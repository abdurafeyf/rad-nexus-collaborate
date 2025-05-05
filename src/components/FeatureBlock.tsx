
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FeatureBlockProps {
  children: React.ReactNode;
  className?: string;
  background?: "light" | "dark" | "white" | "gradient";
  id?: string;
}

const FeatureBlock: React.FC<FeatureBlockProps> = ({ 
  children, 
  className, 
  background = "white",
  id 
}) => {
  return (
    <section 
      id={id}
      className={cn(
        "w-full py-24 md:py-32",
        background === "light" && "bg-gray-50",
        background === "dark" && "bg-gray-900 text-white",
        background === "white" && "bg-white",
        background === "gradient" && "bg-gradient-to-br from-gray-50 to-gray-100",
        className
      )}
    >
      <div className="container mx-auto px-6">
        {children}
      </div>
    </section>
  );
};

export const FeatureBlockTitle: React.FC<{ 
  children: React.ReactNode;
  subtitle?: string; 
  className?: string;
  center?: boolean;
}> = ({ children, subtitle, className, center = false }) => {
  return (
    <div className={cn("mb-16", center && "text-center", className)}>
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="text-3xl font-bold tracking-tight md:text-4xl"
      >
        {children}
      </motion.h2>
      {subtitle && (
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-4 max-w-3xl text-lg text-gray-600 dark:text-gray-300"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
};

export default FeatureBlock;
