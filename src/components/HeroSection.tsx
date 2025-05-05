
import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  className?: string;
  overlayColor?: "teal" | "coral" | "blue" | "gradient" | "modern";
  titleGradient?: boolean;
  alignment?: "left" | "center";
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  children,
  className,
  overlayColor = "modern",
  titleGradient = true,
  alignment = "center",
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
    <div className={cn("relative overflow-hidden py-24 sm:py-32", className)}>
      {/* Modern gradient background with animated shapes */}
      <div 
        className={cn(
          "absolute inset-0", 
          overlayColor === "teal" && "bg-gradient-to-r from-teal-500/90 to-teal-600/80",
          overlayColor === "coral" && "bg-gradient-to-r from-orange-400/90 to-rose-400/80",
          overlayColor === "blue" && "bg-gradient-to-r from-brand-600/90 to-brand-500/80",
          overlayColor === "gradient" && "bg-gradient-to-br from-brand-500/90 via-cyan-500/70 to-teal-400/80",
          overlayColor === "modern" && "bg-gradient-to-br from-indigo-600/95 via-purple-600/90 to-teal-500/85"
        )}
      />
      
      {/* Modern animated decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-float"></div>
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" style={{ animationDelay: '2s', animationDuration: '8s' }}></div>
        <div className="absolute top-1/3 left-1/4 h-64 w-64 rounded-full bg-teal-300/10 blur-2xl animate-float" style={{ animationDelay: '1s', animationDuration: '10s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 h-48 w-48 rounded-full bg-purple-300/10 blur-2xl animate-float" style={{ animationDelay: '3s', animationDuration: '12s' }}></div>
      </div>

      <div className="container relative z-10">
        <motion.div 
          variants={container}
          initial="hidden"
          animate={mounted ? "show" : "hidden"}
          className={cn(
            "mx-auto max-w-3xl text-white",
            alignment === "center" ? "text-center" : "text-left"
          )}
        >
          <motion.h1 
            variants={item}
            className={cn(
              "mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl",
              titleGradient && "bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent"
            )}
          >
            {title}
          </motion.h1>
          <motion.p 
            variants={item}
            className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/90 font-light"
          >
            {subtitle}
          </motion.p>
          <motion.div variants={item} className="mt-10">
            {children}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;
