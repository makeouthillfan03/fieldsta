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
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { TECH_AVAILABILITY } from "@/lib/utils";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  skills: "",
  certifications: "",
  availability: "available",
  epaCertified: false,
  epaCertExpiration: "",
  nateCertified: false,
  onCall: false,
  truckStock: "",
};

const availabilityVariant = {
  available: "success",
  "on-route": "warning",
  "on-site": "warning",
  "on-break": "secondary",
  off: "outline",
};

export default function Technicians() {
  const { companyId } = useAuth();
  const { t } = useLanguage();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyId) {
      setTechnicians([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "technicians"),
      where("companyId", "==", companyId),
      orderBy("name", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setTechnicians(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [companyId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "technicians"), {
        companyId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        certifications: form.certifications.split(",").map((s) => s.trim()).filter(Boolean),
        availability: form.availability,
        epaCertified: form.epaCertified,
        epaCertExpiration: form.epaCertified ? form.epaCertExpiration : "",
        nateCertified: form.nateCertified,
        onCall: form.onCall,
        truckStock: form.truckStock.split(",").map((s) => s.trim()).filter(Boolean),
        createdAt: serverTimestamp(),
      });
      setForm(emptyForm);
      setShowAdd(false);
    } finally {
      setSaving(false);
    }
  }

  async function updateAvailability(id, availability) {
    await updateDoc(doc(db, "technicians", id), { availability });
  }

  async function removeTechnician(id) {
    await deleteDoc(doc(db, "technicians", id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t("tech.title")}</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" /> {t("tech.add")}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("tech.loading")}</p>
      ) : technicians.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          {t("tech.none")}
        </p>
      ) : (
        <div className="space-y-2">
          {technicians.map((tech) => (
            <Card key={tech.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{tech.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {tech.email} {tech.phone && `· ${tech.phone}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeTechnician(tech.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {(tech.epaCertified || tech.nateCertified || tech.onCall) && (
                  <div className="flex flex-wrap gap-1">
                    {tech.epaCertified && (
                      <Badge
                        variant="success"
                        title={
                          tech.epaCertExpiration
                            ? `${t("tech.epaCertified")} · ${t("tech.epaCertExpiration")}: ${tech.epaCertExpiration}`
                            : t("tech.epaCertified")
                        }
                      >
                        {t("tech.epaBadge")}
                      </Badge>
                    )}
                    {tech.nateCertified && (
                      <Badge variant="success" title={t("tech.nateCertified")}>
                        {t("tech.nateBadge")}
                      </Badge>
                    )}
                    {tech.onCall && (
                      <Badge variant="warning" title={t("tech.onCall")}>
                        {t("tech.onCallBadge")}
                      </Badge>
                    )}
                  </div>
                )}

                {(tech.skills?.length > 0 || tech.certifications?.length > 0) && (
                  <div className="flex flex-wrap gap-1">
                    {tech.skills?.map((s) => (
                      <Badge key={s} variant="secondary">
                        {s}
                      </Badge>
                    ))}
                    {tech.certifications?.map((c) => (
                      <Badge key={c} variant="outline">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}

                {tech.truckStock?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tech.truckStock.map((item) => (
                      <Badge key={item} variant="outline">
                        {item}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Badge variant={availabilityVariant[tech.availability] || "secondary"}>
                    {t(`techAvailability.${tech.availability}`)}
                  </Badge>
                  <Select
                    className="h-8 w-40 text-xs"
                    value={tech.availability}
                    onChange={(e) => updateAvailability(tech.id, e.target.value)}
                  >
                    {TECH_AVAILABILITY.map((a) => (
                      <option key={a} value={a}>
                        {t(`techAvailability.${a}`)}
                      </option>
                    ))}
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onClose={() => setShowAdd(false)}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{t("tech.newTitle")}</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowAdd(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="tname">{t("tech.name")}</Label>
            <Input id="tname" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="temail">{t("tech.emailHelp")}</Label>
            <Input
              id="temail"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tphone">{t("common.phone")}</Label>
            <Input id="tphone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tskills">{t("tech.skills")}</Label>
            <Input
              id="tskills"
              placeholder={t("tech.skillsPlaceholder")}
              value={form.skills}
              onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tcerts">{t("tech.certifications")}</Label>
            <Input
              id="tcerts"
              placeholder={t("tech.certificationsPlaceholder")}
              value={form.certifications}
              onChange={(e) => setForm((f) => ({ ...f, certifications: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tavail">{t("tech.availability")}</Label>
            <Select
              id="tavail"
              value={form.availability}
              onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}
            >
              {TECH_AVAILABILITY.map((a) => (
                <option key={a} value={a}>
                  {t(`techAvailability.${a}`)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ttruckstock">{t("tech.truckStock")}</Label>
            <Input
              id="ttruckstock"
              placeholder={t("tech.truckStockPlaceholder")}
              value={form.truckStock}
              onChange={(e) => setForm((f) => ({ ...f, truckStock: e.target.value }))}
            />
          </div>
          <div className="space-y-2 rounded-md border border-border p-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.epaCertified}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, epaCertified: checked }))}
              />
              {t("tech.epaCertified")}
            </label>
            {form.epaCertified && (
              <div className="space-y-1 pl-7">
                <Label htmlFor="tepaexp">{t("tech.epaCertExpiration")}</Label>
                <Input
                  id="tepaexp"
                  type="date"
                  value={form.epaCertExpiration}
                  onChange={(e) => setForm((f) => ({ ...f, epaCertExpiration: e.target.value }))}
                />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.nateCertified}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, nateCertified: checked }))}
              />
              {t("tech.nateCertified")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.onCall}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, onCall: checked }))}
              />
              {t("tech.onCall")}
            </label>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? t("common.saving") : t("tech.addButton")}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
