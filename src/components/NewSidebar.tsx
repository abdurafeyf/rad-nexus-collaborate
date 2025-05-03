
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  FileText, 
  MessageSquare, 
  Calendar, 
  Settings,
  Menu
} from "lucide-react";
import { Button } from "./ui/button";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  isActive?: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ 
  to, 
  icon, 
  label, 
  isCollapsed,
  isActive = false,
}) => (
  <Link 
    to={to} 
    className={cn(
      "flex items-center px-4 py-3 mb-1 rounded-lg transition-colors",
      isActive 
        ? "bg-teal-50 text-teal-700" 
        : "text-gray-700 hover:bg-gray-100",
      isCollapsed ? "justify-center" : ""
    )}
  >
    <span className="flex h-6 w-6 items-center justify-center">
      {React.cloneElement(icon as React.ReactElement, { 
        className: cn("h-5 w-5", isActive ? "text-teal-500" : "text-gray-500") 
      })}
    </span>
    {!isCollapsed && (
      <span className={cn("ml-3", isActive && "font-medium")}>
        {label}
      </span>
    )}
  </Link>
);

interface NewSidebarProps {
  type: 'doctor' | 'patient';
  children?: React.ReactNode;
  className?: string;
}

const NewSidebar: React.FC<NewSidebarProps> = ({ type, children, className }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  
  // Define the navigation items based on the sidebar type
  const navItems = type === 'doctor'
    ? [
        { to: "/doctor/dashboard", icon: <User />, label: "Patients" },
        { to: "/doctor/reports", icon: <FileText />, label: "Reports" },
        { to: "/doctor/messages", icon: <MessageSquare />, label: "Messages" },
        { to: "/doctor/appointments", icon: <Calendar />, label: "Appointments" },
        { to: "/doctor/settings", icon: <Settings />, label: "Settings" },
      ]
    : [
        { to: "/patient/portal", icon: <User />, label: "My Records" },
        { to: "/patient/reports", icon: <FileText />, label: "Reports" },
        { to: "/patient/messages", icon: <MessageSquare />, label: "Messages" },
        { to: "/patient/appointments", icon: <Calendar />, label: "Appointments" },
        { to: "/patient/settings", icon: <Settings />, label: "Settings" },
      ];
  
  const isPathActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  // Mobile toggle
  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };
  
  return (
    <div className={cn("flex flex-grow", className)}>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileMenu}
          className="bg-white shadow-subtle"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Sidebar for desktop */}
      <div
        className={cn(
          "hidden md:flex flex-col fixed z-20 h-screen bg-white border-r transition-all duration-300",
          isCollapsed ? "w-[70px]" : "w-[240px]"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          {!isCollapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                R
              </div>
              <span className="text-xl font-semibold text-gray-800">
                RaDixpert
              </span>
            </Link>
          )}
          {isCollapsed && (
            <div className="mx-auto h-8 w-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-500"
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
        
        <div className="flex flex-col p-2 flex-grow">
          {navItems.map((item) => (
            <SidebarLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isCollapsed={isCollapsed}
              isActive={isPathActive(item.to)}
            />
          ))}
        </div>
        
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className={cn(
              "w-full justify-center border-teal-200 bg-teal-50 text-teal-600 hover:bg-teal-100",
              isCollapsed ? "p-2" : ""
            )}
          >
            <User className="h-5 w-5" />
            {!isCollapsed && <span className="ml-2">Profile</span>}
          </Button>
        </div>
      </div>
      
      {/* Mobile sidebar */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMobileOpen(false)}>
          <div 
            className="fixed left-0 top-0 h-screen w-[240px] bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <Link to="/" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                  R
                </div>
                <span className="text-xl font-semibold text-gray-800">
                  RaDixpert
                </span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex flex-col p-2 flex-grow">
              {navItems.map((item) => (
                <SidebarLink
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  isCollapsed={false}
                  isActive={isPathActive(item.to)}
                />
              ))}
            </div>
            
            <div className="p-4 border-t">
              <Button
                variant="outline"
                className="w-full justify-center border-teal-200 bg-teal-50 text-teal-600 hover:bg-teal-100"
              >
                <User className="h-5 w-5" />
                <span className="ml-2">Profile</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content area */}
      <div 
        className={cn(
          "flex-grow w-full transition-all duration-300",
          "md:ml-[70px]",
          !isCollapsed && "md:ml-[240px]"
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default NewSidebar;
