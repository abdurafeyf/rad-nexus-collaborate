
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NewNavBar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full",
        isScrolled 
          ? "bg-white/90 shadow-sm backdrop-blur-md py-3" 
          : "bg-transparent py-6"
      )}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className={cn(
              "flex items-center gap-2 transition-all duration-300",
              isScrolled ? "scale-90" : ""
            )}
          >
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm",
              "bg-gradient-to-r from-teal-500 to-coral-500"
            )}>
              R
            </div>
            <span className={cn(
              "text-xl font-medium transition-colors",
              isScrolled ? "text-gray-800" : "text-white"
            )}>
              Radixpert
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/features" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-teal-500",
                isScrolled ? "text-gray-700" : "text-white/90"
              )}
            >
              Features
            </Link>
            <Link 
              to="/pricing" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-teal-500",
                isScrolled ? "text-gray-700" : "text-white/90"
              )}
            >
              Pricing
            </Link>
            <Link 
              to="/blog" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-teal-500",
                isScrolled ? "text-gray-700" : "text-white/90"
              )}
            >
              Blog
            </Link>
            <Link 
              to="/about" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-teal-500",
                isScrolled ? "text-gray-700" : "text-white/90"
              )}
            >
              About
            </Link>

            {/* Login/Download buttons */}
            <div className="flex items-center space-x-3">
              <Link to="/login/doctor">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn(
                    "transition-all hover:scale-105 rounded-full",
                    isScrolled 
                      ? "border-teal-500 text-teal-600 hover:bg-teal-50 hover:text-teal-700" 
                      : "border-white/70 text-white hover:bg-white/10 hover:border-white"
                  )}
                >
                  Login
                </Button>
              </Link>
              <Link to="/register/organization">
                <Button 
                  variant="default" 
                  size="sm"
                  className={cn(
                    "bg-coral-500 hover:bg-coral-600 text-white transition-all hover:scale-105 rounded-full",
                    !isScrolled && "bg-white text-coral-600 hover:bg-white/90 hover:text-coral-700"
                  )}
                >
                  Download
                </Button>
              </Link>
            </div>
          </nav>

          {/* Mobile menu button */}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X className={isScrolled ? "h-6 w-6 text-gray-800" : "h-6 w-6 text-white"} />
            ) : (
              <Menu className={isScrolled ? "h-6 w-6 text-gray-800" : "h-6 w-6 text-white"} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-[65px] z-40 bg-white/95 backdrop-blur-md">
          <nav className="flex flex-col p-6 space-y-6">
            <Link 
              to="/features" 
              className="text-lg font-medium text-gray-800 py-2"
            >
              Features
            </Link>
            <Link 
              to="/pricing" 
              className="text-lg font-medium text-gray-800 py-2"
            >
              Pricing
            </Link>
            <Link 
              to="/blog" 
              className="text-lg font-medium text-gray-800 py-2"
            >
              Blog
            </Link>
            <Link 
              to="/about" 
              className="text-lg font-medium text-gray-800 py-2"
            >
              About
            </Link>
            <div className="pt-4 flex flex-col space-y-4">
              <Link to="/login/doctor" className="w-full">
                <Button 
                  variant="outline" 
                  className="w-full border-teal-500 text-teal-600 hover:bg-teal-50 rounded-full"
                >
                  Login
                </Button>
              </Link>
              <Link to="/register/organization" className="w-full">
                <Button
                  variant="default"
                  className="w-full bg-coral-500 hover:bg-coral-600 rounded-full"
                >
                  Download
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default NewNavBar;
