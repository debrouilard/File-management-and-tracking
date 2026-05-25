import { useEffect, useState } from "react";
import { api } from "../services/api.js";

function ThreeDotIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="mb-12 bg-white border border-line rounded-md shadow-sm overflow-hidden">
      <div className="px-4 h-[44px] flex items-center bg-brand-sidebar text-white">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

const ADMIN_PRIMARY_BTN =
  "px-4 py-2 text-sm font-semibold bg-brand-hover text-white rounded-md hover:brightness-95 transition-colors disabled:opacity-50";

export function AdminPage() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [resetRequestsPending, setResetRequestsPending] = useState([]);
  const [resetRequestsHistory, setResetRequestsHistory] = useState([]);
  const [resetTab, setResetTab] = useState("pending");
  const [completeResetModal, setCompleteResetModal] = useState(null);
  const [tempPassword, setTempPassword] = useState("");
  const [tempPasswordConfirm, setTempPasswordConfirm] = useState("");
  const [completeResetBusy, setCompleteResetBusy] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [userQ, setUserQ] = useState("");
  const [deptQ, setDeptQ] = useState("");
  const [openUserMenuId, setOpenUserMenuId] = useState(null);
  const [openDeptMenuId, setOpenDeptMenuId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
    departmentId: "",
  });
  const [deptForm, setDeptForm] = useState({ name: "", prefix: "" });
  const [csvFile, setCsvFile] = useState(null);
  const [userEditModal, setUserEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "STAFF", departmentId: "" });
  const [editBusy, setEditBusy] = useState(false);

  async function load() {
    const [u, d, pending, history] = await Promise.all([
      api("/users"),
      api("/departments"),
      api("/password-resets?status=PENDING"),
      api("/password-resets?status=COMPLETED&limit=100"),
    ]);
    setUsers(u);
    setDepartments(d);
    setResetRequestsPending(pending);
    setResetRequestsHistory(history);
    if (!form.departmentId && d[0]) setForm((f) => ({ ...f, departmentId: d[0].id }));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function onCreateUser(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await api("/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setMsg("User created.");
      setForm((f) => ({ ...f, name: "", email: "", password: "" }));
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function onCreateDepartment(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await api("/departments", {
        method: "POST",
        body: JSON.stringify(deptForm),
      });
      setMsg("Department created.");
      setDeptForm({ name: "", prefix: "" });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function onBulk(e) {
    e.preventDefault();
    if (!csvFile) {
      setError("Choose a CSV file.");
      return;
    }
    setError("");
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", csvFile);
      const res = await api("/users/bulk", { method: "POST", body: fd });
      setMsg(`Bulk import: ${res.created} created, ${res.failed} failed.`);
      setCsvFile(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-950 mb-2">Administration</h1>
      <p className="text-sm text-ink-500 mb-8">Departments, users, and bulk CSV import.</p>
      {error && <p className="text-sm text-red-700 mb-2">{error}</p>}
      {msg && <p className="text-sm text-green-800 mb-4">{msg}</p>}

      <SectionCard title="Search (Admin)">
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
          <div>
            <label className="text-xs text-ink-500">Search user</label>
            <input
              className="mt-1 w-full border border-line px-3 py-2 text-sm"
              value={userQ}
              onChange={(e) => setUserQ(e.target.value)}
              placeholder="Name, email, role, or department prefix"
            />
          </div>
          <div>
            <label className="text-xs text-ink-500">Search department</label>
            <input
              className="mt-1 w-full border border-line px-3 py-2 text-sm"
              value={deptQ}
              onChange={(e) => setDeptQ(e.target.value)}
              placeholder="Prefix or department name"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="New Department">
        <form onSubmit={onCreateDepartment} className="grid sm:grid-cols-3 gap-4 max-w-3xl items-end">
          <div>
            <label className="text-xs text-ink-500">Name</label>
            <input
              className="mt-1 w-full border border-line px-3 py-2 text-sm"
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-ink-500">Prefix (e.g. REG)</label>
            <input
              className="mt-1 w-full border border-line px-3 py-2 text-sm font-mono uppercase"
              value={deptForm.prefix}
              onChange={(e) => setDeptForm({ ...deptForm, prefix: e.target.value.toUpperCase() })}
              required
            />
          </div>
          <button type="submit" className={`${ADMIN_PRIMARY_BTN} h-[38px]`}>
            Create department
          </button>
        </form>
      </SectionCard>

      <SectionCard title="New User">
        <form onSubmit={onCreateUser} className="grid sm:grid-cols-2 gap-4 max-w-3xl">
          <div>
            <label className="text-xs text-ink-500">Name</label>
            <input
              className="mt-1 w-full border border-line px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-ink-500">Email</label>
            <input
              type="email"
              className="mt-1 w-full border border-line px-3 py-2 text-sm"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-ink-500">Password</label>
            <input
              type="password"
              className="mt-1 w-full border border-line px-3 py-2 text-sm"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-ink-500">Role</label>
            <select
              className="mt-1 w-full border border-line px-3 py-2 text-sm bg-white"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="STAFF">Staff</option>
              <option value="DEPARTMENT_HEAD">Department head</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-ink-500">Department</label>
            <select
              className="mt-1 w-full border border-line px-3 py-2 text-sm bg-white"
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.prefix} — {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className={ADMIN_PRIMARY_BTN}>
              Create user
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Bulk Import CSV">
        <p className="text-xs text-ink-500 mb-3 max-w-2xl">
          Header row required:{" "}
          <span className="font-mono">name,email,password,role,departmentPrefix</span>. Role must be ADMIN,
          DEPARTMENT_HEAD, or STAFF. Prefix must match an existing department.
        </p>
        <form onSubmit={onBulk} className="flex flex-wrap items-end gap-4">
          <input type="file" accept=".csv,text/csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
          <button type="submit" className={ADMIN_PRIMARY_BTN}>
            Upload CSV
          </button>
        </form>
      </SectionCard>

      <div className="mb-8 max-w-5xl rounded-lg border border-line bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 bg-slate-50 border-b border-line">
          <div>
            <h2 className="text-sm font-semibold text-ink-950">Password resets</h2>
            <p className="text-[11px] text-ink-500 mt-0.5 max-w-xl">
              Queue from login “Forgot password”. Completing sets a temporary password; the user must change it on next login.
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors ${
                resetTab === "pending"
                  ? "bg-accent text-white border-accent"
                  : "bg-white text-ink-600 border-line hover:bg-surface"
              }`}
              onClick={() => setResetTab("pending")}
            >
              Pending ({resetRequestsPending.length})
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors ${
                resetTab === "history"
                  ? "bg-accent text-white border-accent"
                  : "bg-white text-ink-600 border-line hover:bg-surface"
              }`}
              onClick={() => setResetTab("history")}
            >
              History
            </button>
          </div>
        </div>
        <div className="p-3 max-h-[320px] overflow-auto">
          {resetTab === "pending" && (
            <table className="w-full text-xs min-w-[600px]">
              <thead className="text-ink-500 uppercase tracking-wide border-b border-line">
                <tr>
                  <th className="text-left py-2 pr-2 font-medium">Submitted</th>
                  <th className="text-left py-2 pr-2 font-medium">User</th>
                  <th className="text-left py-2 pr-2 font-medium">Dept</th>
                  <th className="text-left py-2 pr-2 font-medium">When</th>
                  <th className="text-right py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {resetRequestsPending.map((r) => (
                  <tr key={r.id} className="border-b border-line/80 last:border-0">
                    <td className="py-2 pr-2 font-mono text-ink-800">{r.email}</td>
                    <td className="py-2 pr-2 text-ink-700">
                      {r.user ? (
                        <>
                          {r.user.name}
                          <span className="block text-ink-500">{r.user.email}</span>
                        </>
                      ) : (
                        <span className="text-ink-400">No match</span>
                      )}
                    </td>
                    <td className="py-2 pr-2">{r.user?.department?.prefix || "—"}</td>
                    <td className="py-2 pr-2 whitespace-nowrap text-ink-600">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-accent text-white hover:brightness-95 disabled:opacity-40"
                        disabled={!r.userId}
                        title={!r.userId ? "No matching user for this request." : ""}
                        onClick={() => {
                          setTempPassword("");
                          setTempPasswordConfirm("");
                          setCompleteResetModal({
                            id: r.id,
                            submittedAs: r.email,
                            userLabel: r.user ? `${r.user.name} (${r.user.email})` : null,
                          });
                        }}
                      >
                        Reset password
                      </button>
                    </td>
                  </tr>
                ))}
                {resetRequestsPending.length === 0 && (
                  <tr>
                    <td className="py-6 text-ink-500" colSpan={5}>
                      No pending requests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          {resetTab === "history" && (
            <table className="w-full text-xs min-w-[560px]">
              <thead className="text-ink-500 uppercase tracking-wide border-b border-line">
                <tr>
                  <th className="text-left py-2 pr-2 font-medium">Submitted</th>
                  <th className="text-left py-2 pr-2 font-medium">User</th>
                  <th className="text-left py-2 pr-2 font-medium">Completed</th>
                  <th className="text-left py-2 font-medium">By</th>
                </tr>
              </thead>
              <tbody>
                {resetRequestsHistory.map((r) => (
                  <tr key={r.id} className="border-b border-line/80 last:border-0">
                    <td className="py-2 pr-2 font-mono">{r.email}</td>
                    <td className="py-2 pr-2">{r.user?.name || "—"}</td>
                    <td className="py-2 pr-2 whitespace-nowrap">
                      {r.completedAt ? new Date(r.completedAt).toLocaleString() : "—"}
                    </td>
                    <td className="py-2">{r.completedBy?.name || "—"}</td>
                  </tr>
                ))}
                {resetRequestsHistory.length === 0 && (
                  <tr>
                    <td className="py-6 text-ink-500" colSpan={4}>
                      No recent history.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {completeResetModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-950/45 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="complete-reset-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !completeResetBusy) setCompleteResetModal(null);
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-line border-l-4 border-l-accent overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-line bg-white">
              <h2 id="complete-reset-title" className="text-base font-semibold text-ink-950">
                Set temporary password
              </h2>
              <p className="text-xs text-ink-500 mt-1">
                The user will log in with this password, then be required to choose a new one.
              </p>
            </div>
            <form
              className="p-5 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                setMsg("");
                if (tempPassword.length < 8) {
                  setError("Temporary password must be at least 8 characters.");
                  return;
                }
                if (tempPassword !== tempPasswordConfirm) {
                  setError("Passwords do not match.");
                  return;
                }
                setCompleteResetBusy(true);
                try {
                  await api(`/password-resets/${completeResetModal.id}/complete`, {
                    method: "POST",
                    body: JSON.stringify({ tempPassword }),
                  });
                  setMsg("Temporary password set. The user must set a new password after login.");
                  setCompleteResetModal(null);
                  await load();
                } catch (err) {
                  setError(err.message);
                } finally {
                  setCompleteResetBusy(false);
                }
              }}
            >
              <div className="rounded-md bg-surface border border-line px-3 py-2 text-xs text-ink-600">
                <p>
                  <span className="font-medium text-ink-700">Request: </span>
                  <span className="font-mono">{completeResetModal.submittedAs}</span>
                </p>
                {completeResetModal.userLabel && (
                  <p className="mt-1">
                    <span className="font-medium text-ink-700">Account: </span>
                    {completeResetModal.userLabel}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">Temporary password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="w-full border border-line px-3 py-2.5 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-accent/25"
                  placeholder="Minimum 8 characters"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={completeResetBusy}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">Confirm temporary password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  className="w-full border border-line px-3 py-2.5 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-accent/25"
                  value={tempPasswordConfirm}
                  onChange={(e) => setTempPasswordConfirm(e.target.value)}
                  required
                  minLength={8}
                  disabled={completeResetBusy}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="px-4 py-2 text-sm border border-line rounded-md hover:bg-surface text-ink-700"
                  disabled={completeResetBusy}
                  onClick={() => setCompleteResetModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-md bg-accent text-white hover:brightness-95 disabled:opacity-50"
                  disabled={completeResetBusy}
                >
                  {completeResetBusy ? "Saving…" : "Complete reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userEditModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink-950/45 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-user-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !editBusy) setUserEditModal(null);
          }}
        >
          <div
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-line border-l-4 border-l-accent overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-line">
              <h2 id="edit-user-title" className="text-base font-semibold text-ink-950">
                Edit user
              </h2>
              <p className="text-xs text-ink-500 mt-1">Update profile and assignment. Changes apply immediately.</p>
            </div>
            <form
              className="p-5 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                setMsg("");
                setEditBusy(true);
                try {
                  await api(`/users/${userEditModal.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({
                      name: editForm.name.trim(),
                      email: editForm.email.trim().toLowerCase(),
                      role: editForm.role,
                      departmentId: editForm.departmentId,
                    }),
                  });
                  setMsg("User updated.");
                  setUserEditModal(null);
                  await load();
                } catch (err) {
                  setError(err.message);
                } finally {
                  setEditBusy(false);
                }
              }}
            >
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">Full name</label>
                <input
                  className="w-full border border-line px-3 py-2 text-sm rounded-md"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border border-line px-3 py-2 text-sm rounded-md"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">Role</label>
                <select
                  className="w-full border border-line px-3 py-2 text-sm rounded-md bg-white"
                  value={editForm.role}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="STAFF">Staff</option>
                  <option value="DEPARTMENT_HEAD">Department head</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">Department</label>
                <select
                  className="w-full border border-line px-3 py-2 text-sm rounded-md bg-white"
                  value={editForm.departmentId}
                  onChange={(e) => setEditForm((f) => ({ ...f, departmentId: e.target.value }))}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.prefix} — {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm border border-line rounded-md hover:bg-surface"
                  disabled={editBusy}
                  onClick={() => setUserEditModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-md bg-accent text-white hover:brightness-95 disabled:opacity-50"
                  disabled={editBusy}
                >
                  {editBusy ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SectionCard title="Departments">
        <div className="overflow-x-auto border border-line rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-brand-sidebar text-white text-xs uppercase">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Prefix</th>
                <th className="px-3 py-2 text-left font-semibold">Name</th>
                <th className="px-3 py-2 text-right font-semibold w-[56px]">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {departments
                .filter((d) => {
                  const q = deptQ.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    String(d.prefix || "").toLowerCase().includes(q) ||
                    String(d.name || "").toLowerCase().includes(q)
                  );
                })
                .map((d) => (
                <tr key={d.id} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 font-mono">{d.prefix}</td>
                  <td className="px-3 py-2">{d.name}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="relative inline-block">
                      <button
                        type="button"
                        aria-label="Department actions"
                        className="p-1.5 hover:bg-surface border border-transparent hover:border-line rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenUserMenuId(null);
                          setOpenDeptMenuId((v) => (v === d.id ? null : d.id));
                        }}
                      >
                        <ThreeDotIcon />
                      </button>
                      {openDeptMenuId === d.id && (
                        <div
                          className="absolute right-0 mt-1 w-40 bg-white border border-line shadow-lg z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-brand-hover"
                            onClick={async () => {
                              setOpenDeptMenuId(null);
                              const nextName = window.prompt("Update department name", d.name);
                              if (nextName == null) return;
                              const nextPrefix = window.prompt("Update department prefix", d.prefix);
                              if (nextPrefix == null) return;
                              setError("");
                              setMsg("");
                              try {
                                await api(`/departments/${d.id}`, {
                                  method: "PATCH",
                                  body: JSON.stringify({ name: nextName, prefix: nextPrefix }),
                                });
                                setMsg("Department updated.");
                                await load();
                              } catch (e) {
                                setError(e.message);
                              }
                            }}
                          >
                            Update
                          </button>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                            onClick={async () => {
                              setOpenDeptMenuId(null);
                              const ok = window.confirm(`Delete department ${d.prefix} — ${d.name}?`);
                              if (!ok) return;
                              setError("");
                              setMsg("");
                              try {
                                await api(`/departments/${d.id}`, { method: "DELETE" });
                                setMsg("Department deleted.");
                                await load();
                              } catch (e) {
                                setError(e.message);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Users">
        <div className="overflow-x-auto border border-line rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-brand-sidebar text-white text-xs uppercase">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">User ID</th>
                <th className="px-3 py-2 text-left font-semibold">Name</th>
                <th className="px-3 py-2 text-left font-semibold">Email</th>
                <th className="px-3 py-2 text-left font-semibold">Role</th>
                <th className="px-3 py-2 text-left font-semibold">Department</th>
                <th className="px-3 py-2 text-left font-semibold">Reset</th>
                <th className="px-3 py-2 text-right font-semibold w-[56px]">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((u) => {
                  const q = userQ.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    String(u.name || "").toLowerCase().includes(q) ||
                    String(u.email || "").toLowerCase().includes(q) ||
                    String(u.role || "").toLowerCase().includes(q) ||
                    String(u.department?.prefix || "").toLowerCase().includes(q)
                  );
                })
                .map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 font-mono text-xs" title={u.id}>
                    {String(u.id).slice(0, 8)}
                  </td>
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.role}</td>
                  <td className="px-3 py-2">{u.department?.prefix}</td>
                  <td className="px-3 py-2">{u.mustResetPassword ? "Yes" : "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="relative inline-block">
                      <button
                        type="button"
                        aria-label="User actions"
                        className="p-1.5 hover:bg-surface border border-transparent hover:border-line rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDeptMenuId(null);
                          setOpenUserMenuId((v) => (v === u.id ? null : u.id));
                        }}
                      >
                        <ThreeDotIcon />
                      </button>
                      {openUserMenuId === u.id && (
                        <div
                          className="absolute right-0 mt-1 w-40 bg-white border border-line shadow-lg z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-brand-hover"
                            onClick={() => {
                              setOpenUserMenuId(null);
                              setEditForm({
                                name: u.name,
                                email: u.email,
                                role: u.role,
                                departmentId: u.departmentId,
                              });
                              setUserEditModal(u);
                            }}
                          >
                            Update
                          </button>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                            onClick={async () => {
                              setOpenUserMenuId(null);
                              const ok = window.confirm(`Delete user ${u.email}?`);
                              if (!ok) return;
                              setError("");
                              setMsg("");
                              try {
                                await api(`/users/${u.id}`, { method: "DELETE" });
                                setMsg("User deleted.");
                                await load();
                              } catch (e) {
                                setError(e.message);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
