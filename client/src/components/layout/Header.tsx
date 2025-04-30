import React from "react";
import { ShieldCheck } from "lucide-react";

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-2">
          <div className="text-primary p-1 rounded-md bg-blue-50">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold text-dark">VIP-Hosting</h1>
        </div>
        
        {/* User Menu */}
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full">
              <span className="h-2 w-2 bg-success rounded-full mr-1.5"></span>
              System Active
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-sm text-dark font-medium">Admin</span>
            <button className="p-1.5 rounded-full bg-gray-light text-dark hover:bg-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
