import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { currency, formatDate, STATUS_BADGE_VARIANT, STATUS_LABELS } from "@/lib/utils";

// Public, unauthenticated view. Access is controlled by knowing the long
// random token in the URL (the Firestore doc ID) — see README for the
// security tradeoffs of this approach vs. a proper backend-issued token.
export default function CustomerPortal() {
  const { token } = useParams();
  const [portal, setPortal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "portal", token));
      if (snap.exists()) {
        setPortal(snap.data());
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (notFound || !portal) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-muted-foreground">
        This link isn't valid. Please contact us for an updated link.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6">
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          <span className="font-semibold">FieldSta</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hi {portal.customerName}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Here's the latest on your service jobs with us. Last updated{" "}
              {portal.generatedAt?.toDate ? formatDate(portal.generatedAt) : ""}.
            </p>
          </CardContent>
        </Card>

        {(portal.jobs || []).length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            No jobs on file yet.
          </p>
        ) : (
          <div className="space-y-2">
            {portal.jobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{job.description || "HVAC service"}</p>
                    <Badge variant={STATUS_BADGE_VARIANT[job.status] || "secondary"}>
                      {STATUS_LABELS[job.status] || job.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDate(job.scheduledAt)}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span>{currency(job.price)}</span>
                  </div>
                  {job.balanceDue > 0 && (
                    <div className="flex justify-between text-sm font-medium text-destructive">
                      <span>Balance due</span>
                      <span>{currency(job.balanceDue)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <p className="pt-2 text-center text-xs text-muted-foreground">
          Questions about a job or invoice? Reply to your service confirmation or give us a call.
        </p>
      </div>
    </div>
  );
}
