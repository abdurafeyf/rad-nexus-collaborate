
import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Logo {
  name: string;
  url: string;
  imageUrl: string;
}

interface LogoCloudProps {
  logos: Logo[];
  title?: string;
  className?: string;
}

const LogoCloud: React.FC<LogoCloudProps> = ({ logos, title, className }) => {
  return (
    <div className={cn("w-full", className)}>
      {title && (
        <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-gray-400 mb-8">
          {title}
        </h3>
      )}
      
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mx-auto grid max-w-5xl grid-cols-2 items-center gap-x-8 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      >
        {logos.map((logo, index) => (
          <motion.a
            key={index}
            href={logo.url}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center justify-center grayscale transition-all duration-200 hover:grayscale-0 hover:scale-110"
            rel="noopener noreferrer"
            target="_blank"
          >
            <img
              src={logo.imageUrl}
              alt={logo.name}
              className="h-8 object-contain"
            />
          </motion.a>
        ))}
      </motion.div>
    </div>
  );
};

export default LogoCloud;
