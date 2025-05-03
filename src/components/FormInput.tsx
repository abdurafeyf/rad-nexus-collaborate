
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  description?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  id,
  error,
  description,
  className,
  ...props
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
      <Input
        id={id}
        className={cn(
          error && "border-red-300 focus-visible:ring-red-500",
          className
        )}
        {...props}
      />
      {description && !error && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
};

export default FormInput;
