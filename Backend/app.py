"""
=============================================================
  app.py — MIS Dashboard Backend (Flask + MySQL)

  Returns JSON shaped EXACTLY like src/data/projects.js so
  your existing React components (ProjectsTab, BudgetTab,
  KPICard) work with zero changes — just swap the data source.

  HOW TO RUN:
    1. pip install flask flask-cors mysql-connector-python
    2. Edit DB_CONFIG below with your MySQL password
    3. py app.py
    4. API runs at http://localhost:5000
=============================================================
"""
import os
from dotenv import load_dotenv
load_dotenv()
from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from mysql.connector import pooling

app = Flask(__name__)
CORS(app)  # allow your Vite dev server (localhost:5173) to call this API

@app.route('/')
def home():
    return jsonify({
        "status": "running",
        "message": "MIS Backend API"
    })
@app.route('/env-check')
def env_check():
    return {
        "DB_HOST": os.getenv("DB_HOST"),
        "DB_USER": os.getenv("DB_USER"),
        "DB_DATABASE": os.getenv("DB_DATABASE")
    }

# ── DB CONFIG ─────────────────────────────────────────────
DB_CONFIG = dict(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_DATABASE"),
    port     = int(os.getenv("DB_PORT", 21716)),
    ssl_disabled = False   # ← change True to False (Aiven requires SSL)
)

pool = pooling.MySQLConnectionPool(pool_name="mis_pool", pool_size=5, **DB_CONFIG)

def query(sql, params=None, fetchone=False):
    conn = pool.get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute(sql, params or ())
    result = cur.fetchone() if fetchone else cur.fetchall()
    cur.close()
    conn.close()
    return result


# ── STATIC LOOKUPS (matching SCHEMES / SCHEME_SHORT / SCHEME_COLORS) ──
SCHEME_COLORS = ["#534AB7", "#185FA5", "#1D9E75", "#993556", "#639922", "#D85A30"]
SCHEME_LIGHT  = ["#EEEDFE", "#E6F1FB", "#E1F5EE", "#FBEAF0", "#EAF3DE", "#FAECE7"]


def n(v):
    """MySQL DECIMAL columns come back as Decimal — convert to plain float for JSON."""
    return float(v) if v is not None else 0.0


def to_int(value, default=None):
    if value in (None, ""):
        return default
    return int(value)


def to_float(value, default=0.0):
    if value in (None, ""):
        return default
    return float(value)


def to_text(value):
    return (value or "").strip()


def parse_project_payload(data):
    name = to_text(data.get("name") or data.get("project_name"))
    if not name:
        raise ValueError("Project name is required.")

    scheme = data.get("scheme")
    if scheme in (None, ""):
        raise ValueError("Please select a scheme category.")

    budget = data.get("budget")
    if budget in (None, ""):
        raise ValueError("Budget is required.")

    project_type = data.get("projectType") or data.get("project_type") or "ongoing"
    if project_type not in ("ongoing", "new_proposal"):
        project_type = "ongoing"

    return {
        "project_name": name,
        "implementing_agency": to_text(data.get("agency") or data.get("implementing_agency")),
        "category_id": int(scheme) + 1,
        "total_budget_outlay_cr": to_float(budget),
        "remaining_duration_years": to_int(data.get("remainingYears") or data.get("remaining_duration_years")),
        "dealing_officer": to_text(data.get("dealingOfficer") or data.get("dealing_officer")),
        "current_status": to_text(data.get("currentStatus") or data.get("current_status")),
        "next_prsg_due": to_text(data.get("nextPrsgDue") or data.get("next_prsg_due")),
        "project_type": project_type,
        "expenditure": data.get("expenditure") or {},
        "plannedFY2526": data.get("plannedFY2526") or {},
    }


def exp_row_shape(values, fin_year):
    return (
        fin_year,
        to_float(values.get("genGia")),
        to_float(values.get("dapsc")),
        to_float(values.get("dapst")),
        to_float(values.get("ner")),
        to_float(values.get("genGia")) + to_float(values.get("dapsc")) + to_float(values.get("dapst")) + to_float(values.get("ner")),
    )


def write_expenditure(cur, project_id, fin_year, values):
    fin_year, gen_gia, dapsc, dapst, ner, total = exp_row_shape(values, fin_year)
    cur.execute(
        """
        DELETE FROM expenditure
        WHERE project_id = %s AND fin_year = %s
        """,
        (project_id, fin_year),
    )
    cur.execute(
        """
        INSERT INTO expenditure (project_id, fin_year, gia_gen, dapsc, dapst, ner, total)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (project_id, fin_year, gen_gia, dapsc, dapst, ner, total),
    )


def project_to_payload(row, exp_by_project):
    def exp_shape(project_id, fin_year):
        e = exp_by_project.get(project_id, {}).get(fin_year)
        if not e:
            return {"genGia": 0, "dapsc": 0, "dapst": 0, "ner": 0, "total": 0}
        return {
            "genGia": n(e['gia_gen']),
            "dapsc": n(e['dapsc']),
            "dapst": n(e['dapst']),
            "ner": n(e['ner']),
            "total": n(e['total']),
        }

    return {
        "id": row['id'],
        "name": row['project_name'],
        "agency": row['implementing_agency'] or '',
        "scheme": row['category_id'] - 1,
        "budget": n(row['total_budget_outlay_cr']),
        "expenditure": exp_shape(row['id'], '2024-25'),
        "plannedFY2526": exp_shape(row['id'], '2025-26'),
        "status": "Ongoing" if row['project_type'] == 'ongoing' else "New",
        "remainingYears": row['remaining_duration_years'] or 0,
        "dealingOfficer": row['dealing_officer'] or '',
        "currentStatus": row['current_status'] or '',
        "nextPrsgDue": row['next_prsg_due'] or '',
    }


def load_projects():
    rows = query("""
        SELECT p.id, p.sl_no, p.category_id, p.project_name, p.implementing_agency,
               p.total_budget_outlay_cr, p.remaining_duration_years,
               p.dealing_officer, p.current_status, p.next_prsg_due,
               p.project_type
        FROM projects p
        ORDER BY p.category_id, p.project_type, p.sl_no
    """)

    exp_rows = query("SELECT * FROM expenditure")
    exp_by_project = {}
    for e in exp_rows:
        exp_by_project.setdefault(e['project_id'], {})[e['fin_year']] = e

    return [project_to_payload(row, exp_by_project) for row in rows]


# ── API: All metadata your frontend needs (schemes, colors) ──
@app.route('/api/schemes')
def schemes():
    rows = query("SELECT id, name FROM categories ORDER BY id")
    return jsonify({
        "SCHEMES": [r['name'] for r in rows],
        "SCHEME_SHORT": [r['name'].split('.', 1)[-1].strip()[:20] for r in rows],
        "SCHEME_COLORS": SCHEME_COLORS[:len(rows)],
        "SCHEME_LIGHT": SCHEME_LIGHT[:len(rows)],
    })


# ── API: All projects, shaped exactly like ALL_PROJECTS ──
@app.route('/api/projects', methods=['GET', 'POST'])
def projects_collection():
    if request.method == 'GET':
        return jsonify(load_projects())

    data = request.get_json(silent=True) or {}
    try:
        payload = parse_project_payload(data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    conn = pool.get_connection()
    cur = conn.cursor(dictionary=True)
    try:
        conn.start_transaction()

        cur.execute(
            "SELECT COALESCE(MAX(sl_no), 0) + 1 AS next_sl_no FROM projects WHERE category_id = %s",
            (payload["category_id"],),
        )
        next_sl_no = cur.fetchone()["next_sl_no"]

        cur.execute(
            """
            INSERT INTO projects (
                sl_no, category_id, project_name, implementing_agency,
                total_budget_outlay_cr, remaining_duration_years,
                dealing_officer, current_status, next_prsg_due, project_type
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                next_sl_no,
                payload["category_id"],
                payload["project_name"],
                payload["implementing_agency"],
                payload["total_budget_outlay_cr"],
                payload["remaining_duration_years"],
                payload["dealing_officer"],
                payload["current_status"],
                payload["next_prsg_due"],
                payload["project_type"],
            ),
        )
        project_id = cur.lastrowid

        write_expenditure(cur, project_id, '2024-25', payload["expenditure"])
        write_expenditure(cur, project_id, '2025-26', payload["plannedFY2526"])

        conn.commit()
        return jsonify({"ok": True, "id": project_id}), 201
    except mysql.connector.Error as exc:
        conn.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        cur.close()
        conn.close()


@app.route('/api/projects/<int:project_id>', methods=['PUT', 'DELETE'])
def project_item(project_id):
    if request.method == 'DELETE':
        conn = pool.get_connection()
        cur = conn.cursor()
        try:
            conn.start_transaction()
            cur.execute("DELETE FROM expenditure WHERE project_id = %s", (project_id,))
            cur.execute("DELETE FROM projects WHERE id = %s", (project_id,))
            conn.commit()
            return jsonify({"ok": True})
        except mysql.connector.Error as exc:
            conn.rollback()
            return jsonify({"error": str(exc)}), 500
        finally:
            cur.close()
            conn.close()

    data = request.get_json(silent=True) or {}
    try:
        payload = parse_project_payload(data)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    conn = pool.get_connection()
    cur = conn.cursor(dictionary=True)
    try:
        conn.start_transaction()
        cur.execute(
            """
            UPDATE projects
            SET category_id = %s,
                project_name = %s,
                implementing_agency = %s,
                total_budget_outlay_cr = %s,
                remaining_duration_years = %s,
                dealing_officer = %s,
                current_status = %s,
                next_prsg_due = %s,
                project_type = %s
            WHERE id = %s
            """,
            (
                payload["category_id"],
                payload["project_name"],
                payload["implementing_agency"],
                payload["total_budget_outlay_cr"],
                payload["remaining_duration_years"],
                payload["dealing_officer"],
                payload["current_status"],
                payload["next_prsg_due"],
                payload["project_type"],
                project_id,
            ),
        )

        cur.execute("DELETE FROM expenditure WHERE project_id = %s", (project_id,))
        write_expenditure(cur, project_id, '2024-25', payload["expenditure"])
        write_expenditure(cur, project_id, '2025-26', payload["plannedFY2526"])

        conn.commit()
        return jsonify({"ok": True, "id": project_id})
    except mysql.connector.Error as exc:
        conn.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)



