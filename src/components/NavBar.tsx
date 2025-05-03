
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { useState } from "react";

const NavBar: React.FC = () => {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full border-b border-gray-100">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-brand-700"></div>
          <span className="text-xl font-semibold text-brand-900">RadNexus</span>
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
                  <Link
                    to="/login"
                    className="rounded bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    Log In
                  </Link>
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
            <Link to="/login">
              <Button variant="outline" size="sm">
                Log In
              </Button>
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default NavBar;
