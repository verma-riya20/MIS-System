// src/components/ProjectsTab.jsx
import { useState, useMemo } from "react";
import StatusBadge from "./StatusBadge";
import SchemeTag from "./SchemeTag";

const PAGE_SIZE = 12;

export default function ProjectsTab({ projects, schemeShort, schemeColors, schemeLight, onAddProject, onEditProject }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState("budget");
  const [sortDir, setSortDir] = useState("desc");
  const [expandedId, setExpandedId] = useState(null);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let data = projects.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.agency.toLowerCase().includes(q)
    );
    data = [...data].sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (sortKey === "expenditure") { av = a.expenditure.total; bv = b.expenditure.total; }
      if (sortKey === "plannedFY2526") { av = a.plannedFY2526.total; bv = b.plannedFY2526.total; }
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return data;
  }, [projects, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const slice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const SortIcon = ({ col }) => (
    <span style={{ marginLeft: 4, opacity: sortKey === col ? 1 : 0.3, fontSize: 10 }}>
      {sortKey === col ? (sortDir === "asc" ? "▲" : "▼") : "⬍"}
    </span>
  );

  const thStyle = {
    padding: "10px 14px",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-secondary)",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-surface)",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  };

  return (
    <div>
      {/* Search bar */}
      <div className="projects-toolbar" style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", fontSize: 15 }}>🔍</span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search projects or agencies..."
            style={{
              width: "100%",
              padding: "9px 14px 9px 36px",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 13,
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
        </div>
        <span style={{ fontSize: 13, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
          {filtered.length} project{filtered.length !== 1 ? "s" : ""}
        </span>
        <button className="btn-primary" onClick={onAddProject} style={{ whiteSpace: "nowrap" }}>
          + Add Project
        </button>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: "35%" }} onClick={() => handleSort("name")}>
                  Project <SortIcon col="name" />
                </th>
                <th style={{ ...thStyle, width: "17%" }} onClick={() => handleSort("agency")}>
                  Agency <SortIcon col="agency" />
                </th>
                <th style={thStyle}>Scheme</th>
                <th style={{ ...thStyle, textAlign: "right" }} onClick={() => handleSort("budget")}>
                  Budget (₹ Cr) <SortIcon col="budget" />
                </th>
                <th style={{ ...thStyle, textAlign: "right" }} onClick={() => handleSort("expenditure")}>
                  Expend. (₹ Cr) <SortIcon col="expenditure" />
                </th>
                <th style={{ ...thStyle, textAlign: "right" }} onClick={() => handleSort("plannedFY2526")}>
                  Planned 25-26 <SortIcon col="plannedFY2526" />
                </th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: "center" }} onClick={() => handleSort("remainingYears")}>
                  Rem. (yr) <SortIcon col="remainingYears" />
                </th>
                <th style={{ ...thStyle, textAlign: "center", cursor: "default" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((p) => (
                <>
                  <tr
                    key={p.id}
                    onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                    style={{
                      cursor: "pointer",
                      background: expandedId === p.id ? "var(--bg-surface)" : "var(--bg-card)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { if (expandedId !== p.id) e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = expandedId === p.id ? "var(--bg-surface)" : "var(--bg-card)"; }}
                  >
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", fontWeight: 500, color: "var(--text-primary)", verticalAlign: "top" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                        <span style={{ marginTop: 1, fontSize: 10, color: "var(--text-secondary)", minWidth: 12 }}>
                          {expandedId === p.id ? "▼" : "▶"}
                        </span>
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 12, verticalAlign: "top" }}>
                      {p.agency}
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", verticalAlign: "top" }}>
                      <SchemeTag schemeIndex={p.scheme} schemeShort={schemeShort} schemeColors={schemeColors} schemeLight={schemeLight} />
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", fontWeight: 600, verticalAlign: "top", color: "var(--text-primary)" }}>
                      {p.budget.toFixed(2)}
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", verticalAlign: "top", color: p.expenditure.total > 0 ? "#1D9E75" : "var(--text-secondary)" }}>
                      {p.expenditure.total > 0 ? p.expenditure.total.toFixed(2) : "—"}
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "right", verticalAlign: "top", color: p.plannedFY2526.total > 0 ? "#185FA5" : "var(--text-secondary)" }}>
                      {p.plannedFY2526.total > 0 ? p.plannedFY2526.total.toFixed(2) : "—"}
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", verticalAlign: "top" }}>
                      <StatusBadge status={p.status} />
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "center", verticalAlign: "top", color: "var(--text-secondary)" }}>
                      {p.remainingYears > 0 ? `${p.remainingYears}y` : "—"}
                    </td>
                    <td style={{ padding: "11px 14px", borderBottom: "1px solid var(--border)", textAlign: "center", verticalAlign: "top" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditProject(p); }}
                        title="Edit project"
                        style={{ border: "1px solid var(--border)", background: "var(--bg-card)", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: "var(--text-secondary)" }}
                      >
                        ✎ Edit
                      </button>
                    </td>
                  </tr>
                  {expandedId === p.id && (
                    <tr key={`${p.id}-expand`}>
                      <td colSpan={9} style={{ padding: "14px 20px 14px 40px", background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                          {/* Expenditure breakdown */}
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Expenditure breakdown (₹ Cr)</p>
                            {[
                              ["GIA GEN", p.expenditure.genGia],
                              ["DAPSC", p.expenditure.dapsc],
                              ["DAPST", p.expenditure.dapst],
                              ["NER", p.expenditure.ner],
                              ["Total", p.expenditure.total],
                            ].filter(([, v]) => v > 0).map(([label, val]) => (
                              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderBottom: "1px solid var(--border)" }}>
                                <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                                <span style={{ fontWeight: label === "Total" ? 600 : 400, color: "var(--text-primary)" }}>₹{val.toFixed(2)}</span>
                              </div>
                            ))}
                            {p.expenditure.total === 0 && <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>No expenditure recorded</p>}
                          </div>

                          {/* Planned breakdown */}
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Planned FY 2025-26 (₹ Cr)</p>
                            {[
                              ["GIA GEN", p.plannedFY2526.genGia],
                              ["DAPSC", p.plannedFY2526.dapsc],
                              ["DAPST", p.plannedFY2526.dapst],
                              ["NER", p.plannedFY2526.ner],
                              ["Total", p.plannedFY2526.total],
                            ].filter(([, v]) => v > 0).map(([label, val]) => (
                              <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderBottom: "1px solid var(--border)" }}>
                                <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                                <span style={{ fontWeight: label === "Total" ? 600 : 400, color: "var(--text-primary)" }}>₹{val.toFixed(2)}</span>
                              </div>
                            ))}
                            {p.plannedFY2526.total === 0 && <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>No plan recorded</p>}
                          </div>

                          {/* Status and details */}
                          <div>
                            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Project details</p>
                            {p.dealingOfficer && (
                              <p style={{ fontSize: 12, marginBottom: 6 }}>
                                <span style={{ color: "var(--text-secondary)" }}>Dealing officer: </span>
                                <span style={{ color: "var(--text-primary)" }}>{p.dealingOfficer}</span>
                              </p>
                            )}
                            {p.nextPrsgDue && (
                              <p style={{ fontSize: 12, marginBottom: 6 }}>
                                <span style={{ color: "var(--text-secondary)" }}>Next PRSG due: </span>
                                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{p.nextPrsgDue}</span>
                              </p>
                            )}
                            {p.currentStatus && (
                              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginTop: 8, borderLeft: "2px solid #534AB7", paddingLeft: 8 }}>
                                {p.currentStatus}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {slice.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)", fontSize: 14 }}>
                    No projects found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--bg-surface)" }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{ padding: "5px 12px", fontSize: 13, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-card)", color: "var(--text-primary)", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.4 : 1 }}
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  style={{
                    padding: "5px 10px",
                    fontSize: 13,
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    background: page === i ? "#534AB7" : "var(--bg-card)",
                    color: page === i ? "white" : "var(--text-primary)",
                    cursor: "pointer",
                  }}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                style={{ padding: "5px 12px", fontSize: 13, border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-card)", color: "var(--text-primary)", cursor: page === totalPages - 1 ? "not-allowed" : "pointer", opacity: page === totalPages - 1 ? 0.4 : 1 }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
