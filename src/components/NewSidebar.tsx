
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  FileText, 
  MessageSquare, 
  Calendar, 
  Settings,
  Menu,
  LogOut,
  Bot
} from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

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
        ? "bg-teal-50 text-teal-700 border-l-4 border-teal-500" 
        : "border-l-4 border-transparent text-gray-700 hover:bg-gray-100",
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
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  // User information
  const [userFullName, setUserFullName] = useState("");
  const [userInitials, setUserInitials] = useState("");
  
  useEffect(() => {
    if (user && user.user_metadata) {
      const firstName = user.user_metadata.first_name || "";
      const lastName = user.user_metadata.last_name || "";
      setUserFullName(`${firstName} ${lastName}`);
      setUserInitials(`${firstName.charAt(0)}${lastName.charAt(0)}`);
    }
  }, [user]);
  
  // Define the navigation items based on the sidebar type
  const navItems = type === 'doctor'
    ? [
        { to: "/doctor/dashboard", icon: <User />, label: "Patients" },
        { to: "/doctor/appointments", icon: <Calendar />, label: "Appointments" },
        { to: "/doctor/messages", icon: <MessageSquare />, label: "Messages" },
        { to: "/doctor/ai-chat", icon: <Bot />, label: "AI Assistant" },
        { to: "/doctor/reports", icon: <FileText />, label: "Reports" },
        { to: "/doctor/settings", icon: <Settings />, label: "Settings" },
      ]
    : [
        { to: "/patient", icon: <User />, label: "My Records" },
        { to: "/patient/appointments", icon: <Calendar />, label: "Appointments" },
        { to: "/patient/chat", icon: <MessageSquare />, label: "Messages" },
        { to: "/patient/ai-chat", icon: <Bot />, label: "AI Assistant" },
        { to: "/patient/reports", icon: <FileText />, label: "Reports" },
        { to: "/patient/settings", icon: <Settings />, label: "Settings" },
      ];
  
  // Fix path matching to handle subpaths correctly
  const isPathActive = (path: string) => {
    const currentPath = location.pathname;
    
    // For doctor dashboard
    if (path === "/doctor/dashboard" && currentPath === "/doctor/dashboard") {
      return true;
    }
    
    // For doctor appointments
    if (path === "/doctor/appointments" && currentPath.startsWith("/doctor/appointments")) {
      return true;
    }
    
    // For doctor messages
    if (path === "/doctor/messages" && currentPath.startsWith("/doctor/messages")) {
      return true;
    }
    
    // For doctor patient chat
    if (path === "/doctor/messages" && currentPath.includes("/doctor/patients/") && currentPath.includes("/chat")) {
      return true;
    }
    
    // For doctor reports
    if (path === "/doctor/reports" && (currentPath === "/doctor/reports" || currentPath.startsWith("/doctor/reports/"))) {
      return true;
    }
    
    // For doctor AI chat
    if (path === "/doctor/ai-chat" && currentPath.startsWith("/doctor/ai-chat")) {
      return true;
    }
    
    // For doctor settings
    if (path === "/doctor/settings" && currentPath.startsWith("/doctor/settings")) {
      return true;
    }
    
    // For patient portal paths
    if (path === "/patient" && ["/patient", "/patient/dashboard", "/patient/portal"].includes(currentPath)) {
      return true;
    }
    
    // For patient appointments
    if (path === "/patient/appointments" && currentPath.startsWith("/patient/appointments")) {
      return true;
    }
    
    // For patient chat
    if (path === "/patient/chat" && (currentPath === "/patient/chat" || currentPath.startsWith("/patient/chat/") || currentPath.includes("/patient/conversations"))) {
      return true;
    }
    
    // For patient AI chat
    if (path === "/patient/ai-chat" && currentPath.startsWith("/patient/ai-chat")) {
      return true;
    }
    
    // For patient reports
    if (path === "/patient/reports" && (currentPath === "/patient/reports" || currentPath.startsWith("/patient/reports/"))) {
      return true;
    }
    
    // For patient settings
    if (path === "/patient/settings" && currentPath.startsWith("/patient/settings")) {
      return true;
    }
    
    return false;
  };
  
  // Mobile toggle
  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account."
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Logout Failed",
        description: error.message || "An error occurred during logout.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className={cn("flex flex-grow", className)}>
      {/* User profile dropdown in header */}
      <div className="fixed top-4 right-4 z-50 hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-white shadow-sm border">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs bg-teal-100 text-teal-700">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm font-medium">
              {userFullName}
            </div>
            <div className="px-2 py-1 text-xs text-gray-500">
              {user?.email}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate(`/${type}/settings`)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileMenu}
          className="bg-white shadow-sm"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Sidebar for desktop */}
      <div
        className={cn(
          "hidden md:flex flex-col fixed z-20 h-screen bg-white border-r transition-all duration-300",
          isCollapsed ? "w-[60px]" : "w-[230px]"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          {!isCollapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                R
              </div>
              <span className="text-xl font-semibold text-gray-800">
                Radixpert
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
      </div>
      
      {/* Mobile sidebar */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMobileOpen(false)}>
          <div 
            className="fixed left-0 top-0 h-screen w-[230px] bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <Link to="/" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                  R
                </div>
                <span className="text-xl font-semibold text-gray-800">
                  Radixpert
                </span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-teal-100 text-teal-700">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{userFullName}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </div>
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
                className="w-full justify-start text-red-600 border-red-200"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-5 w-5" />
                <span>Log Out</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content area */}
      <div 
        className={cn(
          "flex-grow w-full transition-all duration-300",
          "md:ml-[60px]",
          !isCollapsed && "md:ml-[230px]"
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default NewSidebar;
