import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import TermsAgreement from "@/components/TermsAgreement";

const ROLE_OPTIONS = [
  { value: "client", label: "I need work done" },
  { value: "contractor", label: "I do the work" },
  { value: "both", label: "Both" },
];

export default function ProfileSetup() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState("client");
  const [name, setName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState("");
  const [trade, setTrade] = useState("handyman");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const isContractor = roles === "contractor" || roles === "both";

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !agreed) return;
    setSaving(true);
    setError("");
    try {
      await setDoc(doc(db, "marketplaceProfiles", user.uid), {
        uid: user.uid,
        name: name.trim(),
        email: (user.email || "").toLowerCase(),
        phone: phone.trim(),
        roles,
        trade: isContractor ? trade : null,
        createdAt: serverTimestamp(),
      });
      // Was "/dashboard" — that route was retired with the old SaaS tool
      // and no longer exists, so this silently bounced people to "/" via
      // App.jsx's catch-all instead of actually landing on their new
      // account page. Fixed to go where Account.jsx actually lives.
      navigate("/account", { replace: true });
    } catch (err) {
      setError(err.message || "Couldn't save your profile. Try again.");
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="mb-4 text-center text-xl font-semibold">Set up your profile</h1>
        <Card className="border-border/60">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>I am</Label>
                <div className="flex gap-2">
                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRoles(opt.value)}
                      className={`flex-1 rounded-md border px-2 py-2 text-xs font-medium ${
                        roles === opt.value ? "border-black bg-black text-white" : "border-border"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="psName">Name</Label>
                <Input id="psName" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="psPhone">Phone</Label>
                <Input id="psPhone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
              {isContractor && (
                <div className="space-y-1">
                  <Label htmlFor="psTrade">Trade</Label>
                  <select
                    id="psTrade"
                    value={trade}
                    onChange={(e) => setTrade(e.target.value)}
                    className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
                  >
                    {["electrical", "plumbing", "hvac", "handyman", "painting", "landscaping", "cleaning", "movingHauling"].map(
                      (t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}
              <TermsAgreement checked={agreed} onChange={setAgreed} id="profileTermsAgree" />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full bg-black text-white hover:bg-black/90" disabled={saving || !agreed}>
                {saving ? "Saving…" : "Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
