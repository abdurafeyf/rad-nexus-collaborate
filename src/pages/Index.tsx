
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NewNavBar from "@/components/NewNavBar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Brain, UserCheck, Shield, FileText, Users, ArrowRight, Download } from "lucide-react";

const Index = () => {
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <NewNavBar />
      
      {/* Hero Section with modern design */}
      <HeroSection
        title="The AI Radiology Assistant"
        subtitle="Helping radiologists save time, improve diagnosis, and work smarter with AI-powered collaboration tools."
        overlayColor="modern"
        titleGradient={true}
      >
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/register/organization">
            <Button 
              size="lg" 
              className="bg-white text-indigo-600 hover:bg-white/90 hover:text-indigo-700 rounded-full px-8 py-6 font-medium text-base"
            >
              Try Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/features">
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white/70 text-white hover:bg-white/10 hover:border-white rounded-full px-8 py-6 font-medium text-base"
            >
              Explore Features
            </Button>
          </Link>
        </div>
        
        {/* Modern UI preview */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative mt-16 mx-auto max-w-4xl overflow-hidden rounded-2xl bg-black/20 backdrop-blur-sm border border-white/20 p-6 shadow-subtle-lg"
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="col-span-2 overflow-hidden rounded-xl bg-black/30 p-6 backdrop-blur-sm">
              <div className="mb-4 h-4 w-full rounded-full bg-white/20 animate-pulse-slow"></div>
              <div className="mb-2 h-3 w-3/4 rounded-full bg-white/20 animate-pulse-slow"></div>
              <div className="mb-4 h-3 w-1/2 rounded-full bg-white/20 animate-pulse-slow"></div>
              
              <div className="flex gap-4">
                <div className="h-32 w-32 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10"></div>
                <div className="h-32 w-32 rounded-lg bg-gradient-to-br from-purple-500/20 to-teal-500/20 border border-white/10"></div>
                <div className="h-32 w-32 rounded-lg bg-gradient-to-br from-teal-500/20 to-indigo-500/20 border border-white/10"></div>
              </div>
              
              <div className="mt-4 h-24 rounded-lg bg-white/10 p-3 border border-white/10">
                <div className="mb-2 h-3 w-3/4 rounded-full bg-teal-400/40"></div>
                <div className="h-3 w-1/2 rounded-full bg-teal-400/40"></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="rounded-xl bg-black/30 p-4 backdrop-blur-sm border border-white/10">
                <div className="mb-2 h-5 w-full rounded-full bg-white/20"></div>
                <div className="h-3 w-3/4 rounded-full bg-white/20"></div>
                <div className="mt-2 h-3 w-1/2 rounded-full bg-white/20"></div>
              </div>
              
              <div className="rounded-xl bg-black/30 p-4 backdrop-blur-sm border border-white/10">
                <div className="mb-2 h-5 w-full rounded-full bg-purple-400/40"></div>
                <div className="h-3 w-3/4 rounded-full bg-white/20"></div>
                <div className="mt-2 h-3 w-1/2 rounded-full bg-white/20"></div>
              </div>
              
              <div className="rounded-xl bg-black/30 p-4 backdrop-blur-sm border border-white/10">
                <div className="mb-2 h-5 w-full rounded-full bg-indigo-400/40"></div>
                <div className="h-3 w-3/4 rounded-full bg-white/20"></div>
                <div className="mt-2 h-3 w-1/2 rounded-full bg-white/20"></div>
              </div>
            </div>
          </div>
          
          {/* Animated elements */}
          <div className="absolute bottom-12 left-32 h-12 w-12 animate-float rounded-full bg-purple-500/20 border border-purple-500/30"></div>
          <div className="absolute right-24 top-16 h-8 w-8 animate-float rounded-full bg-teal-500/20 border border-teal-500/30" style={{ animationDelay: '2s' }}></div>
        </motion.div>
      </HeroSection>

      {/* User Type CTAs Section - Modern Design */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100"></div>
        
        <div className="container relative z-10 mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: { 
                opacity: 1,
                transition: { 
                  staggerChildren: 0.2
                } 
              }
            }}
            className="text-center"
          >
            <motion.h2 
              variants={fadeIn}
              className="mb-4 text-center text-3xl font-bold text-gray-900 md:text-4xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
            >
              Choose Your Path
            </motion.h2>
            <motion.div 
              variants={fadeIn}
              className="mx-auto h-1 w-20 rounded bg-gradient-to-r from-indigo-500 to-purple-500 mb-6"
            ></motion.div>
            <motion.p 
              variants={fadeIn}
              className="mx-auto mb-12 max-w-2xl text-center text-gray-600"
            >
              Radixpert provides specialized tools for healthcare organizations, doctors, and patients.
            </motion.p>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <motion.div variants={fadeIn}>
                <Card className="overflow-hidden border-0 shadow-lg hover-card transition-all duration-300 rounded-xl bg-white">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2"></div>
                  <CardContent className="p-8">
                    <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                      <Users className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h3 className="mb-3 text-xl font-semibold">Healthcare Organizations</h3>
                    <p className="mb-6 text-gray-600">
                      Register your institute to provide a collaborative platform for your radiologists and patients.
                    </p>
                    <Link to="/register/organization">
                      <Button 
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white btn-hover rounded-full"
                      >
                        Register Your Institute
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeIn}>
                <Card className="overflow-hidden border-0 shadow-lg hover-card transition-all duration-300 rounded-xl bg-white">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2"></div>
                  <CardContent className="p-8">
                    <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                      <Brain className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="mb-3 text-xl font-semibold">Doctors</h3>
                    <p className="mb-6 text-gray-600">
                      Access and collaborate on radiology reports, communicate with colleagues and patients.
                    </p>
                    <Link to="/login/doctor">
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white btn-hover rounded-full"
                      >
                        Doctor Login
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeIn}>
                <Card className="overflow-hidden border-0 shadow-lg hover-card transition-all duration-300 rounded-xl bg-white">
                  <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2"></div>
                  <CardContent className="p-8">
                    <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
                      <UserCheck className="h-8 w-8 text-teal-600" />
                    </div>
                    <h3 className="mb-3 text-xl font-semibold">Patients</h3>
                    <p className="mb-6 text-gray-600">
                      View your radiology results, communicate with your healthcare providers, and access your records.
                    </p>
                    <Link to="/login/patient">
                      <Button 
                        className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white btn-hover rounded-full"
                      >
                        Patient Login
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section with modern design */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: { 
                opacity: 1,
                transition: { 
                  staggerChildren: 0.15
                } 
              }
            }}
            className="mb-16 text-center"
          >
            <motion.h2 
              variants={fadeIn}
              className="mb-3 text-3xl font-bold md:text-4xl bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500 bg-clip-text text-transparent"
            >
              Powered by Advanced AI
            </motion.h2>
            <motion.div 
              variants={fadeIn}
              className="mx-auto h-1 w-20 rounded bg-gradient-to-r from-indigo-500 to-teal-500 mb-4"
            ></motion.div>
            <motion.p 
              variants={fadeIn}
              className="mx-auto max-w-2xl text-gray-600"
            >
              Our platform provides powerful tools to enhance radiology collaboration and patient care.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature cards with modern design */}
            <FeatureCard 
              icon={<Brain className="h-6 w-6 text-indigo-500" />}
              title="AI-Powered Analysis"
              description="Advanced AI algorithms assist radiologists in detecting anomalies and making accurate diagnoses."
              gradient="from-indigo-500 to-purple-500"
            />
            <FeatureCard 
              icon={<Shield className="h-6 w-6 text-purple-500" />}
              title="Enterprise Security"
              description="State-of-the-art security protocols to protect sensitive healthcare data and maintain compliance."
              gradient="from-purple-500 to-indigo-500"
            />
            <FeatureCard 
              icon={<FileText className="h-6 w-6 text-teal-500" />}
              title="Patient Portal"
              description="Empower patients with access to their records and direct communication with their care team."
              gradient="from-teal-500 to-cyan-500"
            />
          </div>
        </div>
      </section>

      {/* Modern Code Snippet Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="flex flex-wrap items-center justify-between"
          >
            <motion.div 
              variants={fadeIn}
              className="w-full lg:w-1/2 lg:pr-12 mb-12 lg:mb-0"
            >
              <h2 className="mb-6 text-3xl font-bold md:text-4xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Seamless Integration
              </h2>
              <p className="mb-6 text-lg text-gray-700">
                Our API allows for easy integration with your existing hospital systems. 
                Connect once and get access to our powerful AI capabilities.
              </p>
              <ul className="mb-8 space-y-3">
                <li className="flex items-center text-gray-700">
                  <div className="mr-3 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
                  </div>
                  DICOM format support
                </li>
                <li className="flex items-center text-gray-700">
                  <div className="mr-3 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
                  </div>
                  HL7 FHIR compliant
                </li>
                <li className="flex items-center text-gray-700">
                  <div className="mr-3 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
                  </div>
                  Secure webhook notifications
                </li>
              </ul>
              <Link to="/documentation">
                <Button className="rounded-full px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  View Documentation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
            
            <motion.div 
              variants={fadeIn}
              className="w-full lg:w-1/2"
            >
              <div className="rounded-xl overflow-hidden bg-gray-900 shadow-xl border border-gray-800">
                <div className="flex items-center h-9 bg-gray-800 px-4">
                  <div className="flex space-x-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <div className="p-4 overflow-auto text-sm font-mono text-left text-gray-300">
                  <div><span className="text-purple-400">import</span> <span className="text-blue-400">RadixpertAI</span> <span className="text-purple-400">from</span> <span className="text-green-400">'radixpert-client'</span>;</div>
                  <br />
                  <div><span className="text-gray-500">// Initialize the client</span></div>
                  <div><span className="text-purple-400">const</span> <span className="text-blue-400">client</span> = <span className="text-purple-400">new</span> <span className="text-yellow-400">RadixpertAI</span>{'({'}</div>
                  <div>&nbsp;&nbsp;<span className="text-teal-400">apiKey</span>: <span className="text-green-400">'your_api_key'</span>,</div>
                  <div>&nbsp;&nbsp;<span className="text-teal-400">organizationId</span>: <span className="text-green-400">'org_12345'</span></div>
                  <div>{'});'}</div>
                  <br />
                  <div><span className="text-gray-500">// Process a radiology scan</span></div>
                  <div><span className="text-purple-400">const</span> <span className="text-teal-400">analyzeImage</span> = <span className="text-purple-400">async</span>() {'=>'} {'{'}</div>
                  <div>&nbsp;&nbsp;<span className="text-purple-400">const</span> <span className="text-blue-400">result</span> = <span className="text-purple-400">await</span> client.<span className="text-yellow-400">analyze</span>({'{'}</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-teal-400">imageId</span>: <span className="text-green-400">'scan_id_123'</span>,</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-teal-400">options</span>: {'{'}</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-teal-400">enhanceContrast</span>: <span className="text-orange-400">true</span>,</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-teal-400">detectAnomalies</span>: <span className="text-orange-400">true</span></div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;{'}'}</div>
                  <div>&nbsp;&nbsp;{'});'}</div>
                  <div>&nbsp;&nbsp;<span className="text-purple-400">return</span> result;</div>
                  <div>{'}'}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section with modern design */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white blur-3xl"></div>
        </div>
        <div className="container relative z-10 mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.8 } }
            }}
            className="mx-auto max-w-3xl text-center text-white"
          >
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Ready to Transform Your Radiology Workflow?
            </h2>
            <p className="mb-8 text-lg opacity-90">
              Join healthcare organizations across the country that are improving patient outcomes with Radixpert.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register/organization">
                <Button 
                  size="lg" 
                  className="bg-white text-indigo-600 hover:bg-white/90 hover:text-indigo-700 btn-hover rounded-full px-8"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white/70 text-white hover:bg-white/10 hover:border-white btn-hover rounded-full px-8"
                >
                  Contact Sales
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

// Modern feature card component
const FeatureCard = ({ 
  icon, 
  title, 
  description,
  gradient = "from-teal-500 to-blue-500"
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  gradient?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5 }}
  >
    <Card className="border-0 shadow-lg hover:shadow-xl hover-card transition-all duration-300 rounded-xl overflow-hidden">
      <div className={cn("h-1 w-full bg-gradient-to-r", gradient)}></div>
      <CardContent className="p-8">
        <div className={cn("mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full", 
          gradient.includes("indigo") ? "bg-indigo-50" : 
          gradient.includes("purple") ? "bg-purple-50" : 
          "bg-teal-50"
        )}>
          {icon}
        </div>
        <h3 className="mb-3 text-lg font-semibold">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

export default Index;
