
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Routes, Route, Navigate } from "react-router-dom";
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
import MessagesPage from "./pages/MessagesPage";
import AddPatientPage from "./pages/AddPatientPage";
import PatientChatPage from "./pages/PatientChatPage";
import PatientAiChat from "./pages/PatientAiChat";
import DoctorAiChat from "./pages/DoctorAiChat";
import AppointmentsPage from "./pages/AppointmentsPage";

const App = () => (
  <>
    <Toaster />
    <Sonner />
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
      <Route path="/doctor/add-patient" element={
        <ProtectedRoute userType="doctor">
          <AddPatientPage />
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
      <Route path="/doctor/messages" element={
        <ProtectedRoute userType="doctor">
          <MessagesPage />
        </ProtectedRoute>
      } />
      <Route path="/doctor/ai-assistant" element={
        <ProtectedRoute userType="doctor">
          <DoctorAiChat />
        </ProtectedRoute>
      } />
      <Route path="/doctor/appointments" element={
        <ProtectedRoute userType="doctor">
          <AppointmentsPage />
        </ProtectedRoute>
      } />
      
      {/* Patient routes */}
      <Route path="/patient/dashboard" element={
        <ProtectedRoute userType="patient">
          <Navigate to="/patient/portal" replace />
        </ProtectedRoute>
      } />
      <Route path="/patient/portal" element={
        <ProtectedRoute userType="patient">
          <PatientPortal />
        </ProtectedRoute>
      } />
      <Route path="/patient/chat" element={
        <ProtectedRoute userType="patient">
          <PatientChatPage />
        </ProtectedRoute>
      } />
      <Route path="/patient/reports/:reportId" element={
        <ProtectedRoute userType="patient">
          <PatientReport />
        </ProtectedRoute>
      } />
      <Route path="/patient/messages" element={
        <ProtectedRoute userType="patient">
          <MessagesPage />
        </ProtectedRoute>
      } />
      <Route path="/patient/support" element={
        <ProtectedRoute userType="patient">
          <PatientChatPage />
        </ProtectedRoute>
      } />
      <Route path="/patient/ai-assistant" element={
        <ProtectedRoute userType="patient">
          <PatientAiChat />
        </ProtectedRoute>
      } />
      <Route path="/patient/appointments" element={
        <ProtectedRoute userType="patient">
          <AppointmentsPage />
        </ProtectedRoute>
      } />
      
      <Route path="/features" element={<Index />} />
      <Route path="/pricing" element={<Index />} />
      <Route path="/about" element={<Index />} />
      <Route path="/contact" element={<Index />} />
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

export default App;
