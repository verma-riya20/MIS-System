// src/components/SchemeTag.jsx
export default function SchemeTag({ schemeIndex, schemeShort, schemeColors, schemeLight }) {
  return (
    <span
      style={{
        background: schemeLight[schemeIndex],
        color: schemeColors[schemeIndex],
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 9px",
        borderRadius: 20,
        whiteSpace: "nowrap",
        display: "inline-block",
        border: `1px solid ${schemeColors[schemeIndex]}33`,
      }}
    >
      {schemeShort[schemeIndex]}
    </span>
  );
}
