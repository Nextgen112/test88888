import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIpWhitelist } from "@/hooks/use-ip-whitelist";
import { IpStatus } from "@/lib/types";

interface AddIpFormData {
  ipAddress: string;
  description: string;
  expiresAt: string;
}

const IPWhitelist: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingIp, setEditingIp] = useState<any>(null);
  const [formData, setFormData] = useState<AddIpFormData>({
    ipAddress: "",
    description: "",
    expiresAt: "",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: ipWhitelists = [], isLoading } = useIpWhitelist();

  const addIpMutation = useMutation({
    mutationFn: (data: AddIpFormData) => 
      apiRequest("POST", "/api/ip-whitelist", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ip-whitelist'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: "Success",
        description: "IP address added to whitelist",
      });
      
      // Reset form and hide it
      setFormData({
        ipAddress: "",
        description: "",
        expiresAt: "",
      });
      setShowAddForm(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add IP address",
        variant: "destructive",
      });
    },
  });

  const deleteIpMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/ip-whitelist/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ip-whitelist'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: "Success",
        description: "IP address removed from whitelist",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove IP address",
        variant: "destructive",
      });
    },
  });

  const updateIpMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AddIpFormData }) => 
      apiRequest("PUT", `/api/ip-whitelist/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ip-whitelist'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: "Success",
        description: "IP address updated successfully",
      });
      
      // Reset form and hide it
      setFormData({
        ipAddress: "",
        description: "",
        expiresAt: "",
      });
      setShowEditForm(false);
      setEditingIp(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update IP address",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.ipAddress.trim()) {
      toast({
        title: "Validation Error",
        description: "IP address is required",
        variant: "destructive",
      });
      return false;
    }
    
    // Validate IP address format with regex
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(formData.ipAddress)) {
      toast({
        title: "Validation Error",
        description: "Invalid IP address format",
        variant: "destructive",
      });
      return false;
    }
    
    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Description is required",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleAddIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      addIpMutation.mutate(formData);
    }
  };

  const handleEditIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && editingIp) {
      updateIpMutation.mutate({
        id: editingIp.id,
        data: formData
      });
    }
  };

  const handleDeleteIp = (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to remove this IP address from the whitelist?");
    if (confirmDelete) {
      deleteIpMutation.mutate(id);
    }
  };

  const handleEditClick = (ip: any) => {
    setEditingIp(ip);
    setFormData({
      ipAddress: ip.ipAddress,
      description: ip.description,
      expiresAt: ip.expiresAt ? new Date(ip.expiresAt).toISOString().split('T')[0] : "",
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingIp(null);
    setFormData({
      ipAddress: "",
      description: "",
      expiresAt: "",
    });
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setFormData({
      ipAddress: "",
      description: "",
      expiresAt: "",
    });
  };

  const getIpStatusBadge = (ip: any) => {
    let status = IpStatus.ACTIVE;
    let statusText = "Active";
    
    // Check if IP has expiry and if it's expired
    if (ip.expiresAt) {
      const expiryDate = new Date(ip.expiresAt);
      const now = new Date();
      
      // Set time to start of day for accurate comparison
      expiryDate.setHours(23, 59, 59, 999);
      
      if (expiryDate < now) {
        status = IpStatus.EXPIRED;
        statusText = "Expired";
      } else {
        status = IpStatus.TEMPORARY;
        statusText = "Temporary";
      }
    }
    
    // Generate appropriate badge based on status
    switch (status) {
      case IpStatus.ACTIVE:
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">{statusText}</span>;
      case IpStatus.TEMPORARY:
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{statusText}</span>;
      case IpStatus.EXPIRED:
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">{statusText}</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Unknown</span>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toISOString().split('T')[0];
  };

  return (
    <Card className="mb-8">
      <CardHeader className="py-3 px-4 bg-gray-50 border-b border-gray-200 flex flex-row items-center justify-between">
        <CardTitle className="font-medium text-dark">IP Restrictions</CardTitle>
        <Button size="sm" onClick={() => {
          setShowAddForm(true);
          setShowEditForm(false);
          setEditingIp(null);
        }}>
          <Plus className="h-4 w-4 mr-1.5" /> Add IP
        </Button>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* IP Whitelist Table */}
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-sm text-center text-gray-500">
                    Loading IP whitelist...
                  </td>
                </tr>
              ) : ipWhitelists.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-sm text-center text-gray-500">
                    No IP addresses in whitelist
                  </td>
                </tr>
              ) : (
                ipWhitelists.map((ip) => (
                  <tr key={ip.id}>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono">{ip.ipAddress}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{ip.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(ip.createdAt.toString())}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {ip.expiresAt ? formatDate(ip.expiresAt) : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      {getIpStatusBadge(ip)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="p-1 text-gray-500 hover:text-primary" 
                          title="Edit"
                          onClick={() => handleEditClick(ip)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1 text-gray-500 hover:text-danger" 
                          title="Remove"
                          onClick={() => handleDeleteIp(ip.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* IP Whitelist Form */}
        {showAddForm && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-dark mb-3">Add IP Address to Whitelist</h4>
            <form className="space-y-3" onSubmit={handleAddIp}>
              <div>
                <Label htmlFor="ipAddress">IP Address</Label>
                <Input 
                  type="text" 
                  id="ipAddress" 
                  name="ipAddress"
                  placeholder="e.g. 192.168.1.1"
                  value={formData.ipAddress}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input 
                  type="text" 
                  id="description" 
                  name="description"
                  placeholder="e.g. Office Network"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="expiresAt">Expiry (Optional)</Label>
                <Input 
                  type="date" 
                  id="expiresAt" 
                  name="expiresAt"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.expiresAt}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={handleCancelAdd}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addIpMutation.isPending}
                >
                  {addIpMutation.isPending ? "Adding..." : "Add IP"}
                </Button>
              </div>
            </form>
          </div>
        )}
        
        {/* Edit IP Form */}
        {showEditForm && editingIp && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-dark mb-3">Edit IP Address: {editingIp.ipAddress}</h4>
            <form className="space-y-3" onSubmit={handleEditIp}>
              <div>
                <Label htmlFor="edit-ipAddress">IP Address</Label>
                <Input 
                  type="text" 
                  id="edit-ipAddress" 
                  name="ipAddress"
                  placeholder="e.g. 192.168.1.1"
                  value={formData.ipAddress}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input 
                  type="text" 
                  id="edit-description" 
                  name="description"
                  placeholder="e.g. Office Network"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-expiresAt">Expiry Date (Optional)</Label>
                <Input 
                  type="date" 
                  id="edit-expiresAt" 
                  name="expiresAt"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.expiresAt}
                  onChange={handleInputChange}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for permanent access. Current: {editingIp.expiresAt ? formatDate(editingIp.expiresAt) : "Permanent"}
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateIpMutation.isPending}
                >
                  {updateIpMutation.isPending ? "Updating..." : "Update IP"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IPWhitelist;
