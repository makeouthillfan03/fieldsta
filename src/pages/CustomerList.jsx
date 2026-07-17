import { useEffect, useMemo, useState } from "react";
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
  where,
} from "firebase/firestore";
import { Phone, MapPin, Search, Plus, X, ChevronRight, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const emptyCustomer = {
  name: "",
  phone: "",
  email: "",
  address: "",
  preferredContact: "phone",
  notes: "",
};

export default function CustomerList() {
  const { companyId } = useAuth();
  const { t } = useLanguage();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyCustomer);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    if (!companyId) {
      setCustomers([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "customers"),
      where("companyId", "==", companyId),
      orderBy("name", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [companyId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((c) =>
      [c.name, c.phone, c.email, c.address]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term))
    );
  }, [customers, search]);

  async function handleAddCustomer(e) {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    setError("");
    try {
      await addDoc(collection(db, "customers"), {
        ...form,
        companyId,
        createdAt: serverTimestamp(),
      });
      setForm(emptyCustomer);
      setShowAdd(false);
    } catch (err) {
      if (err.code === "permission-denied") {
        setError(
          "Firestore rejected this save. Your Firestore security rules probably haven't been deployed yet — run `firebase deploy --only firestore:rules` from the project folder."
        );
      } else {
        setError(err.message || "Failed to save customer.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(e, customerId) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(t("customerList.confirmDelete") || "Delete this customer? This cannot be undone.")) return;
    setDeletingId(customerId);
    try {
      await deleteDoc(doc(db, "customers", customerId));
    } catch (err) {
      setError(err.message || "Failed to delete customer.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{t("customerList.title")}</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" /> {t("common.new")}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={t("customerList.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("customerList.loading")}</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          {t("customerList.noCustomers")}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Link key={c.id} to={`/customers/${c.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" /> {c.phone}
                        </span>
                      )}
                      {c.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {c.address}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => handleDelete(e, c.id)}
                    disabled={deletingId === c.id}
                    aria-label={t("common.delete") || "Delete"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{t("customerList.newCustomer")}</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowAdd(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleAddCustomer} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="cname">{t("common.name")} *</Label>
            <Input
              id="cname"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="cphone">{t("common.phone")}</Label>
              <Input
                id="cphone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cpreferred">{t("customerList.preferredContact")}</Label>
              <Select
                id="cpreferred"
                value={form.preferredContact}
                onChange={(e) => setForm((f) => ({ ...f, preferredContact: e.target.value }))}
              >
                <option value="phone">{t("common.phone")}</option>
                <option value="email">{t("common.email")}</option>
                <option value="text">Text</option>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="cemail">{t("common.email")}</Label>
            <Input
              id="cemail"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="caddress">{t("common.address")}</Label>
            <Input
              id="caddress"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? t("common.saving") : t("customerList.addCustomer")}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
