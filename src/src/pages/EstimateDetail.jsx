import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { ArrowLeft, Plus, Printer, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { currency } from "@/lib/utils";

const TIER_KEYS = ["good", "better", "best"];
const TIER_LABELS = { good: "Good", better: "Better", best: "Best" };

function emptyTier(label) {
  return { label, items: [], total: 0 };
}

function emptyTiers() {
  return { good: emptyTier("Good"), better: emptyTier("Better"), best: emptyTier("Best") };
}

function recalcTotal(items) {
  return items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0), 0);
}

export default function EstimateDetail() {
  const { estimateId } = useParams();
  const isNew = estimateId === "new";
  const navigate = useNavigate();
  const { user } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [priceBook, setPriceBook] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [status, setStatus] = useState("draft");
  const [selectedTier, setSelectedTier] = useState("");
  const [tiers, setTiers] = useState(emptyTiers());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    async function loadRefs() {
      const [custSnap, pbSnap] = await Promise.all([
        getDocs(query(collection(db, "customers"), orderBy("name", "asc"))),
        getDocs(query(collection(db, "priceBook"), orderBy("name", "asc"))),
      ]);
      setCustomers(custSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setPriceBook(pbSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
    loadRefs();
  }, []);

  useEffect(() => {
    if (isNew) return;
    async function load() {
      const snap = await getDoc(doc(db, "estimates", estimateId));
      if (snap.exists()) {
        const data = snap.data();
        setCustomerId(data.customerId || "");
        setCustomerName(data.customerName || "");
        setStatus(data.status || "draft");
        setSelectedTier(data.selectedTier || "");
        setTiers(data.tiers || emptyTiers());
        setNotes(data.notes || "");
      }
      setLoading(false);
    }
    load();
  }, [estimateId, isNew]);

  function handleCustomerSelect(e) {
    const id = e.target.value;
    const c = customers.find((x) => x.id === id);
    setCustomerId(id);
    setCustomerName(c?.name || "");
  }

  function addItem(tierKey, fromPriceBookId) {
    setTiers((t) => {
      const tier = t[tierKey];
      let newItem = { name: "", qty: 1, unitPrice: 0 };
      if (fromPriceBookId) {
        const pb = priceBook.find((p) => p.id === fromPriceBookId);
        if (pb) newItem = { name: pb.name, qty: 1, unitPrice: pb.unitPrice };
      }
      const items = [...tier.items, newItem];
      return { ...t, [tierKey]: { ...tier, items, total: recalcTotal(items) } };
    });
  }

  function updateItem(tierKey, idx, field, value) {
    setTiers((t) => {
      const tier = t[tierKey];
      const items = tier.items.map((it, i) => (i === idx ? { ...it, [field]: value } : it));
      return { ...t, [tierKey]: { ...tier, items, total: recalcTotal(items) } };
    });
  }

  function removeItem(tierKey, idx) {
    setTiers((t) => {
      const tier = t[tierKey];
      const items = tier.items.filter((_, i) => i !== idx);
      return { ...t, [tierKey]: { ...tier, items, total: recalcTotal(items) } };
    });
  }

  async function handleSave(status_) {
    setSaving(true);
    try {
      const payload = {
        customerId: customerId || null,
        customerName,
        status: status_ || status,
        selectedTier,
        tiers,
        notes,
        updatedAt: serverTimestamp(),
      };
      if (isNew) {
        const docRef = await addDoc(collection(db, "estimates"), {
          ...payload,
          createdAt: serverTimestamp(),
          createdBy: user?.email || null,
        });
        navigate(`/estimates/${docRef.id}`);
      } else {
        await updateDoc(doc(db, "estimates", estimateId), payload);
        setStatus(payload.status);
      }
    } finally {
      setSaving(false);
    }
  }

  async function convertToJob() {
    if (!selectedTier || !tiers[selectedTier]) return;
    setConverting(true);
    try {
      const tier = tiers[selectedTier];
      const description = `Estimate (${TIER_LABELS[selectedTier]}): ${tier.items
        .map((i) => `${i.qty}x ${i.name}`)
        .join(", ")}`;
      const customer = customers.find((c) => c.id === customerId);
      const jobRef = await addDoc(collection(db, "jobs"), {
        customerId: customerId || null,
        customerName,
        phone: customer?.phone || "",
        address: customer?.address || "",
        jobType: "install",
        priority: "standard",
        description,
        status: "new",
        technicianId: null,
        technicianName: null,
        technicianEmail: null,
        scheduledAt: Timestamp.fromDate(new Date()),
        price: tier.total,
        supplies: [],
        photos: [],
        notes: `Converted from estimate ${estimateId}`,
        paymentStatus: "unpaid",
        paymentsLog: [],
        createdAt: serverTimestamp(),
        createdBy: user?.email || null,
      });
      await updateDoc(doc(db, "estimates", estimateId), {
        status: "accepted",
        selectedTier,
        jobId: jobRef.id,
      });
      navigate(`/jobs/${jobRef.id}`);
    } finally {
      setConverting(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading estimate...</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="no-print flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" /> Print
          </Button>
          {!isNew && <Badge className="self-center capitalize">{status}</Badge>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? "New Estimate" : "Edit Estimate"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="no-print space-y-1">
            <Label htmlFor="customer">Existing customer</Label>
            <Select id="customer" value={customerId} onChange={handleCustomerSelect}>
              <option value="">-- Manual entry --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="customerName">Customer name</Label>
            <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {TIER_KEYS.map((key) => (
              <div key={key} className="space-y-2 rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{TIER_LABELS[key]}</p>
                  <p className="text-sm font-semibold">{currency(tiers[key].total)}</p>
                </div>

                <ul className="space-y-2">
                  {tiers[key].items.map((it, idx) => (
                    <li key={idx} className="space-y-1 rounded border border-border p-2">
                      <Input
                        className="h-8 text-sm"
                        placeholder="Item name"
                        value={it.name}
                        onChange={(e) => updateItem(key, idx, "name", e.target.value)}
                      />
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          className="h-8 w-16 text-sm"
                          value={it.qty}
                          onChange={(e) => updateItem(key, idx, "qty", e.target.value)}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          className="h-8 flex-1 text-sm"
                          value={it.unitPrice}
                          onChange={(e) => updateItem(key, idx, "unitPrice", e.target.value)}
                        />
                        <button
                          type="button"
                          className="no-print text-muted-foreground"
                          onClick={() => removeItem(key, idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="no-print space-y-1">
                  <Select className="h-8 text-xs" onChange={(e) => e.target.value && addItem(key, e.target.value)} value="">
                    <option value="">+ Add from price book...</option>
                    {priceBook.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({currency(p.unitPrice)})
                      </option>
                    ))}
                  </Select>
                  <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => addItem(key)}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Custom line
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {!isNew && (
            <div className="no-print space-y-2 rounded-md border border-border p-3">
              <Label>Customer selected tier</Label>
              <Select value={selectedTier} onChange={(e) => setSelectedTier(e.target.value)}>
                <option value="">Not yet decided</option>
                {TIER_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {TIER_LABELS[k]} — {currency(tiers[k].total)}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                className="w-full"
                onClick={convertToJob}
                disabled={!selectedTier || converting}
              >
                {converting ? "Creating job..." : "Accept & Convert to Job"}
              </Button>
            </div>
          )}

          <div className="no-print flex gap-2">
            <Button className="flex-1" onClick={() => handleSave("draft")} disabled={saving}>
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => handleSave("sent")} disabled={saving}>
              Mark as Sent
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
