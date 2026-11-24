import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  Star,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Building2,
} from "lucide-react";
import API_URL from "../../config/api";

export default function ContactsModal({ client, isOpen, onClose }) {
  const getAuthToken = () =>
    localStorage.getItem("client-connect-token") ||
    sessionStorage.getItem("client-connect-token") ||
    "";

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    designation: "",
    department: "Management",
    role: "Decision Maker",
    isPrimary: false,
    canAccessPortal: false,
  });

  const loadContacts = async () => {
    if (!client?._id && !client?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/contacts?clientId=${client._id || client.id}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setContacts(data.data || []);
      }
    } catch (err) {
      console.error("Load contacts error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen, client]);

  const handleCreateContact = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          ...form,
          clientId: client._id || client.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to create contact.");
      setShowAddForm(false);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        designation: "",
        department: "Management",
        role: "Decision Maker",
        isPrimary: false,
        canAccessPortal: false,
      });
      loadContacts();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMakePrimary = async (contactId) => {
    try {
      const res = await fetch(`${API_URL}/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ isPrimary: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        loadContacts();
      }
    } catch (err) {
      console.error("Make primary error:", err);
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm("Are you sure you want to remove this contact?")) return;
    try {
      const res = await fetch(`${API_URL}/api/contacts/${contactId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        loadContacts();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs"
      />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">B2B Company Contacts</h3>
              <p className="text-xs text-slate-500">{client.companyName} ({client.clientCode})</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Registered Stakeholders ({contacts.length})
            </p>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 rounded-lg bg-[#1B59F8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1548D1]"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Add Contact</span>
              </button>
            )}
          </div>

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleCreateContact} className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-blue-200/60">
                <span className="text-xs font-bold text-blue-900">New Contact Stakeholder</span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Vikram"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="Malhotra"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Direct Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9876543210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="vikram@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Job Designation</label>
                  <input
                    type="text"
                    placeholder="Chief Financial Officer"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Primary Decision Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-hidden"
                  >
                    <option value="Decision Maker">Decision Maker</option>
                    <option value="Billing Contact">Billing Contact</option>
                    <option value="Technical Contact">Technical Contact</option>
                    <option value="Support Contact">Support Contact</option>
                    <option value="Signatory">Signatory</option>
                    <option value="End User">End User</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPrimary}
                    onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Mark as Primary Account Contact</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.canAccessPortal}
                    onChange={(e) => setForm({ ...form, canAccessPortal: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>Enable Customer Portal Login</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Contact"}
                </button>
              </div>
            </form>
          )}

          {/* List of contacts */}
          <div className="space-y-2.5">
            {contacts && contacts.length > 0 ? (
              contacts.map((contact) => (
                <div
                  key={contact._id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 hover:border-slate-300 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                      {(contact.firstName?.[0] || "") + (contact.lastName?.[0] || "")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">
                          {contact.firstName} {contact.lastName}
                        </h4>
                        {contact.isPrimary && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 ring-1 ring-amber-600/20">
                            <Star size={10} className="fill-amber-500" />
                            Primary
                          </span>
                        )}
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-blue-700">
                          {contact.role}
                        </span>
                      </div>

                      <p className="mt-0.5 text-[11px] text-slate-500">{contact.designation || "Business Contact"}</p>

                      <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Phone size={11} className="text-slate-400" />
                          {contact.phone}
                        </span>
                        {contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail size={11} className="text-slate-400" />
                            {contact.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!contact.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleMakePrimary(contact._id)}
                        title="Make Primary Contact"
                        className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteContact(contact._id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                <Users size={28} className="mx-auto mb-2 text-slate-300 stroke-1" />
                <p className="text-xs font-semibold text-slate-700">No additional contacts yet</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Add multi-tier stakeholders like the Billing Lead or Technical Director.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
