
import React from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import CTACard from "@/components/CTACard";
import FeatureCard from "@/components/FeatureCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

// Import Lucide icons
import { 
  Hospital, 
  User, 
  UserCheck, 
  Brain, 
  MessageSquare, 
  Database, 
  Shield,
  Zap,
  FileText,
  Users
} from "lucide-react";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <NavBar />
      <main className="flex-grow">
        {/* Hero Section */}
        <HeroSection
          title="Advanced Radiology For Better Patient Care"
          subtitle="A secure platform connecting healthcare professionals and patients for seamless collaboration and enhanced outcomes."
        >
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link to="/features">
              <Button variant="outline" size="lg" className="border-brand-400 text-brand-700 hover:bg-brand-100 hover:text-brand-800">
                Explore Features
              </Button>
            </Link>
            <Link to="/register/organization">
              <Button size="lg" className="bg-brand-600 hover:bg-brand-700">Get Started</Button>
            </Link>
          </div>
          
          {/* Modern illustration */}
          <div className="relative mt-16 overflow-hidden rounded-xl border border-brand-100 bg-white p-8 shadow-lg">
            <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-tr from-brand-50 to-brand-100 opacity-70"></div>
            <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-br from-brand-50 to-brand-100 opacity-70"></div>
            
            <div className="relative mx-auto max-w-4xl">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="col-span-2 overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-sm">
                  <div className="mb-4 h-4 w-full rounded bg-gray-200"></div>
                  <div className="mb-2 h-3 w-3/4 rounded bg-gray-200"></div>
                  <div className="mb-4 h-3 w-1/2 rounded bg-gray-200"></div>
                  
                  <div className="flex gap-4">
                    <div className="h-32 w-32 rounded-lg bg-brand-100"></div>
                    <div className="h-32 w-32 rounded-lg bg-brand-100"></div>
                    <div className="h-32 w-32 rounded-lg bg-brand-100"></div>
                  </div>
                  
                  <div className="mt-4 h-24 rounded bg-white p-3">
                    <div className="mb-2 h-3 w-3/4 rounded bg-gray-200"></div>
                    <div className="h-3 w-1/2 rounded bg-gray-200"></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="mb-2 h-5 w-full rounded bg-brand-100"></div>
                    <div className="h-3 w-3/4 rounded bg-gray-200"></div>
                    <div className="mt-2 h-3 w-1/2 rounded bg-gray-200"></div>
                  </div>
                  
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="mb-2 h-5 w-full rounded bg-brand-100"></div>
                    <div className="h-3 w-3/4 rounded bg-gray-200"></div>
                    <div className="mt-2 h-3 w-1/2 rounded bg-gray-200"></div>
                  </div>
                  
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="mb-2 h-5 w-full rounded bg-brand-100"></div>
                    <div className="h-3 w-3/4 rounded bg-gray-200"></div>
                    <div className="mt-2 h-3 w-1/2 rounded bg-gray-200"></div>
                  </div>
                </div>
              </div>
              
              {/* Animated elements */}
              <div className="absolute bottom-12 left-32 h-12 w-12 animate-float rounded-full bg-brand-200/30"></div>
              <div className="absolute right-24 top-16 h-8 w-8 animate-float rounded-full bg-brand-300/20" style={{ animationDelay: '2s' }}></div>
            </div>
          </div>
        </HeroSection>

        {/* User Type CTAs */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
              Choose Your Path
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-center text-gray-600">
              RaDixpert provides specialized tools for healthcare organizations, doctors, and patients.
            </p>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <CTACard
                title="Healthcare Organizations"
                description="Register your institute to provide a collaborative platform for your radiologists and patients."
                buttonText="Register Your Institute"
                linkTo="/register/organization"
                icon={<Hospital className="h-6 w-6 text-brand-600" />}
                className="transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              />

              <CTACard
                title="Doctors"
                description="Access and collaborate on radiology reports, communicate with colleagues and patients."
                buttonText="Doctor Login"
                linkTo="/login/doctor"
                icon={<User className="h-6 w-6 text-brand-600" />}
                className="transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              />

              <CTACard
                title="Patients"
                description="View your radiology results, communicate with your healthcare providers, and access your records."
                buttonText="Patient Login"
                linkTo="/login/patient"
                icon={<UserCheck className="h-6 w-6 text-brand-600" />}
                className="transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-3xl font-bold text-gray-900">
                Key Features
              </h2>
              <div className="mx-auto h-1 w-20 rounded bg-brand-500 mb-4"></div>
              <p className="mx-auto max-w-2xl text-gray-600">
                Our platform provides powerful tools to enhance radiology collaboration and patient care.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Brain className="h-6 w-6 text-brand-600" />}
                title="AI-Powered Analysis"
                description="Advanced AI algorithms assist radiologists in detecting anomalies and making accurate diagnoses."
              />
              <FeatureCard
                icon={<MessageSquare className="h-6 w-6 text-brand-600" />}
                title="Seamless Communication"
                description="Secure chat and collaboration tools for healthcare teams to discuss cases in real-time."
              />
              <FeatureCard
                icon={<Database className="h-6 w-6 text-brand-600" />}
                title="Centralized Records"
                description="Store and access all radiology images and reports in one secure, HIPAA-compliant platform."
              />
              <FeatureCard
                icon={<Shield className="h-6 w-6 text-brand-600" />}
                title="Enterprise Security"
                description="State-of-the-art security protocols to protect sensitive healthcare data and maintain compliance."
              />
              <FeatureCard
                icon={<Users className="h-6 w-6 text-brand-600" />}
                title="Multi-Institute Support"
                description="Connect multiple healthcare facilities for seamless collaboration across organizations."
              />
              <FeatureCard
                icon={<FileText className="h-6 w-6 text-brand-600" />}
                title="Patient Portal"
                description="Empower patients with access to their records and direct communication with their care team."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-brand-600 to-brand-800 text-white">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold">
                Ready to Transform Your Radiology Workflow?
              </h2>
              <p className="mb-8 text-lg opacity-90">
                Join healthcare organizations across the country that are improving patient outcomes with RaDixpert.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/register/organization">
                  <Button size="lg" variant="secondary" className="bg-white text-brand-700 hover:bg-gray-100">
                    <Zap className="mr-2 h-5 w-5" />
                    Get Started
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
