import React, { useEffect } from "react";
import { X, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { NotificationProps } from "@/lib/types";

const Notification: React.FC<NotificationProps> = ({
  show,
  type = "success",
  title,
  message,
  action,
  onClose
}) => {
  useEffect(() => {
    if (show) {
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);
  
  if (!show) return null;
  
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="text-success text-lg" />;
      case "error":
        return <XCircle className="text-danger text-lg" />;
      case "warning":
        return <AlertTriangle className="text-warning text-lg" />;
      default:
        return <CheckCircle className="text-success text-lg" />;
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 animate-in fade-in slide-in-from-right-5">
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          {getIcon()}
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium text-dark">{title}</p>
          <p className="text-sm text-gray-500 mt-1">{message}</p>
          {action && (
            <div className="mt-2 flex">
              <button 
                className="text-sm text-primary font-medium"
                onClick={action.onClick}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button 
            className="text-gray-400 hover:text-gray-500"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
