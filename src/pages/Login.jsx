import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { loginWithGoogle, getRedirectRoundtripError } from "@/lib/firebase";

// Distinct gradient variant from FindAPro's (same blue family, different
// blob placement/sizing) so pages don't all read as one copy-pasted
// background — see chat "make every page different." This one sits
// centered behind a single sign-in card instead of a top-down hero.
function LoginGradientBackground() {
  return (
    <>
      <style>{`
        .login-bg {
          position: fixed;
          inset: 0;
          z-index: -1;
          overflow: hidden;
          background: #ffffff;
        }
        .login-bg::before,
        .login-bg::after {
          content: "";
          position: absolute;
          border-radius: 9999px;
          filter: blur(80px);
          opacity: 0.55;
        }
        .login-bg::before {
          top: 15%;
          left: 50%;
          transform: translateX(-50%);
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, #a9c9ec, #dcebf9 65%, transparent 78%);
        }
        .login-bg::after {
          bottom: -20%;
          right: -15%;
          width: 45vw;
          height: 45vw;
          background: radial-gradient(circle, #cfe1f5, #f2f8fd 60%, transparent 75%);
        }
      `}</style>
      <div className="login-bg" aria-hidden="true" />
    </>
  );
}

export default function Login() {
  const { user, loading } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [error, setError] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [searchParams] = useSearchParams();

  // Same referral-link stash as Welcome.jsx, in case someone lands here
  // directly with ?ref= instead of going through /welcome first.
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) localStorage.setItem("fieldsta_ref", ref);
  }, [searchParams]);

  // Sign-in uses a full-page redirect (not a popup, which browsers block
  // often enough to be unreliable). That means the actual result of the
  // Google sign-in comes back on the *next* page load, not from a promise
  // right after clicking the button — so we check for it once here.
  useEffect(() => {
    getRedirectRoundtripError().then((result) => {
      if (result instanceof Error && result.code !== "auth/no-auth-event") {
        setError(result.message || "Sign-in failed. Try again.");
      }
    });
  }, []);

  if (!loading && user) return <Navigate to="/" replace />;

  async function handleLogin() {
    setError("");
    setSigningIn(true);
    try {
      // This navigates the browser away to Google's sign-in page — it
      // doesn't resolve here. AuthContext's onAuthStateChanged picks up
      // the signed-in user automatically once Google redirects back.
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || "Sign-in failed. Try again.");
      setSigningIn(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <LoginGradientBackground />
      <button
        type="button"
        onClick={() => setLang(lang === "en" ? "es" : "en")}
        className="absolute right-4 top-4 rounded-full border border-border bg-white/70 px-3 py-1 text-xs font-semibold text-muted-foreground backdrop-blur-sm"
        aria-label="Switch language"
      >
        {t("lang.toggle")}
      </button>

      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Account sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            For Find a Pro's admin tools — homeowners and contractors don't need an account.
          </p>
        </div>

        <Card className="border-border/60 bg-white/85 shadow-xl backdrop-blur-sm">
          <CardContent className="space-y-4 p-8">
            <Button className="w-full" size="lg" onClick={handleLogin} disabled={signingIn}>
              {signingIn ? "Signing in…" : "Sign in with Google"}
            </Button>
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
