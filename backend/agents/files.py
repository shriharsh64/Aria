import os
import google.generativeai as genai
from fastapi import APIRouter
from pydantic import BaseModel
from db.database import get_config, get_conn

router = APIRouter(prefix="/files")

MAIN_MODEL = "gemini-2.0-flash"


class AnalyzeRequest(BaseModel):
    path: str
    content: str
    project_id: str | None = None


def configure_genai():
    key = get_config("google_api_key")
    if not key:
        raise ValueError("Google API key not set")
    genai.configure(api_key=key)


def get_project_ctx(project_id: str | None) -> str:
    if not project_id:
        return ""
    conn = get_conn()
    p = conn.execute("SELECT name, problem_statement, domain FROM projects WHERE id = ?", (project_id,)).fetchone()
    conn.close()
    return f"Project: {p['name']}\nProblem: {p['problem_statement']}" if p else ""


@router.post("/analyze")
async def analyze_file(req: AnalyzeRequest):
    try:
        configure_genai()
    except ValueError as e:
        return {"error": str(e)}

    ext = os.path.splitext(req.path)[1].lower()
    file_type_hint = {
        ".py": "Python source code",
        ".ts": "TypeScript source code",
        ".tsx": "TypeScript React component",
        ".js": "JavaScript",
        ".md": "Markdown document",
        ".txt": "Text document",
        ".csv": "CSV data file",
        ".json": "JSON data",
    }.get(ext, "file")

    project_ctx = get_project_ctx(req.project_id)
    file_name = req.path.replace("\\", "/").split("/")[-1]

    prompt = f"""You are ARIA analyzing a {file_type_hint} in the context of the user's project.
{project_ctx}

File: {file_name}
Content:
```
{req.content[:6000]}
```

Provide a concise analysis covering:
1. **What this file does** (1-2 sentences)
2. **Relevance to the project** — how does it contribute?
3. **Quality & completeness** — is it well-structured? What's missing?
4. **Suggested next steps** — what should be added or improved?
5. **Progress indicator** — what % complete does this component seem?

Keep it practical and actionable."""

    try:
        model = genai.GenerativeModel(MAIN_MODEL)
        response = model.generate_content(prompt)
        return {"analysis": response.text}
    except Exception as e:
        return {"error": str(e)}


@router.post("/write-report")
async def write_progress_report(body: dict):
    project_id = body.get("project_id")
    output_path = body.get("output_path")

    if not project_id or not output_path:
        return {"error": "project_id and output_path required"}

    conn = get_conn()
    project = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    tasks = conn.execute("SELECT * FROM tasks WHERE project_id = ?", (project_id,)).fetchall()
    conn.close()

    if not project:
        return {"error": "Project not found"}

    done = [t for t in tasks if t["status"] == "done"]
    in_progress = [t for t in tasks if t["status"] == "in_progress"]
    blocked = [t for t in tasks if t["status"] == "blocked"]

    try:
        configure_genai()
        report_prompt = f"""Generate a concise weekly progress report for this project in Markdown format.

Project: {project['name']}
Problem: {project['problem_statement']}
Overall Progress: {project['overall_progress']}%

Tasks Done ({len(done)}): {', '.join(t['title'] for t in done[:5])}
In Progress ({len(in_progress)}): {', '.join(t['title'] for t in in_progress[:5])}
Blocked ({len(blocked)}): {', '.join(t['title'] for t in blocked[:3])}

Include: Executive summary, achievements, blockers & solutions, next week priorities, risk assessment."""

        model = genai.GenerativeModel(MAIN_MODEL)
        response = model.generate_content(report_prompt)
        report = response.text

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(report)

        return {"success": True, "path": output_path, "preview": report[:300]}
    except Exception as e:
        return {"error": str(e)}
