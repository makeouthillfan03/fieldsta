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

const emptyForm = {
  customerId: "",
  customerName: "",
  phone: "",
  address: "",
  jobType: "repair",
  priority: "standard",
  description: "",
  status: "new",
  technicianId: "",
  scheduledDate: "",
  scheduledTime: "",
  price: "",
  notes: "",
};

export default function AddJob() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [supplyItem, setSupplyItem] = useState("");
  const [supplyQty, setSupplyQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [customerSnap, techSnap] = await Promise.all([
        getDocs(query(collection(db, "customers"), orderBy("name", "asc"))),
        getDocs(query(collection(db, "technicians"), orderBy("name", "asc"))),
      ]);
      setCustomers(customerSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTechnicians(techSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
    load();
  }, []);

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
      setError("Customer name and date are required.");
      return;
    }

    setSaving(true);
    try {
      const scheduledAt = Timestamp.fromDate(
        new Date(`${form.scheduledDate}T${form.scheduledTime || "09:00"}`)
      );
      const technician = technicians.find((t) => t.id === form.technicianId);

      const docRef = await addDoc(collection(db, "jobs"), {
        customerId: form.customerId || null,
        customerName: form.customerName,
        phone: form.phone,
        address: form.address,
        jobType: form.jobType,
        priority: form.priority,
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
      setError(err.message || "Failed to save job.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Add Job</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="existingCustomer">Existing customer</Label>
              <Select id="existingCustomer" value={form.customerId} onChange={handleCustomerSelect}>
                <option value="">-- New / manual entry --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="customerName">Customer name *</Label>
              <Input
                id="customerName"
                value={form.customerName}
                onChange={(e) => update("customerName", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address">Job address</Label>
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
              <Label htmlFor="technician">Assign technician</Label>
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
                <Label htmlFor="scheduledDate">Date *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => update("scheduledDate", e.target.value)}
                  required
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
                placeholder="e.g. AC unit not cooling, check refrigerant"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="price">Estimated price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
            </div>

            <div className="space-y-2 rounded-md border border-border p-3">
              <Label>Supplies needed</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Item"
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
                Checked off in Job Detail; unchecked items can be sent to Store Orders.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Internal notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving..." : "Save Job"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
