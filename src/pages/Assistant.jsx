import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Sparkles, Send, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { db } from "@/lib/firebase";
import { runAssistant } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { currency } from "@/lib/utils";

const ACTION_LABEL_KEYS = {
  create_customer: "assistant.actionCreateCustomer",
  create_job: "assistant.actionCreateJob",
  log_payment: "assistant.actionLogPayment",
  log_refrigerant: "assistant.actionLogRefrigerant",
  create_maintenance_agreement: "assistant.actionCreateAgreement",
  add_note: "assistant.actionAddNote",
};

const FREQUENCY_MONTHS = { quarterly: 3, biannual: 6, annual: 12 };

function nextIdGen() {
  let n = 0;
  return () => `a${Date.now()}_${n++}`;
}
const nextId = nextIdGen();

export default function Assistant() {
  const { user, companyId } = useAuth();
  const { t } = useLanguage();
  const [customers, setCustomers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [turns, setTurns] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!companyId) return;
    const q = query(
      collection(db, "customers"),
      where("companyId", "==", companyId),
      orderBy("name", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, "jobs"), where("companyId", "==", companyId));
    const unsub = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [companyId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  function jobLabel(job) {
    return `${job.customerName || "Unknown"} — ${job.description || job.jobType || "job"}`;
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!messageText.trim() || sending) return;
    setSending(true);
    setError("");
    const text = messageText.trim();
    setMessageText("");
    try {
      const customerContext = customers.map((c) => ({ id: c.id, name: c.name }));
      const jobContext = jobs
        .slice()
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 60)
        .map((j) => ({ id: j.id, customerName: j.customerName, description: j.description, status: j.status }));

      // Give the model the actual back-and-forth so far, not just this one
      // message — otherwise "add another one for him too" means nothing to it.
      const history = turns.flatMap((t) => [
        { role: "user", content: t.request },
        { role: "assistant", content: t.assistantRaw },
      ]);

      const result = await runAssistant(text, customerContext, jobContext, history);
      const data = result.data || {};
      const actions = (data.actions || []).map((a) => ({
        id: nextId(),
        type: a.type,
        fields: a,
        included: true,
        status: "pending",
      }));
      setTurns((t) => [
        ...t,
        {
          id: nextId(),
          request: text,
          reply: data.reply || "",
          actions,
          assistantRaw: JSON.stringify({ reply: data.reply || "", actions: data.actions || [] }),
        },
      ]);
    } catch (err) {
      setError(
        err.code === "functions/failed-precondition" || err.code === "failed-precondition"
          ? "AI service rejected the request — the ANTHROPIC_API_KEY secret may be missing or invalid."
          : err.code === "functions/unavailable" || err.message?.includes("fetch")
          ? "Couldn't reach the AI assistant. Cloud Functions may not be deployed yet — see README.md."
          : err.message || "Something went wrong. Try again."
      );
    } finally {
      setSending(false);
    }
  }

  function updateActionField(turnId, actionId, field, value) {
    setTurns((ts) =>
      ts.map((t) =>
        t.id !== turnId
          ? t
          : {
              ...t,
              actions: t.actions.map((a) =>
                a.id !== actionId ? a : { ...a, fields: { ...a.fields, [field]: value } }
              ),
            }
      )
    );
  }

  function toggleAction(turnId, actionId) {
    setTurns((ts) =>
      ts.map((t) =>
        t.id !== turnId
          ? t
          : {
              ...t,
              actions: t.actions.map((a) => (a.id !== actionId ? a : { ...a, included: !a.included })),
            }
      )
    );
  }

  async function executeAction(action) {
    const f = action.fields;
    switch (action.type) {
      case "create_customer": {
        await addDoc(collection(db, "customers"), {
          companyId,
          name: f.name || "Unnamed",
          phone: f.phone || "",
          email: f.email || "",
          address: f.address || "",
          preferredContact: "phone",
          notes: "",
          createdAt: serverTimestamp(),
        });
        return;
      }
      case "create_job": {
        const customer = customers.find((c) => c.id === f.customerId);
        const dateStr = f.scheduledDate || new Date().toISOString().slice(0, 10);
        const timeStr = f.scheduledTime || "09:00";
        await addDoc(collection(db, "jobs"), {
          companyId,
          customerId: f.customerId || null,
          customerName: f.customerName || customer?.name || "Unnamed customer",
          phone: f.phone || customer?.phone || "",
          address: f.address || customer?.address || "",
          jobType: f.jobType || "repair",
          priority: f.priority || "standard",
          description: f.description || "",
          status: "new",
          technicianId: null,
          technicianName: null,
          technicianEmail: null,
          scheduledAt: Timestamp.fromDate(new Date(`${dateStr}T${timeStr}`)),
          price: Number(f.price) || 0,
          supplies: [],
          photos: [],
          refrigerantLog: [],
          notes: "",
          paymentStatus: "unpaid",
          paymentsLog: [],
          createdAt: serverTimestamp(),
          createdBy: user?.email || null,
        });
        return;
      }
      case "log_payment": {
        const job = jobs.find((j) => j.id === f.jobId);
        if (!job) throw new Error("Pick a job first.");
        const entry = {
          amount: Number(f.amount) || 0,
          method: f.method || "cash",
          note: f.note || "",
          recordedBy: user?.email || "unknown",
          date: new Date().toISOString(),
        };
        const newLog = [...(job.paymentsLog || []), entry];
        const totalPaid = newLog.reduce((s, p) => s + (Number(p.amount) || 0), 0);
        const price = Number(job.price) || 0;
        const newStatus = totalPaid <= 0 ? "unpaid" : totalPaid >= price ? "paid" : "partial";
        await updateDoc(doc(db, "jobs", job.id), { paymentsLog: newLog, paymentStatus: newStatus });
        await addDoc(collection(db, "jobs", job.id, "activity"), {
          type: "note",
          text: `Payment recorded (via Assistant): ${currency(entry.amount)} via ${entry.method}`,
          author: user?.email || "unknown",
          companyId,
          createdAt: serverTimestamp(),
        });
        return;
      }
      case "log_refrigerant": {
        const job = jobs.find((j) => j.id === f.jobId);
        if (!job) throw new Error("Pick a job first.");
        const entry = {
          type: f.refType || "unknown",
          action: f.action === "recovered" ? "recovered" : "added",
          pounds: Number(f.pounds) || 0,
          leakTestResult: f.leakTestResult || "n/a",
          technicianCertNumber: "",
          recordedBy: user?.email || "unknown",
          date: new Date().toISOString(),
        };
        const newLog = [...(job.refrigerantLog || []), entry];
        await updateDoc(doc(db, "jobs", job.id), { refrigerantLog: newLog });
        await addDoc(collection(db, "jobs", job.id, "activity"), {
          type: "note",
          text: `EPA 608 log (via Assistant): ${entry.pounds} lbs ${entry.type} ${entry.action}`,
          author: user?.email || "unknown",
          companyId,
          createdAt: serverTimestamp(),
        });
        return;
      }
      case "create_maintenance_agreement": {
        const customer = customers.find((c) => c.id === f.customerId);
        if (!customer) throw new Error("Pick a customer first.");
        await addDoc(collection(db, "maintenanceAgreements"), {
          companyId,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone || "",
          customerAddress: customer.address || "",
          equipmentLabel: f.equipmentLabel || "",
          frequency: f.frequency || "annual",
          price: Number(f.price) || 0,
          notes: "",
          active: true,
          nextDueDate: Timestamp.fromDate(new Date()),
          lastScheduledAt: null,
          createdAt: serverTimestamp(),
          createdBy: user?.email || null,
        });
        return;
      }
      case "add_note": {
        const job = jobs.find((j) => j.id === f.jobId);
        if (!job) throw new Error("Pick a job first.");
        await addDoc(collection(db, "jobs", job.id, "activity"), {
          type: "note",
          text: f.text || "",
          author: user?.email || "unknown",
          companyId,
          createdAt: serverTimestamp(),
        });
        return;
      }
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  async function applyTurnActions(turnId) {
    const turn = turns.find((t) => t.id === turnId);
    if (!turn) return;
    for (const action of turn.actions) {
      if (!action.included || action.status === "done") continue;
      setTurns((ts) =>
        ts.map((t) =>
          t.id !== turnId
            ? t
            : { ...t, actions: t.actions.map((a) => (a.id !== action.id ? a : { ...a, status: "saving" })) }
        )
      );
      try {
        await executeAction(action);
        setTurns((ts) =>
          ts.map((t) =>
            t.id !== turnId
              ? t
              : { ...t, actions: t.actions.map((a) => (a.id !== action.id ? a : { ...a, status: "done" })) }
          )
        );
      } catch (err) {
        setTurns((ts) =>
          ts.map((t) =>
            t.id !== turnId
              ? t
              : {
                  ...t,
                  actions: t.actions.map((a) =>
                    a.id !== action.id ? a : { ...a, status: "error", errorMessage: err.message }
                  ),
                }
          )
        );
      }
    }
  }

  const starters = [
    t("assistant.starter1") || "Schedule an AC repair for tomorrow at 2pm",
    t("assistant.starter2") || "Log a $150 cash payment on the Smith job",
    t("assistant.starter3") || "Add a new customer, Maria Lopez, 555-0142",
  ];

  return (
    <div className="mx-auto flex max-w-lg flex-col space-y-4">
      <div className="flex items-center gap-2">
        <img src="/mascot.png" alt="" className="h-6 w-6" />
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">{t("assistant.title")}</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        {t("assistant.subtitle")}
      </p>

      <div className="space-y-4">
        {turns.length === 0 && !sending && (
          <div className="space-y-3 rounded-lg border border-dashed border-border p-4 text-center">
            <img src="/mascot.png" alt="" className="mx-auto h-10 w-10" />
            <p className="text-sm text-muted-foreground">
              {t("assistant.emptyState") || "Tell me what happened and I'll turn it into jobs, notes, and payments — try one of these:"}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {starters.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setMessageText(s)}
                  className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((turn) => (
          <div key={turn.id} className="space-y-2">
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-lg rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                {turn.request}
              </div>
            </div>

            {turn.reply && (
              <div className="flex items-start gap-2">
                <img src="/mascot.png" alt="" className="mt-0.5 h-6 w-6 shrink-0" />
                <div className="max-w-[85%] rounded-lg rounded-tl-sm bg-secondary px-3 py-2 text-sm">
                  {turn.reply}
                </div>
              </div>
            )}

            {turn.actions.length > 0 && (
              <Card className="ml-8">
                <CardContent className="space-y-3 p-3">
                  {turn.actions.map((action) => (
                    <ActionEditor
                      key={action.id}
                      action={action}
                      customers={customers}
                      jobs={jobs}
                      jobLabel={jobLabel}
                      onToggle={() => toggleAction(turn.id, action.id)}
                      onFieldChange={(field, value) => updateActionField(turn.id, action.id, field, value)}
                    />
                  ))}
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => applyTurnActions(turn.id)}
                    disabled={turn.actions.every((a) => !a.included || a.status === "done")}
                  >
                    {t("jobDetail.applySelected")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex items-start gap-2">
            <img src="/mascot.png" alt="" className="mt-0.5 h-6 w-6 shrink-0 animate-pulse" />
            <div className="flex items-center gap-1 rounded-lg rounded-tl-sm bg-secondary px-3 py-2.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <form onSubmit={handleSend} className="sticky bottom-16 flex gap-2 bg-background pt-2 sm:bottom-0">
        <Input
          placeholder={t("assistant.placeholder")}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          disabled={sending}
          autoFocus
        />
        <Button type="submit" size="icon" disabled={sending || !messageText.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function ActionEditor({ action, customers, jobs, jobLabel, onToggle, onFieldChange }) {
  const { t } = useLanguage();
  const f = action.fields;
  const done = action.status === "done";
  const saving = action.status === "saving";

  return (
    <div className={`space-y-2 rounded-md border p-2.5 ${done ? "border-green-300 bg-green-50" : "border-border"}`}>
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Checkbox checked={action.included} onCheckedChange={onToggle} disabled={done || saving} />
          {ACTION_LABEL_KEYS[action.type] ? t(ACTION_LABEL_KEYS[action.type]) : action.type}
        </label>
        {done && <Check className="h-4 w-4 text-green-600" />}
        {action.status === "error" && <X className="h-4 w-4 text-destructive" />}
      </div>

      {action.status === "error" && (
        <p className="text-xs text-destructive">{action.errorMessage}</p>
      )}

      <fieldset disabled={done || saving} className="space-y-1.5 text-sm">
        {action.type === "create_customer" && (
          <>
            <Input placeholder={t("common.name")} value={f.name || ""} onChange={(e) => onFieldChange("name", e.target.value)} />
            <div className="grid grid-cols-2 gap-1.5">
              <Input placeholder={t("common.phone")} value={f.phone || ""} onChange={(e) => onFieldChange("phone", e.target.value)} />
              <Input placeholder={t("common.address")} value={f.address || ""} onChange={(e) => onFieldChange("address", e.target.value)} />
            </div>
          </>
        )}

        {action.type === "create_job" && (
          <>
            <Select value={f.customerId || ""} onChange={(e) => onFieldChange("customerId", e.target.value)}>
              <option value="">{t("assistant.manualEntryNew")}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              placeholder={t("assistant.customerNamePlaceholder")}
              value={f.customerName || ""}
              onChange={(e) => onFieldChange("customerName", e.target.value)}
            />
            <Textarea
              placeholder={t("assistant.descriptionPlaceholder")}
              value={f.description || ""}
              onChange={(e) => onFieldChange("description", e.target.value)}
              rows={2}
            />
            <div className="grid grid-cols-2 gap-1.5">
              <Input
                type="date"
                value={f.scheduledDate || ""}
                onChange={(e) => onFieldChange("scheduledDate", e.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                placeholder={t("common.price")}
                value={f.price || ""}
                onChange={(e) => onFieldChange("price", e.target.value)}
              />
            </div>
          </>
        )}

        {(action.type === "log_payment" || action.type === "log_refrigerant" || action.type === "add_note") && (
          <Select value={f.jobId || ""} onChange={(e) => onFieldChange("jobId", e.target.value)}>
            <option value="">{t("assistant.selectJob")}</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {jobLabel(j)}
              </option>
            ))}
          </Select>
        )}

        {action.type === "log_payment" && (
          <div className="grid grid-cols-2 gap-1.5">
            <Input
              type="number"
              step="0.01"
              placeholder={t("assistant.amountPlaceholder")}
              value={f.amount || ""}
              onChange={(e) => onFieldChange("amount", e.target.value)}
            />
            <Select value={f.method || "cash"} onChange={(e) => onFieldChange("method", e.target.value)}>
              <option value="cash">{t("paymentMethod.cash")}</option>
              <option value="check">{t("paymentMethod.check")}</option>
              <option value="card">{t("paymentMethod.card")}</option>
              <option value="online">{t("paymentMethod.online")}</option>
            </Select>
          </div>
        )}

        {action.type === "log_refrigerant" && (
          <div className="grid grid-cols-2 gap-1.5">
            <Input
              placeholder={t("jobDetail.refTypePlaceholder")}
              value={f.refType || ""}
              onChange={(e) => onFieldChange("refType", e.target.value)}
            />
            <Input
              type="number"
              step="0.1"
              placeholder={t("assistant.poundsPlaceholder")}
              value={f.pounds || ""}
              onChange={(e) => onFieldChange("pounds", e.target.value)}
            />
          </div>
        )}

        {action.type === "add_note" && (
          <Textarea placeholder={t("assistant.notePlaceholder")} value={f.text || ""} onChange={(e) => onFieldChange("text", e.target.value)} rows={2} />
        )}

        {action.type === "create_maintenance_agreement" && (
          <>
            <Select value={f.customerId || ""} onChange={(e) => onFieldChange("customerId", e.target.value)}>
              <option value="">{t("assistant.selectCustomer")}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-1.5">
              <Select value={f.frequency || "annual"} onChange={(e) => onFieldChange("frequency", e.target.value)}>
                <option value="annual">{t("agreements.annual")}</option>
                <option value="biannual">{t("agreements.biannual")}</option>
                <option value="quarterly">{t("agreements.quarterly")}</option>
              </Select>
              <Input
                type="number"
                step="0.01"
                placeholder={t("assistant.pricePerVisit")}
                value={f.price || ""}
                onChange={(e) => onFieldChange("price", e.target.value)}
              />
            </div>
          </>
        )}
      </fieldset>
    </div>
  );
}
