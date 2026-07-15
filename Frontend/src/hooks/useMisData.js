// src/hooks/useMisData.js
import { useState, useEffect } from "react";

const API_BASE = "https://mis-system-aysc.onrender.com";

// Same fallback colors as before, in case /api/schemes is slow to load
const FALLBACK_COLORS = ["#534AB7", "#185FA5", "#1D9E75", "#993556", "#639922", "#D85A30"];
const FALLBACK_LIGHT  = ["#EEEDFE", "#E6F1FB", "#E1F5EE", "#FBEAF0", "#EAF3DE", "#FAECE7"];
 
export function useMisData() {
  const [projects, setProjects]       = useState([]);
  const [schemes, setSchemes]         = useState([]);
  const [schemeShort, setSchemeShort] = useState([]);
  const [schemeColors, setSchemeColors] = useState(FALLBACK_COLORS);
  const [schemeLight, setSchemeLight]   = useState(FALLBACK_LIGHT);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
 
  const headers = { "Content-Type": "application/json" };
 
  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [pRes, sRes] = await Promise.all([
        fetch(`${API_BASE}/projects`, { headers }),
        fetch(`${API_BASE}/schemes`,  { headers }),
      ]);
      if (!pRes.ok || !sRes.ok) throw new Error("API request failed");
      const pData = await pRes.json();
      const sData = await sRes.json();
      setProjects(pData);
      setSchemes(sData.SCHEMES);
      setSchemeShort(sData.SCHEME_SHORT);
      setSchemeColors(sData.SCHEME_COLORS);
      setSchemeLight(sData.SCHEME_LIGHT);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);
 
  useEffect(() => { load(); }, [load]);
 
  // ── CREATE ─────────────────────────────────────────────
  async function createProject(formData) {
    const res = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers,
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create project");
    await load();
    return data;
  }
 
  // ── UPDATE ─────────────────────────────────────────────
  async function updateProject(id, formData) {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update project");
    await load();
    return data;
  }
 
  // ── DELETE ─────────────────────────────────────────────
  async function deleteProject(id) {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: "DELETE",
      headers,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete project");
    await load();
    return data;
  }
 
  return {
    projects,
    schemes,
    schemeShort,
    schemeColors,
    schemeLight,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: load,
  };
}
 