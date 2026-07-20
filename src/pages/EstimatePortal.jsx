import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SignaturePad from "@/components/SignaturePad";
import { db } from "@/lib/firebase";
import { currency, formatDate } from "@/lib/utils";

const TIER_KEYS = ["good", "better", "best"];
const TIER_LABELS = { good: "Good", better: "Better", best: "Best" };

// Public, unauthenticated view — a customer opens this link (no login) to
// review Good/Better/Best pricing on their estimate, pick a tier, and sign
// off. Access is the same tradeoff as /portal: the Firestore doc ID is the
// unguessable "token". See firestore.rules `customerSigning()` for exactly
// what an anonymous visitor is allowed to write (only the sign-off fields,
// exactly once, never the estimate's line items or price).
export default function EstimatePortal() {
  const { estimateId } = useParams();
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tier, setTier] = useState("");
  const [name, setName] = useState("");
  const [signatureData, setSignatureData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "estimates", estimateId));
      if (snap.exists()) {
        const data = snap.data();
        setEstimate(data);
        setTier(data.selectedTier || "");
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }
    load();
  }, [estimateId]);

  async function handleAccept(e) {
    e.preventDefault();
    if (!tier || !signatureData || !name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await updateDoc(doc(db, "estimates", estimateId), {
        status: "accepted",
        selectedTier: tier,
        customerSignature: signatureData,
        signedByName: name.trim(),
        signedAt: serverTimestamp(),
      });
      setEstimate((prev) => ({
        ...prev,
        status: "accepted",
        selectedTier: tier,
        customerSignature: signatureData,
        signedByName: name.trim(),
      }));
    } catch (err) {
      setError(err.message || "Couldn't save your signature. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (notFound || !estimate) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-muted-foreground">
        This estimate link isn't valid.
      </div>
    );
  }

  const alreadySigned = !!estimate.customerSignature;

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex items-center gap-2">
          <img src="/mascot.png" alt="" className="h-6 w-6" />
          <span className="font-semibold">Fieldsta</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Estimate for {estimate.customerName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>Pick the option that works for you, then sign below to approve it.</p>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {TIER_KEYS.map((key) => {
            const t = estimate.tiers?.[key];
            if (!t) return null;
            return (
              <label
                key={key}
                className={`block cursor-pointer rounded-md border p-3 ${
                  tier === key ? "border-primary bg-primary/5" : "border-border"
                } ${alreadySigned ? "pointer-events-none opacity-70" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="tier"
                      checked={tier === key}
                      onChange={() => setTier(key)}
                      disabled={alreadySigned}
                    />
                    <span className="font-medium">{TIER_LABELS[key]}</span>
                  </div>
                  <span className="font-semibold">{currency(t.total)}</span>
                </div>
                <ul className="mt-2 space-y-0.5 pl-6 text-sm text-muted-foreground">
                  {(t.items || []).map((it, i) => (
                    <li key={i}>
                      {it.qty}x {it.name}
                    </li>
                  ))}
                </ul>
              </label>
            );
          })}
        </div>

        {estimate.notes && (
          <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            {estimate.notes}
          </p>
        )}

        {alreadySigned ? (
          <Card>
            <CardContent className="space-y-2 p-4">
              <p className="text-sm font-medium text-green-700">
                Approved — signed by {estimate.signedByName}
                {estimate.signedAt?.toDate ? ` on ${formatDate(estimate.signedAt)}` : ""}.
              </p>
              <img
                src={estimate.customerSignature}
                alt="Signature"
                className="h-16 rounded border border-border bg-white"
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="space-y-1">
                <Label htmlFor="signerName">Your name</Label>
                <Input id="signerName" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Signature</Label>
                <SignaturePad onChange={setSignatureData} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button
                className="w-full"
                onClick={handleAccept}
                disabled={!tier || !signatureData || !name.trim() || saving}
              >
                {saving ? "Saving…" : "Approve & Sign"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
