import React from "react";
import { AlertCircle } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AccessDeniedDialogProps } from "@/lib/types";

const AccessDeniedDialog: React.FC<AccessDeniedDialogProps> = ({
  show,
  ipAddress,
  onClose,
  onAddToWhitelist
}) => {
  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="bg-red-50 px-4 py-3 -mt-5 -mx-6 mb-4 border-b border-red-100 rounded-t-lg">
          <div className="flex items-center">
            <AlertCircle className="text-danger h-5 w-5" />
            <DialogTitle className="ml-2 text-lg font-medium text-danger">Access Denied</DialogTitle>
          </div>
        </DialogHeader>
        
        <DialogDescription className="text-gray-700 mb-3">
          The IP address <span className="font-mono font-medium">{ipAddress}</span> is not authorized to access this file.
        </DialogDescription>
        
        <p className="text-sm text-gray-500 mb-4">
          To grant access, add this IP to the whitelist in the IP Restrictions section.
        </p>
        
        <DialogFooter className="flex justify-end space-x-3">
          <Button 
            variant="outline" 
            onClick={() => onAddToWhitelist(ipAddress)}
          >
            Add to Whitelist
          </Button>
          <Button 
            variant="destructive" 
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AccessDeniedDialog;
