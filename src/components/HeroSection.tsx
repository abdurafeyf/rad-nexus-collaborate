
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  primaryCTA?: {
    text: string;
    link: string;
    icon?: React.ReactNode;
  };
  secondaryCTA?: {
    text: string;
    link: string;
    icon?: React.ReactNode;
  };
  className?: string;
  overlayColor?: "teal-coral" | "purple-blue" | "modern";
  titleGradient?: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  primaryCTA,
  secondaryCTA,
  className,
  overlayColor = "teal-coral",
  titleGradient = true,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className={cn("relative overflow-hidden py-32 md:py-40", className)}>
      {/* Gradient background */}
      <div 
        className={cn(
          "absolute inset-0", 
          overlayColor === "teal-coral" && "bg-gradient-to-br from-teal-500/95 to-coral-400/90",
          overlayColor === "purple-blue" && "bg-gradient-to-br from-indigo-600/95 to-purple-500/90",
          overlayColor === "modern" && "bg-gradient-to-br from-indigo-600/95 via-purple-600/90 to-teal-500/85"
        )}
      />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-float"></div>
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" style={{ animationDelay: '2s', animationDuration: '8s' }}></div>
        <div className="absolute top-1/3 left-1/4 h-64 w-64 rounded-full bg-teal-300/10 blur-2xl animate-float" style={{ animationDelay: '1s', animationDuration: '10s' }}></div>
      </div>

      <div className="container relative z-10 mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left pane: Text content */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate={mounted ? "show" : "hidden"}
            className="text-white"
          >
            <motion.h1 
              variants={item}
              className={cn(
                "text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight",
                titleGradient && "bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent"
              )}
            >
              {title}
            </motion.h1>
            
            <motion.p 
              variants={item}
              className="mt-6 text-lg leading-7 text-white/90 font-light max-w-lg"
            >
              {subtitle}
            </motion.p>
            
            {(primaryCTA || secondaryCTA) && (
              <motion.div variants={item} className="mt-10 flex flex-wrap gap-4">
                {primaryCTA && (
                  <Link to={primaryCTA.link}>
                    <Button 
                      size="lg" 
                      className="bg-white text-teal-600 hover:bg-white/90 hover:text-teal-700 rounded-full px-8 py-6 text-base transition-all"
                    >
                      {primaryCTA.text}
                      {primaryCTA.icon || <ArrowRight className="ml-2 h-5 w-5" />}
                    </Button>
                  </Link>
                )}
                
                {secondaryCTA && (
                  <Link to={secondaryCTA.link}>
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="border-white/70 text-white hover:bg-white/10 hover:border-white rounded-full px-8 py-6 text-base"
                    >
                      {secondaryCTA.text}
                      {secondaryCTA.icon}
                    </Button>
                  </Link>
                )}
              </motion.div>
            )}
          </motion.div>
          
          {/* Right pane: Stylized dashboard mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative hidden md:block"
          >
            <div className="relative mx-auto max-w-lg overflow-hidden rounded-2xl bg-black/20 backdrop-blur-md border border-white/20 p-6 shadow-xl">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 overflow-hidden rounded-xl bg-black/30 p-4 backdrop-blur-sm">
                  <div className="mb-4 h-4 w-full rounded-full bg-white/20 animate-pulse-slow"></div>
                  <div className="mb-2 h-3 w-3/4 rounded-full bg-white/20 animate-pulse-slow"></div>
                  
                  <div className="mt-4 flex gap-3">
                    <div className="h-24 w-24 rounded-lg bg-gradient-to-br from-teal-500/20 to-coral-500/20 border border-white/10"></div>
                    <div className="h-24 w-24 rounded-lg bg-gradient-to-br from-purple-500/20 to-teal-500/20 border border-white/10"></div>
                    <div className="h-24 w-24 rounded-lg bg-gradient-to-br from-coral-500/20 to-indigo-500/20 border border-white/10"></div>
                  </div>
                  
                  <div className="mt-4 h-20 rounded-lg bg-white/10 p-3 border border-white/10">
                    <div className="mb-2 h-3 w-3/4 rounded-full bg-teal-400/40"></div>
                    <div className="h-3 w-1/2 rounded-full bg-teal-400/40"></div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="rounded-xl bg-black/30 p-4 backdrop-blur-sm border border-white/10">
                    <div className="mb-2 h-5 w-full rounded-full bg-white/20"></div>
                    <div className="h-3 w-3/4 rounded-full bg-white/20"></div>
                  </div>
                  
                  <div className="rounded-xl bg-black/30 p-4 backdrop-blur-sm border border-white/10">
                    <div className="mb-2 h-5 w-full rounded-full bg-coral-400/40"></div>
                    <div className="h-3 w-3/4 rounded-full bg-white/20"></div>
                  </div>
                  
                  <div className="rounded-xl bg-black/30 p-4 backdrop-blur-sm border border-white/10">
                    <div className="mb-2 h-5 w-full rounded-full bg-indigo-400/40"></div>
                    <div className="h-3 w-3/4 rounded-full bg-white/20"></div>
                  </div>
                </div>
              </div>
              
              {/* Animated elements */}
              <div className="absolute bottom-12 left-12 h-8 w-8 animate-float rounded-full bg-coral-500/30 border border-coral-500/40"></div>
              <div className="absolute right-12 top-12 h-6 w-6 animate-float rounded-full bg-teal-500/30 border border-teal-500/40" style={{ animationDelay: '2s' }}></div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
