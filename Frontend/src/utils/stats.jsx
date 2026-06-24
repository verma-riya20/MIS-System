// src/utils/stats.js
//
// Same logic as the old getSchemeStats() / getAgencyStats() that lived in
// data/projects.js — but now takes live data as arguments instead of
// reading the hardcoded ALL_PROJECTS array directly.

export function getSchemeStats(projects, schemes, schemeShort, schemeColors, schemeLight) {
  return schemes.map((name, i) => {
    const schemeProjects = projects.filter((p) => p.scheme === i);
    const totalBudget = schemeProjects.reduce((a, p) => a + p.budget, 0);
    const totalExpend = schemeProjects.reduce((a, p) => a + p.expenditure.total, 0);
    const totalPlan = schemeProjects.reduce((a, p) => a + p.plannedFY2526.total, 0);
    const ongoing = schemeProjects.filter((p) => p.status === "Ongoing").length;
    const newProposals = schemeProjects.filter((p) => p.status === "New").length;
    return {
      name,
      shortName: schemeShort[i],
      color: schemeColors[i],
      lightColor: schemeLight[i],
      totalBudget: +totalBudget.toFixed(2),
      totalExpend: +totalExpend.toFixed(2),
      totalPlan: +totalPlan.toFixed(2),
      utilisation: totalBudget > 0 ? +((totalExpend / totalBudget) * 100).toFixed(1) : 0,
      ongoing,
      newProposals,
      totalProjects: schemeProjects.length,
    };
  });
}

export function getAgencyStats(projects) {
  const map = {};
  projects.forEach((p) => {
    const key = p.agency.split(",")[0].split(" through")[0].trim();
    if (!map[key]) map[key] = { agency: key, budget: 0, projects: 0, expend: 0 };
    map[key].budget += p.budget;
    map[key].projects += 1;
    map[key].expend += p.expenditure.total;
  });
  return Object.values(map).sort((a, b) => b.budget - a.budget);
}