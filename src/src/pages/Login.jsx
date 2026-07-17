import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { loginWithGoogle } from "@/lib/firebase";

export default function Login() {
  const { user, loading } = useAuth();
  const [error, setError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

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
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">FieldSta</CardTitle>
          <CardDescription>Dispatch and job management for HVAC contractors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={handleLogin} disabled={signingIn}>
            {signingIn ? "Signing in..." : "Sign in with Google"}
          </Button>
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
