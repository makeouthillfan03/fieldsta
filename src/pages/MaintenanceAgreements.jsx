import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  doc,
  where,
} from "firebase/firestore";
import { CalendarCheck, Plus, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { currency, formatDate } from "@/lib/utils";

const FREQUENCY_MONTHS = { quarterly: 3, biannual: 6, annual: 12 };
const FREQUENCY_KEYS = { quarterly: "agreements.quarterly", biannual: "agreements.biannual", annual: "agreements.annual" };

const emptyForm = {
  customerId: "",
  equipmentLabel: "",
  frequency: "annual",
  price: "",
  notes: "",
  startDate: new Date().toISOString().slice(0, 10),
};

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export default function MaintenanceAgreements() {
  const { user, companyId } = useAuth();
  const { t } = useLanguage();
  const [agreements, setAgreements] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [schedulingId, setSchedulingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    if (!companyId) {
      setAgreements([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "maintenanceAgreements"),
      where("companyId", "==", companyId),
      orderBy("nextDueDate", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setAgreements(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, "customers"),
      where("companyId", "==", companyId),
      orderBy("name", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [companyId]);

  const { overdue, upcoming, later } = useMemo(() => {
    const now = new Date();
    const in30 = addMonths(now, 0);
    in30.setDate(in30.getDate() + 30);
    const overdue = [];
    const upcoming = [];
    const later = [];
    for (const a of agreements) {
      if (!a.active) continue;
      const due = a.nextDueDate?.toDate ? a.nextDueDate.toDate() : new Date(a.nextDueDate);
      if (due < now) overdue.push(a);
      else if (due <= in30) upcoming.push(a);
      else later.push(a);
    }
    return { overdue, upcoming, later };
  }, [agreements]);

  async function handleAdd(e) {
    e.preventDefault();
    const customer = customers.find((c) => c.id === form.customerId);
    if (!customer || !form.price) return;
    setSaving(true);
    setError("");
    try {
      await addDoc(collection(db, "maintenanceAgreements"), {
        companyId,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone || "",
        customerAddress: customer.address || "",
        equipmentLabel: form.equipmentLabel,
        frequency: form.frequency,
        price: Number(form.price) || 0,
        notes: form.notes,
        active: true,
        nextDueDate: Timestamp.fromDate(new Date(form.startDate)),
        lastScheduledAt: null,
        createdAt: serverTimestamp(),
        createdBy: user?.email || null,
      });
      setForm(emptyForm);
      setShowAdd(false);
    } catch (err) {
      setError(err.message || "Failed to save agreement.");
    } finally {
      setSaving(false);
    }
  }

  async function scheduleNextVisit(agreement) {
    setSchedulingId(agreement.id);
    try {
      const dueDate = agreement.nextDueDate?.toDate
        ? agreement.nextDueDate.toDate()
        : new Date(agreement.nextDueDate);

      await addDoc(collection(db, "jobs"), {
        companyId,
        customerId: agreement.customerId,
        customerName: agreement.customerName,
        phone: agreement.customerPhone || "",
        address: agreement.customerAddress || "",
        jobType: "maintenance",
        priority: "standard",
        description: `Scheduled maintenance visit${
          agreement.equipmentLabel ? ` — ${agreement.equipmentLabel}` : ""
        } (${t(FREQUENCY_KEYS[agreement.frequency]) || "maintenance"} agreement)`,
        status: "new",
        technicianId: null,
        technicianName: null,
        technicianEmail: null,
        scheduledAt: Timestamp.fromDate(dueDate),
        price: agreement.price || 0,
        supplies: [],
        photos: [],
        notes: agreement.notes || "",
        paymentStatus: "unpaid",
        paymentsLog: [],
        createdAt: serverTimestamp(),
        createdBy: user?.email || null,
      });

      const nextDue = addMonths(dueDate, FREQUENCY_MONTHS[agreement.frequency] || 12);
      await updateDoc(doc(db, "maintenanceAgreements", agreement.id), {
        nextDueDate: Timestamp.fromDate(nextDue),
        lastScheduledAt: serverTimestamp(),
      });
    } finally {
      setSchedulingId("");
    }
  }

  async function handleDeleteAgreement(agreementId) {
    if (!window.confirm(t("agreements.confirmDelete") || "Delete this maintenance agreement? This cannot be undone.")) return;
    setDeletingId(agreementId);
    try {
      await deleteDoc(doc(db, "maintenanceAgreements", agreementId));
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{t("agreements.title")}</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" /> {t("common.new")}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : agreements.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          {t("agreements.noAgreements")}
        </p>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <AgreementSection
              title={t("agreements.overdue")}
              items={overdue}
              badgeVariant="destructive"
              onSchedule={scheduleNextVisit}
              schedulingId={schedulingId}
              onDelete={handleDeleteAgreement}
              deletingId={deletingId}
            />
          )}
          {upcoming.length > 0 && (
            <AgreementSection
              title={t("agreements.dueSoon")}
              items={upcoming}
              badgeVariant="warning"
              onSchedule={scheduleNextVisit}
              schedulingId={schedulingId}
              onDelete={handleDeleteAgreement}
              deletingId={deletingId}
            />
          )}
          {later.length > 0 && (
            <AgreementSection
              title={t("agreements.later")}
              items={later}
              badgeVariant="secondary"
              onSchedule={scheduleNextVisit}
              schedulingId={schedulingId}
              onDelete={handleDeleteAgreement}
              deletingId={deletingId}
            />
          )}
        </div>
      )}

      <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{t("agreements.newTitle")}</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowAdd(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="customerId">{t("agreements.customer")} *</Label>
            <Select
              id="customerId"
              value={form.customerId}
              onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
              required
            >
              <option value="">{t("agreements.select")}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="equipmentLabel">{t("agreements.equipmentOptional")}</Label>
            <Input
              id="equipmentLabel"
              placeholder="e.g. Carrier furnace + AC"
              value={form.equipmentLabel}
              onChange={(e) => setForm((f) => ({ ...f, equipmentLabel: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="frequency">{t("agreements.frequency")}</Label>
              <Select
                id="frequency"
                value={form.frequency}
                onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
              >
                <option value="annual">{t("agreements.annual")}</option>
                <option value="biannual">{t("agreements.biannual")}</option>
                <option value="quarterly">{t("agreements.quarterly")}</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="price">{t("agreements.pricePerVisit")}</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="startDate">{t("agreements.firstVisitDue")}</Label>
            <Input
              id="startDate"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">{t("common.notes")}</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? t("common.saving") : t("agreements.createAgreement")}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}

function AgreementSection({ title, items, badgeVariant, onSchedule, schedulingId, onDelete, deletingId }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title} ({items.length})
      </h2>
      <div className="space-y-2">
        {items.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link to={`/customers/${a.customerId}`} className="truncate font-medium hover:underline">
                    {a.customerName}
                  </Link>
                  <Badge variant={badgeVariant}>{formatDate(a.nextDueDate)}</Badge>
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {t(FREQUENCY_KEYS[a.frequency])} · {currency(a.price)}
                  {a.equipmentLabel && ` · ${a.equipmentLabel}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSchedule(a)}
                  disabled={schedulingId === a.id}
                >
                  <CalendarCheck className="mr-1 h-3.5 w-3.5" />
                  {schedulingId === a.id ? t("agreements.scheduling") : t("agreements.scheduleVisit")}
                </Button>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDelete(a.id)}
                  disabled={deletingId === a.id}
                  aria-label={t("common.delete") || "Delete"}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
