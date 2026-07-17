import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { Plus, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { TECH_AVAILABILITY, TECH_AVAILABILITY_LABELS } from "@/lib/utils";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  skills: "",
  certifications: "",
  availability: "available",
};

const availabilityVariant = {
  available: "success",
  "on-route": "warning",
  "on-site": "warning",
  "on-break": "secondary",
  off: "outline",
};

export default function Technicians() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "technicians"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setTechnicians(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "technicians"), {
        name: form.name,
        email: form.email,
        phone: form.phone,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        certifications: form.certifications.split(",").map((s) => s.trim()).filter(Boolean),
        availability: form.availability,
        createdAt: serverTimestamp(),
      });
      setForm(emptyForm);
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  }

  async function updateAvailability(id, availability) {
    await updateDoc(doc(db, "technicians", id), { availability });
  }

  async function removeTechnician(id) {
    await deleteDoc(doc(db, "technicians", id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Technicians</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading technicians...</p>
      ) : technicians.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          No technicians yet
        </p>
      ) : (
        <div className="space-y-2">
          {technicians.map((t) => (
            <Card key={t.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {t.email} {t.phone && `· ${t.phone}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeTechnician(t.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {(t.skills?.length > 0 || t.certifications?.length > 0) && (
                  <div className="flex flex-wrap gap-1">
                    {t.skills?.map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                    {t.certifications?.map((c) => (
                      <Badge key={c} variant="outline">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant={availabilityVariant[t.availability] || "secondary"}>
                    {TECH_AVAILABILITY_LABELS[t.availability] || t.availability}
                  </Badge>
                  <Select
                    className="h-8 w-40 text-xs"
                    value={t.availability}
                    onChange={(e) => updateAvailability(t.id, e.target.value)}
                  >
                    {TECH_AVAILABILITY.map((a) => (
                      <option key={a} value={a}>
                        {TECH_AVAILABILITY_LABELS[a]}
                      </option>
                    ))}
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">New Technician</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowAdd(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="tname">Name *</Label>
            <Input id="tname" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="temail">Email (must match their Google login)</Label>
            <Input
              id="temail"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tphone">Phone</Label>
            <Input id="tphone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tskills">Skills (comma separated)</Label>
            <Input
              id="tskills"
              placeholder="Refrigeration, Electrical"
              value={form.skills}
              onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tcerts">Certifications (comma separated)</Label>
            <Input
              id="tcerts"
              placeholder="EPA 608, NATE"
              value={form.certifications}
              onChange={(e) => setForm((f) => ({ ...f, certifications: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tavail">Availability</Label>
            <Select
              id="tavail"
              value={form.availability}
              onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}
            >
              {TECH_AVAILABILITY.map((a) => (
                <option key={a} value={a}>
                  {TECH_AVAILABILITY_LABELS[a]}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Add Technician"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
