import { Link, Navigate } from "react-router-dom";
import { Calendar, MapPin, FileText, ShieldCheck, Globe, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

// Public marketing page — reachable without signing in. This is the
// "home / about us / welcome" surface that stays outside the paywall;
// everything past the "Get started" button requires login and (once
// a trial ends) an active plan. Kept as one page for now rather than
// separate /about, /pricing routes — can be split out later if it grows.
export default function Welcome() {
  const { user, loading } = useAuth();
  const { lang, setLang, t } = useLanguage();

  if (!loading && user) return <Navigate to="/" replace />;

  const features = [
    { icon: Calendar, text: t("login.feature1") },
    { icon: MapPin, text: t("login.feature2") },
    { icon: FileText, text: t("login.feature3") },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <img src="/mascot.png" alt="" className="h-8 w-8" />
          <span className="font-semibold">Fieldsta</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "es" : "en")}
            className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent"
            aria-label="Switch language"
          >
            {t("lang.toggle")}
          </button>
          <Link to="/login">
            <Button size="sm" variant="outline">
              {t("welcome.signIn") || "Sign in"}
            </Button>
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-primary px-6 py-16 text-primary-foreground sm:py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 sm:h-72 sm:w-72"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/10"
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <img
            src="/mascot.png"
            alt="Fieldsta mascot"
            className="mx-auto mb-2 h-32 w-32 sm:h-40 sm:w-40"
          />
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {t("welcome.heroTitle") || "Run your HVAC business from your phone"}
          </h1>
          <p className="mt-3 text-primary-foreground/85 sm:text-lg">
            {t("welcome.heroSubtitle") ||
              "Jobs, customers, estimates, dispatch, and payments — built for HVAC contractors, not generic field service."}
          </p>
          <Link to="/login">
            <Button size="lg" className="mt-6 bg-white text-primary hover:bg-white/90">
              {t("welcome.getStarted") || "Get started"}
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-6 py-14">
        <ul className="grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 rounded-md border border-border p-4 text-sm">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="about" className="bg-muted/40 px-6 py-14">
        <div className="mx-auto max-w-2xl space-y-4">
          <h2 className="text-xl font-semibold">{t("welcome.aboutTitle") || "About Fieldsta"}</h2>
          <p className="text-sm text-muted-foreground">
            {t("welcome.aboutBody") ||
              "Fieldsta was built for HVAC contractors — with equipment tonnage/BTU tracking, EPA 608 refrigerant recordkeeping, technician EPA/NATE certifications, and maintenance agreements built in from day one, not bolted on. It's bilingual (English/Spanish) throughout, so your whole crew can use it comfortably."}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-md border border-border bg-background p-4 text-sm">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{t("welcome.aboutPoint1") || "EPA 608 refrigerant logs, kept for you automatically"}</span>
            </div>
            <div className="flex items-start gap-3 rounded-md border border-border bg-background p-4 text-sm">
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{t("welcome.aboutPoint2") || "Full English & Spanish support, not just menus"}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-2xl px-6 py-14">
        <h2 className="text-xl font-semibold">{t("welcome.pricingTitle") || "Simple pricing"}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="space-y-2 p-5">
              <p className="text-sm font-medium text-muted-foreground">
                {t("billing.basePlan") || "Base plan"}
              </p>
              <p className="text-3xl font-semibold">
                $49<span className="text-base font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {t("billing.basePlanDesc") || "Owner + 1 teammate included"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 p-5">
              <p className="text-sm font-medium text-muted-foreground">
                {t("billing.seatPlan") || "Additional teammates"}
              </p>
              <p className="text-3xl font-semibold">
                +$15<span className="text-base font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {t("billing.seatPlanDesc") || "Per teammate beyond the first 2"}
              </p>
            </CardContent>
          </Card>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5" /> {t("welcome.trialNote") || "Every account starts with a 3-day free trial."}
        </p>
      </section>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        Fieldsta — {new Date().getFullYear()}
      </footer>
    </div>
  );
}
