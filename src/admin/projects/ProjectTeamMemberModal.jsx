import { useState, useEffect } from "react";
import { X, UserPlus, AlertCircle, Clock, Users, Briefcase } from "lucide-react";
import API_URL from "../../config/api";

export const TEAM_ROLES = [
  "Project Manager",
  "Team Lead",
  "Developer",
  "QA / Tester",
  "Implementation",
  "Support",
  "Functional Consultant",
  "Training",
  "Other",
];

export default function ProjectTeamMemberModal({
  isOpen,
  onClose,
  project,
  memberToEdit = null,
  initialEmployee = null,
  employees = [],
  onSuccess,
}) {
  const isEditing = Boolean(memberToEdit);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [role, setRole] = useState("Developer");
  const [customRole, setCustomRole] = useState("");
  const [responsibility, setResponsibility] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      if (memberToEdit) {
        setSelectedEmployeeId(
          memberToEdit.employeeId?._id || memberToEdit.employeeId || ""
        );
        const existingRole = memberToEdit.role || "Developer";
        if (TEAM_ROLES.includes(existingRole)) {
          setRole(existingRole);
          setCustomRole("");
        } else {
          setRole("Other");
          setCustomRole(existingRole);
        }
        setResponsibility(memberToEdit.responsibility || "");
      } else if (initialEmployee) {
        setSelectedEmployeeId(initialEmployee.id || initialEmployee._id || "");
        setRole("Developer");
        setCustomRole("");
        setResponsibility("");
      } else {
        setSelectedEmployeeId("");
        setRole("Developer");
        setCustomRole("");
        setResponsibility("");
      }
    }
  }, [isOpen, memberToEdit, initialEmployee]);

  if (!isOpen || !project) return null;

  const getAuthToken = () =>
    localStorage.getItem("client-connect-token") ||
    sessionStorage.getItem("client-connect-token") ||
    "";

  // Existing active member IDs to prevent duplicates
  const activeMemberEmpIds = new Set(
    (project.teamMembers || [])
      .filter((m) => m.status === "Active" && (!memberToEdit || String(m._id) !== String(memberToEdit._id)))
      .map((m) => String(m.employeeId?._id || m.employeeId))
  );

  const effectiveRole = role === "Other" && customRole.trim() ? customRole.trim() : role;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!isEditing && !selectedEmployeeId) {
      setErrorMessage("Please select an employee.");
      return;
    }

    if (!isEditing && activeMemberEmpIds.has(String(selectedEmployeeId))) {
      const selectedEmp = employees.find(
        (emp) => String(emp.id || emp._id) === String(selectedEmployeeId)
      );
      setErrorMessage(
        `${selectedEmp?.name || "This employee"} is already an active member of this project team.`
      );
      return;
    }

    try {
      setSubmitting(true);
      const token = getAuthToken();

      let url = "";
      let method = "";
      let bodyData = {};

      if (isEditing) {
        const memberId = memberToEdit._id || memberToEdit.id;
        url = `${API_URL}/api/admin/project/${project._id || project.id}/team-members/${memberId}`;
        method = "PATCH";
        bodyData = {
          role: effectiveRole,
          responsibility: responsibility.trim(),
        };
      } else {
        url = `${API_URL}/api/admin/project/${project._id || project.id}/team-members`;
        method = "POST";
        bodyData = {
          employeeId: selectedEmployeeId,
          role: effectiveRole,
          responsibility: responsibility.trim(),
        };
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save team member.");
      }

      if (typeof onSuccess === "function") {
        onSuccess(data.data);
      }
      onClose();
    } catch (err) {
      console.error("Team member error:", err);
      setErrorMessage(err.message || "Unable to save team member.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isEditing ? "Edit Team Member" : "Add Team Member"}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {project.projectCode} • {project.projectName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Employee Selector (or Readonly if Editing) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Employee
            </label>
            {isEditing ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 font-semibold">
                {memberToEdit.employeeName}
                {memberToEdit.employeeCode && ` (${memberToEdit.employeeCode})`}
              </div>
            ) : (
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              >
                <option value="">— Select Active Employee —</option>
                {employees
                  .filter((emp) => emp.id || emp._id)
                  .map((emp) => {
                    const id = emp.id || emp._id;
                    const isAlreadyMember = activeMemberEmpIds.has(String(id));
                    return (
                      <option
                        key={id}
                        value={id}
                        disabled={isAlreadyMember}
                      >
                        {emp.name} {emp.employeeCode ? `(${emp.employeeCode})` : ""}{" "}
                        {isAlreadyMember ? "— (Already in team)" : ""}
                      </option>
                    );
                  })}
              </select>
            )}
          </div>

          {/* Role Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Project Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            >
              {TEAM_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Role Input if Other */}
          {role === "Other" && (
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Specify Role Title
              </label>
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="e.g. Solution Architect, DevOps..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>
          )}

          {/* Responsibility */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Responsibility / Scope (optional)
            </label>
            <textarea
              rows={2}
              value={responsibility}
              onChange={(e) => setResponsibility(e.target.value)}
              placeholder="e.g. Frontend UI components, REST API integration, UAT defect fixing..."
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-8.5 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 h-8.5 px-4 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition disabled:opacity-50 shadow-xs"
          >
            {submitting ? (
              <>
                <Clock size={12} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEditing ? "Save Changes" : "Add to Team"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

