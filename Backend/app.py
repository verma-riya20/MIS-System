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

from flask import Flask, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import pooling

app = Flask(__name__)
CORS(app)  # allow your Vite dev server (localhost:5173) to call this API

# ── DB CONFIG ─────────────────────────────────────────────
DB_CONFIG = dict(
    host     = 'localhost',
    user     = 'root',
    password = 'Riya@2005',   # <-- change this
    database = 'mis_projects'
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
@app.route('/api/projects')
def all_projects():
    rows = query("""
        SELECT p.id, p.sl_no, p.category_id, p.project_name, p.implementing_agency,
               p.total_budget_outlay_cr, p.remaining_duration_years,
               p.dealing_officer, p.current_status, p.next_prsg_due,
               p.project_type
        FROM projects p
        ORDER BY p.category_id, p.project_type, p.sl_no
    """)

    # Pre-fetch all expenditure rows in one query, group by project_id
    exp_rows = query("SELECT * FROM expenditure")
    exp_by_project = {}
    for e in exp_rows:
        exp_by_project.setdefault(e['project_id'], {})[e['fin_year']] = e

    def exp_shape(project_id, fin_year):
        e = exp_by_project.get(project_id, {}).get(fin_year)
        if not e:
            return {"genGia": 0, "dapsc": 0, "dapst": 0, "ner": 0, "total": 0}
        return {
            "genGia": n(e['gia_gen']),
            "dapsc":  n(e['dapsc']),
            "dapst":  n(e['dapst']),
            "ner":    n(e['ner']),
            "total":  n(e['total']),
        }

    result = []
    for p in rows:
        result.append({
            "id": p['id'],
            "name": p['project_name'],
            "agency": p['implementing_agency'] or '',
            "scheme": p['category_id'] - 1,  # categories are 1-indexed in MySQL, frontend expects 0-indexed
            "budget": n(p['total_budget_outlay_cr']),
            "expenditure": exp_shape(p['id'], '2024-25'),
            "plannedFY2526": exp_shape(p['id'], '2025-26'),
            "status": "Ongoing" if p['project_type'] == 'ongoing' else "New",
            "remainingYears": p['remaining_duration_years'] or 0,
            "dealingOfficer": p['dealing_officer'] or '',
            "currentStatus": p['current_status'] or '',
            "nextPrsgDue": p['next_prsg_due'] or '',
        })

    return jsonify(result)


if __name__ == '__main__':
    print("=" * 55)
    print("  MIS Dashboard API")
    print("  Running at: http://localhost:5000")
    print("  Endpoints:")
    print("    GET /api/schemes")
    print("    GET /api/projects")
    print("=" * 55)
    app.run(debug=True, port=5000)
