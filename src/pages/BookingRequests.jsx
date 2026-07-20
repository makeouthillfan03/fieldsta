import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Calendar, Check, Copy, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatDateTime } from "@/lib/utils";

// Admin review queue for requests submitted through the public /book/{id}
// widget. Nothing from that form ever creates a job directly — an admin
// looks at each request here and either converts it into a real scheduled
// job or dismisses it, same "propose, don't auto-commit" pattern used
// everywhere else AI or an outside party can put something into the system.
export default function BookingRequests() {
  const { user, companyId } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "bookingRequests"),
      where("companyId", "==", companyId),
      where("status", "==", "new"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [companyId]);

  function copyBookingLink() {
    const url = `${window.location.origin}/book/${companyId}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function convertToJob(req) {
    setBusyId(req.id);
    try {
      const dateStr = req.preferredDate || new Date().toISOString().slice(0, 10);
      const timeStr = req.preferredTime || "09:00";
      const jobRef = await addDoc(collection(db, "jobs"), {
        companyId,
        customerId: null,
        customerName: req.name,
        phone: req.phone || "",
        address: req.address || "",
        jobType: req.jobType || "repair",
        priority: "standard",
        description: req.description || "",
        status: "new",
        technicianId: null,
        technicianName: null,
        technicianEmail: null,
        scheduledAt: Timestamp.fromDate(new Date(`${dateStr}T${timeStr}`)),
        price: 0,
        supplies: [],
        photos: [],
        notes: `From online booking request (${req.email || "no email"})`,
        paymentStatus: "unpaid",
        paymentsLog: [],
        createdAt: serverTimestamp(),
        createdBy: user?.email || null,
      });
      await updateDoc(doc(db, "bookingRequests", req.id), { status: "converted", jobId: jobRef.id });
      navigate(`/jobs/${jobRef.id}`);
    } finally {
      setBusyId(null);
    }
  }

  async function dismiss(req) {
    setBusyId(req.id);
    try {
      await deleteDoc(doc(db, "bookingRequests", req.id));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{t("bookingRequests.title") || "Booking Requests"}</h1>
        <Button size="sm" variant="outline" onClick={copyBookingLink}>
          {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
          {copied ? t("common.copied") || "Copied!" : t("bookingRequests.copyLink") || "Booking link"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("bookingRequests.subtitle") ||
          "Requests submitted through your public booking link. Review each one and convert it into a scheduled job, or dismiss it."}
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading") || "Loading…"}</p>
      ) : requests.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          {t("bookingRequests.none") || "No pending requests. Share your booking link to start receiving them."}
        </p>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{req.name}</p>
                    <p className="text-sm text-muted-foreground">{req.phone}{req.email ? ` · ${req.email}` : ""}</p>
                    <p className="text-sm text-muted-foreground">{req.address}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium capitalize">{req.jobType}</span>
                </div>
                {(req.preferredDate || req.preferredTime) && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {req.preferredDate || "Any date"} {req.preferredTime || ""}
                  </p>
                )}
                {req.description && <p className="text-sm">{req.description}</p>}
                <p className="text-xs text-muted-foreground">{req.createdAt?.toDate ? formatDateTime(req.createdAt) : ""}</p>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1" onClick={() => convertToJob(req)} disabled={busyId === req.id}>
                    {t("bookingRequests.convert") || "Create job"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => dismiss(req)} disabled={busyId === req.id}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
