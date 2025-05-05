
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NewNavBar from "@/components/NewNavBar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import FeatureBlock, { FeatureBlockTitle } from "@/components/FeatureBlock";
import FeatureCard from "@/components/FeatureCard";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import VideoDemo from "@/components/VideoDemo";
import LogoCloud from "@/components/LogoCloud";
import { motion } from "framer-motion";
import { ArrowRight, Brain, FileText, MessageSquare, Shield, Users } from "lucide-react";

const Index = () => {
  // Sample testimonial data
  const testimonials = [
    {
      quote: "Radixpert has transformed how we collaborate on radiology reports. The AI assistant has cut our reporting time by 40%.",
      author: "Dr. Sarah Johnson",
      role: "Chief Radiologist",
      organization: "Northwest Memorial Hospital",
    },
    {
      quote: "The platform's intuitive design and powerful AI features have significantly improved our diagnostic accuracy and patient communication.",
      author: "Dr. Michael Chen",
      role: "Director of Radiology",
      organization: "Pacific Medical Center",
    },
    {
      quote: "As a patient, I appreciate how Radixpert makes my medical information accessible and easy to understand. It's brought peace of mind during my treatment journey.",
      author: "Emily Rodriguez",
      role: "Patient",
    },
  ];

  // Sample partner logos
  const partnerLogos = [
    {
      name: "Mayo Clinic",
      url: "#",
      imageUrl: "https://placehold.co/200x80/e2e8f0/64748b?text=Mayo+Clinic&font=sans-serif",
    },
    {
      name: "Cleveland Clinic",
      url: "#",
      imageUrl: "https://placehold.co/200x80/e2e8f0/64748b?text=Cleveland+Clinic&font=sans-serif",
    },
    {
      name: "Johns Hopkins",
      url: "#",
      imageUrl: "https://placehold.co/200x80/e2e8f0/64748b?text=Johns+Hopkins&font=sans-serif",
    },
    {
      name: "Mass General",
      url: "#",
      imageUrl: "https://placehold.co/200x80/e2e8f0/64748b?text=Mass+General&font=sans-serif",
    },
    {
      name: "Stanford Health",
      url: "#",
      imageUrl: "https://placehold.co/200x80/e2e8f0/64748b?text=Stanford+Health&font=sans-serif",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <NewNavBar />
      
      {/* Hero Section with modern gradient and split-pane design */}
      <HeroSection
        title="Smarter Radiology, Faster Reports"
        subtitle="AI-powered tools that help radiologists save time, improve diagnosis accuracy, and collaborate seamlessly with healthcare teams."
        overlayColor="teal-coral"
        primaryCTA={{ 
          text: "Try Now", 
          link: "/register/organization"
        }}
        secondaryCTA={{ 
          text: "Explore Features", 
          link: "/features"
        }}
      />

      {/* Feature Cards Block - Notion-style with white background */}
      <FeatureBlock background="white" id="features">
        <FeatureBlockTitle center subtitle="Radixpert provides powerful tools designed specifically for radiology workflows">
          Powerful AI Features
        </FeatureBlockTitle>
        
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Brain className="h-6 w-6 text-teal-500" />}
            title="AI-Powered Analysis"
            description="Our advanced algorithms help detect anomalies and suggest diagnoses with high accuracy."
            gradient="from-teal-500 to-cyan-500"
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6 text-purple-500" />}
            title="HIPAA Compliant Security"
            description="Enterprise-level security protocols to protect sensitive patient data."
            gradient="from-purple-500 to-indigo-500"
          />
          <FeatureCard
            icon={<FileText className="h-6 w-6 text-coral-500" />}
            title="Smart Report Generation"
            description="Automated report drafting based on scans, saving time and reducing errors."
            gradient="from-coral-500 to-coral-400"
          />
        </div>
      </FeatureBlock>

      {/* Video Demo Section with glassmorphism style */}
      <FeatureBlock background="light" id="demo">
        <FeatureBlockTitle center subtitle="See how Radixpert transforms radiology workflows">
          Watch Radixpert in Action
        </FeatureBlockTitle>
        
        <VideoDemo
          videoUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
          thumbnailUrl="https://placehold.co/1280x720/e2e8f0/64748b?text=Radixpert+Demo&font=sans-serif"
          title="Radixpert Platform Overview"
        />
      </FeatureBlock>

      {/* User Types Block - Notion-style with gradient background */}
      <FeatureBlock background="white" id="solutions">
        <FeatureBlockTitle center subtitle="Specialized tools for every stakeholder in the radiology process">
          Solutions for Everyone
        </FeatureBlockTitle>
        
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
          >
            {/* Top accent border */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            
            {/* Hover glow effect */}
            <div className="absolute -inset-0.5 rounded-xl opacity-0 blur-xl transition-all duration-300 group-hover:opacity-20 -z-10 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-indigo-100">
              <Users className="h-7 w-7 text-indigo-600" />
            </div>
            
            <h3 className="mb-3 text-xl font-semibold">Healthcare Organizations</h3>
            
            <p className="mb-8 text-gray-600 flex-grow">
              A collaborative platform connecting radiologists and patients while maintaining compliance.
            </p>
            
            <Link to="/register/organization" className="mt-auto">
              <Button 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all duration-300 rounded-full"
              >
                Register Your Institute
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
          >
            {/* Top accent border */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500"></div>
            
            {/* Hover glow effect */}
            <div className="absolute -inset-0.5 rounded-xl opacity-0 blur-xl transition-all duration-300 group-hover:opacity-20 -z-10 bg-gradient-to-r from-teal-500 to-cyan-500"></div>
            
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-teal-100">
              <Brain className="h-7 w-7 text-teal-600" />
            </div>
            
            <h3 className="mb-3 text-xl font-semibold">Radiologists</h3>
            
            <p className="mb-8 text-gray-600 flex-grow">
              Tools to analyze scans, generate reports, and collaborate with colleagues efficiently.
            </p>
            
            <Link to="/login/doctor" className="mt-auto">
              <Button 
                className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white transition-all duration-300 rounded-full"
              >
                Doctor Login
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
          >
            {/* Top accent border */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-coral-500 to-coral-400"></div>
            
            {/* Hover glow effect */}
            <div className="absolute -inset-0.5 rounded-xl opacity-0 blur-xl transition-all duration-300 group-hover:opacity-20 -z-10 bg-gradient-to-r from-coral-500 to-coral-400"></div>
            
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-coral-100">
              <MessageSquare className="h-7 w-7 text-coral-600" />
            </div>
            
            <h3 className="mb-3 text-xl font-semibold">Patients</h3>
            
            <p className="mb-8 text-gray-600 flex-grow">
              Access your radiology results and communicate with healthcare providers securely.
            </p>
            
            <Link to="/login/patient" className="mt-auto">
              <Button 
                className="w-full bg-gradient-to-r from-coral-500 to-coral-400 hover:from-coral-600 hover:to-coral-500 text-white transition-all duration-300 rounded-full"
              >
                Patient Login
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </FeatureBlock>
      
      {/* Testimonials Section - Notion-style draggable blocks */}
      <FeatureBlock background="light" id="testimonials">
        <FeatureBlockTitle center subtitle="See what our users have to say about Radixpert">
          Trusted by Leading Hospitals
        </FeatureBlockTitle>
        
        <TestimonialCarousel testimonials={testimonials} />
        
        <div className="mt-20">
          <LogoCloud logos={partnerLogos} title="Trusted by leading medical institutions" />
        </div>
      </FeatureBlock>
      
      {/* CTA Section */}
      <FeatureBlock background="gradient">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
          >
            Ready to transform your radiology workflow?
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-6 max-w-xl text-lg text-gray-600"
          >
            Join healthcare organizations across the country that are improving patient outcomes with Radixpert.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex flex-wrap justify-center gap-4"
          >
            <Link to="/register/organization">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-teal-500 to-coral-500 text-white hover:from-teal-600 hover:to-coral-600 rounded-full px-8 py-6 text-base transition-all duration-300 hover:shadow-lg"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
            <Link to="/contact">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-full px-8 py-6 text-base transition-all duration-300"
              >
                Contact Sales
              </Button>
            </Link>
          </motion.div>
        </div>
      </FeatureBlock>
      
      <Footer />
    </div>
  );
};

export default Index;
