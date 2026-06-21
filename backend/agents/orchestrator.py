import google.generativeai as genai
from fastapi import APIRouter
from pydantic import BaseModel
from db.database import get_config, get_conn

router = APIRouter()

MAIN_MODEL = "gemini-2.5-flash"
FAST_MODEL = "gemini-2.5-flash"

AGENT_SYSTEM_PROMPTS = {
    "auto": """You are ARIA, an expert AI project co-pilot. You help users with every aspect of their project:
problem definition, ideation, planning, research, patent analysis, skill building, and writing research papers.
Be concise, actionable, and always relate your answers to the specific project context provided.
Use markdown for structured responses. Prioritize practical next steps.""",

    "problem": """You are ARIA's Problem Statement Agent. Your specialty is helping users define, scope, and validate
problem statements. Use Socratic questioning to clarify vague ideas. Ensure problems are specific, measurable,
achievable, relevant, and time-bound. Output structured problem definitions with success criteria.""",

    "ideation": """You are ARIA's Ideation Agent. Generate creative, diverse solution ideas using structured techniques
(SCAMPER, TRIZ principles, analogical reasoning, first-principles thinking). Rank ideas by feasibility x impact.
Connect ideas to existing open-source solutions, APIs, and research. Be creative but practical.""",

    "planning": """You are ARIA's Planning Agent. Create detailed, dependency-aware task breakdowns, phased roadmaps,
Gantt-compatible timelines, and resource plans. Identify critical path tasks. Break complex tasks into
executable sub-tasks with clear definitions of done. Estimate hours realistically.""",

    "research": """You are ARIA's Research Agent. Conduct thorough domain research, summarize state-of-the-art
approaches, identify key papers and researchers, and synthesize findings into actionable insights.
Always cite sources and distinguish established facts from emerging trends.""",

    "patent": """You are ARIA's Patent & IP Agent. Analyze patent search results for prior art relevance,
assess freedom-to-operate risk, identify patentability angles, and explain IP concepts clearly.
Flag high-risk overlaps and suggest design-around strategies.""",

    "writing": """You are ARIA's Research Writing Agent. Draft and refine research paper sections following
IEEE/ACM/APA formats. Ensure technical accuracy, logical flow, and compliance with venue guidelines.
Suggest improvements for clarity, depth, and impact. Generate proper citations.""",

    "progress": """You are ARIA's Progress Assessment Agent. Analyze project state, compare actual vs. planned
progress, identify bottlenecks, calculate velocity, and predict completion dates. Generate actionable
weekly reports with specific recommendations to get back on track.""",

    "skill": """You are ARIA's Skill & Learning Agent. Identify skill gaps relative to project requirements,
create personalized learning roadmaps with specific resources, estimate learning time, and track progress.
Recommend the most efficient learning paths given the project timeline."""
}

AGENT_ROUTING_PROMPT = """Given this user message, which ARIA agent should handle it?
Choose ONE from: problem, ideation, planning, research, patent, writing, progress, skill, auto
Respond with ONLY the agent name, nothing else.

Message: {message}"""


class ChatRequest(BaseModel):
    message: str
    agent_mode: str = "auto"
    project_id: str | None = None
    history: list[dict] = []
    attachment_path: str | None = None


def configure_genai():
    key = get_config("google_api_key")
    if not key:
        raise ValueError("Google API key not set. Please configure your API key.")
    genai.configure(api_key=key)


def get_project_context(project_id: str | None) -> str:
    if not project_id:
        return ""
    conn = get_conn()
    project = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    tasks = conn.execute(
        "SELECT title, status, priority, phase FROM tasks WHERE project_id = ? LIMIT 20",
        (project_id,)
    ).fetchall()
    conn.close()
    if not project:
        return ""

    task_summary = "\n".join(
        f"  - [{t['status'].upper()}] {t['title']} ({t['priority']}, {t['phase']})"
        for t in tasks
    )
    return f"""
--- PROJECT CONTEXT ---
Name: {project['name']}
Domain: {project['domain']}
Problem Statement: {project['problem_statement']}
Scope: {project['scope']}
Progress: {project['overall_progress']}%
Skill Gaps: {project['skill_gaps']}
Suggested Tools: {project['suggested_tools']}

Current Tasks:
{task_summary}
--- END CONTEXT ---
"""


def route_agent(message: str) -> str:
    try:
        model = genai.GenerativeModel(FAST_MODEL)
        response = model.generate_content(AGENT_ROUTING_PROMPT.format(message=message))
        agent = response.text.strip().lower()
        return agent if agent in AGENT_SYSTEM_PROMPTS else "auto"
    except Exception:
        return "auto"


def read_attachment(path: str) -> str:
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read(8000)
        name = path.replace("\\", "/").split("/")[-1]
        return f"\n\n[Attached file: {name}]\n{content}"
    except Exception:
        return ""


def build_gemini_history(history: list[dict]) -> list[dict]:
    """Convert OpenAI-style history to Gemini format."""
    gemini_history = []
    for msg in history:
        role = "user" if msg["role"] == "user" else "model"
        gemini_history.append({"role": role, "parts": [msg["content"]]})
    return gemini_history


@router.post("/chat")
async def chat(req: ChatRequest):
    try:
        configure_genai()
    except ValueError as e:
        return {"error": str(e)}

    agent_mode = req.agent_mode
    if agent_mode == "auto":
        agent_mode = route_agent(req.message)

    system = AGENT_SYSTEM_PROMPTS.get(agent_mode, AGENT_SYSTEM_PROMPTS["auto"])
    project_ctx = get_project_context(req.project_id)
    if project_ctx:
        system += f"\n{project_ctx}"

    user_content = req.message
    if req.attachment_path:
        user_content += read_attachment(req.attachment_path)

    try:
        model = genai.GenerativeModel(MAIN_MODEL, system_instruction=system)

        # Build history excluding the last user message
        history = build_gemini_history(req.history)

        chat_session = model.start_chat(history=history)
        response = chat_session.send_message(user_content)

        return {
            "response": response.text,
            "agent_used": agent_mode,
        }
    except Exception as e:
        return {"error": f"Agent error: {e}"}
