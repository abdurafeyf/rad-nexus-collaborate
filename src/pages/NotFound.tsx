
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="flex flex-grow items-center justify-center bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-4 text-9xl font-extrabold text-brand-200">404</h1>
          <h2 className="mb-6 text-3xl font-bold text-gray-900">
            Page not found
          </h2>
          <p className="mb-8 text-lg text-gray-600">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link to="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
