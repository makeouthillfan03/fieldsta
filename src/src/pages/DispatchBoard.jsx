import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { AlertTriangle, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { JOB_STATUSES, STATUS_LABELS, formatDateTime } from "@/lib/utils";

// Native HTML5 drag-and-drop kanban — no external DnD library required.
export default function DispatchBoard() {
  const [jobs, setJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [techFilter, setTechFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [dragJobId, setDragJobId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "jobs"), orderBy("scheduledAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "technicians"), (snap) => {
      setTechnicians(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const visibleJobs = useMemo(() => {
    if (!techFilter) return jobs;
    return jobs.filter((j) => j.technicianId === techFilter);
  }, [jobs, techFilter]);

  const columns = useMemo(() => {
    const map = {};
    for (const status of JOB_STATUSES) map[status] = [];
    for (const job of visibleJobs) {
      (map[job.status] ||= []).push(job);
    }
    return map;
  }, [visibleJobs]);

  async function moveJob(jobId, status) {
    await updateDoc(doc(db, "jobs", jobId), { status });
  }

  function handleDrop(e, status) {
    e.preventDefault();
    if (dragJobId) moveJob(dragJobId, status);
    setDragJobId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Dispatch Board</h1>
        <Select className="w-48" value={techFilter} onChange={(e) => setTechFilter(e.target.value)}>
          <option value="">All technicians</option>
          {technicians.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading dispatch board...</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {JOB_STATUSES.map((status) => (
            <div
              key={status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, status)}
              className="w-64 shrink-0 rounded-lg bg-muted/50 p-2"
            >
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {STATUS_LABELS[status]} ({columns[status].length})
              </p>
              <div className="space-y-2">
                {columns[status].map((job) => (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={() => setDragJobId(job.id)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <Link to={`/jobs/${job.id}`}>
                      <Card className="hover:shadow-md">
                        <CardContent className="space-y-1 p-3">
                          <div className="flex items-center gap-1">
                            {job.priority === "emergency" && (
                              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                            )}
                            <p className="truncate text-sm font-medium">{job.customerName}</p>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{job.description}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(job.scheduledAt)}</p>
                          {job.technicianName ? (
                            <Badge variant="secondary">
                              <User className="mr-1 h-3 w-3" /> {job.technicianName}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Unassigned</Badge>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
