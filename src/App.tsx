
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Main Pages
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import OrganizationRegister from "@/pages/OrganizationRegister";
import RegistrationSuccess from "@/pages/RegistrationSuccess";

// Doctor Pages
import DoctorDashboard from "@/pages/DoctorDashboard";
import PatientDetail from "@/pages/PatientDetail";
import AddPatientPage from "@/pages/AddPatientPage";
import ReportReview from "@/pages/ReportReview";
import MessagesPage from "@/pages/MessagesPage";
import DoctorAiChat from "@/pages/DoctorAiChat";

// Patient Pages
import PatientPortal from "@/pages/PatientPortal";
import PatientReport from "@/pages/PatientReport";
import ScanUpload from "@/pages/ScanUpload";
import PatientChatPage from "@/pages/PatientChatPage";
import PatientAiChat from "@/pages/PatientAiChat";
import PatientConversationsPage from "@/pages/PatientConversationsPage";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./App.css";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen w-full">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login/:type" element={<Login />} />
            <Route path="/register/:type" element={<Register />} />
            <Route path="/organization-register" element={<OrganizationRegister />} />
            <Route path="/registration-success" element={<RegistrationSuccess />} />

            {/* Doctor Routes */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute userType="doctor">
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patients/:patientId"
              element={
                <ProtectedRoute userType="doctor">
                  <PatientDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/add-patient"
              element={
                <ProtectedRoute userType="doctor">
                  <AddPatientPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/reports/:reportId"
              element={
                <ProtectedRoute userType="doctor">
                  <ReportReview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/messages"
              element={
                <ProtectedRoute userType="doctor">
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patients/:patientId/chat"
              element={
                <ProtectedRoute userType="doctor">
                  <PatientChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/ai-chat"
              element={
                <ProtectedRoute userType="doctor">
                  <DoctorAiChat />
                </ProtectedRoute>
              }
            />

            {/* Patient Routes */}
            <Route
              path="/patient"
              element={
                <ProtectedRoute userType="patient">
                  <PatientPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/reports/:reportId"
              element={
                <ProtectedRoute userType="patient">
                  <PatientReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/upload"
              element={
                <ProtectedRoute userType="patient">
                  <ScanUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/conversations"
              element={
                <ProtectedRoute userType="patient">
                  <PatientConversationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/chat/:doctorId"
              element={
                <ProtectedRoute userType="patient">
                  <PatientChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/chat"
              element={
                <ProtectedRoute userType="patient">
                  <PatientConversationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/ai-chat"
              element={
                <ProtectedRoute userType="patient">
                  <PatientAiChat />
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster richColors />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
