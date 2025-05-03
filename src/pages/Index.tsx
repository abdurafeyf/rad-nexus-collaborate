
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
  Shield 
} from "lucide-react";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="flex-grow">
        {/* Hero Section */}
        <HeroSection
          title="Collaborative Radiology for Better Patient Care"
          subtitle="A secure platform connecting healthcare organizations, doctors and patients for seamless radiology collaboration and enhanced patient outcomes."
        >
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
            <Link to="/features">
              <Button variant="outline" size="lg">
                Explore Features
              </Button>
            </Link>
            <Link to="/register/organization">
              <Button size="lg">Get Started</Button>
            </Link>
          </div>
          
          {/* Decorative background element */}
          <div className="relative mt-16 overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-md">
            <div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-brand-50"></div>
            <div className="absolute -top-12 -left-12 h-40 w-40 rounded-full bg-brand-50"></div>
            
            <div className="relative mx-auto aspect-video max-w-4xl rounded-lg bg-gray-100">
              <div className="absolute left-4 right-4 top-4 h-6 rounded bg-white"></div>
              <div className="absolute bottom-4 left-4 top-14 w-48 rounded bg-white"></div>
              <div className="absolute bottom-4 left-56 right-4 top-14 rounded bg-white"></div>
              <div className="absolute bottom-12 left-64 right-12 top-20 rounded bg-brand-50"></div>
            </div>
          </div>
        </HeroSection>

        {/* User Type CTAs */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
              Choose Your Path
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <CTACard
                title="Healthcare Organizations"
                description="Register your institute to provide a collaborative platform for your radiologists and patients."
                buttonText="Register Your Institute"
                linkTo="/register/organization"
                icon={<Hospital className="h-6 w-6" />}
                className="md:transform md:transition-transform md:hover:-translate-y-1"
              />

              <CTACard
                title="Doctors"
                description="Access and collaborate on radiology reports, communicate with colleagues and patients."
                buttonText="Doctor Login"
                linkTo="/login/doctor"
                icon={<User className="h-6 w-6" />}
                className="md:transform md:transition-transform md:hover:-translate-y-1"
              />

              <CTACard
                title="Patients"
                description="View your radiology results, communicate with your healthcare providers, and access your records."
                buttonText="Patient Login"
                linkTo="/login/patient"
                icon={<UserCheck className="h-6 w-6" />}
                className="md:transform md:transition-transform md:hover:-translate-y-1"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-2 text-3xl font-bold text-gray-900">
                Key Features
              </h2>
              <p className="mx-auto max-w-2xl text-gray-600">
                Our platform provides powerful tools to enhance radiology collaboration and patient care.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Brain className="h-6 w-6" />}
                title="AI-Powered Analysis"
                description="Advanced AI algorithms assist radiologists in detecting anomalies and making accurate diagnoses."
              />
              <FeatureCard
                icon={<MessageSquare className="h-6 w-6" />}
                title="Seamless Communication"
                description="Secure chat and collaboration tools for healthcare teams to discuss cases in real-time."
              />
              <FeatureCard
                icon={<Database className="h-6 w-6" />}
                title="Centralized Records"
                description="Store and access all radiology images and reports in one secure, HIPAA-compliant platform."
              />
              <FeatureCard
                icon={<Shield className="h-6 w-6" />}
                title="Enterprise Security"
                description="State-of-the-art security protocols to protect sensitive healthcare data and maintain compliance."
              />
              <FeatureCard
                icon={<Hospital className="h-6 w-6" />}
                title="Multi-Institute Support"
                description="Connect multiple healthcare facilities for seamless collaboration across organizations."
              />
              <FeatureCard
                icon={<UserCheck className="h-6 w-6" />}
                title="Patient Portal"
                description="Empower patients with access to their records and direct communication with their care team."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-brand-50 py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                Ready to Transform Your Radiology Workflow?
              </h2>
              <p className="mb-8 text-lg text-gray-600">
                Join healthcare organizations across the country that are improving patient outcomes with RadNexus.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/register/organization">
                  <Button size="lg">Get Started</Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="lg">
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
