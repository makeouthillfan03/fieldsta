import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
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
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Camera, CreditCard, FileText, Send, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  JOB_STATUSES,
  STATUS_LABELS,
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

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  useEffect(() => {
    async function load() {
      const [snap, techSnap] = await Promise.all([
        getDoc(doc(db, "jobs", jobId)),
        getDocs(collection(db, "technicians")),
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
      }
      setLoading(false);
    }
    load();
  }, [jobId]);

  useEffect(() => {
    const q = query(collection(db, "jobs", jobId, "activity"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setActivity(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [jobId]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function logActivity(type, text) {
    await addDoc(collection(db, "jobs", jobId, "activity"), {
      type,
      text,
      author: user?.email || "unknown",
      createdAt: serverTimestamp(),
    });
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
        await logActivity("status-change", `Status changed to ${STATUS_LABELS[form.status] || form.status}`);
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
    await logActivity("status-change", `Status changed to ${STATUS_LABELS[status] || status}`);
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

  if (loading) return <p className="text-sm text-muted-foreground">Loading job...</p>;
  if (!job) return <p className="text-sm text-muted-foreground">Job not found.</p>;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Job Detail</h1>
        <Link to={`/jobs/${jobId}/invoice`}>
          <Button variant="outline" size="sm">
            <FileText className="mr-1 h-4 w-4" /> Invoice
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{form.customerName}</CardTitle>
            <Badge variant={STATUS_BADGE_VARIANT[form.status] || "secondary"}>
              {STATUS_LABELS[form.status] || form.status}
            </Badge>
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
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="customerName">Customer name</Label>
              <Input
                id="customerName"
                value={form.customerName}
                onChange={(e) => update("customerName", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={form.address} onChange={(e) => update("address", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="jobType">Job type</Label>
                <Select id="jobType" value={form.jobType} onChange={(e) => update("jobType", e.target.value)}>
                  <option value="install">Install</option>
                  <option value="repair">Repair</option>
                  <option value="maintenance">Maintenance</option>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="priority">Priority</Label>
                <Select id="priority" value={form.priority} onChange={(e) => update("priority", e.target.value)}>
                  <option value="standard">Standard</option>
                  <option value="emergency">Emergency</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="technician">Technician</Label>
              <Select id="technician" value={form.technicianId} onChange={(e) => update("technicianId", e.target.value)}>
                <option value="">Unassigned</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="scheduledDate">Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => update("scheduledDate", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="scheduledTime">Time</Label>
                <Input
                  id="scheduledTime"
                  type="time"
                  value={form.scheduledTime}
                  onChange={(e) => update("scheduledTime", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Job description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="price">Price ($)</Label>
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
                  <Label>Supplies needed</Label>
                  <Button type="button" size="sm" variant="outline" onClick={sendSuppliesToStore}>
                    <Send className="mr-1 h-3.5 w-3.5" /> Send to Store
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
                <Label>Photos</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Camera className="mr-1 h-3.5 w-3.5" /> {uploading ? "Uploading..." : "Add Photo"}
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
              <Label htmlFor="notes">Internal notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete job"
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
            <CreditCard className="h-4 w-4" /> Payments
          </CardTitle>
          <Badge
            variant={
              paymentStatus === "paid" ? "success" : paymentStatus === "partial" ? "warning" : "secondary"
            }
            className="capitalize"
          >
            {paymentStatus}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total price</span>
            <span>{currency(form.price)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Paid so far</span>
            <span>{currency(totalPaid)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold">
            <span>Balance due</span>
            <span>{currency(balanceDue)}</span>
          </div>

          {paymentsLog.length > 0 && (
            <ul className="space-y-1 border-t border-border pt-2">
              {paymentsLog.map((p, idx) => (
                <li key={idx} className="flex justify-between text-sm text-muted-foreground">
                  <span className="capitalize">
                    {p.method}{p.note ? ` · ${p.note}` : ""}
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
              placeholder="Amount"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="col-span-1"
            />
            <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="col-span-1">
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="card">Card (manual)</option>
              <option value="online">Online</option>
            </Select>
            <Button type="submit" size="sm" className="col-span-1">
              Record
            </Button>
            <Input
              placeholder="Note (optional)"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              className="col-span-3"
            />
          </form>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowOnlinePayInfo(true)}
          >
            Request Online Card Payment
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity & Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleAddNote} className="flex gap-2">
            <Input
              placeholder="Add a note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <Button type="submit" size="sm">
              Add
            </Button>
          </form>
          <ul className="space-y-2">
            {activity.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
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
        <h2 className="mb-2 font-semibold">Delete this job?</h2>
        <p className="mb-4 text-sm text-muted-foreground">This action cannot be undone.</p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Dialog>

      <Dialog open={showOnlinePayInfo} onClose={() => setShowOnlinePayInfo(false)}>
        <h2 className="mb-2 font-semibold">Online card payments</h2>
        <p className="mb-2 text-sm text-muted-foreground">
          Taking a real card payment requires a payment processor (e.g. Stripe Checkout) wired up
          through a backend, since secret API keys can't live in this client-only app. That's a
          follow-on integration: add a Firebase Cloud Function that creates a Stripe Checkout
          session for this job's balance ({currency(balanceDue)}) and emails/texts the customer a
          pay link; a Stripe webhook then calls back to record the payment here automatically.
        </p>
        <p className="text-sm text-muted-foreground">
          Until that's set up, use "Record Payment" above to log cash, check, or card-present
          payments manually.
        </p>
        <Button className="mt-4 w-full" onClick={() => setShowOnlinePayInfo(false)}>
          Got it
        </Button>
      </Dialog>
    </div>
  );
}
