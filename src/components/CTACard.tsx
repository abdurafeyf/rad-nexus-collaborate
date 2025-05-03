
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface CTACardProps {
  title: string;
  description: string;
  buttonText: string;
  linkTo: string;
  icon: React.ReactNode;
  className?: string;
}

const CTACard: React.FC<CTACardProps> = ({
  title,
  description,
  buttonText,
  linkTo,
  icon,
  className,
}) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md ${className}`}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        {icon}
      </div>
      <h3 className="mb-2 text-center text-xl font-semibold text-gray-900">{title}</h3>
      <p className="mb-6 text-center text-sm text-gray-600">{description}</p>
      <Link to={linkTo} className="mt-auto">
        <Button variant="default">{buttonText}</Button>
      </Link>
    </div>
  );
};

export default CTACard;
