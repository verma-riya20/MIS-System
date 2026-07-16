// src/components/OverviewTab.jsx
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: "var(--text-primary)" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "var(--text-secondary)", margin: "2px 0" }}>
          {p.name}: ₹{(+p.value).toFixed(2)} Cr
        </p>
      ))}
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function OverviewTab({ filtered, schemeStats, schemeColors }) {
  const filteredStats = schemeStats.map((s, i) => {
    const projects = filtered.filter((p) => p.scheme === i);
    return {
      ...s,
      totalBudget: +projects.reduce((a, p) => a + p.budget, 0).toFixed(2),
      totalExpend: +projects.reduce((a, p) => a + p.expenditure.total, 0).toFixed(2),
      totalPlan: +projects.reduce((a, p) => a + p.plannedFY2526.total, 0).toFixed(2),
    };
  });

  const ongoingCount = filtered.filter((p) => p.status === "Ongoing").length;
  const newCount = filtered.filter((p) => p.status === "New").length;
  const pieData = [
    { name: "Ongoing", value: ongoingCount, color: "#1D9E75" },
    { name: "New Proposal", value: newCount, color: "#534AB7" },
  ];

  const agencyFiltered = (() => {
    const map = {};
    filtered.forEach((p) => {
      const key = p.agency.split(",")[0].split(" through")[0].trim();
      if (!map[key]) map[key] = { agency: key, budget: 0 };
      map[key].budget += p.budget;
    });
    return Object.values(map).sort((a, b) => b.budget - a.budget).slice(0, 8);
  })();

  return (
    <div className="overview-layout" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Row 1: Budget by scheme + Status donut */}
      <div className="overview-row overview-row-1" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
        <div className="chart-card">
          <h3 className="chart-title">Budget by scheme (₹ Cr)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={filteredStats} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickFormatter={(v) => `₹${v}`} />
              <YAxis type="category" dataKey="shortName" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} width={95} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="totalBudget" name="Budget" radius={[0, 4, 4, 0]}>
                {filteredStats.map((_, i) => (
                  <Cell key={i} fill={schemeColors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Project status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={48}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
            {pieData.map((d) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, display: "inline-block" }} />
                <span style={{ color: "var(--text-secondary)" }}>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Budget vs Expenditure */}
      <div className="chart-card">
        <h3 className="chart-title">Budget vs expenditure incurred till 2024-25 (₹ Cr)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={filteredStats} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="shortName" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickFormatter={(v) => `₹${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="totalBudget" name="Sanctioned budget" radius={[3, 3, 0, 0]}>
              {filteredStats.map((_, i) => (
                <Cell key={i} fill={schemeColors[i] + "55"} stroke={schemeColors[i]} strokeWidth={1} />
              ))}
            </Bar>
            <Bar dataKey="totalExpend" name="Expenditure till 2024-25" radius={[3, 3, 0, 0]}>
              {filteredStats.map((_, i) => (
                <Cell key={i} fill={schemeColors[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Row 3: Agency chart + Utilisation */}
      <div className="overview-row overview-row-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="chart-card">
          <h3 className="chart-title">Top agencies by budget (₹ Cr)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={agencyFiltered} layout="vertical" margin={{ left: 8, right: 30, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} tickFormatter={(v) => `₹${v}`} />
              <YAxis
                type="category"
                dataKey="agency"
                tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
                width={90}
                tickFormatter={(v) => v.length > 14 ? v.slice(0, 14) + "…" : v}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
                      <p style={{ color: "#534AB7" }}>₹{(+payload[0].value).toFixed(2)} Cr</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="budget" name="Budget" fill="#534AB7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Budget utilisation rate by scheme</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
            {filteredStats.map((s, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12 }}>
                  <span style={{ color: "var(--text-secondary)" }}>{s.shortName}</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {s.totalBudget > 0 ? ((s.totalExpend / s.totalBudget) * 100).toFixed(1) : 0}%
                    <span style={{ color: "var(--text-secondary)", fontWeight: 400, marginLeft: 6 }}>
                      ₹{s.totalExpend.toFixed(0)} / ₹{s.totalBudget.toFixed(0)} Cr
                    </span>
                  </span>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 4,
                      background: schemeColors[i],
                      width: `${Math.min(s.totalBudget > 0 ? (s.totalExpend / s.totalBudget) * 100 : 0, 100)}%`,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Planned expenditure FY 2025-26 */}
      <div className="chart-card">
        <h3 className="chart-title">Planned expenditure FY 2025-26 (₹ Cr)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={filteredStats} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="shortName" tick={{ fontSize: 10, fill: "var(--text-secondary)" }} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickFormatter={(v) => `₹${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalPlan" name="Planned FY 2025-26" radius={[3, 3, 0, 0]}>
              {filteredStats.map((_, i) => (
                <Cell key={i} fill={schemeColors[i] + "CC"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
