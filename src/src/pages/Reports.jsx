import { useEffect, useMemo, useState } from "react";
import { collection, collectionGroup, getDocs, query, where } from "firebase/firestore";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { currency } from "@/lib/utils";

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function Reports() {
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [onHoldJobIds, setOnHoldJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [jobSnap, custSnap] = await Promise.all([
        getDocs(collection(db, "jobs")),
        getDocs(collection(db, "customers")),
      ]);
      setJobs(jobSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCustomers(custSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Approximate "first-time fix" by checking whether a job's activity
      // timeline ever logged an on-hold status change (i.e. needed a return trip).
      try {
        const onHoldSnap = await getDocs(
          query(collectionGroup(db, "activity"), where("text", "==", "Status changed to On Hold"))
        );
        const ids = new Set(onHoldSnap.docs.map((d) => d.ref.parent.parent.id));
        setOnHoldJobIds(ids);
      } catch {
        // collectionGroup query requires an index the first time it's run;
        // Firestore will log a console link to create it. Non-fatal.
      }
      setLoading(false);
    }
    load();
  }, []);

  const revenueByMonth = useMemo(() => {
    const map = {};
    for (const job of jobs) {
      if (!["completed", "invoiced"].includes(job.status)) continue;
      const d = job.scheduledAt?.toDate ? job.scheduledAt.toDate() : new Date(job.scheduledAt);
      const key = monthKey(d);
      map[key] = (map[key] || 0) + (Number(job.price) || 0);
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }));
  }, [jobs]);

  const outstandingInvoices = useMemo(() => {
    return jobs
      .filter((j) => j.status === "invoiced" || j.status === "completed")
      .reduce((sum, j) => {
        const paid = (j.paymentsLog || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
        return sum + Math.max((Number(j.price) || 0) - paid, 0);
      }, 0);
  }, [jobs]);

  const completedJobs = useMemo(
    () => jobs.filter((j) => ["completed", "invoiced"].includes(j.status)),
    [jobs]
  );

  const avgCompletionDays = useMemo(() => {
    const durations = completedJobs
      .filter((j) => j.createdAt?.toDate && j.updatedAt?.toDate)
      .map((j) => (j.updatedAt.toDate() - j.createdAt.toDate()) / (1000 * 60 * 60 * 24));
    if (durations.length === 0) return null;
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }, [completedJobs]);

  const firstTimeFixRate = useMemo(() => {
    const repairJobs = completedJobs.filter((j) => j.jobType === "repair");
    if (repairJobs.length === 0) return null;
    const fixedFirstTry = repairJobs.filter((j) => !onHoldJobIds.has(j.id));
    return (fixedFirstTry.length / repairJobs.length) * 100;
  }, [completedJobs, onHoldJobIds]);

  const utilizationByTech = useMemo(() => {
    const map = {};
    for (const job of jobs) {
      const name = job.technicianName || "Unassigned";
      map[name] = (map[name] || 0) + 1;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([technician, jobs]) => ({ technician, jobs }));
  }, [jobs]);

  const topCustomers = useMemo(() => {
    const map = {};
    for (const job of jobs) {
      if (!["completed", "invoiced"].includes(job.status)) continue;
      map[job.customerName] = (map[job.customerName] || 0) + (Number(job.price) || 0);
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [jobs]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading reports...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Reports & Analytics</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Completed/Invoiced Jobs</p>
            <p className="text-xl font-semibold">{completedJobs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className="text-xl font-semibold">{currency(outstandingInvoices)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg. Days to Complete</p>
            <p className="text-xl font-semibold">
              {avgCompletionDays != null ? avgCompletionDays.toFixed(1) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">First-Time Fix Rate</p>
            <p className="text-xl font-semibold">
              {firstTimeFixRate != null ? `${firstTimeFixRate.toFixed(0)}%` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue by Month</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {revenueByMonth.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed/invoiced jobs yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => currency(v)} />
                <Bar dataKey="revenue" fill="hsl(221.2 83.2% 53.3%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Technician Utilization (all-time job count)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={utilizationByTech} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" fontSize={12} />
              <YAxis type="category" dataKey="technician" width={100} fontSize={12} />
              <Tooltip />
              <Bar dataKey="jobs" fill="hsl(221.2 83.2% 53.3%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Customers by Revenue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No revenue data yet.</p>
          ) : (
            topCustomers.map(([name, total]) => (
              <div key={name} className="flex justify-between text-sm">
                <span>{name}</span>
                <span className="font-medium">{currency(total)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {customers.length} customers on file · First-time fix rate approximates "never went to
        On Hold" for repair jobs — treat as directional, not exact, until visits are tracked
        more precisely.
      </p>
    </div>
  );
}
