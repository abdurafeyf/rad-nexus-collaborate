
import React from "react";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <div className="relative overflow-hidden bg-white py-16 sm:py-24">
      <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-brand-50 to-transparent"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            {subtitle}
          </p>
          <div className="mt-10">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
