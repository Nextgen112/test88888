import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import FileUpload from "@/components/dashboard/FileUpload";
import IPWhitelist from "@/components/dashboard/IPWhitelist";
import AccessLogs from "@/components/dashboard/AccessLogs";
import Notification from "@/components/ui/notification";
import AccessDeniedDialog from "@/components/ui/access-denied-dialog";
import { NotificationProps } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const Dashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationProps>({
    show: false,
    type: "success",
    title: "",
    message: "",
    onClose: () => setNotification(prev => ({ ...prev, show: false }))
  });
  
  const [accessDeniedDialog, setAccessDeniedDialog] = useState({
    show: false,
    ipAddress: ""
  });
  
  const { toast } = useToast();
  
  const handleAddToWhitelist = (ipAddress: string) => {
    // Close the dialog
    setAccessDeniedDialog({
      show: false,
      ipAddress: ""
    });
    
    // Show a notification about redirection
    toast({
      title: "Adding IP to whitelist",
      description: "Please use the IP Restrictions section to add this IP",
    });
    
    // Scroll to IP whitelist section
    const ipSection = document.getElementById("ip-restrictions");
    if (ipSection) {
      ipSection.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile */}
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
          {/* Mobile Menu Button (shown only on mobile) */}
          <div className="block md:hidden mb-4">
            <button 
              className="flex items-center justify-center p-2 rounded-md bg-white border border-gray-200 text-dark"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Menu</span>
            </button>
          </div>
          
          {/* Mobile Sidebar (when open) */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 md:hidden">
              {/* Background overlay */}
              <div 
                className="fixed inset-0 bg-gray-600 bg-opacity-75"
                onClick={() => setSidebarOpen(false)}
              ></div>
              
              {/* Sidebar */}
              <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <Sidebar />
              </div>
            </div>
          )}
          
          {/* Dashboard Content */}
          <DashboardOverview />
          
          {/* File Upload Section */}
          <section id="files">
            <FileUpload />
          </section>
          
          {/* IP Whitelist Section */}
          <section id="ip-restrictions">
            <IPWhitelist />
          </section>
          
          {/* Access Logs Section */}
          <section id="access-logs">
            <AccessLogs />
          </section>
        </main>
      </div>
      
      {/* Notification Component */}
      <Notification {...notification} />
      
      {/* Access Denied Dialog */}
      <AccessDeniedDialog 
        show={accessDeniedDialog.show}
        ipAddress={accessDeniedDialog.ipAddress}
        onClose={() => setAccessDeniedDialog({ show: false, ipAddress: "" })}
        onAddToWhitelist={handleAddToWhitelist}
      />
    </div>
  );
};

export default Dashboard;
