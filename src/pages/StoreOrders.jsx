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
  where,
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
import { useLanguage } from "@/context/LanguageContext";
import { formatDateTime } from "@/lib/utils";

const emptyOrder = { item: "", quantity: 1, notes: "", status: "pending" };

const statusVariant = {
  pending: "warning",
  ordered: "secondary",
  received: "success",
};

export default function StoreOrders() {
  const { user, companyId } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyOrder);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "storeOrders"),
      where("companyId", "==", companyId),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [companyId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.item) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "storeOrders"), {
        companyId,
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
      <h1 className="text-lg font-semibold">{t("orders.title")}</h1>
      <p className="text-sm text-muted-foreground">
        {t("orders.subtitle")}
      </p>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="item">{t("orders.item")}</Label>
              <Input
                id="item"
                value={form.item}
                onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
                placeholder={t("orders.itemPlaceholder")}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 space-y-1">
                <Label htmlFor="quantity">{t("orders.qty")}</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="notes">{t("common.notes")}</Label>
                <Input
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder={t("orders.notesPlaceholder")}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              <Plus className="mr-1 h-4 w-4" /> {saving ? t("orders.adding") : t("orders.addOrder")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("orders.loading")}</p>
      ) : orders.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          {t("orders.none")}
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
                    <Badge variant={statusVariant[o.status] || "secondary"}>{t(`orders.status${o.status.charAt(0).toUpperCase()}${o.status.slice(1)}`)}</Badge>
                  </div>
                  {o.notes && <p className="truncate text-sm text-muted-foreground">{o.notes}</p>}
                  <p className="text-xs text-muted-foreground">
                    {t("orders.requestedBy", { name: o.requestedBy })} · {formatDateTime(o.createdAt)}
                  </p>
                  {o.jobId && (
                    <Link to={`/jobs/${o.jobId}`} className="text-xs text-primary underline">
                      {t("orders.viewJob")}
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    className="h-9 w-32"
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                  >
                    <option value="pending">{t("orders.statusPending")}</option>
                    <option value="ordered">{t("orders.statusOrdered")}</option>
                    <option value="received">{t("orders.statusReceived")}</option>
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
