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
  where,
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
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const emptyForm = { name: "", category: "labor", unitPrice: "", unit: "each", notes: "" };

export default function PriceBook() {
  const { companyId } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setItems([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "priceBook"),
      where("companyId", "==", companyId),
      orderBy("name", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [companyId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name || !form.unitPrice) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "priceBook"), {
        companyId,
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
        <h1 className="text-lg font-semibold">{t("priceBook.title")}</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" /> {t("priceBook.addItem")}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("priceBook.subtitle")}
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("priceBook.loading")}</p>
      ) : items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          {t("priceBook.none")}
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
                      {t(`priceBook.category${item.category.charAt(0).toUpperCase()}${item.category.slice(1)}`)}
                    </Badge>
                  </div>
                  {item.notes && <p className="truncate text-sm text-muted-foreground">{item.notes}</p>}
                  <p className="text-xs text-muted-foreground">{t("priceBook.perUnit", { unit: item.unit })}</p>
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
          <h2 className="font-semibold">{t("priceBook.newTitle")}</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowAdd(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="pname">{t("priceBook.name")}</Label>
            <Input id="pname" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pcategory">{t("priceBook.category")}</Label>
              <Select id="pcategory" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                <option value="labor">{t("priceBook.categoryLabor")}</option>
                <option value="part">{t("priceBook.categoryPart")}</option>
                <option value="material">{t("priceBook.categoryMaterial")}</option>
                <option value="fee">{t("priceBook.categoryFee")}</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="punit">{t("priceBook.unit")}</Label>
              <Input id="punit" placeholder={t("priceBook.unitPlaceholder")} value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="pprice">{t("priceBook.unitPrice")}</Label>
            <Input id="pprice" type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pnotes">{t("common.notes")}</Label>
            <Input id="pnotes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? t("common.saving") : t("priceBook.addItem")}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
