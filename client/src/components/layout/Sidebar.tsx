import React from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileUp, 
  Network, 
  ClipboardList, 
  Settings,
  Server,
  Database
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
  
  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:block shrink-0">
      <nav className="p-4 space-y-1">
        <NavItem 
          href="/" 
          label="Dashboard" 
          icon={<LayoutDashboard className="w-5 h-5" />} 
          active={location === "/"} 
        />
        <NavItem 
          href="/#files" 
          label="File Management" 
          icon={<FileUp className="w-5 h-5" />} 
          active={location === "/#files"} 
        />
        <NavItem 
          href="/#ip-restrictions" 
          label="IP Restrictions" 
          icon={<Network className="w-5 h-5" />} 
          active={location === "/#ip-restrictions"} 
        />
        <NavItem 
          href="/#access-logs" 
          label="Access Logs" 
          icon={<ClipboardList className="w-5 h-5" />} 
          active={location === "/#access-logs"} 
        />
        <NavItem 
          href="/#settings" 
          label="Settings" 
          icon={<Settings className="w-5 h-5" />} 
          active={location === "/#settings"} 
        />
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
