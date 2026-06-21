import httpx
from google import genai
from fastapi import APIRouter
from pydantic import BaseModel
from db.database import get_config

router = APIRouter(prefix="/research")

USPTO_BASE = "https://api.patentsview.org/patents/query"
FAST_MODEL = "gemini-3.1-flash-lite"


class PatentSearchRequest(BaseModel):
    query: str
    project_id: str | None = None
    max_results: int = 10


def get_client() -> genai.Client:
    key = get_config("google_api_key")
    if not key:
        raise ValueError("Google API key not set")
    return genai.Client(api_key=key)


async def search_uspto(query: str, limit: int = 10) -> list[dict]:
    payload = {
        "q": {"_text_any": {"patent_abstract": query}},
        "f": ["patent_number", "patent_title", "patent_abstract", "assignee_organization", "patent_date"],
        "o": {"per_page": limit}
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.post(USPTO_BASE, json=payload)
            data = res.json()
            patents = data.get("patents") or []
            return [
                {
                    "patent_number": p.get("patent_number", ""),
                    "title": p.get("patent_title", ""),
                    "abstract": p.get("patent_abstract", "")[:500],
                    "assignee": (p.get("assignees") or [{}])[0].get("assignee_organization", ""),
                    "date": p.get("patent_date", ""),
                    "url": f"https://patents.google.com/patent/US{p.get('patent_number', '')}"
                }
                for p in patents
            ]
    except Exception as e:
        return [{"error": str(e)}]


def score_similarity(patent_abstract: str, query: str) -> float:
    query_words = set(query.lower().split())
    abstract_words = set(patent_abstract.lower().split())
    overlap = query_words & abstract_words
    return round(len(overlap) / max(len(query_words), 1), 2)


@router.post("/patent")
async def patent_search(req: PatentSearchRequest):
    results = await search_uspto(req.query, req.max_results)

    for r in results:
        if "error" not in r:
            r["similarity_score"] = score_similarity(r.get("abstract", ""), req.query)

    results.sort(key=lambda r: r.get("similarity_score", 0), reverse=True)

    summary = ""
    if results and "error" not in results[0]:
        try:
            client = get_client()
            patent_text = "\n\n".join(
                f"Patent #{r['patent_number']}: {r['title']}\n{r['abstract']}"
                for r in results[:5]
            )
            response = client.models.generate_content(
                model=FAST_MODEL,
                contents=f"""As ARIA's Patent Agent, analyze these patents in relation to the query: "{req.query}"

Patents found:
{patent_text}

Provide a 3-4 sentence IP landscape summary:
1. How similar are these patents to the proposed project?
2. What's the freedom-to-operate risk level (low/medium/high)?
3. What's a key differentiation angle to avoid conflicts?"""
            )
            summary = response.text
        except Exception:
            summary = "Could not generate AI summary."

    return {"results": results, "summary": summary}
