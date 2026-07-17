import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { currency, formatDate, JOB_TYPE_LABELS } from "@/lib/utils";

export default function InvoicePreview() {
  const { jobId } = useParams();
  const navigate = useNavigate();
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

  if (loading) return <p className="text-sm text-muted-foreground">Loading invoice...</p>;
  if (!job) return <p className="text-sm text-muted-foreground">Job not found.</p>;

  const invoiceNumber = `INV-${job.id.slice(0, 6).toUpperCase()}`;
  const suppliesTotal = (job.supplies || []).length;
  const paymentsLog = job.paymentsLog || [];
  const totalPaid = paymentsLog.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balanceDue = (Number(job.price) || 0) - totalPaid;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="no-print mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="mr-1 h-4 w-4" /> Print
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-white p-6 shadow-sm print:border-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <h1 className="text-xl font-bold">FieldSta HVAC</h1>
            <p className="text-sm text-muted-foreground">Invoice #{invoiceNumber}</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>Date: {formatDate(job.scheduledAt)}</p>
            <p className="capitalize">Status: {job.status}</p>
            {job.jobType && <p>{JOB_TYPE_LABELS[job.jobType] || job.jobType}</p>}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold">Bill To</p>
            <p>{job.customerName}</p>
            {job.address && <p>{job.address}</p>}
            {job.phone && <p>{job.phone}</p>}
          </div>
          {job.technicianName && (
            <div className="text-right">
              <p className="font-semibold">Technician</p>
              <p>{job.technicianName}</p>
            </div>
          )}
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-3">{job.description || "HVAC service"}</td>
              <td className="py-3 text-right">{currency(job.price)}</td>
            </tr>
            {suppliesTotal > 0 && (
              <tr className="border-b border-border">
                <td className="py-3 text-muted-foreground">
                  Parts & materials ({suppliesTotal} item{suppliesTotal > 1 ? "s" : ""}):{" "}
                  {job.supplies.map((s) => `${s.qty}x ${s.item}`).join(", ")}
                </td>
                <td className="py-3 text-right text-muted-foreground">Included</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="py-3 text-right font-semibold">Total</td>
              <td className="py-3 text-right font-semibold">{currency(job.price)}</td>
            </tr>
            {totalPaid > 0 && (
              <>
                <tr>
                  <td className="py-1 text-right text-muted-foreground">Paid</td>
                  <td className="py-1 text-right text-muted-foreground">-{currency(totalPaid)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-right font-semibold">Balance Due</td>
                  <td className="py-1 text-right font-semibold">{currency(balanceDue)}</td>
                </tr>
              </>
            )}
          </tfoot>
        </table>

        {paymentsLog.length > 0 && (
          <div className="mt-4 border-t border-border pt-4 text-sm">
            <p className="mb-1 font-semibold">Payment History</p>
            <ul className="space-y-1 text-muted-foreground">
              {paymentsLog.map((p, idx) => (
                <li key={idx} className="flex justify-between">
                  <span className="capitalize">
                    {new Date(p.date).toLocaleDateString()} · {p.method}
                  </span>
                  <span>{currency(p.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {job.notes && (
          <div className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Notes</p>
            <p>{job.notes}</p>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">Thank you for your business.</p>
      </div>
    </div>
  );
}
