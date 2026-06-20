import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "aria.db")


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            problem_statement TEXT,
            scope TEXT,
            domain TEXT,
            team_size INTEGER DEFAULT 1,
            deadline TEXT,
            project_folder TEXT,
            overall_progress INTEGER DEFAULT 0,
            skill_gaps TEXT DEFAULT '[]',
            suggested_tools TEXT DEFAULT '[]',
            created_at TEXT NOT NULL
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            status TEXT DEFAULT 'todo',
            priority TEXT DEFAULT 'medium',
            phase TEXT DEFAULT 'General',
            dependencies TEXT DEFAULT '[]',
            estimated_hours REAL DEFAULT 0,
            completed_hours REAL DEFAULT 0,
            due_date TEXT,
            tags TEXT DEFAULT '[]',
            aria_assessment TEXT,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS milestones (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            title TEXT NOT NULL,
            date TEXT,
            done INTEGER DEFAULT 0,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS chat_history (
            id TEXT PRIMARY KEY,
            project_id TEXT,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            agent_type TEXT,
            timestamp TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


def get_config(key: str) -> str | None:
    conn = get_conn()
    row = conn.execute("SELECT value FROM config WHERE key = ?", (key,)).fetchone()
    conn.close()
    return row["value"] if row else None


def set_config(key: str, value: str):
    conn = get_conn()
    conn.execute("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)", (key, value))
    conn.commit()
    conn.close()
