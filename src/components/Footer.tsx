
import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-100 bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-brand-700"></div>
              <span className="text-xl font-semibold text-brand-900">RadNexus</span>
            </Link>
            <p className="mt-4 max-w-md text-sm text-gray-600">
              Transforming radiology collaboration through secure, intelligent, and
              connected healthcare solutions.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/features" className="text-gray-600 hover:text-brand-700">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-600 hover:text-brand-700">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/security" className="text-gray-600 hover:text-brand-700">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-gray-600 hover:text-brand-700">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-brand-700">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-600 hover:text-brand-700">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-brand-700">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-600 hover:text-brand-700">
                  Terms
                </Link>
              </li>
              <li>
                <Link to="/hipaa" className="text-gray-600 hover:text-brand-700">
                  HIPAA Compliance
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-100 pt-6">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} RadNexus. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
