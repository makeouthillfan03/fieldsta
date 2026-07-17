import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, orderBy, query, where, Timestamp } from "firebase/firestore";
import { AlertTriangle, CalendarCheck, MapPin, Phone, Plus, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  formatDateTime,
  formatDate,
  isSameDay,
  STATUS_BADGE_VARIANT,
} from "@/lib/utils";

function MaintenanceDueBanner({ companyId }) {
  const { t } = useLanguage();
  const [agreements, setAgreements] = useState([]);

  useEffect(() => {
    if (!companyId) return;
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    const q = query(
      collection(db, "maintenanceAgreements"),
      where("companyId", "==", companyId),
      where("active", "==", true),
      where("nextDueDate", "<=", Timestamp.fromDate(in30)),
      orderBy("nextDueDate", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setAgreements(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [companyId]);

  if (agreements.length === 0) return null;

  return (
    <Link to="/agreements">
      <Card className="border-amber-300 bg-amber-50 transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-3 p-4">
          <CalendarCheck className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-900">
              {agreements.length} {t("dashboard.maintenanceDue")}
            </p>
            <p className="truncate text-xs text-amber-800">
              {agreements
                .slice(0, 3)
                .map((a) => `${a.customerName} (${formatDate(a.nextDueDate)})`)
                .join(", ")}
              {agreements.length > 3 && "..."}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function JobRow({ job }) {
  const { t } = useLanguage();
  return (
    <Link to={`/jobs/${job.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{job.customerName || t("dashboard.unnamedCustomer")}</p>
              {job.priority === "emergency" && (
                <Badge variant="destructive">
                  <AlertTriangle className="mr-1 h-3 w-3" /> {t("dashboard.emergency")}
                </Badge>
              )}
              <Badge variant={STATUS_BADGE_VARIANT[job.status] || "secondary"}>
                {t(`status.${job.status}`)}
              </Badge>
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {job.jobType ? `${t(`jobType.${job.jobType}`)}: ` : ""}
              {job.description}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{formatDateTime(job.scheduledAt)}</span>
              {job.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {job.address}
                </span>
              )}
              {job.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {job.phone}
                </span>
              )}
              {job.technicianName && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> {job.technicianName}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function JobSection({ title, jobs }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title} ({jobs.length})
      </h2>
      {jobs.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          {t("dashboard.noJobs")}
        </p>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user, companyId } = useAuth();
  const { t } = useLanguage();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myJobsOnly, setMyJobsOnly] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setJobs([]);
      setLoading(false);
      return;
    }

    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const q = query(
      collection(db, "jobs"),
      where("companyId", "==", companyId),
      where("scheduledAt", ">=", Timestamp.fromDate(weekStart)),
      where("scheduledAt", "<", Timestamp.fromDate(weekEnd)),
      orderBy("scheduledAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [companyId]);

  const { today, tomorrow, thisWeek } = useMemo(() => {
    const now = new Date();
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(now.getDate() + 1);

    const visibleJobs = myJobsOnly
      ? jobs.filter((j) => j.technicianEmail === user?.email)
      : jobs;

    const today = [];
    const tomorrow = [];
    const thisWeek = [];

    for (const job of visibleJobs) {
      const d = job.scheduledAt?.toDate ? job.scheduledAt.toDate() : new Date(job.scheduledAt);
      if (isSameDay(d, now)) today.push(job);
      else if (isSameDay(d, tomorrowDate)) tomorrow.push(job);
      else thisWeek.push(job);
    }
    return { today, tomorrow, thisWeek };
  }, [jobs, myJobsOnly, user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t("dashboard.title")}</h1>
        <Link to="/jobs/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" /> {t("dashboard.addJob")}
          </Button>
        </Link>
      </div>

      <MaintenanceDueBanner companyId={companyId} />

      <div className="flex gap-2">
        <button
          onClick={() => setMyJobsOnly(false)}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            !myJobsOnly ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
          }`}
        >
          {t("dashboard.allJobs")}
        </button>
        <button
          onClick={() => setMyJobsOnly(true)}
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            myJobsOnly ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
          }`}
        >
          {t("dashboard.myJobs")}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("dashboard.loading")}</p>
      ) : (
        <>
          <JobSection title={t("dashboard.today")} jobs={today} />
          <JobSection title={t("dashboard.tomorrow")} jobs={tomorrow} />
          <JobSection title={t("dashboard.thisWeek")} jobs={thisWeek} />
        </>
      )}
    </div>
  );
}
