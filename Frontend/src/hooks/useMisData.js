// src/hooks/useMisData.js
import { useState, useEffect } from "react";

const API_BASE = "https://mis-system-aysc.onrender.com";

// Same fallback colors as before, in case /api/schemes is slow to load
const FALLBACK_COLORS = ["#534AB7", "#185FA5", "#1D9E75", "#993556", "#639922", "#D85A30"];
const FALLBACK_LIGHT = ["#EEEDFE", "#E6F1FB", "#E1F5EE", "#FBEAF0", "#EAF3DE", "#FAECE7"];

export function useMisData() {
  const [projects, setProjects] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [schemeShort, setSchemeShort] = useState([]);
  const [schemeColors, setSchemeColors] = useState(FALLBACK_COLORS);
  const [schemeLight, setSchemeLight] = useState(FALLBACK_LIGHT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [projectsRes, schemesRes] = await Promise.all([
          fetch(`${API_BASE}/projects`),
          fetch(`${API_BASE}/schemes`),
        ]);

        if (!projectsRes.ok || !schemesRes.ok) {
          throw new Error("API request failed");
        }

        const projectsData = await projectsRes.json();
        const schemesData = await schemesRes.json();

        if (!cancelled) {
          setProjects(projectsData);
          setSchemes(schemesData.SCHEMES);
          setSchemeShort(schemesData.SCHEME_SHORT);
          setSchemeColors(schemesData.SCHEME_COLORS);
          setSchemeLight(schemesData.SCHEME_LIGHT);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return {
    projects,
    schemes,
    schemeShort,
    schemeColors,
    schemeLight,
    loading,
    error,
  };
}
