import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Wrench, Calendar, MapPin, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { loginWithGoogle } from "@/lib/firebase";

export default function Login() {
  const { user, loading } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [error, setError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const features = [
    { icon: Calendar, text: t("login.feature1") },
    { icon: MapPin, text: t("login.feature2") },
    { icon: FileText, text: t("login.feature3") },
  ];

  async function handleLogin() {
    setError("");
    setSigningIn(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || "Sign-in failed. Try again.");
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="relative overflow-hidden bg-primary px-6 pb-8 pt-8 text-primary-foreground sm:pb-10 sm:pt-10">
        <button
          type="button"
          onClick={() => setLang(lang === "en" ? "es" : "en")}
          className="absolute right-4 top-4 z-10 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold"
          aria-label="Switch language"
        >
          {t("lang.toggle")}
        </button>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 sm:h-56 sm:w-56"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-white/10"
        />
        <div className="relative mx-auto flex max-w-sm flex-col items-center text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Wrench className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold sm:text-2xl">{t("login.title")}</h1>
          <p className="mt-1 text-xs text-primary-foreground/80 sm:text-sm">{t("login.tagline")}</p>
        </div>
      </div>

      <div className="mx-auto -mt-4 flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-16 pt-4">
        <Card className="border border-border bg-background shadow-xl">
          <CardContent className="space-y-6 p-8">
            <Button className="w-full" size="lg" onClick={handleLogin} disabled={signingIn}>
              {signingIn ? t("login.signingIn") : t("login.signIn")}
            </Button>
            {error && <p className="text-center text-sm text-destructive">{error}</p>}

            <ul className="space-y-4 border-t border-border pt-6">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5" /> {t("login.footer")}
        </p>
      </div>
    </div>
  );
}
