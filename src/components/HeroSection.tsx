
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
    <div className="relative overflow-hidden py-20 sm:py-28">
      <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-brand-50 to-transparent"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            {title}
          </h1>
          <div className="mx-auto h-1 w-20 rounded bg-brand-500 mb-6"></div>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            {subtitle}
          </p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
