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
import { currency } from "@/lib/utils";

const emptyForm = { name: "", category: "labor", unitPrice: "", unit: "each", notes: "" };

export default function PriceBook() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "priceBook"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name || !form.unitPrice) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "priceBook"), {
        name: form.name,
        category: form.category,
        unitPrice: Number(form.unitPrice) || 0,
        unit: form.unit,
        notes: form.notes,
        createdAt: serverTimestamp(),
      });
      setForm(emptyForm);
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdatePrice(id, unitPrice) {
    await updateDoc(doc(db, "priceBook", id), { unitPrice: Number(unitPrice) || 0 });
  }

  async function removeItem(id) {
    await deleteDoc(doc(db, "priceBook", id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Price Book</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add Item
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Centralized parts, materials, and labor rates used when building estimates so pricing stays
        consistent across the team.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading price book...</p>
      ) : items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          No items yet
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{item.name}</p>
                    <Badge variant="secondary" className="capitalize">
                      {item.category}
                    </Badge>
                  </div>
                  {item.notes && <p className="truncate text-sm text-muted-foreground">{item.notes}</p>}
                  <p className="text-xs text-muted-foreground">per {item.unit}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    defaultValue={item.unitPrice}
                    onBlur={(e) => handleUpdatePrice(item.id, e.target.value)}
                    className="w-24"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">New Price Book Item</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowAdd(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="pname">Name *</Label>
            <Input id="pname" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pcategory">Category</Label>
              <Select id="pcategory" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                <option value="labor">Labor</option>
                <option value="part">Part</option>
                <option value="material">Material</option>
                <option value="fee">Fee</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="punit">Unit</Label>
              <Input id="punit" placeholder="each, hour, ft..." value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="pprice">Unit price ($) *</Label>
            <Input id="pprice" type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pnotes">Notes</Label>
            <Input id="pnotes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Add Item"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
