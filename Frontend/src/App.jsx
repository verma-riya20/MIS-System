// src/App.jsx
import { useState, useMemo } from "react";
import { useMisData } from "./hooks/useMisData";
import { getSchemeStats, getAgencyStats } from "./utils/stats";
import KPICard from "./components/KPICard";
import OverviewTab from "./components/OverviewTab";
import ProjectsTab from "./components/ProjectsTab";
import BudgetTab from "./components/BudgetTab";
import ProjectModal from "./components/ProjectModal";
import "./App.css";

const TABS = ["Overview", "Projects", "Budget & Expenditure"];

export default function App() {
  const {
    projects: ALL_PROJECTS,
    schemes: SCHEMES,
    schemeShort: SCHEME_SHORT,
    schemeColors: SCHEME_COLORS,
    schemeLight: SCHEME_LIGHT,
    loading,
    error,
    refetch,
    createProject,
    updateProject,
    deleteProject,
  } = useMisData();

  const [activeTab, setActiveTab] = useState(0);
  const [globalSearch, setGlobalSearch] = useState("");
  const [filterScheme, setFilterScheme] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAgency, setFilterAgency] = useState("");
  const [filterDueSoon, setFilterDueSoon] = useState(false);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  // null = modal closed · {} = "add new" mode · {...project} = "edit" mode
  const [modalProject, setModalProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  function openAddModal() {
    setModalProject(null);
    setModalOpen(true);
  }
  function openEditModal(project) {
    setModalProject(project);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setModalProject(null);
  }
  async function handleSave(formData, existingId) {
    if (existingId) {
      await updateProject(existingId, formData);
    } else {
      await createProject(formData);
    }
  }
  async function handleDelete(id) {
    await deleteProject(id);
  }

  // Reactive replacements for the old module-level getSchemeStats()/getAgencyStats()
  // calls — these now recompute whenever live data arrives or changes.
  const schemeStats = useMemo(
    () => getSchemeStats(ALL_PROJECTS, SCHEMES, SCHEME_SHORT, SCHEME_COLORS, SCHEME_LIGHT),
    [ALL_PROJECTS, SCHEMES, SCHEME_SHORT, SCHEME_COLORS, SCHEME_LIGHT]
  );
  const agencyStats = useMemo(
    () => getAgencyStats(ALL_PROJECTS).slice(0, 8),
    [ALL_PROJECTS]
  );

  const agencies = useMemo(() => {
    const set = new Set(ALL_PROJECTS.map((p) => p.agency.split(",")[0].split(" through")[0].trim()));
    return [...set].sort();
  }, [ALL_PROJECTS]);

  const filtered = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    return ALL_PROJECTS.filter((p) => {
      if (filterScheme !== "" && p.scheme !== parseInt(filterScheme)) return false;
      if (filterStatus !== "" && p.status !== filterStatus) return false;
      if (filterAgency !== "" && !p.agency.toLowerCase().includes(filterAgency.toLowerCase())) return false;

      if (budgetMin !== "" && p.budget < parseFloat(budgetMin)) return false;
      if (budgetMax !== "" && p.budget > parseFloat(budgetMax)) return false;

      if (filterDueSoon && !p.nextPrsgDue) return false;

      if (q) {
        const haystack = [p.name, p.agency, p.dealingOfficer, p.currentStatus]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [ALL_PROJECTS, globalSearch, filterScheme, filterStatus, filterAgency, budgetMin, budgetMax, filterDueSoon]);

  const kpis = useMemo(() => {
    const total = filtered.reduce((a, p) => a + p.budget, 0);
    const expend = filtered.reduce((a, p) => a + p.expenditure.total, 0);
    const plan = filtered.reduce((a, p) => a + p.plannedFY2526.total, 0);
    const ongoing = filtered.filter((p) => p.status === "Ongoing").length;
    const newP = filtered.filter((p) => p.status === "New").length;
    return { total, expend, plan, ongoing, newP, util: total > 0 ? (expend / total) * 100 : 0 };
  }, [filtered]);

  const resetFilters = () => {
    setGlobalSearch("");
    setFilterScheme("");
    setFilterStatus("");
    setFilterAgency("");
    setFilterDueSoon(false);
    setBudgetMin("");
    setBudgetMax("");
  };

  const hasFilters =
    globalSearch !== "" ||
    filterScheme !== "" ||
    filterStatus !== "" ||
    filterAgency !== "" ||
    filterDueSoon ||
    budgetMin !== "" ||
    budgetMax !== "";

  if (loading) {
    return (
      <div className="app-loading">
        <p>Loading data from MySQL…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-loading app-error">
        <p>Could not reach the API at localhost:5000.</p>
        <p className="app-error-sub">Make sure the Flask backend is running: <code>py app.py</code></p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">MIS</div>
          <div>
            <p className="brand-title">HRD Projects</p>
            <p className="brand-sub">MeitY Capacity Building</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              className={`nav-item ${activeTab === i ? "active" : ""}`}
              onClick={() => setActiveTab(i)}
            >
              <span className="nav-icon">{["📊", "📋", "💰"][i]}</span>
              {tab}
            </button>
          ))}
        </nav>

        <div className="sidebar-filters">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p className="filter-heading">Filters</p>
            {hasFilters && (
              <button className="reset-btn" onClick={resetFilters}>Reset</button>
            )}
          </div>

          <div className="filter-group">
            <label className="filter-label">Scheme category</label>
            <select
              value={filterScheme}
              onChange={(e) => setFilterScheme(e.target.value)}
              className="filter-select"
            >
              <option value="">All schemes</option>
              {SCHEME_SHORT.map((s, i) => (
                <option key={i} value={i}>{s}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Project status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">All statuses</option>
              <option value="Ongoing">Ongoing</option>
              <option value="New">New Proposal</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Agency</label>
            <select
              value={filterAgency}
              onChange={(e) => setFilterAgency(e.target.value)}
              className="filter-select"
            >
              <option value="">All agencies</option>
              {agencies.map((a) => (
                <option key={a} value={a}>{a.length > 30 ? a.slice(0, 30) + "…" : a}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Budget range (₹ Cr)</label>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="Min"
                className="filter-select"
                style={{ width: "50%" }}
              />
              <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>–</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="Max"
                className="filter-select"
                style={{ width: "50%" }}
              />
            </div>
          </div>

          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filterDueSoon}
              onChange={(e) => setFilterDueSoon(e.target.checked)}
            />
            <span>PRSG review due</span>
          </label>

          {hasFilters && (
            <div className="filter-result-badge">
              {filtered.length} of {ALL_PROJECTS.length} projects
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>Data as of FY 2024-25</p>
          <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>6 schemes · {ALL_PROJECTS.length} projects</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="main">
        {/* Header */}
        <header className="page-header">
          <div>
            <h1 className="page-title">{TABS[activeTab]}</h1>
            <p className="page-sub">Scheme for Capacity Building in Electronics, ICT & Allied Technologies</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="global-search">
              <span className="global-search-icon">⌕</span>
              <input
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search projects, agencies, officers…"
              />
              {globalSearch && (
                <button className="global-search-clear" onClick={() => setGlobalSearch("")} aria-label="Clear search">✕</button>
              )}
            </div>
            {hasFilters && (
              <div className="active-filter-pill">
                {filtered.length} of {ALL_PROJECTS.length}
              </div>
            )}
          </div>
        </header>

        <div className="mobile-tabbar" role="tablist" aria-label="Main navigation">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              type="button"
              className={`mobile-tab ${activeTab === i ? "active" : ""}`}
              onClick={() => setActiveTab(i)}
              aria-pressed={activeTab === i}
            >
              <span className="mobile-tab-icon">{["📊", "📋", "💰"][i]}</span>
              <span>{tab}</span>
            </button>
          ))}
        </div>

        {/* KPI grid */}
        <div className="kpi-grid">
          <KPICard
            label="Total projects"
            value={filtered.length}
            sub={`${kpis.ongoing} ongoing · ${kpis.newP} proposed`}
            color={SCHEME_COLORS[0]}
          />
          <KPICard
            label="Total budget"
            value={`₹${kpis.total.toFixed(0)} Cr`}
            sub="Sanctioned outlay"
            color={SCHEME_COLORS[1]}
          />
          <KPICard
            label="Expended till 2024-25"
            value={`₹${kpis.expend.toFixed(0)} Cr`}
            sub={`${kpis.util.toFixed(1)}% of budget utilised`}
            color={SCHEME_COLORS[2]}
          />
          <KPICard
            label="Planned FY 2025-26"
            value={`₹${kpis.plan.toFixed(0)} Cr`}
            sub="Next year approved spend"
            color={SCHEME_COLORS[3]}
          />
        </div>

        {/* Tab content */}
        <div className="tab-content">
          {activeTab === 0 && (
            <OverviewTab
              filtered={filtered}
              schemeStats={schemeStats}
              agencyStats={agencyStats}
              schemeColors={SCHEME_COLORS}
            />
          )}
          {activeTab === 1 && (
            <ProjectsTab
              projects={filtered}
              schemeShort={SCHEME_SHORT}
              schemeColors={SCHEME_COLORS}
              schemeLight={SCHEME_LIGHT}
              onAddProject={openAddModal}
              onEditProject={openEditModal}
            />
          )}
          {activeTab === 2 && (
            <BudgetTab
              projects={filtered}
              schemeShort={SCHEME_SHORT}
              schemeColors={SCHEME_COLORS}
            />
          )}
        </div>
      </main>

      {modalOpen && (
        <ProjectModal
          project={modalProject}
          schemes={SCHEMES}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
