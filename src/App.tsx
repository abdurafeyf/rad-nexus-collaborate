
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OrganizationRegister from "./pages/OrganizationRegister";
import RegistrationSuccess from "./pages/RegistrationSuccess";
import Login from "./pages/Login";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientDetail from "./pages/PatientDetail";
import PatientChat from "./pages/PatientChat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/register/organization" element={<OrganizationRegister />} />
          <Route path="/register/success" element={<RegistrationSuccess />} />
          <Route path="/login/:userType" element={<Login />} />
          
          {/* Doctor routes */}
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
          <Route path="/doctor/patients/:patientId" element={<PatientDetail />} />
          <Route path="/doctor/patients/:patientId/chat" element={<PatientChat />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
