// src/components/ProjectModal.jsx
import { useState, useEffect } from "react";

const EMPTY_EXP = { genGia: 0, dapsc: 0, dapst: 0, ner: 0 };

const EMPTY_FORM = {
  name: "",
  agency: "",
  scheme: 0,
  budget: "",
  startDate: "",
  completionDate: "",
  remainingYears: "",
  dealingOfficer: "",
  currentStatus: "",
  nextPrsgDue: "",
  projectType: "ongoing",
  expenditure: { ...EMPTY_EXP },
  plannedFY2526: { ...EMPTY_EXP },
};

export default function ProjectModal({ project, schemes, onClose, onSave, onDelete }) {
  const isEditing = Boolean(project);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || "",
        agency: project.agency || "",
        scheme: project.scheme ?? 0,
        budget: project.budget ?? "",
        startDate: project.startDate || "",
        completionDate: project.completionDate || "",
        remainingYears: project.remainingYears || "",
        dealingOfficer: project.dealingOfficer || "",
        currentStatus: project.currentStatus || "",
        nextPrsgDue: project.nextPrsgDue || "",
        projectType: project.projectType || (project.status === "Ongoing" ? "ongoing" : "new_proposal"),
        expenditure: { ...EMPTY_EXP, ...project.expenditure },
        plannedFY2526: { ...EMPTY_EXP, ...project.plannedFY2526 },
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors([]);
    setConfirmingDelete(false);
  }, [project]);

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateExpField(section, key, value) {
    setForm((f) => ({
      ...f,
      [section]: { ...f[section], [key]: value === "" ? 0 : Number(value) },
    }));
  }

  function validate() {
    const errs = [];
    if (!form.name.trim()) errs.push("Project name is required.");
    if (form.budget === "" || Number(form.budget) < 0) errs.push("Budget must be a positive number.");
    if (form.scheme === "" || form.scheme === null) errs.push("Please select a scheme category.");
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...form,
        scheme: Number(form.scheme),
        budget: Number(form.budget),
        remainingYears: form.remainingYears === "" ? null : Number(form.remainingYears),
      }, project?.id);
      onClose();
    } catch (err) {
      setErrors([err.message || "Something went wrong while saving."]);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await onDelete(project.id);
      onClose();
    } catch (err) {
      setErrors([err.message || "Something went wrong while deleting."]);
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? "Edit Project" : "Add New Project"}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {errors.length > 0 && (
            <div className="form-errors">
              {errors.map((err, i) => <p key={i}>⚠ {err}</p>)}
            </div>
          )}

          <div className="form-section-title">Project Details</div>
          <div className="form-grid">
            <label className="form-field span-2">
              <span>Project Name *</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Skilling Centre for Advanced Semiconductor Packaging"
              />
            </label>

            <label className="form-field span-2">
              <span>Implementing Agency</span>
              <input
                type="text"
                value={form.agency}
                onChange={(e) => updateField("agency", e.target.value)}
                placeholder="e.g. NIELIT Guwahati"
              />
            </label>

            <label className="form-field">
              <span>Scheme Category *</span>
              <select value={form.scheme} onChange={(e) => updateField("scheme", e.target.value)}>
                {schemes.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Status</span>
              <select value={form.projectType} onChange={(e) => updateField("projectType", e.target.value)}>
                <option value="ongoing">Ongoing</option>
                <option value="new_proposal">New Proposal</option>
              </select>
            </label>

            <label className="form-field">
              <span>Total Budget Outlay (₹ Cr) *</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.budget}
                onChange={(e) => updateField("budget", e.target.value)}
                placeholder="0.00"
              />
            </label>

            <label className="form-field">
              <span>Remaining Duration (years)</span>
              <input
                type="number"
                min="0"
                value={form.remainingYears}
                onChange={(e) => updateField("remainingYears", e.target.value)}
                placeholder="e.g. 3"
              />
            </label>

            <label className="form-field">
              <span>Project Start Date</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
              />
            </label>

            <label className="form-field">
              <span>Completion Date</span>
              <input
                type="date"
                value={form.completionDate}
                onChange={(e) => updateField("completionDate", e.target.value)}
              />
            </label>

            <label className="form-field">
              <span>Dealing Officer</span>
              <input
                type="text"
                value={form.dealingOfficer}
                onChange={(e) => updateField("dealingOfficer", e.target.value)}
                placeholder="e.g. Shri Surendra Singh, Scientist E"
              />
            </label>

            <label className="form-field">
              <span>Next PRSG Due</span>
              <input
                type="text"
                value={form.nextPrsgDue}
                onChange={(e) => updateField("nextPrsgDue", e.target.value)}
                placeholder="e.g. September 2025"
              />
            </label>

            <label className="form-field span-2">
              <span>Current Status</span>
              <textarea
                rows={3}
                value={form.currentStatus}
                onChange={(e) => updateField("currentStatus", e.target.value)}
                placeholder="Brief status update on the project..."
              />
            </label>
          </div>

          <div className="form-section-title">Expenditure — FY 2024–25 (Actual)</div>
          <ExpenditureRow values={form.expenditure} onChange={(k, v) => updateExpField("expenditure", k, v)} />

          <div className="form-section-title">Expenditure — FY 2025–26 (Planned)</div>
          <ExpenditureRow values={form.plannedFY2526} onChange={(k, v) => updateExpField("plannedFY2526", k, v)} />

          <div className="modal-footer">
            {isEditing && (
              confirmingDelete ? (
                <div className="delete-confirm">
                  <span>Delete this project permanently?</span>
                  <button type="button" className="btn-danger" onClick={handleDelete} disabled={saving}>
                    {saving ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setConfirmingDelete(false)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button type="button" className="btn-danger-outline" onClick={() => setConfirmingDelete(true)}>
                  Delete Project
                </button>
              )
            )}
            <div className="modal-footer-right">
              <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : isEditing ? "Save Changes" : "Add Project"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExpenditureRow({ values, onChange }) {
  const fields = [
    ["genGia", "GIA GEN"],
    ["dapsc", "DAPSC"],
    ["dapst", "DAPST"],
    ["ner", "NER"],
  ];
  const total = fields.reduce((a, [k]) => a + (Number(values[k]) || 0), 0);

  return (
    <div className="exp-row">
      {fields.map(([key, label]) => (
        <label className="form-field exp-field" key={key}>
          <span>{label}</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={values[key]}
            onChange={(e) => onChange(key, e.target.value)}
          />
        </label>
      ))}
      <div className="form-field exp-field exp-total">
        <span>Total</span>
        <div className="exp-total-value">₹{total.toFixed(2)} Cr</div>
      </div>
    </div>
  );
}
