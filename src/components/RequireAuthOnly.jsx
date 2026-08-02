import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// The owner-only growth stats page only needs "is this a signed-in Google
// account," full stop -- the real access control happens server-side in the
// Cloud Functions themselves (locked to one email, see functions/index.js).
//
// Pulled out of App.jsx so App.jsx itself never has a static top-level
// import of AuthContext (and therefore Firebase) -- App.jsx is the entry
// point every visitor's bundle includes, and the live product (DemoLanding,
// the chat widget) has nothing to do with Firebase auth at all. This file
// is only ever reached via a lazy import from the /growth route.
export default function RequireAuthOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
