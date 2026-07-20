import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { ArrowLeft, Plus, Printer, Trash2, Link as LinkIcon, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { currency, formatDate } from "@/lib/utils";

const TIER_KEYS = ["good", "better", "best"];
const TIER_LABEL_KEYS = { good: "estimates.good", better: "estimates.better", best: "estimates.best" };

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
  const { user, companyId } = useAuth();
  const { t } = useLanguage();

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
  const [deleting, setDeleting] = useState(false);
  const [customerSignature, setCustomerSignature] = useState(null);
  const [signedByName, setSignedByName] = useState("");
  const [signedAt, setSignedAt] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  function copyCustomerLink() {
    const url = `${window.location.origin}/estimate/${estimateId}`;
    navigator.clipboard?.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  useEffect(() => {
    if (!companyId) return;
    async function loadRefs() {
      const [custSnap, pbSnap] = await Promise.all([
        getDocs(
          query(
            collection(db, "customers"),
            where("companyId", "==", companyId),
            orderBy("name", "asc")
          )
        ),
        getDocs(
          query(
            collection(db, "priceBook"),
            where("companyId", "==", companyId),
            orderBy("name", "asc")
          )
        ),
      ]);
      setCustomers(custSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setPriceBook(pbSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
    loadRefs();
  }, [companyId]);

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
        setCustomerSignature(data.customerSignature || null);
        setSignedByName(data.signedByName || "");
        setSignedAt(data.signedAt || null);
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
          companyId,
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
      const description = `Estimate (${t(TIER_LABEL_KEYS[selectedTier])}): ${tier.items
        .map((i) => `${i.qty}x ${i.name}`)
        .join(", ")}`;
      const customer = customers.find((c) => c.id === customerId);
      const jobRef = await addDoc(collection(db, "jobs"), {
        companyId,
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

  async function handleDelete() {
    if (!window.confirm(t("estimateDetail.confirmDelete") || "Delete this estimate? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "estimates", estimateId));
      navigate("/estimates");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t("estimateDetail.loading")}</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="no-print flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> {t("common.back")}
        </Button>
        <div className="flex gap-2">
          {!isNew && (
            <Button variant="outline" size="sm" onClick={copyCustomerLink}>
              {linkCopied ? <Check className="mr-1 h-4 w-4" /> : <LinkIcon className="mr-1 h-4 w-4" />}
              {linkCopied ? t("estimateDetail.linkCopied") || "Copied!" : t("estimateDetail.copyLink") || "Customer link"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" /> {t("estimateDetail.print")}
          </Button>
          {!isNew && <Badge className="self-center capitalize">{t(`estimates.status${status.charAt(0).toUpperCase()}${status.slice(1)}`)}</Badge>}
          {!isNew && (
            <Button variant="ghost" size="icon" onClick={handleDelete} disabled={deleting} aria-label={t("common.delete") || "Delete"}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? t("estimateDetail.newTitle") : t("estimateDetail.editTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="no-print space-y-1">
            <Label htmlFor="customer">{t("addJob.existingCustomer")}</Label>
            <Select id="customer" value={customerId} onChange={handleCustomerSelect}>
              <option value="">{t("estimateDetail.manualEntry")}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="customerName">{t("addJob.customerName")}</Label>
            <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {TIER_KEYS.map((key) => (
              <div key={key} className="space-y-2 rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{t(TIER_LABEL_KEYS[key])}</p>
                  <p className="text-sm font-semibold">{currency(tiers[key].total)}</p>
                </div>

                <ul className="space-y-2">
                  {tiers[key].items.map((it, idx) => (
                    <li key={idx} className="space-y-1 rounded border border-border p-2">
                      <Input
                        className="h-8 text-sm"
                        placeholder={t("estimateDetail.itemName")}
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
                    <option value="">{t("estimateDetail.addFromPriceBook")}</option>
                    {priceBook.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({currency(p.unitPrice)})
                      </option>
                    ))}
                  </Select>
                  <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => addItem(key)}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> {t("estimateDetail.customLine")}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">{t("common.notes")}</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {!isNew && customerSignature && (
            <div className="space-y-2 rounded-md border border-green-300 bg-green-50 p-3">
              <p className="text-sm font-medium text-green-700">
                {t("estimateDetail.customerSigned", { name: signedByName }) ||
                  `Signed by ${signedByName}`}
                {signedAt?.toDate ? ` — ${formatDate(signedAt)}` : ""}
              </p>
              <img src={customerSignature} alt="Customer signature" className="h-14 rounded border border-border bg-white" />
            </div>
          )}

          {!isNew && (
            <div className="no-print space-y-2 rounded-md border border-border p-3">
              <Label>{t("estimateDetail.customerSelectedTier")}</Label>
              <Select value={selectedTier} onChange={(e) => setSelectedTier(e.target.value)}>
                <option value="">{t("estimateDetail.notYetDecided")}</option>
                {TIER_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {t(TIER_LABEL_KEYS[k])} — {currency(tiers[k].total)}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                className="w-full"
                onClick={convertToJob}
                disabled={!selectedTier || converting}
              >
                {converting ? t("estimateDetail.creatingJob") : t("estimateDetail.acceptConvert")}
              </Button>
            </div>
          )}

          <div className="no-print flex gap-2">
            <Button className="flex-1" onClick={() => handleSave("draft")} disabled={saving}>
              {saving ? t("common.saving") : t("estimateDetail.saveDraft")}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => handleSave("sent")} disabled={saving}>
              {t("estimateDetail.markSent")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
