// src/hooks/useMisData.js
import { useState, useEffect, useCallback } from "react";

const API_BASE = "https://mis-system-aysc.onrender.com/api";

// Same fallback colors as before, in case /api/schemes is slow to load
const FALLBACK_COLORS = ["#534AB7", "#185FA5", "#1D9E75", "#993556", "#639922", "#D85A30"];
const FALLBACK_LIGHT  = ["#EEEDFE", "#E6F1FB", "#E1F5EE", "#FBEAF0", "#EAF3DE", "#FAECE7"];
const EMPTY_EXP = { genGia: 0, dapsc: 0, dapst: 0, ner: 0, total: 0 };

async function readJsonResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();
  return text ? { error: text } : {};
}

function normalizeProject(formData, id) {
  const expenditure = formData.expenditure || {};
  const plannedFY2526 = formData.plannedFY2526 || {};

  const mapExp = (value) => ({
    genGia: Number(value.genGia) || 0,
    dapsc: Number(value.dapsc) || 0,
    dapst: Number(value.dapst) || 0,
    ner: Number(value.ner) || 0,
    total: Number(value.genGia || 0) + Number(value.dapsc || 0) + Number(value.dapst || 0) + Number(value.ner || 0),
  });

  return {
    id,
    name: formData.name || "",
    agency: formData.agency || "",
    scheme: Number(formData.scheme) || 0,
    budget: Number(formData.budget) || 0,
    expenditure: mapExp(expenditure),
    plannedFY2526: mapExp(plannedFY2526),
    status: formData.projectType === "new_proposal" ? "New" : "Ongoing",
    remainingYears: formData.remainingYears == null ? 0 : Number(formData.remainingYears) || 0,
    dealingOfficer: formData.dealingOfficer || "",
    currentStatus: formData.currentStatus || "",
    nextPrsgDue: formData.nextPrsgDue || "",
  };
}
 
export function useMisData() {
  const [projects, setProjects]       = useState([]);
  const [schemes, setSchemes]         = useState([]);
  const [schemeShort, setSchemeShort] = useState([]);
  const [schemeColors, setSchemeColors] = useState(FALLBACK_COLORS);
  const [schemeLight, setSchemeLight]   = useState(FALLBACK_LIGHT);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
 
  const headers = { "Content-Type": "application/json" };
 
  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      const [pRes, sRes] = await Promise.all([
        fetch(`${API_BASE}/projects`, { headers }),
        fetch(`${API_BASE}/schemes`, { headers }),
      ]);
      if (!pRes.ok || !sRes.ok) throw new Error("API request failed");
      const pData = await pRes.json();
      const sData = await sRes.json();
      setProjects(pData);
      setSchemes(sData.SCHEMES);
      setSchemeShort(sData.SCHEME_SHORT);
      setSchemeColors(sData.SCHEME_COLORS);
      setSchemeLight(sData.SCHEME_LIGHT);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
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
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error || "Failed to create project");
    const created = normalizeProject(formData, data.id);
    setProjects((current) => [...current, created]);
    return data;
  }
 
  // ── UPDATE ─────────────────────────────────────────────
  async function updateProject(id, formData) {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(formData),
    });
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error || "Failed to update project");
    const updated = normalizeProject(formData, id);
    setProjects((current) => current.map((project) => (project.id === id ? updated : project)));
    return data;
  }
 
  // ── DELETE ─────────────────────────────────────────────
  async function deleteProject(id) {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: "DELETE",
      headers,
    });
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error || "Failed to delete project");
    setProjects((current) => current.filter((project) => project.id !== id));
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
 