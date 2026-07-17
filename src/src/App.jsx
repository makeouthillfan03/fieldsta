import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AddJob from "@/pages/AddJob";
import CustomerList from "@/pages/CustomerList";
import CustomerDetail from "@/pages/CustomerDetail";
import JobDetail from "@/pages/JobDetail";
import DispatchBoard from "@/pages/DispatchBoard";
import Technicians from "@/pages/Technicians";
import StoreOrders from "@/pages/StoreOrders";
import InvoicePreview from "@/pages/InvoicePreview";
import PriceBook from "@/pages/PriceBook";
import Estimates from "@/pages/Estimates";
import EstimateDetail from "@/pages/EstimateDetail";
import MyRoute from "@/pages/MyRoute";
import Reports from "@/pages/Reports";
import CustomerPortal from "@/pages/CustomerPortal";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/portal/:token" element={<CustomerPortal />} />

      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/jobs/new" element={<AddJob />} />
        <Route path="/jobs/:jobId" element={<JobDetail />} />
        <Route path="/jobs/:jobId/invoice" element={<InvoicePreview />} />
        <Route path="/customers" element={<CustomerList />} />
        <Route path="/customers/:customerId" element={<CustomerDetail />} />
        <Route path="/my-route" element={<MyRoute />} />
        <Route path="/estimates" element={<Estimates />} />
        <Route path="/estimates/:estimateId" element={<EstimateDetail />} />
        <Route
          path="/dispatch"
          element={
            <AdminRoute>
              <DispatchBoard />
            </AdminRoute>
          }
        />
        <Route
          path="/technicians"
          element={
            <AdminRoute>
              <Technicians />
            </AdminRoute>
          }
        />
        <Route
          path="/store-orders"
          element={
            <AdminRoute>
              <StoreOrders />
            </AdminRoute>
          }
        />
        <Route
          path="/price-book"
          element={
            <AdminRoute>
              <PriceBook />
            </AdminRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <AdminRoute>
              <Reports />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
