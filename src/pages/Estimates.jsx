import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { currency, formatDate } from "@/lib/utils";

const statusVariant = {
  draft: "secondary",
  sent: "warning",
  accepted: "success",
  declined: "destructive",
};

export default function Estimates() {
  const { companyId } = useAuth();
  const { t } = useLanguage();
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

  async function handleDelete(e, estimateId) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(t("estimates.confirmDelete") || "Delete this estimate? This cannot be undone.")) return;
    setDeletingId(estimateId);
    try {
      await deleteDoc(doc(db, "estimates", estimateId));
    } finally {
      setDeletingId("");
    }
  }

  useEffect(() => {
    if (!companyId) {
      setEstimates([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "estimates"),
      where("companyId", "==", companyId),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setEstimates(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [companyId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{t("estimates.title")}</h1>
        <Link to="/estimates/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" /> {t("estimates.newEstimate")}
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("estimates.loading")}</p>
      ) : estimates.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          {t("estimates.none")}
        </p>
      ) : (
        <div className="space-y-2">
          {estimates.map((est) => {
            return (
              <Link key={est.id} to={`/estimates/${est.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{est.customerName}</p>
                        <Badge variant={statusVariant[est.status] || "secondary"}>{t(`estimates.status${est.status.charAt(0).toUpperCase()}${est.status.slice(1)}`)}</Badge>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {est.tiers?.good?.total != null &&
                          `${t("estimates.good")} ${currency(est.tiers.good.total)} · ${t("estimates.better")} ${currency(
                            est.tiers.better?.total
                          )} · ${t("estimates.best")} ${currency(est.tiers.best?.total)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(est.createdAt)}</p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => handleDelete(e, est.id)}
                      disabled={deletingId === est.id}
                      aria-label={t("common.delete") || "Delete"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
