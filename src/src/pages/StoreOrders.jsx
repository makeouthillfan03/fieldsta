import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime } from "@/lib/utils";

const emptyOrder = { item: "", quantity: 1, notes: "", status: "pending" };

const statusVariant = {
  pending: "warning",
  ordered: "secondary",
  received: "success",
};

export default function StoreOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyOrder);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "storeOrders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.item) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "storeOrders"), {
        item: form.item,
        quantity: Number(form.quantity) || 1,
        notes: form.notes,
        status: "pending",
        requestedBy: user?.email || "unknown",
        jobId: null,
        createdAt: serverTimestamp(),
      });
      setForm(emptyOrder);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id, status) {
    await updateDoc(doc(db, "storeOrders", id), { status });
  }

  async function removeOrder(id) {
    await deleteDoc(doc(db, "storeOrders", id));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Store Orders</h1>
      <p className="text-sm text-muted-foreground">
        Parts and supplies requested by technicians, including items sent straight from a job's
        "Supplies Needed" checklist.
      </p>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="item">Item</Label>
              <Input
                id="item"
                value={form.item}
                onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
                placeholder="e.g. R-410A refrigerant, 25lb"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 space-y-1">
                <Label htmlFor="quantity">Qty</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Supplier, part #, urgency..."
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              <Plus className="mr-1 h-4 w-4" /> {saving ? "Adding..." : "Add Order"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          No store orders yet
        </p>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">
                      {o.quantity}x {o.item}
                    </p>
                    <Badge variant={statusVariant[o.status] || "secondary"}>{o.status}</Badge>
                  </div>
                  {o.notes && <p className="truncate text-sm text-muted-foreground">{o.notes}</p>}
                  <p className="text-xs text-muted-foreground">
                    Requested by {o.requestedBy} · {formatDateTime(o.createdAt)}
                  </p>
                  {o.jobId && (
                    <Link to={`/jobs/${o.jobId}`} className="text-xs text-primary underline">
                      View job
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    className="h-9 w-32"
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="ordered">Ordered</option>
                    <option value="received">Received</option>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => removeOrder(o.id)} aria-label="Remove order">
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
