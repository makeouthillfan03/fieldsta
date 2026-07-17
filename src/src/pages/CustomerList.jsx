import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { Phone, MapPin, Search, Plus, X, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";

const emptyCustomer = {
  name: "",
  phone: "",
  email: "",
  address: "",
  preferredContact: "phone",
  notes: "",
};

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyCustomer);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "customers"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

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
    try {
      await addDoc(collection(db, "customers"), {
        ...form,
        createdAt: serverTimestamp(),
      });
      setForm(emptyCustomer);
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Customers</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" /> New
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, phone, email, address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading customers...</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          No customers found
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
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">New Customer</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowAdd(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleAddCustomer} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="cname">Name *</Label>
            <Input
              id="cname"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="cphone">Phone</Label>
              <Input
                id="cphone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cpreferred">Preferred contact</Label>
              <Select
                id="cpreferred"
                value={form.preferredContact}
                onChange={(e) => setForm((f) => ({ ...f, preferredContact: e.target.value }))}
              >
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="text">Text</option>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="cemail">Email</Label>
            <Input
              id="cemail"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="caddress">Address</Label>
            <Input
              id="caddress"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Add Customer"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
