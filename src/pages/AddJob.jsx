import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const emptyForm = {
  customerId: "",
  customerName: "",
  phone: "",
  address: "",
  jobType: "repair",
  priority: "standard",
  diagnosisCode: "",
  description: "",
  status: "new",
  technicianId: "",
  scheduledDate: "",
  scheduledTime: "",
  price: "",
  notes: "",
};

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

export default function AddJob() {
  const navigate = useNavigate();
  const { user, companyId } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState(emptyForm);
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [supplyItem, setSupplyItem] = useState("");
  const [supplyQty, setSupplyQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!companyId) return;
    async function load() {
      const [customerSnap, techSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, "customers"),
            where("companyId", "==", companyId),
            orderBy("name", "asc")
          )
        ),
        getDocs(
          query(
            collection(db, "technicians"),
            where("companyId", "==", companyId),
            orderBy("name", "asc")
          )
        ),
      ]);
      setCustomers(customerSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTechnicians(techSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
    load();
  }, [companyId]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleCustomerSelect(e) {
    const id = e.target.value;
    const customer = customers.find((c) => c.id === id);
    setForm((f) => ({
      ...f,
      customerId: id,
      customerName: customer?.name || f.customerName,
      phone: customer?.phone || f.phone,
      address: customer?.address || f.address,
    }));
  }

  function addSupply() {
    if (!supplyItem.trim()) return;
    setSupplies((s) => [...s, { item: supplyItem.trim(), qty: Number(supplyQty) || 1, checked: false }]);
    setSupplyItem("");
    setSupplyQty(1);
  }

  function removeSupply(idx) {
    setSupplies((s) => s.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.customerName || !form.scheduledDate) {
      setError(t("addJob.requiredError"));
      return;
    }

    setSaving(true);
    try {
      const scheduledAt = Timestamp.fromDate(
        new Date(`${form.scheduledDate}T${form.scheduledTime || "09:00"}`)
      );
      const technician = technicians.find((t) => t.id === form.technicianId);

      const docRef = await addDoc(collection(db, "jobs"), {
        companyId,
        customerId: form.customerId || null,
        customerName: form.customerName,
        phone: form.phone,
        address: form.address,
        jobType: form.jobType,
        priority: form.priority,
        diagnosisCode: form.diagnosisCode,
        description: form.description,
        status: form.technicianId ? "dispatched" : form.status,
        technicianId: form.technicianId || null,
        technicianName: technician?.name || null,
        technicianEmail: technician?.email || null,
        scheduledAt,
        price: Number(form.price) || 0,
        supplies,
        photos: [],
        notes: form.notes,
        paymentStatus: "unpaid",
        paymentsLog: [],
        createdAt: serverTimestamp(),
        createdBy: user?.email || null,
      });
      navigate(`/jobs/${docRef.id}`);
    } catch (err) {
      setError(err.message || t("addJob.saveFailedError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>{t("addJob.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="existingCustomer">{t("addJob.existingCustomer")}</Label>
              <Select id="existingCustomer" value={form.customerId} onChange={handleCustomerSelect}>
                <option value="">{t("addJob.newManual")}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="customerName">{t("addJob.customerName")} *</Label>
              <Input
                id="customerName"
                value={form.customerName}
                onChange={(e) => update("customerName", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="phone">{t("common.phone")}</Label>
                <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address">{t("addJob.jobAddress")}</Label>
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
              <Label htmlFor="technician">{t("addJob.technician")}</Label>
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
                <Label htmlFor="scheduledDate">{t("addJob.date")} *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => update("scheduledDate", e.target.value)}
                  required
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
                placeholder={t("addJob.descriptionPlaceholder")}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="price">{t("addJob.estimatedPrice")}</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
            </div>

            <div className="space-y-2 rounded-md border border-border p-3">
              <Label>{t("addJob.suppliesNeeded")}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={t("orders.item")}
                  value={supplyItem}
                  onChange={(e) => setSupplyItem(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min="1"
                  value={supplyQty}
                  onChange={(e) => setSupplyQty(e.target.value)}
                  className="w-16"
                />
                <Button type="button" size="icon" variant="outline" onClick={addSupply}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {supplies.length > 0 && (
                <ul className="space-y-1 pt-1">
                  {supplies.map((s, idx) => (
                    <li key={idx} className="flex items-center justify-between text-sm">
                      <span>
                        {s.qty}x {s.item}
                      </span>
                      <button type="button" onClick={() => removeSupply(idx)} className="text-muted-foreground">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground">
                {t("addJob.suppliesHelp")}
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">{t("addJob.internalNotes")}</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? t("addJob.savingJob") : t("addJob.saveJob")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
