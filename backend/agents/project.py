import json
import uuid
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
import google.generativeai as genai
from db.database import get_config, get_conn

router = APIRouter(prefix="/project")

MAIN_MODEL = "gemini-2.0-flash"

PROJECT_INIT_PROMPT = """You are ARIA, an expert project management AI. A user has described their project idea.
Your job is to:
1. Write a crisp, precise problem statement (2-3 sentences)
2. Define the project scope
3. Generate 8-15 concrete, actionable tasks organized into phases
4. Create 3-5 milestones with realistic dates (deadline: {deadline})
5. Identify 3-5 skill gaps the user likely has
6. Suggest 5-8 key tools/technologies for this project

Respond ONLY with valid JSON matching this exact structure:
{{
  "problem_statement": "...",
  "scope": "...",
  "tasks": [
    {{
      "title": "...",
      "description": "...",
      "priority": "critical|high|medium|low",
      "phase": "Phase name",
      "estimated_hours": 4,
      "tags": ["tag1"]
    }}
  ],
  "milestones": [
    {{"title": "...", "date": "YYYY-MM-DD"}}
  ],
  "skill_gaps": ["skill1", "skill2"],
  "suggested_tools": ["tool1", "tool2"]
}}

Project: {name}
Domain: {domain}
Team size: {team_size}
Idea: {idea}
Deadline: {deadline}
Today: {today}
"""


class ProjectInitRequest(BaseModel):
    name: str
    idea: str
    domain: str = ""
    deadline: str = ""
    team_size: int = 1


def configure_genai():
    key = get_config("google_api_key")
    if not key:
        raise ValueError("Google API key not set")
    genai.configure(api_key=key)


@router.post("/init")
async def init_project(req: ProjectInitRequest):
    try:
        configure_genai()
    except ValueError as e:
        return {"error": str(e)}

    prompt = PROJECT_INIT_PROMPT.format(
        name=req.name,
        idea=req.idea,
        domain=req.domain or "General",
        team_size=req.team_size,
        deadline=req.deadline or "no fixed deadline",
        today=datetime.now().strftime("%Y-%m-%d")
    )

    try:
        model = genai.GenerativeModel(MAIN_MODEL)
        response = model.generate_content(prompt)
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw.strip())
    except Exception as e:
        return {"error": f"AI generation failed: {e}"}

    project_id = str(uuid.uuid4())
    now = datetime.now().isoformat()

    conn = get_conn()
    try:
        conn.execute(
            """INSERT INTO projects (id, name, problem_statement, scope, domain, team_size, deadline,
               overall_progress, skill_gaps, suggested_tools, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)""",
            (
                project_id, req.name,
                data.get("problem_statement", ""),
                data.get("scope", ""),
                req.domain, req.team_size, req.deadline,
                json.dumps(data.get("skill_gaps", [])),
                json.dumps(data.get("suggested_tools", [])),
                now
            )
        )

        tasks = []
        for t in data.get("tasks", []):
            tid = str(uuid.uuid4())
            conn.execute(
                """INSERT INTO tasks (id, project_id, title, description, status, priority, phase,
                   dependencies, estimated_hours, completed_hours, tags)
                   VALUES (?, ?, ?, ?, 'todo', ?, ?, '[]', ?, 0, ?)""",
                (
                    tid, project_id, t.get("title", "Untitled"),
                    t.get("description", ""), t.get("priority", "medium"),
                    t.get("phase", "General"), t.get("estimated_hours", 2),
                    json.dumps(t.get("tags", []))
                )
            )
            tasks.append({
                "id": tid, "title": t.get("title", ""),
                "description": t.get("description", ""),
                "status": "todo", "priority": t.get("priority", "medium"),
                "phase": t.get("phase", "General"), "dependencies": [],
                "estimatedHours": t.get("estimated_hours", 2), "completedHours": 0,
                "tags": t.get("tags", [])
            })

        milestones = []
        for m in data.get("milestones", []):
            mid = str(uuid.uuid4())
            conn.execute(
                "INSERT INTO milestones (id, project_id, title, date, done) VALUES (?, ?, ?, ?, 0)",
                (mid, project_id, m.get("title", ""), m.get("date", ""))
            )
            milestones.append({"id": mid, "title": m.get("title", ""), "date": m.get("date", ""), "done": False})

        conn.commit()
    finally:
        conn.close()

    return {
        "project": {
            "id": project_id,
            "name": req.name,
            "problemStatement": data.get("problem_statement", ""),
            "scope": data.get("scope", ""),
            "domain": req.domain,
            "teamSize": req.team_size,
            "deadline": req.deadline,
            "projectFolder": None,
            "createdAt": now,
            "tasks": tasks,
            "milestones": milestones,
            "overallProgress": 0,
            "skillGaps": data.get("skill_gaps", []),
            "suggestedTools": data.get("suggested_tools", [])
        }
    }


@router.post("/progress")
async def assess_progress(body: dict):
    project_id = body.get("project_id")
    if not project_id:
        return {"error": "project_id required"}

    conn = get_conn()
    tasks = conn.execute("SELECT * FROM tasks WHERE project_id = ?", (project_id,)).fetchall()
    conn.close()

    total = len(tasks)
    done = sum(1 for t in tasks if t["status"] == "done")
    progress = round((done / total) * 100) if total > 0 else 0

    conn = get_conn()
    conn.execute("UPDATE projects SET overall_progress = ? WHERE id = ?", (progress, project_id))
    conn.commit()
    conn.close()

    return {"progress": progress, "done": done, "total": total}
