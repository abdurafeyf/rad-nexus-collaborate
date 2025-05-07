import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { useState } from "react";

const NavBar: React.FC = () => {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const path = location.pathname;

  // Determine which buttons to show based on current route
  const renderAuthButtons = () => {
    if (path === "/login/doctor") {
      return (
        <Link to="/login/patient">
          <Button variant="outline" size="sm">
            Patient Login
          </Button>
        </Link>
      );
    } else if (path === "/login/patient") {
      return (
        <Link to="/login/doctor">
          <Button variant="default" size="sm">
            Doctor Login
          </Button>
        </Link>
      );
    } else if (path === "/register/doctor") {
      return (
        <Link to="/register/patient">
          <Button variant="outline" size="sm">
            Register as Patient
          </Button>
        </Link>
      );
    } else if (path === "/register/patient") {
      return (
        <Link to="/register/doctor">
          <Button variant="default" size="sm">
            Register as Doctor
          </Button>
        </Link>
      );
    } else if (path.includes("/register/organization")) {
      return (
        <Link to="/login">
          <Button variant="outline" size="sm">
            Back to Login
          </Button>
        </Link>
      );
    } else {
      // Default: show both buttons
      return (
        <>
          <Link to="/login/patient">
            <Button variant="outline" size="sm" className="mr-2">
              Patient Login
            </Button>
          </Link>
          <Link to="/login/doctor">
            <Button variant="default" size="sm">
              Doctor Login
            </Button>
          </Link>
        </>
      );
    }
  };

  // Determine which mobile auth links to show
  const renderMobileAuthLinks = () => {
    if (path === "/login/doctor") {
      return (
        <Link
          to="/login/patient"
          className="rounded bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
          onClick={() => setMenuOpen(false)}
        >
          Patient Login
        </Link>
      );
    } else if (path === "/login/patient") {
      return (
        <Link
          to="/login/doctor"
          className="rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          onClick={() => setMenuOpen(false)}
        >
          Doctor Login
        </Link>
      );
    } else if (path === "/register/doctor") {
      return (
        <Link
          to="/register/patient"
          className="rounded bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
          onClick={() => setMenuOpen(false)}
        >
          Register as Patient
        </Link>
      );
    } else if (path === "/register/patient") {
      return (
        <Link
          to="/register/doctor"
          className="rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          onClick={() => setMenuOpen(false)}
        >
          Register as Doctor
        </Link>
      );
    } else if (path.includes("/register/organization")) {
      return (
        <Link
          to="/login"
          className="rounded bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
          onClick={() => setMenuOpen(false)}
        >
          Back to Login
        </Link>
      );
    } else {
      // Default: show both buttons
      return (
        <>
          <Link
            to="/login/patient"
            className="rounded bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
            onClick={() => setMenuOpen(false)}
          >
            Patient Login
          </Link>
          <Link
            to="/login/doctor"
            className="rounded bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
            onClick={() => setMenuOpen(false)}
          >
            Doctor Login
          </Link>
        </>
      );
    }
  };

  return (
    <header className="w-full border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold text-sm">
            R
          </div>
          <span className="text-xl font-semibold text-brand-900">Radixpert</span>
        </Link>

        {isMobile ? (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-md bg-white p-2 shadow-lg">
                <nav className="flex flex-col space-y-2">
                  <Link
                    to="/features"
                    className="rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link
                    to="/pricing"
                    className="rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link
                    to="/about"
                    className="rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    About
                  </Link>
                  {renderMobileAuthLinks()}
                </nav>
              </div>
            )}
          </div>
        ) : (
          <nav className="flex items-center space-x-6">
            <Link
              to="/features"
              className="text-sm font-medium text-gray-700 hover:text-brand-700"
            >
              Features
            </Link>
            <Link
              to="/pricing"
              className="text-sm font-medium text-gray-700 hover:text-brand-700"
            >
              Pricing
            </Link>
            <Link
              to="/about"
              className="text-sm font-medium text-gray-700 hover:text-brand-700"
            >
              About
            </Link>
            {renderAuthButtons()}
          </nav>
        )}
      </div>
    </header>
  );
};

export default NavBar;