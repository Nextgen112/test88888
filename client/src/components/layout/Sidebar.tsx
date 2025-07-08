import React from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileUp, 
  Network, 
  ClipboardList, 
  Settings,
  Server,
  Database,
  Users
} from "lucide-react";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, label, icon, active }) => {
  const baseClasses = "flex items-center space-x-2 px-3 py-2 rounded-md font-medium";
  const activeClasses = "text-primary bg-blue-50";
  const inactiveClasses = "text-dark hover:bg-gray-light";
  
  return (
    <Link href={href}>
      <div className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}>
        {icon}
        <span>{label}</span>
      </div>
    </Link>
  );
};

const Sidebar: React.FC = () => {
  const [location] = useLocation();
  
  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:block shrink-0">
      <nav className="p-4 space-y-1">
        <NavItem 
          href="/" 
          label="Dashboard" 
          icon={<LayoutDashboard className="w-5 h-5" />} 
          active={location === "/"} 
        />
        <button 
          onClick={() => handleScrollToSection('ip-restrictions')}
          className="flex items-center space-x-2 px-3 py-2 rounded-md font-medium text-dark hover:bg-gray-100 w-full text-left"
        >
          <Network className="w-5 h-5" />
          <span>IP Restrictions</span>
        </button>
        <button 
          onClick={() => handleScrollToSection('access-logs')}
          className="flex items-center space-x-2 px-3 py-2 rounded-md font-medium text-dark hover:bg-gray-100 w-full text-left"
        >
          <ClipboardList className="w-5 h-5" />
          <span>Access Logs</span>
        </button>
        <button 
          onClick={() => handleScrollToSection('users')}
          className="flex items-center space-x-2 px-3 py-2 rounded-md font-medium text-dark hover:bg-gray-100 w-full text-left"
        >
          <Users className="w-5 h-5" />
          <span>User Management</span>
        </button>
      </nav>
      
      <div className="border-t border-gray-200 p-4">
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="text-sm font-medium text-dark mb-1">System Status</div>
          <div className="flex items-center space-x-2 text-sm mb-2">
            <Server className="h-4 w-4 text-success" />
            <span>Server: Online</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Database className="h-4 w-4 text-success" />
            <span>Storage: 2.1GB / 5GB</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
