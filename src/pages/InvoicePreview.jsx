import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { currency, formatDate } from "@/lib/utils";

export default function InvoicePreview() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "jobs", jobId));
      if (snap.exists()) setJob({ id: snap.id, ...snap.data() });
      setLoading(false);
    }
    load();
  }, [jobId]);

  if (loading) return <p className="text-sm text-muted-foreground">{t("invoice.loading")}</p>;
  if (!job) return <p className="text-sm text-muted-foreground">{t("invoice.notFound")}</p>;

  const invoiceNumber = `INV-${job.id.slice(0, 6).toUpperCase()}`;
  const suppliesTotal = (job.supplies || []).length;
  const paymentsLog = job.paymentsLog || [];
  const totalPaid = paymentsLog.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balanceDue = (Number(job.price) || 0) - totalPaid;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> {t("common.back")}
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="mr-1 h-4 w-4" /> {t("invoice.print")}
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-white p-6 shadow-sm print:border-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-xl font-bold">Fieldsta HVAC</h1>
            <p className="text-sm text-muted-foreground">{t("invoice.invoiceNumber", { number: invoiceNumber })}</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>{t("invoice.date", { date: formatDate(job.scheduledAt) })}</p>
            <p className="capitalize">{t("invoice.status", { status: t(`status.${job.status}`) })}</p>
            {job.jobType && <p>{t(`jobType.${job.jobType}`)}</p>}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold">{t("invoice.billTo")}</p>
            <p>{job.customerName}</p>
            {job.address && <p>{job.address}</p>}
            {job.phone && <p>{job.phone}</p>}
          </div>
          {job.technicianName && (
            <div className="text-right">
              <p className="font-semibold">{t("invoice.technician")}</p>
              <p>{job.technicianName}</p>
            </div>
          )}
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2">{t("invoice.description")}</th>
              <th className="py-2 text-right">{t("invoice.amount")}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-3">{job.description || t("invoice.hvacService")}</td>
              <td className="py-3 text-right">{currency(job.price)}</td>
            </tr>
            {suppliesTotal > 0 && (
              <tr className="border-b border-border">
                <td className="py-3 text-muted-foreground">
                  {t("invoice.partsMaterials", {
                    count: suppliesTotal,
                    list: job.supplies.map((s) => `${s.qty}x ${s.item}`).join(", "),
                  })}
                </td>
                <td className="py-3 text-right text-muted-foreground">{t("invoice.included")}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="py-3 text-right font-semibold">{t("invoice.total")}</td>
              <td className="py-3 text-right font-semibold">{currency(job.price)}</td>
            </tr>
            {totalPaid > 0 && (
              <>
                <tr>
                  <td className="py-1 text-right text-muted-foreground">{t("invoice.paid")}</td>
                  <td className="py-1 text-right text-muted-foreground">-{currency(totalPaid)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-right font-semibold">{t("invoice.balanceDue")}</td>
                  <td className="py-1 text-right font-semibold">{currency(balanceDue)}</td>
                </tr>
              </>
            )}
          </tfoot>
        </table>

        {paymentsLog.length > 0 && (
          <div className="mt-4 border-t border-border pt-4 text-sm">
            <p className="mb-1 font-semibold">{t("invoice.paymentHistory")}</p>
            <ul className="space-y-1 text-muted-foreground">
              {paymentsLog.map((p, idx) => (
                <li key={idx} className="flex justify-between">
                  <span className="capitalize">
                    {new Date(p.date).toLocaleDateString()} · {t(`paymentMethod.${p.method}`)}
                  </span>
                  <span>{currency(p.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {job.notes && (
          <div className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">{t("common.notes")}</p>
            <p>{job.notes}</p>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">{t("invoice.thankYou")}</p>
      </div>
    </div>
  );
}
