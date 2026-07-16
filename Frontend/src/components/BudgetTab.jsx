// src/components/BudgetTab.jsx
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, LineChart, Line,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: "var(--text-primary)" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: ₹{(+p.value).toFixed(2)} Cr
        </p>
      ))}
    </div>
  );
};

export default function BudgetTab({ projects, schemeShort, schemeColors }) {
  const schemeData = schemeShort.map((name, i) => {
    const ps = projects.filter((p) => p.scheme === i);
    const budget = ps.reduce((a, p) => a + p.budget, 0);
    const expend = ps.reduce((a, p) => a + p.expenditure.total, 0);
    const plan = ps.reduce((a, p) => a + p.plannedFY2526.total, 0);
    const remaining = budget - expend;
    return {
      name,
      budget: +budget.toFixed(2),
      expend: +expend.toFixed(2),
      plan: +plan.toFixed(2),
      remaining: +remaining.toFixed(2),
      util: budget > 0 ? +((expend / budget) * 100).toFixed(1) : 0,
    };
  }).filter((s) => s.budget > 0);

  const componentData = (() => {
    const totals = { genGia: 0, dapsc: 0, dapst: 0, ner: 0 };
    projects.forEach((p) => {
      totals.genGia += p.expenditure.genGia;
      totals.dapsc += p.expenditure.dapsc;
      totals.dapst += p.expenditure.dapst;
      totals.ner += p.expenditure.ner;
    });
    return [
      { name: "GIA GEN", value: +totals.genGia.toFixed(2), color: "#534AB7" },
      { name: "DAPSC", value: +totals.dapsc.toFixed(2), color: "#185FA5" },
      { name: "DAPST", value: +totals.dapst.toFixed(2), color: "#1D9E75" },
      { name: "NER", value: +totals.ner.toFixed(2), color: "#D85A30" },
    ];
  })();

  const top10Budget = [...projects].sort((a, b) => b.budget - a.budget).slice(0, 10).map((p) => ({
    name: p.name.length > 40 ? p.name.slice(0, 40) + "…" : p.name,
    budget: p.budget,
    expend: p.expenditure.total,
    scheme: p.scheme,
  }));

  const totalBudget = projects.reduce((a, p) => a + p.budget, 0);
  const totalExpend = projects.reduce((a, p) => a + p.expenditure.total, 0);
  const totalPlan = projects.reduce((a, p) => a + p.plannedFY2526.total, 0);

  return (
    <div className="budget-layout" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Summary row */}
      <div className="budget-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
        {[
          { label: "Total sanctioned budget", value: `₹${totalBudget.toFixed(0)} Cr`, color: "#534AB7" },
          { label: "Expended till 2024-25", value: `₹${totalExpend.toFixed(0)} Cr`, color: "#1D9E75" },
          { label: "Utilisation rate", value: `${totalBudget > 0 ? ((totalExpend / totalBudget) * 100).toFixed(1) : 0}%`, color: "#185FA5" },
          { label: "Planned FY 2025-26", value: `₹${totalPlan.toFixed(0)} Cr`, color: "#D85A30" },
          { label: "Unspent balance", value: `₹${(totalBudget - totalExpend).toFixed(0)} Cr`, color: "#993556" },
        ].map((item) => (
          <div key={item.label} style={{ background: "var(--bg-card)", border: `1px solid var(--border)`, borderRadius: 10, padding: "14px 16px", borderTop: `3px solid ${item.color}` }}>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Scheme budget vs expend stacked */}
      <div className="budget-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="chart-card">
          <h3 className="chart-title">Budget, expenditure & planned by scheme (₹ Cr)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={schemeData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--text-secondary)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-secondary)" }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="budget" name="Budget" fill="#534AB755" stroke="#534AB7" strokeWidth={1} radius={[3, 3, 0, 0]} />
              <Bar dataKey="expend" name="Expenditure" fill="#1D9E75" radius={[3, 3, 0, 0]} />
              <Bar dataKey="plan" name="Planned 2025-26" fill="#185FA5AA" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
            {[["#534AB7", "Budget"], ["#1D9E75", "Expended"], ["#185FA5", "Planned 25-26"]].map(([c, l]) => (
              <span key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-secondary)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: "inline-block" }} />{l}
              </span>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Expenditure by grant component (₹ Cr)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={componentData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                      <p style={{ fontWeight: 600 }}>{label}</p>
                      <p style={{ color: payload[0].fill }}>₹{(+payload[0].value).toFixed(2)} Cr</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="value" name="Expenditure" radius={[4, 4, 0, 0]}>
                {componentData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {componentData.map((d) => (
              <div key={d.name} style={{ fontSize: 11, display: "flex", justifyContent: "space-between", padding: "4px 8px", borderRadius: 6, background: "var(--bg-surface)" }}>
                <span style={{ color: "var(--text-secondary)" }}>{d.name}</span>
                <span style={{ fontWeight: 600, color: d.color }}>₹{d.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 10 by budget */}
      <div className="chart-card">
        <h3 className="chart-title">Top 10 projects by sanctioned budget (₹ Cr)</h3>
        <div style={{ overflowX: "auto" }}>
          <ResponsiveContainer width="100%" height={top10Budget.length * 42 + 60}>
            <BarChart data={top10Budget} layout="vertical" margin={{ left: 10, right: 60, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} tickFormatter={(v) => `₹${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} width={200} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 12, maxWidth: 280 }}>
                      <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
                      {payload.map((p, i) => (
                        <p key={i} style={{ color: p.fill, margin: "2px 0" }}>{p.name}: ₹{(+p.value).toFixed(2)} Cr</p>
                      ))}
                    </div>
                  );
                }}
              />
              <Bar dataKey="budget" name="Budget" radius={[0, 4, 4, 0]}>
                {top10Budget.map((d, i) => <Cell key={i} fill={schemeColors[d.scheme] + "99"} stroke={schemeColors[d.scheme]} strokeWidth={1} />)}
              </Bar>
              <Bar dataKey="expend" name="Expenditure" radius={[0, 4, 4, 0]}>
                {top10Budget.map((d, i) => <Cell key={i} fill={schemeColors[d.scheme]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-secondary)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#534AB755", border: "1px solid #534AB7", display: "inline-block" }} />Light = Budget
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-secondary)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#534AB7", display: "inline-block" }} />Dark = Expenditure
          </span>
        </div>
      </div>
    </div>
  );
}
