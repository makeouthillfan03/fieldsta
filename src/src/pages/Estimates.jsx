import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { currency, formatDate } from "@/lib/utils";

const statusVariant = {
  draft: "secondary",
  sent: "warning",
  accepted: "success",
  declined: "destructive",
};

export default function Estimates() {
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "estimates"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setEstimates(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Estimates</h1>
        <Link to="/estimates/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" /> New Estimate
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading estimates...</p>
      ) : estimates.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          No estimates yet
        </p>
      ) : (
        <div className="space-y-2">
          {estimates.map((est) => {
            const selected = est.tiers?.[est.selectedTier || "better"];
            return (
              <Link key={est.id} to={`/estimates/${est.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{est.customerName}</p>
                        <Badge variant={statusVariant[est.status] || "secondary"}>{est.status}</Badge>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {est.tiers?.good?.total != null &&
                          `Good ${currency(est.tiers.good.total)} · Better ${currency(
                            est.tiers.better?.total
                          )} · Best ${currency(est.tiers.best?.total)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(est.createdAt)}</p>
                    </div>
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
