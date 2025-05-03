
import React from "react";
import { Link } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const RegistrationSuccess = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="flex flex-grow items-center justify-center bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-md rounded-lg border border-green-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Registration Successful!
            </h1>
            
            <p className="mb-6 text-gray-600">
              Your organization has been successfully registered. Your doctors can now log in using their work email addresses.
            </p>
            
            <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50 p-4 text-left">
              <h3 className="mb-2 text-sm font-medium text-gray-900">Next Steps:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2 text-brand-600">•</span>
                  Share the login link with your staff members
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-brand-600">•</span>
                  Doctors with email domains you specified can now create accounts
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-brand-600">•</span>
                  Access your organization dashboard to manage users and settings
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Link to="/login/admin">
                <Button className="w-full">Go to Admin Dashboard</Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="w-full">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RegistrationSuccess;
