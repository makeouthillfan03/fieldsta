import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { ArrowLeft, Link2, Mail, MapPin, Phone, Plus, Settings2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { STATUS_BADGE_VARIANT, formatDate } from "@/lib/utils";

const emptyEquipment = {
  make: "",
  model: "",
  serialNumber: "",
  installDate: "",
  refrigerantType: "",
  refrigerantCapacityLbs: "",
  systemType: "",
  tonnage: "",
  filterSize: "",
  warrantyExpirationDate: "",
  notes: "",
};

const SYSTEM_TYPES = ["split", "heat-pump", "packaged", "mini-split", "geothermal"];

// EPA Section 608 (AIM Act, effective Jan 2026) requires recordkeeping for
// appliances holding 15+ lbs of an HFC refrigerant — down from the old
// 50 lb threshold. Flag equipment at or above that so a shop knows which
// systems need refrigerant logs kept on file.
const EPA_608_THRESHOLD_LBS = 15;

// Warn on equipment whose warranty has already lapsed or lapses within the
// next 90 days, mirroring the EPA 608 badge pattern above.
const WARRANTY_WARNING_WINDOW_DAYS = 90;

function warrantyBadgeVariant(warrantyExpirationDate) {
  if (!warrantyExpirationDate) return null;
  const expires = new Date(warrantyExpirationDate);
  if (Number.isNaN(expires.getTime())) return null;
  const today = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntil = (expires - today) / msPerDay;
  if (daysUntil < 0) return "expired";
  if (daysUntil <= WARRANTY_WARNING_WINDOW_DAYS) return "soon";
  return null;
}

export default function CustomerDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { companyId } = useAuth();
  const { t } = useLanguage();

  const [customer, setCustomer] = useState(null);
  const [form, setForm] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddEquip, setShowAddEquip] = useState(false);
  const [equipForm, setEquipForm] = useState(emptyEquipment);
  const [portalToken, setPortalToken] = useState(null);
  const [portalCopied, setPortalCopied] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "customers", customerId));
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setCustomer(data);
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
          preferredContact: data.preferredContact || "phone",
          notes: data.notes || "",
        });
        setPortalToken(data.portalToken || null);
      }
      setLoading(false);
    }
    load();
  }, [customerId]);

  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, "equipment"),
      where("companyId", "==", companyId),
      where("customerId", "==", customerId)
    );
    const unsub = onSnapshot(q, (snap) => {
      setEquipment(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [customerId, companyId]);

  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, "jobs"),
      where("companyId", "==", companyId),
      where("customerId", "==", customerId),
      orderBy("scheduledAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [customerId, companyId]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, "customers", customerId), form);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddEquipment(e) {
    e.preventDefault();
    if (!equipForm.make && !equipForm.model) return;
    await addDoc(collection(db, "equipment"), {
      ...equipForm,
      companyId,
      customerId,
      createdAt: serverTimestamp(),
    });
    setEquipForm(emptyEquipment);
    setShowAddEquip(false);
  }

  async function handleDeleteEquipment(id) {
    await deleteDoc(doc(db, "equipment", id));
  }

  async function generateOrRefreshPortalLink() {
    setPortalBusy(true);
    try {
      let token = portalToken;
      if (!token) {
        token = crypto.randomUUID().replace(/-/g, "");
        await updateDoc(doc(db, "customers", customerId), { portalToken: token });
        setPortalToken(token);
      }

      const jobsForPortal = jobs.map((j) => {
        const paid = (j.paymentsLog || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
        return {
          id: j.id,
          description: j.description || "",
          status: j.status || "new",
          scheduledAt: j.scheduledAt || null,
          price: j.price || 0,
          balanceDue: Math.max((Number(j.price) || 0) - paid, 0),
        };
      });

      await setDoc(doc(db, "portal", token), {
        customerId,
        customerName: customer.name,
        jobs: jobsForPortal,
        generatedAt: Timestamp.now(),
      });

      const url = `${window.location.origin}/portal/${token}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      setPortalCopied(true);
      setTimeout(() => setPortalCopied(false), 2000);
    } finally {
      setPortalBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  if (!customer) return <p className="text-sm text-muted-foreground">Customer not found.</p>;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-1 h-4 w-4" /> {t("common.back")}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{t("customerDetail.profileTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name">{t("common.name")}</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="phone">
                  <Phone className="mr-1 inline h-3.5 w-3.5" /> {t("common.phone")}
                </Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">
                  <Mail className="mr-1 inline h-3.5 w-3.5" /> {t("common.email")}
                </Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="address">
                <MapPin className="mr-1 inline h-3.5 w-3.5" /> {t("common.address")}
              </Label>
              <Input id="address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="notes">{t("common.notes")}</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? t("common.saving") : t("customerDetail.saveProfile")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4" /> {t("customerDetail.equipment")}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAddEquip(true)}>
            <Plus className="mr-1 h-4 w-4" /> {t("common.add")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {equipment.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("customerDetail.noEquipment")}</p>
          ) : (
            equipment.map((eq) => {
              const warrantyStatus = warrantyBadgeVariant(eq.warrantyExpirationDate);
              return (
                <div
                  key={eq.id}
                  className="flex items-start justify-between gap-2 rounded-md border border-border p-3"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-medium">
                        {eq.make} {eq.model}
                      </p>
                      {eq.systemType && (
                        <Badge variant="outline">{t(`systemType.${eq.systemType}`)}</Badge>
                      )}
                      {Number(eq.refrigerantCapacityLbs) >= EPA_608_THRESHOLD_LBS && (
                        <Badge variant="warning" title="15+ lbs of refrigerant — EPA 608 recordkeeping applies">
                          EPA 608
                        </Badge>
                      )}
                      {warrantyStatus === "soon" && (
                        <Badge variant="warning">{t("customerDetail.warrantyExpiringSoon")}</Badge>
                      )}
                      {warrantyStatus === "expired" && (
                        <Badge variant="destructive">{t("customerDetail.warrantyExpired")}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {eq.serialNumber && `S/N ${eq.serialNumber}`}
                      {eq.installDate && ` · Installed ${eq.installDate}`}
                    </p>
                    {eq.refrigerantType && (
                      <p className="text-sm text-muted-foreground">
                        {eq.refrigerantType}
                        {eq.refrigerantCapacityLbs && ` · ${eq.refrigerantCapacityLbs} lbs charge`}
                      </p>
                    )}
                    {(eq.tonnage || eq.filterSize) && (
                      <p className="text-sm text-muted-foreground">
                        {eq.tonnage &&
                          `${eq.tonnage} ${t("customerDetail.tonnage")} (${t("customerDetail.btuHelp", {
                            btu: (Number(eq.tonnage) * 12000).toLocaleString(),
                          })})`}
                        {eq.tonnage && eq.filterSize && " · "}
                        {eq.filterSize && `${t("customerDetail.filterSize")}: ${eq.filterSize}`}
                      </p>
                    )}
                    {eq.warrantyExpirationDate && (
                      <p className="text-sm text-muted-foreground">
                        {t("customerDetail.warrantyExpiration")}: {eq.warrantyExpirationDate}
                      </p>
                    )}
                    {eq.notes && <p className="mt-1 text-sm text-muted-foreground">{eq.notes}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteEquipment(eq.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("customerDetail.serviceHistory")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("customerDetail.noJobs")}</p>
          ) : (
            jobs.map((job) => (
              <Link key={job.id} to={`/jobs/${job.id}`}>
                <div className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-accent">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{job.description || "HVAC job"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(job.scheduledAt)}</p>
                  </div>
                  <Badge variant={STATUS_BADGE_VARIANT[job.status] || "secondary"}>
                    {t(`status.${job.status}`)}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4" /> {t("customerDetail.portalTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {t("customerDetail.portalHelp", { name: customer.name })}
          </p>
          <Button variant="outline" className="w-full" onClick={generateOrRefreshPortalLink} disabled={portalBusy}>
            {portalBusy
              ? t("common.loading")
              : portalCopied
              ? t("customerDetail.linkCopied")
              : portalToken
              ? t("customerDetail.refreshLink")
              : t("customerDetail.generateLink")}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showAddEquip} onClose={() => setShowAddEquip(false)}>
        <h2 className="mb-3 font-semibold">{t("customerDetail.addEquipment")}</h2>
        <form onSubmit={handleAddEquipment} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="make">{t("customerDetail.make")}</Label>
              <Input
                id="make"
                value={equipForm.make}
                onChange={(e) => setEquipForm((f) => ({ ...f, make: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="model">{t("customerDetail.model")}</Label>
              <Input
                id="model"
                value={equipForm.model}
                onChange={(e) => setEquipForm((f) => ({ ...f, model: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="serialNumber">{t("customerDetail.serialNumber")}</Label>
            <Input
              id="serialNumber"
              value={equipForm.serialNumber}
              onChange={(e) => setEquipForm((f) => ({ ...f, serialNumber: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="installDate">{t("customerDetail.installDate")}</Label>
            <Input
              id="installDate"
              type="date"
              value={equipForm.installDate}
              onChange={(e) => setEquipForm((f) => ({ ...f, installDate: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="refrigerantType">{t("customerDetail.refrigerantType")}</Label>
              <Input
                id="refrigerantType"
                placeholder="e.g. R-410A"
                value={equipForm.refrigerantType}
                onChange={(e) => setEquipForm((f) => ({ ...f, refrigerantType: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="refrigerantCapacityLbs">{t("customerDetail.refrigerantCharge")}</Label>
              <Input
                id="refrigerantCapacityLbs"
                type="number"
                step="0.1"
                value={equipForm.refrigerantCapacityLbs}
                onChange={(e) =>
                  setEquipForm((f) => ({ ...f, refrigerantCapacityLbs: e.target.value }))
                }
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("customerDetail.epaNote")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="systemType">{t("customerDetail.systemType")}</Label>
              <Select
                id="systemType"
                value={equipForm.systemType}
                onChange={(e) => setEquipForm((f) => ({ ...f, systemType: e.target.value }))}
              >
                <option value="">{t("addJob.diagnosisCodeNone")}</option>
                {SYSTEM_TYPES.map((st) => (
                  <option key={st} value={st}>
                    {t(`systemType.${st}`)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="tonnage">{t("customerDetail.tonnage")}</Label>
              <Input
                id="tonnage"
                type="number"
                step="0.5"
                value={equipForm.tonnage}
                onChange={(e) => setEquipForm((f) => ({ ...f, tonnage: e.target.value }))}
              />
              {equipForm.tonnage && (
                <p className="text-xs text-muted-foreground">
                  {t("customerDetail.btuHelp", {
                    btu: (Number(equipForm.tonnage) * 12000).toLocaleString(),
                  })}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="filterSize">{t("customerDetail.filterSize")}</Label>
              <Input
                id="filterSize"
                placeholder="16x25x1"
                value={equipForm.filterSize}
                onChange={(e) => setEquipForm((f) => ({ ...f, filterSize: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="warrantyExpirationDate">{t("customerDetail.warrantyExpiration")}</Label>
              <Input
                id="warrantyExpirationDate"
                type="date"
                value={equipForm.warrantyExpirationDate}
                onChange={(e) =>
                  setEquipForm((f) => ({ ...f, warrantyExpirationDate: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="equipNotes">{t("common.notes")}</Label>
            <Textarea
              id="equipNotes"
              value={equipForm.notes}
              onChange={(e) => setEquipForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <Button type="submit" className="w-full">
            {t("customerDetail.addEquipment")}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
