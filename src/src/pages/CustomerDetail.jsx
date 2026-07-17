import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { ArrowLeft, Link2, Mail, MapPin, Phone, Plus, Trash2, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { STATUS_BADGE_VARIANT, STATUS_LABELS, formatDate } from "@/lib/utils";

const emptyEquipment = { make: "", model: "", serialNumber: "", installDate: "", notes: "" };

export default function CustomerDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [form, setForm] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddEquip, setShowAddEquip] = useState(false);
  const [equipForm, setEquipForm] = useState(emptyEquipment);
  const [portalToken, setPortalToken] = useState(null);
  const [portalCopied, setPortalCopied] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "customers", customerId));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setCustomer(data);
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
          preferredContact: data.preferredContact || "phone",
          notes: data.notes || "",
        });
        setPortalToken(data.portalToken || null);
      }
      setLoading(false);
    }
    load();
  }, [customerId]);

  useEffect(() => {
    const q = query(collection(db, "equipment"), where("customerId", "==", customerId));
    const unsub = onSnapshot(q, (snap) => {
      setEquipment(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [customerId]);

  useEffect(() => {
    const q = query(
      collection(db, "jobs"),
      where("customerId", "==", customerId),
      orderBy("scheduledAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [customerId]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, "customers", customerId), form);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEquipment(e) {
    e.preventDefault();
    if (!equipForm.make && !equipForm.model) return;
    await addDoc(collection(db, "equipment"), {
      ...equipForm,
      customerId,
      createdAt: serverTimestamp(),
    });
    setEquipForm(emptyEquipment);
    setShowAddEquip(false);
  }

  async function handleDeleteEquipment(id) {
    await deleteDoc(doc(db, "equipment", id));
  }

  async function generateOrRefreshPortalLink() {
    setPortalBusy(true);
    try {
      let token = portalToken;
      if (!token) {
        token = crypto.randomUUID().replace(/-/g, "");
        await updateDoc(doc(db, "customers", customerId), { portalToken: token });
        setPortalToken(token);
      }

      const jobsForPortal = jobs.map((j) => {
        const paid = (j.paymentsLog || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
        return {
          id: j.id,
          description: j.description || "",
          status: j.status || "new",
          scheduledAt: j.scheduledAt || null,
          price: j.price || 0,
          balanceDue: Math.max((Number(j.price) || 0) - paid, 0),
        };
      });

      await setDoc(doc(db, "portal", token), {
        customerId,
        customerName: customer.name,
        jobs: jobsForPortal,
        generatedAt: Timestamp.now(),
      });

      const url = `${window.location.origin}/portal/${token}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      setPortalCopied(true);
      setTimeout(() => setPortalCopied(false), 2000);
    } finally {
      setPortalBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading customer...</p>;
  if (!customer) return <p className="text-sm text-muted-foreground">Customer not found.</p>;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Customer Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="phone">
                  <Phone className="mr-1 inline h-3.5 w-3.5" /> Phone
                </Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">
                  <Mail className="mr-1 inline h-3.5 w-3.5" /> Email
                </Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="address">
                <MapPin className="mr-1 inline h-3.5 w-3.5" /> Address
              </Label>
              <Input id="address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4" /> Equipment
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAddEquip(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {equipment.length === 0 ? (
            <p className="text-sm text-muted-foreground">No equipment on file.</p>
          ) : (
            equipment.map((eq) => (
              <div
                key={eq.id}
                className="flex items-start justify-between gap-2 rounded-md border border-border p-3"
              >
                <div>
                  <p className="font-medium">
                    {eq.make} {eq.model}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {eq.serialNumber && `S/N ${eq.serialNumber}`}
                    {eq.installDate && ` · Installed ${eq.installDate}`}
                  </p>
                  {eq.notes && <p className="mt-1 text-sm text-muted-foreground">{eq.notes}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteEquipment(eq.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No jobs yet.</p>
          ) : (
            jobs.map((job) => (
              <Link key={job.id} to={`/jobs/${job.id}`}>
                <div className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-accent">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{job.description || "HVAC job"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(job.scheduledAt)}</p>
                  </div>
                  <Badge variant={STATUS_BADGE_VARIANT[job.status] || "secondary"}>
                    {STATUS_LABELS[job.status] || job.status}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4" /> Customer Portal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Share a link where {customer.name} can check job status and balances without logging
            in.
          </p>
          <Button variant="outline" className="w-full" onClick={generateOrRefreshPortalLink} disabled={portalBusy}>
            {portalBusy
              ? "Working..."
              : portalCopied
              ? "Link copied!"
              : portalToken
              ? "Refresh & Copy Portal Link"
              : "Generate Portal Link"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showAddEquip} onClose={() => setShowAddEquip(false)}>
        <h2 className="mb-3 font-semibold">Add Equipment</h2>
        <form onSubmit={handleAddEquipment} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={equipForm.make}
                onChange={(e) => setEquipForm((f) => ({ ...f, make: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={equipForm.model}
                onChange={(e) => setEquipForm((f) => ({ ...f, model: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="serialNumber">Serial number</Label>
            <Input
              id="serialNumber"
              value={equipForm.serialNumber}
              onChange={(e) => setEquipForm((f) => ({ ...f, serialNumber: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="installDate">Install date</Label>
            <Input
              id="installDate"
              type="date"
              value={equipForm.installDate}
              onChange={(e) => setEquipForm((f) => ({ ...f, installDate: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="equipNotes">Notes</Label>
            <Textarea
              id="equipNotes"
              value={equipForm.notes}
              onChange={(e) => setEquipForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <Button type="submit" className="w-full">
            Add Equipment
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
