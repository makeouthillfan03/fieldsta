import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Camera, Check, Copy, CreditCard, ExternalLink, FileText, Send, Snowflake, Sparkles, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { db, storage, requestJobPaymentLink, parseQuickNote } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  JOB_STATUSES,
  STATUS_BADGE_VARIANT,
  formatDateTime,
  currency,
} from "@/lib/utils";

function toDateInput(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toISOString().slice(0, 10);
}
function toTimeInput(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toTimeString().slice(0, 5);
}

const DIAGNOSIS_CODES = [
  "low-refrigerant",
  "compressor-failure",
  "capacitor-bad",
  "thermostat-malfunction",
  "fan-motor-failure",
  "coil-leak",
  "electrical-issue",
  "drain-clog",
  "other",
];

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, companyId } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [job, setJob] = useState(null);
  const [form, setForm] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [activity, setActivity] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const [paymentsLog, setPaymentsLog] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState("unpaid");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payNote, setPayNote] = useState("");
  const [showOnlinePayInfo, setShowOnlinePayInfo] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [paymentBanner, setPaymentBanner] = useState("");
  const [refrigerantLog, setRefrigerantLog] = useState([]);
  const [refType, setRefType] = useState("R-410A");
  const [refAction, setRefAction] = useState("added");
  const [refPounds, setRefPounds] = useState("");
  const [refLeakTest, setRefLeakTest] = useState("pass");
  const [refCertNumber, setRefCertNumber] = useState("");
  const [quickNoteText, setQuickNoteText] = useState("");
  const [quickNoteLoading, setQuickNoteLoading] = useState(false);
  const [quickNoteError, setQuickNoteError] = useState("");
  const [quickNotePreview, setQuickNotePreview] = useState(null);
  const [quickNoteIncludeNote, setQuickNoteIncludeNote] = useState(true);
  const [quickNoteIncludeRef, setQuickNoteIncludeRef] = useState([]);

  useEffect(() => {
    if (!companyId) return;
    async function load() {
      const [snap, techSnap] = await Promise.all([
        getDoc(doc(db, "jobs", jobId)),
        getDocs(query(collection(db, "technicians"), where("companyId", "==", companyId))),
      ]);
      setTechnicians(techSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setJob(data);
        setForm({
          customerName: data.customerName || "",
          phone: data.phone || "",
          address: data.address || "",
          jobType: data.jobType || "repair",
          priority: data.priority || "standard",
          diagnosisCode: data.diagnosisCode || "",
          description: data.description || "",
          status: data.status || "new",
          technicianId: data.technicianId || "",
          scheduledDate: toDateInput(data.scheduledAt),
          scheduledTime: toTimeInput(data.scheduledAt),
          price: data.price ?? "",
          notes: data.notes || "",
          supplies: data.supplies || [],
          photos: data.photos || [],
        });
        setPaymentsLog(data.paymentsLog || []);
        setPaymentStatus(data.paymentStatus || "unpaid");
        setRefrigerantLog(data.refrigerantLog || []);
      }
      setLoading(false);
    }
    load();
  }, [jobId, companyId]);

  useEffect(() => {
    const q = query(collection(db, "jobs", jobId, "activity"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setActivity(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [jobId]);

  // If we just came back from a Stripe Checkout redirect, the webhook may
  // still be processing — poll the job doc a couple of times so the payment
  // shows up without the user having to manually refresh.
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (!payment) return;

    if (payment === "success") {
      setPaymentBanner("Payment received! Confirming with Stripe...");
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts += 1;
        const snap = await getDoc(doc(db, "jobs", jobId));
        if (snap.exists()) {
          const data = snap.data();
          if ((data.paymentsLog || []).length > (paymentsLog || []).length) {
            setPaymentsLog(data.paymentsLog || []);
            setPaymentStatus(data.paymentStatus || "unpaid");
            setPaymentBanner("Payment recorded — thanks!");
            clearInterval(poll);
          }
        }
        if (attempts >= 6) {
          clearInterval(poll);
          setPaymentBanner((b) =>
            b === "Payment received! Confirming with Stripe..."
              ? "Payment received. It can take a minute to show up here — refresh if it's not visible yet."
              : b
          );
        }
      }, 2000);
    } else if (payment === "cancelled") {
      setPaymentBanner("Checkout was cancelled — no payment was made.");
    }

    // Clean the query param out of the URL without another navigation.
    const next = new URLSearchParams(searchParams);
    next.delete("payment");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  async function requestOnlinePayment() {
    setCheckoutError("");
    setCheckoutUrl("");
    setShowOnlinePayInfo(true);
    setCheckoutLoading(true);
    try {
      const result = await requestJobPaymentLink(jobId);
      setCheckoutUrl(result.data?.url || "");
    } catch (err) {
      setCheckoutError(
        err.code === "functions/not-found" || err.code === "not-found"
          ? "Payments aren't set up for this job yet."
          : err.code === "functions/unavailable" || err.message?.includes("CORS") || err.message?.includes("fetch")
          ? "Couldn't reach the payments backend. Stripe Cloud Functions may not be deployed yet — see README.md \"Stripe payments\"."
          : err.message || "Couldn't create a payment link. Try again."
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  function copyCheckoutLink() {
    if (!checkoutUrl) return;
    navigator.clipboard.writeText(checkoutUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function logActivity(type, text) {
    await addDoc(collection(db, "jobs", jobId, "activity"), {
      type,
      text,
      author: user?.email || "unknown",
      companyId,
      createdAt: serverTimestamp(),
    });
  }

  async function recordRefrigerant(e) {
    e.preventDefault();
    const pounds = Number(refPounds);
    if (!pounds || pounds <= 0) return;
    const entry = {
      type: refType,
      action: refAction,
      pounds,
      leakTestResult: refLeakTest,
      technicianCertNumber: refCertNumber.trim(),
      recordedBy: user?.email || "unknown",
      date: new Date().toISOString(),
    };
    const newLog = [...refrigerantLog, entry];
    await updateDoc(doc(db, "jobs", jobId), { refrigerantLog: newLog });
    setRefrigerantLog(newLog);
    setRefPounds("");
    setRefCertNumber("");
    await logActivity(
      "note",
      `EPA 608 log: ${pounds} lbs ${refType} ${refAction}${
        refLeakTest === "fail" ? " — leak test FAILED" : ""
      }`
    );
  }

  async function handleQuickNoteParse() {
    if (!quickNoteText.trim()) return;
    setQuickNoteLoading(true);
    setQuickNoteError("");
    setQuickNotePreview(null);
    try {
      const result = await parseQuickNote(quickNoteText.trim(), jobId);
      const data = result.data || {};
      setQuickNotePreview(data);
      setQuickNoteIncludeNote(!!data.noteText);
      setQuickNoteIncludeRef((data.refrigerant || []).map(() => true));
    } catch (err) {
      setQuickNoteError(
        err.code === "functions/failed-precondition" || err.code === "failed-precondition"
          ? "AI service rejected the request — the ANTHROPIC_API_KEY secret may be missing or invalid. See README.md."
          : err.code === "functions/unavailable" || err.message?.includes("fetch")
          ? "Couldn't reach the AI assistant. Cloud Functions may not be deployed yet — see README.md \"AI Quick Note\"."
          : err.message || "Couldn't parse that note. Try again."
      );
    } finally {
      setQuickNoteLoading(false);
    }
  }

  async function handleQuickNoteApply() {
    if (!quickNotePreview) return;
    setQuickNoteLoading(true);
    try {
      if (quickNoteIncludeNote && quickNotePreview.noteText) {
        await logActivity("note", quickNotePreview.noteText);
      }

      const acceptedRef = (quickNotePreview.refrigerant || []).filter(
        (_, idx) => quickNoteIncludeRef[idx]
      );
      if (acceptedRef.length > 0) {
        const entries = acceptedRef.map((r) => ({
          type: r.type || "unknown",
          action: r.action === "recovered" ? "recovered" : "added",
          pounds: Number(r.pounds) || 0,
          leakTestResult: r.leakTestResult || "n/a",
          technicianCertNumber: "",
          recordedBy: user?.email || "unknown",
          date: new Date().toISOString(),
        }));
        const newLog = [...refrigerantLog, ...entries];
        await updateDoc(doc(db, "jobs", jobId), { refrigerantLog: newLog });
        setRefrigerantLog(newLog);
        for (const entry of entries) {
          await logActivity(
            "note",
            `EPA 608 log (via Quick Note): ${entry.pounds} lbs ${entry.type} ${entry.action}`
          );
        }
      }

      setQuickNoteText("");
      setQuickNotePreview(null);
    } finally {
      setQuickNoteLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const scheduledAt = Timestamp.fromDate(
        new Date(`${form.scheduledDate}T${form.scheduledTime || "09:00"}`)
      );
      const technician = technicians.find((t) => t.id === form.technicianId);
      const statusChanged = job.status !== form.status;

      await updateDoc(doc(db, "jobs", jobId), {
        customerName: form.customerName,
        phone: form.phone,
        address: form.address,
        jobType: form.jobType,
        priority: form.priority,
        diagnosisCode: form.diagnosisCode,
        description: form.description,
        status: form.status,
        technicianId: form.technicianId || null,
        technicianName: technician?.name || null,
        technicianEmail: technician?.email || null,
        scheduledAt,
        price: Number(form.price) || 0,
        notes: form.notes,
        supplies: form.supplies,
        updatedAt: serverTimestamp(),
      });

      if (statusChanged) {
        await logActivity("status-change", `Status changed to ${t(`status.${form.status}`)}`);
      }
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to update job.");
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickStatus(status) {
    await updateDoc(doc(db, "jobs", jobId), { status, updatedAt: serverTimestamp() });
    update("status", status);
    setJob((j) => ({ ...j, status }));
    await logActivity("status-change", `Status changed to ${t(`status.${status}`)}`);
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!noteText.trim()) return;
    await logActivity("note", noteText.trim());
    setNoteText("");
  }

  function toggleSupply(idx) {
    setForm((f) => {
      const supplies = [...f.supplies];
      supplies[idx] = { ...supplies[idx], checked: !supplies[idx].checked };
      return { ...f, supplies };
    });
  }

  async function sendSuppliesToStore() {
    const unchecked = form.supplies.filter((s) => !s.checked);
    if (unchecked.length === 0) return;
    await Promise.all(
      unchecked.map((s) =>
        addDoc(collection(db, "storeOrders"), {
          companyId,
          item: s.item,
          quantity: s.qty,
          notes: `From job: ${form.customerName}`,
          status: "pending",
          requestedBy: user?.email || "unknown",
          jobId,
          createdAt: serverTimestamp(),
        })
      )
    );
    await logActivity("note", `Sent ${unchecked.length} supply item(s) to Store Orders`);
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `jobPhotos/${jobId}/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const photos = [...(form.photos || []), url];
      await updateDoc(doc(db, "jobs", jobId), { photos });
      update("photos", photos);
      await logActivity("note", "Photo attached");
    } catch (err) {
      setError(err.message || "Photo upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete() {
    await deleteDoc(doc(db, "jobs", jobId));
    navigate("/");
  }

  const totalPaid = paymentsLog.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balanceDue = (Number(form?.price) || 0) - totalPaid;

  async function recordPayment(e) {
    e.preventDefault();
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return;
    const entry = {
      amount,
      method: payMethod,
      note: payNote,
      recordedBy: user?.email || "unknown",
      date: new Date().toISOString(),
    };
    const newLog = [...paymentsLog, entry];
    const newTotalPaid = newLog.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const price = Number(form.price) || 0;
    const newStatus = newTotalPaid <= 0 ? "unpaid" : newTotalPaid >= price ? "paid" : "partial";

    await updateDoc(doc(db, "jobs", jobId), {
      paymentsLog: newLog,
      paymentStatus: newStatus,
    });
    setPaymentsLog(newLog);
    setPaymentStatus(newStatus);
    setPayAmount("");
    setPayNote("");
    await logActivity(
      "note",
      `Payment recorded: ${currency(amount)} via ${payMethod}${payNote ? ` (${payNote})` : ""}`
    );
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t("jobDetail.loadingJob")}</p>;
  if (!job) return <p className="text-sm text-muted-foreground">{t("jobDetail.notFound")}</p>;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t("jobDetail.title")}</h1>
        <Link to={`/jobs/${jobId}/invoice`}>
          <Button variant="outline" size="sm">
            <FileText className="mr-1 h-4 w-4" /> {t("jobDetail.invoice")}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{form.customerName}</CardTitle>
            <div className="flex items-center gap-1.5">
              {form.diagnosisCode && (
                <Badge variant="outline">{t(`diagnosisCode.${form.diagnosisCode}`)}</Badge>
              )}
              <Badge variant={STATUS_BADGE_VARIANT[form.status] || "secondary"}>
                {t(`status.${form.status}`)}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {JOB_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleQuickStatus(s)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  form.status === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {t(`status.${s}`)}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="customerName">{t("jobDetail.customerName")}</Label>
              <Input
                id="customerName"
                value={form.customerName}
                onChange={(e) => update("customerName", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="phone">{t("jobDetail.phone")}</Label>
                <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address">{t("jobDetail.address")}</Label>
                <Input id="address" value={form.address} onChange={(e) => update("address", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="jobType">{t("addJob.jobType")}</Label>
                <Select id="jobType" value={form.jobType} onChange={(e) => update("jobType", e.target.value)}>
                  <option value="install">{t("addJob.install")}</option>
                  <option value="repair">{t("addJob.repair")}</option>
                  <option value="maintenance">{t("addJob.maintenance")}</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="priority">{t("addJob.priority")}</Label>
                <Select id="priority" value={form.priority} onChange={(e) => update("priority", e.target.value)}>
                  <option value="standard">{t("addJob.standard")}</option>
                  <option value="emergency">{t("addJob.emergency")}</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="technician">{t("jobDetail.technician")}</Label>
              <Select id="technician" value={form.technicianId} onChange={(e) => update("technicianId", e.target.value)}>
                <option value="">{t("addJob.unassigned")}</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="scheduledDate">{t("addJob.date")}</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => update("scheduledDate", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="scheduledTime">{t("addJob.time")}</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={form.scheduledTime}
                  onChange={(e) => update("scheduledTime", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="diagnosisCode">{t("addJob.diagnosisCode")}</Label>
              <Select
                id="diagnosisCode"
                value={form.diagnosisCode}
                onChange={(e) => update("diagnosisCode", e.target.value)}
              >
                <option value="">{t("addJob.diagnosisCodeNone")}</option>
                {DIAGNOSIS_CODES.map((code) => (
                  <option key={code} value={code}>
                    {t(`diagnosisCode.${code}`)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">{t("addJob.description")}</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="price">{t("jobDetail.price")}</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
            </div>

            {form.supplies.length > 0 && (
              <div className="space-y-2 rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <Label>{t("addJob.suppliesNeeded")}</Label>
                  <Button type="button" size="sm" variant="outline" onClick={sendSuppliesToStore}>
                    <Send className="mr-1 h-3.5 w-3.5" /> {t("jobDetail.sendToStore")}
                  </Button>
                </div>
                <ul className="space-y-2">
                  {form.supplies.map((s, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={s.checked} onCheckedChange={() => toggleSupply(idx)} />
                      <span className={s.checked ? "text-muted-foreground line-through" : ""}>
                        {s.qty}x {s.item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("jobDetail.photos")}</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera className="mr-1 h-3.5 w-3.5" /> {uploading ? t("jobDetail.uploading") : t("jobDetail.addPhoto")}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
              {form.photos?.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {form.photos.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="Job attachment" className="aspect-square w-full rounded-md object-cover" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">{t("addJob.internalNotes")}</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? t("jobDetail.saving") : t("jobDetail.saveChanges")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => setConfirmDelete(true)}
                aria-label={t("jobDetail.deleteJobAria")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" /> {t("jobDetail.payments")}
          </CardTitle>
          <Badge
            variant={
              paymentStatus === "paid" ? "success" : paymentStatus === "partial" ? "warning" : "secondary"
            }
            className="capitalize"
          >
            {t(`paymentStatus.${paymentStatus}`)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("jobDetail.totalPrice")}</span>
            <span>{currency(form.price)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("jobDetail.paidSoFar")}</span>
            <span>{currency(totalPaid)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <span>{t("jobDetail.balanceDue")}</span>
            <span>{currency(balanceDue)}</span>
          </div>

          {paymentsLog.length > 0 && (
            <ul className="space-y-1 border-t border-border pt-2">
              {paymentsLog.map((p, idx) => (
                <li key={idx} className="flex justify-between text-sm text-muted-foreground">
                  <span className="capitalize">
                    {t(`paymentMethod.${p.method}`)}{p.note ? ` · ${p.note}` : ""}
                  </span>
                  <span>{currency(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={recordPayment} className="grid grid-cols-3 gap-2 border-t border-border pt-3">
            <Input
              type="number"
              step="0.01"
              placeholder={t("jobDetail.amount")}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="col-span-1"
            />
            <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="col-span-1">
              <option value="cash">{t("paymentMethod.cash")}</option>
              <option value="check">{t("paymentMethod.check")}</option>
              <option value="card">{t("paymentMethod.card")}</option>
              <option value="online">{t("paymentMethod.online")}</option>
            </Select>
            <Button type="submit" size="sm" className="col-span-1">
              {t("jobDetail.record")}
            </Button>
            <Input
              placeholder={t("jobDetail.notePlaceholder")}
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              className="col-span-3"
            />
          </form>

          {paymentBanner && (
            <p className="rounded-md bg-secondary px-3 py-2 text-sm">{paymentBanner}</p>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={requestOnlinePayment}
            disabled={balanceDue <= 0}
          >
            <CreditCard className="mr-1 h-3.5 w-3.5" /> {t("jobDetail.requestOnlinePayment")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <img src="/mascot.png" alt="" className="h-5 w-5" />
            <Sparkles className="h-4 w-4" /> {t("jobDetail.quickNoteTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("jobDetail.quickNoteHelp")}
          </p>
          <Textarea
            placeholder='e.g. "Replaced the compressor, used 3 lbs of R410a, leak test passed, customer wants a quote for a new furnace too"'
            value={quickNoteText}
            onChange={(e) => setQuickNoteText(e.target.value)}
            rows={3}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleQuickNoteParse}
            disabled={quickNoteLoading || !quickNoteText.trim()}
          >
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            {quickNoteLoading && !quickNotePreview ? t("jobDetail.thinking") : t("jobDetail.parseWithAI")}
          </Button>

          {quickNoteError && <p className="text-sm text-destructive">{quickNoteError}</p>}

          {quickNotePreview && (
            <div className="space-y-3 rounded-md border border-border p-3">
              {quickNotePreview.noteText && (
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={quickNoteIncludeNote}
                    onCheckedChange={() => setQuickNoteIncludeNote((v) => !v)}
                  />
                  <span>
                    <span className="font-medium">{t("jobDetail.activityNoteLabel")}</span> {quickNotePreview.noteText}
                  </span>
                </label>
              )}

              {(quickNotePreview.refrigerant || []).map((r, idx) => (
                <label key={idx} className="flex items-start gap-2 text-sm">
                  <Checkbox
                    checked={!!quickNoteIncludeRef[idx]}
                    onCheckedChange={() =>
                      setQuickNoteIncludeRef((v) => v.map((val, i) => (i === idx ? !val : val)))
                    }
                  />
                  <span>
                    <span className="font-medium">{t("jobDetail.refrigerantLogLabel")}</span> {r.pounds} lbs {r.type}{" "}
                    {r.action}
                    {r.leakTestResult && r.leakTestResult !== "n/a" && ` (leak test: ${r.leakTestResult})`}
                  </span>
                </label>
              ))}

              {(quickNotePreview.suggestions || []).length > 0 && (
                <div className="border-t border-border pt-2">
                  <p className="text-xs font-medium text-muted-foreground">{t("jobDetail.worthConsidering")}</p>
                  <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                    {quickNotePreview.suggestions.map((s, idx) => (
                      <li key={idx}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(quickNotePreview.noteText || (quickNotePreview.refrigerant || []).length > 0) && (
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  onClick={handleQuickNoteApply}
                  disabled={quickNoteLoading}
                >
                  {quickNoteLoading ? t("jobDetail.applying") : t("jobDetail.applySelected")}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Snowflake className="h-4 w-4" /> {t("jobDetail.refrigerantTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("jobDetail.refrigerantHelp")}
          </p>

          {refrigerantLog.length > 0 && (
            <ul className="space-y-1 border-t border-border pt-2">
              {refrigerantLog.map((r, idx) => (
                <li key={idx} className="flex justify-between text-sm text-muted-foreground">
                  <span className="capitalize">
                    {r.pounds} lbs {r.type} {r.action}
                    {r.leakTestResult === "fail" && (
                      <span className="ml-1 text-destructive">(leak test failed)</span>
                    )}
                  </span>
                  <span>{r.technicianCertNumber && `Cert #${r.technicianCertNumber}`}</span>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={recordRefrigerant} className="space-y-2 border-t border-border pt-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder={t("jobDetail.refTypePlaceholder")}
                value={refType}
                onChange={(e) => setRefType(e.target.value)}
              />
              <Select value={refAction} onChange={(e) => setRefAction(e.target.value)}>
                <option value="added">{t("jobDetail.added")}</option>
                <option value="recovered">{t("jobDetail.recovered")}</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="0.1"
                placeholder={t("assistant.poundsPlaceholder")}
                value={refPounds}
                onChange={(e) => setRefPounds(e.target.value)}
              />
              <Select value={refLeakTest} onChange={(e) => setRefLeakTest(e.target.value)}>
                <option value="pass">{t("jobDetail.leakTestPass")}</option>
                <option value="fail">{t("jobDetail.leakTestFail")}</option>
                <option value="n/a">{t("jobDetail.leakTestNA")}</option>
              </Select>
            </div>
            <Input
              placeholder={t("jobDetail.certPlaceholder")}
              value={refCertNumber}
              onChange={(e) => setRefCertNumber(e.target.value)}
            />
            <Button type="submit" size="sm" className="w-full">
              {t("jobDetail.logEntry")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("jobDetail.activityTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleAddNote} className="flex gap-2">
            <Input
              placeholder={t("jobDetail.addNotePlaceholder")}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <Button type="submit" size="sm">
              {t("common.add")}
            </Button>
          </form>
          <ul className="space-y-2">
            {activity.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("jobDetail.noActivity")}</p>
            )}
            {activity.map((a) => (
              <li key={a.id} className="rounded-md border border-border p-2 text-sm">
                <p>{a.text}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {a.author} · {formatDateTime(a.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <h2 className="mb-2 font-semibold">{t("jobDetail.deleteJobTitle")}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{t("jobDetail.deleteJobWarning")}</p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleDelete}>
            {t("common.delete")}
          </Button>
        </div>
      </Dialog>

      <Dialog open={showOnlinePayInfo} onClose={() => setShowOnlinePayInfo(false)}>
        <h2 className="mb-2 font-semibold">{t("jobDetail.onlinePaymentTitle")}</h2>

        {checkoutLoading && (
          <p className="text-sm text-muted-foreground">{t("jobDetail.creatingLink")}</p>
        )}

        {!checkoutLoading && checkoutError && (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{checkoutError}</p>
            <p className="text-sm text-muted-foreground">
              Until Stripe is set up, use "Record Payment" above to log cash, check, or
              card-present payments manually.
            </p>
            <Button variant="outline" className="w-full" onClick={requestOnlinePayment}>
              {t("jobDetail.tryAgain")}
            </Button>
          </div>
        )}

        {!checkoutLoading && !checkoutError && checkoutUrl && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              A Stripe Checkout link for {currency(balanceDue)} is ready. Text or email it to the
              customer — once they pay, it's recorded here automatically.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-md border border-border bg-muted px-3 py-2 text-xs">
                {checkoutUrl}
              </code>
              <Button variant="secondary" size="icon" onClick={copyCheckoutLink} aria-label={t("jobDetail.copyLink")}>
                {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <a href={checkoutUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" className="w-full">
                <ExternalLink className="mr-1 h-3.5 w-3.5" /> {t("jobDetail.openPaymentPage")}
              </Button>
            </a>
          </div>
        )}

        <Button className="mt-4 w-full" variant="ghost" onClick={() => setShowOnlinePayInfo(false)}>
          {t("common.close")}
        </Button>
      </Dialog>
    </div>
  );
}
