import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where } from "firebase/firestore";
import { AlertTriangle, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { JOB_STATUSES, formatDateTime } from "@/lib/utils";

// Native HTML5 drag-and-drop kanban — no external DnD library required.
export default function DispatchBoard() {
  const { companyId } = useAuth();
  const { t } = useLanguage();
  const [jobs, setJobs] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [techFilter, setTechFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [dragJobId, setDragJobId] = useState(null);

  useEffect(() => {
    if (!companyId) {
      setJobs([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "jobs"),
      where("companyId", "==", companyId),
      orderBy("scheduledAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, "technicians"), where("companyId", "==", companyId));
    const unsub = onSnapshot(q, (snap) => {
      setTechnicians(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [companyId]);

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
        <h1 className="text-lg font-semibold">{t("dispatch.title")}</h1>
        <Select className="w-48" value={techFilter} onChange={(e) => setTechFilter(e.target.value)}>
          <option value="">{t("dispatch.allTechnicians")}</option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.name}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("dispatch.loading")}</p>
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
                {t(`status.${status}`)} ({columns[status].length})
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
                            <Badge variant="outline">{t("addJob.unassigned")}</Badge>
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
