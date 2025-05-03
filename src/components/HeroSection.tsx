
import React from "react";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  className?: string;
  overlayColor?: "teal" | "coral" | "blue" | "gradient";
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  children,
  className,
  overlayColor = "gradient",
}) => {
  return (
    <div className={cn("relative overflow-hidden py-24 sm:py-32", className)}>
      {/* Background with gradient overlay */}
      <div 
        className={cn(
          "absolute inset-0", 
          overlayColor === "teal" && "bg-gradient-to-r from-teal-500/90 to-teal-600/80",
          overlayColor === "coral" && "bg-gradient-to-r from-orange-400/90 to-rose-400/80",
          overlayColor === "blue" && "bg-gradient-to-r from-brand-600/90 to-brand-500/80",
          overlayColor === "gradient" && "bg-gradient-to-br from-brand-500/90 via-cyan-500/70 to-teal-400/80"
        )}
      />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
      </div>

      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center text-white">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/90 font-light">
            {subtitle}
          </p>
          <div className="mt-10">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
