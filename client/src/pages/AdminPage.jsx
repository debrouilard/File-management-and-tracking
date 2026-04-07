import { useEffect, useState } from "react";
import { api } from "../services/api.js";

export function AdminPage() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
    departmentId: "",
  });

  async function load() {
    const [u, d] = await Promise.all([api("/users"), api("/departments")]);
    setUsers(u);
    setDepartments(d);
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

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-950 mb-2">Administration</h1>
      <p className="text-sm text-ink-500 mb-8">Create accounts and review departments.</p>
      {error && <p className="text-sm text-red-700 mb-2">{error}</p>}
      {msg && <p className="text-sm text-green-800 mb-4">{msg}</p>}

      <section className="mb-12">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500 border-b border-line pb-2 mb-4">
          New user
        </h2>
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
            <button type="submit" className="px-4 py-2 text-sm font-medium bg-accent text-white">
              Create user
            </button>
          </div>
        </form>
      </section>

      <section className="mb-12">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500 border-b border-line pb-2 mb-4">
          Departments
        </h2>
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead className="bg-white border-b border-line text-xs uppercase text-ink-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Prefix</th>
                <th className="px-3 py-2 text-left font-medium">Name</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 font-mono">{d.prefix}</td>
                  <td className="px-3 py-2">{d.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500 border-b border-line pb-2 mb-4">
          Users
        </h2>
        <div className="overflow-x-auto border border-line">
          <table className="w-full text-sm">
            <thead className="bg-white border-b border-line text-xs uppercase text-ink-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Name</th>
                <th className="px-3 py-2 text-left font-medium">Email</th>
                <th className="px-3 py-2 text-left font-medium">Role</th>
                <th className="px-3 py-2 text-left font-medium">Dept</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.role}</td>
                  <td className="px-3 py-2">{u.department?.prefix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
