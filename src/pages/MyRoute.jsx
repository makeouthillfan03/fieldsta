import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { GripVertical, MapPin, Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { formatTime } from "@/lib/utils";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function MyRoute() {
  const { user, isAdmin, companyId } = useAuth();
  const [technicians, setTechnicians] = useState([]);
  const [technicianId, setTechnicianId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [jobs, setJobs] = useState([]);
  const [order, setOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragIdx, setDragIdx] = useState(null);

  useEffect(() => {
    if (!isAdmin || !companyId) return;
    const q = query(collection(db, "technicians"), where("companyId", "==", companyId));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTechnicians(list);
      if (!technicianId) {
        const mine = list.find((t) => t.email === user?.email);
        setTechnicianId(mine?.id || list[0]?.id || "");
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, companyId]);

  useEffect(() => {
    if (isAdmin || !user?.email || !companyId) return;
    const q = query(
      collection(db, "technicians"),
      where("companyId", "==", companyId),
      where("email", "==", user.email)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (snap.docs.length) setTechnicianId(snap.docs[0].id);
    });
    return unsub;
  }, [isAdmin, user, companyId]);

  useEffect(() => {
    if (!technicianId || !date || !companyId) {
      setJobs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const dayStart = Timestamp.fromDate(new Date(`${date}T00:00:00`));
    const dayEnd = Timestamp.fromDate(new Date(`${date}T23:59:59`));
    const q = query(
      collection(db, "jobs"),
      where("companyId", "==", companyId),
      where("technicianId", "==", technicianId),
      where("scheduledAt", ">=", dayStart),
      where("scheduledAt", "<=", dayEnd)
    );
    const unsub = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [technicianId, date, companyId]);

  useEffect(() => {
    if (!technicianId || !date) return;
    async function loadOrder() {
      const snap = await getDoc(doc(db, "routes", `${technicianId}_${date}`));
      setOrder(snap.exists() ? snap.data().jobIds || [] : []);
    }
    loadOrder();
  }, [technicianId, date]);

  const orderedJobs = useMemo(() => {
    const byId = Object.fromEntries(jobs.map((j) => [j.id, j]));
    const known = order.filter((id) => byId[id]).map((id) => byId[id]);
    const rest = jobs
      .filter((j) => !order.includes(j.id))
      .sort((a, b) => (a.scheduledAt?.seconds || 0) - (b.scheduledAt?.seconds || 0));
    return [...known, ...rest];
  }, [jobs, order]);

  async function persistOrder(list) {
    const jobIds = list.map((j) => j.id);
    setOrder(jobIds);
    await setDoc(doc(db, "routes", `${technicianId}_${date}`), {
      companyId,
      technicianId,
      date,
      jobIds,
      updatedAt: Timestamp.now(),
    });
  }

  function handleDrop(idx) {
    if (dragIdx === null || dragIdx === idx) return;
    const list = [...orderedJobs];
    const [moved] = list.splice(dragIdx, 1);
    list.splice(idx, 0, moved);
    persistOrder(list);
    setDragIdx(null);
  }

  function openInMaps() {
    const addresses = orderedJobs.map((j) => j.address).filter(Boolean);
    if (addresses.length === 0) return;
    const url = `https://www.google.com/maps/dir/${addresses.map(encodeURIComponent).join("/")}`;
    window.open(url, "_blank");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">My Route</h1>

      <div className="flex flex-wrap gap-2">
        {isAdmin && (
          <Select className="w-48" value={technicianId} onChange={(e) => setTechnicianId(e.target.value)}>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        )}
        <Input type="date" className="w-40" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button variant="outline" onClick={openInMaps} disabled={orderedJobs.length === 0}>
          <Navigation className="mr-1 h-4 w-4" /> Open in Google Maps
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Drag jobs to set the order you'll drive them in, then open the route in Google Maps. Maps
        will lay out driving directions stop-by-stop in that order; for automatic distance-based
        optimization across many stops, wire this up to the Google Maps Directions API with an API
        key (not required for the basic multi-stop flow here).
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading route...</p>
      ) : orderedJobs.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          No jobs scheduled for this technician on this date.
        </p>
      ) : (
        <div className="space-y-2">
          {orderedJobs.map((job, idx) => (
            <div
              key={job.id}
              draggable
              onDragStart={() => setDragIdx(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(idx)}
              className="cursor-grab active:cursor-grabbing"
            >
              <Card>
                <CardContent className="flex items-center gap-3 p-3">
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {idx + 1}
                  </span>
                  <Link to={`/jobs/${job.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{job.customerName}</p>
                    <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span>{formatTime(job.scheduledAt)}</span>
                      {job.address && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" /> {job.address}
                        </span>
                      )}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
