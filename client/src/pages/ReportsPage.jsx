import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

function Card({ title, children }) {
  return (
    <div className="bg-white border border-line rounded-md shadow-sm overflow-hidden">
      <div className="px-4 h-[44px] flex items-center bg-brand-sidebar text-white">
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/** Softer red for “received” trend line */
const RECEIVED_LINE = "#d4a09a";
const SENT_LINE = "#3F79A8";

function SimpleLineChart({ sent, received }) {
  const w = 520;
  const h = 160;
  const pad = 24;
  const max = Math.max(...sent, ...received, 1);
  const n = Math.max(sent.length, 2);

  function line(points) {
    if (points.length <= 1) {
      const y = h - pad - (points[0] * (h - pad * 2)) / max;
      return `${pad},${y} ${w - pad},${y}`;
    }
    return points
      .map((v, i) => {
        const x = pad + (i * (w - pad * 2)) / (points.length - 1);
        const y = h - pad - (v * (h - pad * 2)) / max;
        return `${x},${y}`;
      })
      .join(" ");
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[180px]">
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#e5e7eb" />
      <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#e5e7eb" />
      <polyline fill="none" stroke={SENT_LINE} strokeWidth="2.5" points={line(sent)} />
      <polyline fill="none" stroke={RECEIVED_LINE} strokeWidth="2.5" points={line(received)} />
      {["Week 1", "Week 2", "Week 3", "Week 4"].map((label, i) => (
        <text
          key={label}
          x={pad + (i * (w - pad * 2)) / 3}
          y={h - 6}
          textAnchor="middle"
          fontSize="10"
          fill="#6b7280"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

function DeptDualBarChart({ departments, sentByDept, receivedByDept }) {
  const w = 560;
  const h = 220;
  const pad = 28;
  const count = Math.max(departments.length, 1);
  const groupW = (w - pad * 2) / count;
  const max = Math.max(1, ...departments.map((d) => (sentByDept.get(d.id) || 0) + (receivedByDept.get(d.id) || 0)));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[240px]">
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#e5e7eb" />
      {departments.map((d, i) => {
        const sent = sentByDept.get(d.id) || 0;
        const recv = receivedByDept.get(d.id) || 0;
        const bx = pad + i * groupW + 8;
        const inner = (groupW - 16) / 2 - 2;
        const hSent = (sent * (h - pad * 2)) / max;
        const hRecv = (recv * (h - pad * 2)) / max;
        const ySent = h - pad - hSent;
        const yRecv = h - pad - hRecv;
        return (
          <g key={d.id}>
            <rect x={bx} y={ySent} width={inner} height={hSent} rx={3} fill="#3F79A8" opacity={0.92} />
            <rect x={bx + inner + 4} y={yRecv} width={inner} height={hRecv} rx={3} fill="#e8b4b0" opacity={0.95} />
            <text
              x={pad + i * groupW + groupW / 2}
              y={h - 8}
              textAnchor="middle"
              fontSize="9"
              fill="#6b7280"
            >
              {d.prefix}
            </text>
          </g>
        );
      })}
      <text x={pad} y={14} fontSize="10" fill="#3F79A8">
        ■ Sent
      </text>
      <text x={pad + 52} y={14} fontSize="10" fill="#c97d7d">
        ■ Received
      </text>
    </svg>
  );
}

function monthRange(isoMonth) {
  const [y, m] = isoMonth.split("-").map((x) => parseInt(x, 10));
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  return {
    startStr: start.toISOString().slice(0, 10),
    endStr: end.toISOString(),
  };
}

export function ReportsPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [files, setFiles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    api("/departments").then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => {
    const { startStr, endStr } = monthRange(month);
    const params = new URLSearchParams();
    params.set("dateFrom", startStr);
    params.set("dateTo", endStr);
    setLoadError("");
    api(`/files?${params.toString()}`)
      .then(setFiles)
      .catch((e) => {
        setLoadError(e.message || "Failed to load reports");
        setFiles([]);
      });
  }, [month]);

  const stats = useMemo(() => {
    const sent = files.filter((f) => f.status === "SENT").length;
    const received = files.filter((f) => ["RECEIVED", "UNDER_REVIEW", "APPROVED", "REJECTED"].includes(f.status)).length;
    const accepted = files.filter((f) => f.status === "APPROVED").length;
    const rejected = files.filter((f) => f.status === "REJECTED").length;

    const sentByDept = new Map();
    const receivedByDept = new Map();
    for (const d of departments) {
      sentByDept.set(d.id, 0);
      receivedByDept.set(d.id, 0);
    }
    for (const f of files) {
      if (f.senderDeptId && sentByDept.has(f.senderDeptId)) {
        sentByDept.set(f.senderDeptId, (sentByDept.get(f.senderDeptId) || 0) + 1);
      }
      if (f.receiverDeptId && receivedByDept.has(f.receiverDeptId)) {
        receivedByDept.set(f.receiverDeptId, (receivedByDept.get(f.receiverDeptId) || 0) + 1);
      }
    }

    const sentWeekly = [0, 0, 0, 0];
    const receivedWeekly = [0, 0, 0, 0];
    const [y, m] = month.split("-").map((x) => parseInt(x, 10));
    for (const f of files) {
      const dt = new Date(f.createdAt);
      if (dt.getFullYear() !== y || dt.getMonth() !== m - 1) continue;
      const day = dt.getDate();
      const week = Math.min(3, Math.floor((day - 1) / 7));
      if (f.status === "SENT") sentWeekly[week] += 1;
      if (["RECEIVED", "UNDER_REVIEW", "APPROVED", "REJECTED"].includes(f.status)) receivedWeekly[week] += 1;
    }

    return { sent, received, accepted, rejected, sentWeekly, receivedWeekly, sentByDept, receivedByDept };
  }, [files, departments, month]);

  const deptList = useMemo(() => departments.slice(0, 10), [departments]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <h1 className="text-lg font-semibold text-ink-950">Reports / Summary</h1>
            <p className="text-xs text-ink-500 mt-1">Data is limited to the selected month.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-ink-700">Monthly Review</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border border-line px-3 py-2 text-sm bg-white rounded-md"
            />
          </div>
        </div>

        {loadError && <p className="text-sm text-red-700 mb-3">{loadError}</p>}

        <div className="grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-12 xl:col-span-7">
            <Card title="Monthly Document Flow">
              <div className="text-xs text-ink-500 mb-2">Sent vs Received (by week of month)</div>
              <SimpleLineChart sent={stats.sentWeekly} received={stats.receivedWeekly} />
            </Card>
          </div>
          <div className="col-span-12 xl:col-span-5">
            <Card title="Departmental Volume">
              <div className="text-xs text-ink-500 mb-2">Per department in selected month</div>
              <DeptDualBarChart
                departments={deptList}
                sentByDept={stats.sentByDept}
                receivedByDept={stats.receivedByDept}
              />
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-12 xl:col-span-6">
            <Card title="Sent Summary">
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-line rounded-md p-3">
                  <p className="text-xs text-ink-500">Total Sent</p>
                  <p className="text-xl font-semibold text-accent">{stats.sent}</p>
                </div>
                <div className="border border-line rounded-md p-3">
                  <p className="text-xs text-ink-500">Accepted</p>
                  <p className="text-xl font-semibold text-brand-sidebar">{stats.accepted}</p>
                </div>
                <div className="border border-line rounded-md p-3">
                  <p className="text-xs text-ink-500">Rejected</p>
                  <p className="text-xl font-semibold text-ink-700">{stats.rejected}</p>
                </div>
              </div>
            </Card>
          </div>
          <div className="col-span-12 xl:col-span-6">
            <Card title="Received Summary">
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-line rounded-md p-3">
                  <p className="text-xs text-ink-500">Total Received</p>
                  <p className="text-xl font-semibold text-accent">{stats.received}</p>
                </div>
                <div className="border border-line rounded-md p-3">
                  <p className="text-xs text-ink-500">Accepted</p>
                  <p className="text-xl font-semibold text-brand-sidebar">{stats.accepted}</p>
                </div>
                <div className="border border-line rounded-md p-3">
                  <p className="text-xs text-ink-500">Rejected</p>
                  <p className="text-xl font-semibold text-ink-700">{stats.rejected}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
