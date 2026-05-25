import { useAuth } from "../context/AuthContext.jsx";

export function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-10 bg-white border border-line p-6">
        <h1 className="text-lg font-semibold text-ink-950 mb-4">Profile</h1>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-4 text-ink-500">Full Name</div>
            <div className="col-span-8 text-ink-900 font-medium">{user?.name || "—"}</div>
          </div>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-4 text-ink-500">User ID</div>
            <div className="col-span-8 text-ink-900 font-medium">{user?.email || "—"}</div>
          </div>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-4 text-ink-500">Email</div>
            <div className="col-span-8 text-ink-900 font-medium">{user?.email || "—"}</div>
          </div>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-4 text-ink-500">Department</div>
            <div className="col-span-8 text-ink-900 font-medium">
              {user?.department?.name ? `${user.department.name} (${user.department.prefix})` : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

