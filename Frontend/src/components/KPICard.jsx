// src/components/KPICard.jsx
export default function KPICard({ label, value, sub, color }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "18px 20px",
        borderTop: color ? `3px solid ${color}` : undefined,
      }}
    >
      <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      <p style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>{sub}</p>
      )}
    </div>
  );
}
