import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { currency, formatDate, STATUS_BADGE_VARIANT } from "@/lib/utils";

// Public, unauthenticated view. Access is controlled by knowing the long
// random token in the URL (the Firestore doc ID) — see README for the
// security tradeoffs of this approach vs. a proper backend-issued token.
export default function CustomerPortal() {
  const { token } = useParams();
  const { t } = useLanguage();
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
        {t("portal.loading")}
      </div>
    );
  }

  if (notFound || !portal) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-muted-foreground">
        {t("portal.invalidLink")}
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

        <Card>
          <CardHeader>
            <CardTitle>{t("portal.greeting", { name: portal.customerName })}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t("portal.subtitle", {
                date: portal.generatedAt?.toDate ? formatDate(portal.generatedAt) : "",
              })}
            </p>
          </CardContent>
        </Card>

        {(portal.jobs || []).length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            {t("portal.none")}
          </p>
        ) : (
          <div className="space-y-2">
            {portal.jobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{job.description || t("invoice.hvacService")}</p>
                    <Badge variant={STATUS_BADGE_VARIANT[job.status] || "secondary"}>
                      {t(`status.${job.status}`)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDate(job.scheduledAt)}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("portal.total")}</span>
                    <span>{currency(job.price)}</span>
                  </div>
                  {job.balanceDue > 0 && (
                    <div className="flex justify-between text-sm font-medium text-destructive">
                      <span>{t("jobDetail.balanceDue")}</span>
                      <span>{currency(job.balanceDue)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <p className="pt-2 text-center text-xs text-muted-foreground">
          {t("portal.footer")}
        </p>
      </div>
    </div>
  );
}
