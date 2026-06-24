// src/components/StatusBadge.jsx
const styles = {
  Ongoing: { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" },
  New: { background: "#dbeafe", color: "#1e40af", border: "1px solid #bfdbfe" },
  Completed: { background: "#f0fdf4", color: "#14532d", border: "1px solid #86efac" },
};

export default function StatusBadge({ status }) {
  const s = styles[status] || styles.New;
  return (
    <span
      style={{
        ...s,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 20,
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {status === "New" ? "New Proposal" : status}
    </span>
  );
}
