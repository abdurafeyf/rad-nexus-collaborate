
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  gradient?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  className,
  gradient = "from-teal-500 to-cyan-500",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className={cn(className)}
    >
      <div className="group relative rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] overflow-hidden">
        {/* Accent top border with gradient */}
        <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", gradient)}></div>
        
        {/* Hover glow effect */}
        <div className={cn(
          "absolute -inset-0.5 rounded-xl opacity-0 blur-xl transition-all duration-300 group-hover:opacity-40 -z-10 bg-gradient-to-r",
          gradient
        )}></div>

        <div className={cn(
          "mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg",
          gradient.includes("teal") ? "bg-teal-50" :
          gradient.includes("purple") ? "bg-purple-50" :
          gradient.includes("coral") ? "bg-orange-50" : "bg-blue-50"
        )}>
          {icon}
        </div>
        
        <h3 className="mb-3 text-lg font-semibold">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </motion.div>
  );
};

export default FeatureCard;
