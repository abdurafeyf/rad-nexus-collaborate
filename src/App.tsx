
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
        <Router>
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
                <ProtectedRoute allowedUserTypes={["doctor"]}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patients/:patientId"
              element={
                <ProtectedRoute allowedUserTypes={["doctor"]}>
                  <PatientDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/add-patient"
              element={
                <ProtectedRoute allowedUserTypes={["doctor"]}>
                  <AddPatientPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/reports/:reportId"
              element={
                <ProtectedRoute allowedUserTypes={["doctor"]}>
                  <ReportReview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/messages"
              element={
                <ProtectedRoute allowedUserTypes={["doctor"]}>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patients/:patientId/chat"
              element={
                <ProtectedRoute allowedUserTypes={["doctor"]}>
                  <PatientChat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/ai-chat"
              element={
                <ProtectedRoute allowedUserTypes={["doctor"]}>
                  <DoctorAiChat />
                </ProtectedRoute>
              }
            />

            {/* Patient Routes */}
            <Route
              path="/patient"
              element={
                <ProtectedRoute allowedUserTypes={["patient"]}>
                  <PatientPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/reports/:reportId"
              element={
                <ProtectedRoute allowedUserTypes={["patient"]}>
                  <PatientReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/upload"
              element={
                <ProtectedRoute allowedUserTypes={["patient"]}>
                  <ScanUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/conversations"
              element={
                <ProtectedRoute allowedUserTypes={["patient"]}>
                  <PatientConversationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/chat/:doctorId"
              element={
                <ProtectedRoute allowedUserTypes={["patient"]}>
                  <PatientChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/chat"
              element={
                <ProtectedRoute allowedUserTypes={["patient"]}>
                  <PatientConversationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/ai-chat"
              element={
                <ProtectedRoute allowedUserTypes={["patient"]}>
                  <PatientAiChat />
                </ProtectedRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
