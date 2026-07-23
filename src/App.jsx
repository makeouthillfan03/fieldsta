import { Routes, Route, Navigate, Outlet } from "react-router-dom";
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
import EstimatePortal from "@/pages/EstimatePortal";
import BookingRequest from "@/pages/BookingRequest";
import BookingRequests from "@/pages/BookingRequests";
import CompanySetup from "@/pages/CompanySetup";
import Team from "@/pages/Team";
import MaintenanceAgreements from "@/pages/MaintenanceAgreements";
import Assistant from "@/pages/Assistant";
import Billing from "@/pages/Billing";
import Welcome from "@/pages/Welcome";
import GrowthDashboard from "@/pages/GrowthDashboard";
import FindAPro from "@/pages/FindAPro";
import MarketplaceAdmin from "@/pages/MarketplaceAdmin";

function PrivateRoute({ children }) {
  const { user, loading, companyLoading, needsCompany } = useAuth();
  if (loading || (user && companyLoading)) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }
  if (!user) return <Navigate to="/welcome" replace />;
  if (needsCompany) return <Navigate to="/setup-company" replace />;
  return children;
}

function RequireAuthOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

// Blocks access to the working app once a company's trial has expired and
// it isn't comped or actively subscribed — redirects to /billing instead.
// /billing itself lives outside this gate so a blocked company can still
// reach it to subscribe.
function RequirePlan() {
  const { planLoading, planActive } = useAuth();
  if (planLoading) return null;
  if (!planActive) return <Navigate to="/billing" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/portal/:token" element={<CustomerPortal />} />
      <Route path="/estimate/:estimateId" element={<EstimatePortal />} />
      <Route path="/book/:companyId" element={<BookingRequest />} />
      <Route path="/find-a-pro" element={<FindAPro />} />
      <Route
        path="/setup-company"
        element={
          <RequireAuthOnly>
            <CompanySetup />
          </RequireAuthOnly>
        }
      />

      <Route
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="/billing" element={<Billing />} />
        <Route path="/growth" element={<GrowthDashboard />} />
        <Route path="/marketplace-admin" element={<MarketplaceAdmin />} />

        <Route element={<RequirePlan />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs/new" element={<AddJob />} />
          <Route path="/jobs/:jobId" element={<JobDetail />} />
          <Route path="/jobs/:jobId/invoice" element={<InvoicePreview />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:customerId" element={<CustomerDetail />} />
          <Route path="/my-route" element={<MyRoute />} />
          <Route path="/estimates" element={<Estimates />} />
          <Route path="/estimates/:estimateId" element={<EstimateDetail />} />
          <Route path="/agreements" element={<MaintenanceAgreements />} />
          <Route path="/assistant" element={<Assistant />} />
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
          <Route
            path="/team"
            element={
              <AdminRoute>
                <Team />
              </AdminRoute>
            }
          />
          <Route
            path="/booking-requests"
            element={
              <AdminRoute>
                <BookingRequests />
              </AdminRoute>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
