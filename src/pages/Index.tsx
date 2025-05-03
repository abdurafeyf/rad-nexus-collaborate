
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NewNavBar from "@/components/NewNavBar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import { Card, CardContent } from "@/components/ui/card";
import { Hospital, User, UserCheck, Brain, MessageSquare, Shield, FileText, Users } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <NewNavBar />
      
      {/* Hero Section */}
      <HeroSection
        title="Advanced Radiology For Better Patient Care"
        subtitle="A secure platform connecting healthcare professionals and patients for seamless collaboration and enhanced outcomes."
        overlayColor="gradient"
      >
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/register/organization">
            <Button 
              size="lg" 
              className="bg-white text-teal-600 hover:bg-white/90 hover:text-teal-700 btn-hover rounded-full"
            >
              Register Institute
            </Button>
          </Link>
          <Link to="/features">
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white/70 text-white hover:bg-white/10 hover:border-white btn-hover rounded-full"
            >
              Explore Features
            </Button>
          </Link>
        </div>
        
        {/* Modern illustration */}
        <div className="relative mt-16 mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 shadow-subtle-lg">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="col-span-2 overflow-hidden rounded-xl bg-white/20 p-6 backdrop-blur-sm">
              <div className="mb-4 h-4 w-full rounded-full bg-white/30 animate-pulse-slow"></div>
              <div className="mb-2 h-3 w-3/4 rounded-full bg-white/30 animate-pulse-slow"></div>
              <div className="mb-4 h-3 w-1/2 rounded-full bg-white/30 animate-pulse-slow"></div>
              
              <div className="flex gap-4">
                <div className="h-32 w-32 rounded-lg bg-white/30"></div>
                <div className="h-32 w-32 rounded-lg bg-white/30"></div>
                <div className="h-32 w-32 rounded-lg bg-white/30"></div>
              </div>
              
              <div className="mt-4 h-24 rounded-lg bg-white/30 p-3">
                <div className="mb-2 h-3 w-3/4 rounded-full bg-white/40"></div>
                <div className="h-3 w-1/2 rounded-full bg-white/40"></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="rounded-xl bg-white/20 p-4 backdrop-blur-sm">
                <div className="mb-2 h-5 w-full rounded-full bg-white/30"></div>
                <div className="h-3 w-3/4 rounded-full bg-white/30"></div>
                <div className="mt-2 h-3 w-1/2 rounded-full bg-white/30"></div>
              </div>
              
              <div className="rounded-xl bg-white/20 p-4 backdrop-blur-sm">
                <div className="mb-2 h-5 w-full rounded-full bg-white/30"></div>
                <div className="h-3 w-3/4 rounded-full bg-white/30"></div>
                <div className="mt-2 h-3 w-1/2 rounded-full bg-white/30"></div>
              </div>
              
              <div className="rounded-xl bg-white/20 p-4 backdrop-blur-sm">
                <div className="mb-2 h-5 w-full rounded-full bg-white/30"></div>
                <div className="h-3 w-3/4 rounded-full bg-white/30"></div>
                <div className="mt-2 h-3 w-1/2 rounded-full bg-white/30"></div>
              </div>
            </div>
          </div>
          
          {/* Animated elements */}
          <div className="absolute bottom-12 left-32 h-12 w-12 animate-float rounded-full bg-white/10"></div>
          <div className="absolute right-24 top-16 h-8 w-8 animate-float rounded-full bg-white/10" style={{ animationDelay: '2s' }}></div>
        </div>
      </HeroSection>

      {/* User Type CTAs Section */}
      <section className="section-alt">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900 md:text-4xl">
            Choose Your Path
          </h2>
          <div className="mx-auto h-1 w-20 rounded bg-teal-500 mb-6"></div>
          <p className="mx-auto mb-12 max-w-2xl text-center text-gray-600">
            RaDixpert provides specialized tools for healthcare organizations, doctors, and patients.
          </p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="overflow-hidden border-0 shadow-subtle hover-card">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2"></div>
              <CardContent className="p-8">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-teal-100">
                  <Hospital className="h-7 w-7 text-teal-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Healthcare Organizations</h3>
                <p className="mb-6 text-gray-600">
                  Register your institute to provide a collaborative platform for your radiologists and patients.
                </p>
                <Link to="/register/organization">
                  <Button 
                    className="w-full bg-teal-500 hover:bg-teal-600 btn-hover rounded-full"
                  >
                    Register Your Institute
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 shadow-subtle hover-card">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2"></div>
              <CardContent className="p-8">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Doctors</h3>
                <p className="mb-6 text-gray-600">
                  Access and collaborate on radiology reports, communicate with colleagues and patients.
                </p>
                <Link to="/login/doctor">
                  <Button 
                    className="w-full bg-blue-500 hover:bg-blue-600 btn-hover rounded-full"
                  >
                    Doctor Login
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-0 shadow-subtle hover-card">
              <div className="bg-gradient-to-r from-coral-400 to-coral-500 h-2"></div>
              <CardContent className="p-8">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-coral-100">
                  <UserCheck className="h-7 w-7 text-coral-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Patients</h3>
                <p className="mb-6 text-gray-600">
                  View your radiology results, communicate with your healthcare providers, and access your records.
                </p>
                <Link to="/login/patient">
                  <Button 
                    className="w-full bg-coral-500 hover:bg-coral-600 btn-hover rounded-full"
                  >
                    Patient Login
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
              Key Features
            </h2>
            <div className="mx-auto h-1 w-20 rounded bg-teal-500 mb-4"></div>
            <p className="mx-auto max-w-2xl text-gray-600">
              Our platform provides powerful tools to enhance radiology collaboration and patient care.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature cards */}
            <FeatureCard 
              icon={<Brain className="h-6 w-6 text-teal-500" />}
              title="AI-Powered Analysis"
              description="Advanced AI algorithms assist radiologists in detecting anomalies and making accurate diagnoses."
            />
            <FeatureCard 
              icon={<MessageSquare className="h-6 w-6 text-teal-500" />}
              title="Seamless Communication"
              description="Secure chat and collaboration tools for healthcare teams to discuss cases in real-time."
            />
            <FeatureCard 
              icon={<Shield className="h-6 w-6 text-teal-500" />}
              title="Enterprise Security"
              description="State-of-the-art security protocols to protect sensitive healthcare data and maintain compliance."
            />
            <FeatureCard 
              icon={<FileText className="h-6 w-6 text-teal-500" />}
              title="Patient Portal"
              description="Empower patients with access to their records and direct communication with their care team."
            />
            <FeatureCard 
              icon={<Users className="h-6 w-6 text-teal-500" />}
              title="Multi-Institute Support"
              description="Connect multiple healthcare facilities for seamless collaboration across organizations."
            />
            <FeatureCard 
              icon={<Hospital className="h-6 w-6 text-teal-500" />}
              title="Centralized Records"
              description="Store and access all radiology images and reports in one secure, HIPAA-compliant platform."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white blur-3xl"></div>
        </div>
        <div className="container relative z-10 mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center text-white">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Ready to Transform Your Radiology Workflow?
            </h2>
            <p className="mb-8 text-lg opacity-90">
              Join healthcare organizations across the country that are improving patient outcomes with RaDixpert.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register/organization">
                <Button 
                  size="lg" 
                  className="bg-white text-teal-600 hover:bg-white/90 hover:text-teal-700 btn-hover rounded-full"
                >
                  Get Started
                </Button>
              </Link>
              <Link to="/contact">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white/70 text-white hover:bg-white/10 hover:border-white btn-hover rounded-full"
                >
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

// Simple feature card component
const FeatureCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) => (
  <Card className="border-0 shadow-subtle hover-card">
    <CardContent className="p-6">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </CardContent>
  </Card>
);

export default Index;
