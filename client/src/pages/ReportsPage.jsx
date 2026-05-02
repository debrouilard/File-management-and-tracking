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

function SimpleLineChart({ sent, received }) {
  const w = 520;
  const h = 160;
  const pad = 24;
  const max = Math.max(...sent, ...received, 1);

  function line(points) {
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
      <polyline fill="none" stroke="#3F79A8" strokeWidth="3" points={line(sent)} />
      <polyline fill="none" stroke="#1e3a5f" strokeWidth="3" points={line(received)} />
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

function SimpleBarChart({ labels, values }) {
  const w = 520;
  const h = 200;
  const pad = 24;
  const max = Math.max(...values, 1);
  const barW = (w - pad * 2) / values.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[220px]">
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#e5e7eb" />
      {values.map((v, i) => {
        const x = pad + i * barW + 6;
        const bh = (v * (h - pad * 2)) / max;
        const y = h - pad - bh;
        return (
          <g key={labels[i]}>
            <rect x={x} y={y} width={barW - 12} height={bh} fill="#3F79A8" />
            <text
              x={pad + i * barW + barW / 2}
              y={h - 6}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function ReportsPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [files, setFiles] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    api("/departments").then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => {
    api("/files")
      .then(setFiles)
      .catch(() => setFiles([]));
  }, [month]);

  const stats = useMemo(() => {
    const sent = files.filter((f) => f.status === "SENT").length;
    const received = files.filter((f) => ["RECEIVED", "UNDER_REVIEW", "APPROVED", "REJECTED"].includes(f.status))
      .length;
    const accepted = files.filter((f) => f.status === "APPROVED").length;
    const rejected = files.filter((f) => f.status === "REJECTED").length;

    const byDept = new Map();
    for (const d of departments) byDept.set(d.prefix, 0);
    for (const f of files) {
      const p = f.senderDept?.prefix;
      if (p) byDept.set(p, (byDept.get(p) || 0) + 1);
    }
    const labels = [...byDept.keys()].slice(0, 8);
    const values = labels.map((l) => byDept.get(l) || 0);

    const sentWeekly = [0, 0, 0, 0];
    const receivedWeekly = [0, 0, 0, 0];
    for (const f of files) {
      const dt = new Date(f.createdAt);
      const week = Math.min(3, Math.floor((dt.getDate() - 1) / 7));
      if (f.status === "SENT") sentWeekly[week] += 1;
      if (["RECEIVED", "UNDER_REVIEW", "APPROVED", "REJECTED"].includes(f.status)) receivedWeekly[week] += 1;
    }

    return { sent, received, accepted, rejected, labels, values, sentWeekly, receivedWeekly };
  }, [files, departments]);

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-12 lg:col-span-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <h1 className="text-lg font-semibold text-ink-950">Reports / Summary</h1>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-ink-700">Monthly Review</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border border-line px-3 py-2 text-sm bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-12 xl:col-span-7">
            <Card title="Monthly Document Flow">
              <div className="text-xs text-ink-500 mb-2">Sent vs Received</div>
              <SimpleLineChart sent={stats.sentWeekly} received={stats.receivedWeekly} />
            </Card>
          </div>
          <div className="col-span-12 xl:col-span-5">
            <Card title="Departmental Volume">
              <SimpleBarChart labels={stats.labels} values={stats.values} />
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
                  <p className="text-xl font-semibold text-brand-headerTo">{stats.rejected}</p>
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
                  <p className="text-xl font-semibold text-brand-headerTo">{stats.rejected}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

