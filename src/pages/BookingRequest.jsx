import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { db } from "@/lib/firebase";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  jobType: "repair",
  preferredDate: "",
  preferredTime: "",
  description: "",
};

// Public, unauthenticated "request an appointment" form — the link a
// company shares on their own website/socials. Anyone can submit a
// request; only that company can ever see or act on it (see firestore.rules
// bookingRequests). This never books a slot directly — it lands as a
// request the office reviews and turns into a real scheduled job, same
// "propose, don't auto-commit" pattern as the rest of the app.
export default function BookingRequest() {
  const { companyId } = useParams();
  const [companyName, setCompanyName] = useState("");
  const [companyValid, setCompanyValid] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCompany() {
      const snap = await getDoc(doc(db, "companies", companyId));
      if (snap.exists()) {
        setCompanyName(snap.data().name || "this company");
        setCompanyValid(true);
      } else {
        setCompanyValid(false);
      }
    }
    loadCompany();
  }, [companyId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) return;
    setSaving(true);
    setError("");
    try {
      await addDoc(collection(db, "bookingRequests"), {
        companyId,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        jobType: form.jobType,
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime,
        description: form.description.trim(),
        status: "new",
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Couldn't send your request. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (companyValid === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!companyValid) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-muted-foreground">
        This booking link isn't valid.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex items-center gap-2">
          <img src="/mascot.png" alt="" className="h-6 w-6" />
          <span className="font-semibold">Fieldsta</span>
        </div>

        {submitted ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <p className="font-medium">Request sent!</p>
              <p className="text-sm text-muted-foreground">
                {companyName} will reach out to confirm a time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Request an appointment with {companyName}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="address">Service address *</Label>
                  <Input id="address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="jobType">Type of service</Label>
                  <Select id="jobType" value={form.jobType} onChange={(e) => setForm((f) => ({ ...f, jobType: e.target.value }))}>
                    <option value="repair">Repair</option>
                    <option value="install">Install</option>
                    <option value="maintenance">Maintenance</option>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="preferredDate">Preferred date</Label>
                    <Input id="preferredDate" type="date" value={form.preferredDate} onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="preferredTime">Preferred time</Label>
                    <Input id="preferredTime" type="time" value={form.preferredTime} onChange={(e) => setForm((f) => ({ ...f, preferredTime: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="description">What's going on?</Label>
                  <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Sending…" : "Request appointment"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
