
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OrganizationRegister from "./pages/OrganizationRegister";
import RegistrationSuccess from "./pages/RegistrationSuccess";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientDetail from "./pages/PatientDetail";
import PatientChat from "./pages/PatientChat";
import ScanUpload from "./pages/ScanUpload";
import ReportReview from "./pages/ReportReview";
import PatientPortal from "./pages/PatientPortal";
import PatientReport from "./pages/PatientReport";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register/organization" element={<OrganizationRegister />} />
            <Route path="/register/success" element={<RegistrationSuccess />} />
            <Route path="/login/:userType" element={<Login />} />
            <Route path="/register/:userType" element={<Register />} />
            
            {/* Doctor routes */}
            <Route path="/doctor/dashboard" element={
              <ProtectedRoute userType="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/doctor" element={
              <ProtectedRoute userType="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/doctor/patients/:patientId" element={
              <ProtectedRoute userType="doctor">
                <PatientDetail />
              </ProtectedRoute>
            } />
            <Route path="/doctor/patients/:patientId/chat" element={
              <ProtectedRoute userType="doctor">
                <PatientChat />
              </ProtectedRoute>
            } />
            <Route path="/doctor/patients/:patientId/scan/upload" element={
              <ProtectedRoute userType="doctor">
                <ScanUpload />
              </ProtectedRoute>
            } />
            <Route path="/doctor/reports/:reportId/review" element={
              <ProtectedRoute userType="doctor">
                <ReportReview />
              </ProtectedRoute>
            } />
            
            {/* Patient routes */}
            <Route path="/patient/portal" element={
              <ProtectedRoute userType="patient">
                <PatientPortal />
              </ProtectedRoute>
            } />
            <Route path="/patient/reports/:reportId" element={
              <ProtectedRoute userType="patient">
                <PatientReport />
              </ProtectedRoute>
            } />
            
            <Route path="/features" element={<Index />} />
            <Route path="/pricing" element={<Index />} />
            <Route path="/about" element={<Index />} />
            <Route path="/contact" element={<Index />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
