import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Plus, Wifi } from 'lucide-react';

export default function AddMyIP() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addMyIPMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/add-my-ip', {}),
    onSuccess: (data: any) => {
      if (data.alreadyExists) {
        toast({
          title: "Already Whitelisted",
          description: "Your IP address is already in the allowed list. You can access VIP.js files!",
        });
      } else {
        toast({
          title: "Success",
          description: "Your IP address has been added to the allowed list!",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/ip-whitelist'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add your IP address",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">VIP Access</h1>
          <p className="text-gray-600">Add your IP address to access VIP.js files</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Wifi className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Allow Your IP Address</CardTitle>
            <CardDescription>
              Click the button below to add your current IP address to the allowed list for VIP.js file access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Important Note:</p>
                  <p className="text-yellow-700">
                    Only users with whitelisted IP addresses can download VIP.js files. 
                    Make sure you're on the network you want to grant access to.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => addMyIPMutation.mutate()}
              disabled={addMyIPMutation.isPending}
              className="w-full h-12 text-lg"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              {addMyIPMutation.isPending ? 'Adding Your IP...' : 'Add My IP to Allowed List'}
            </Button>

            <div className="text-center text-sm text-gray-500">
              Your IP address will be automatically detected and added to the whitelist
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/api/auth/logout'}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}