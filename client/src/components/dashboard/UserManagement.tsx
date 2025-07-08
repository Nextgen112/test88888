import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Trash2, Edit, Plus, User, Shield, Eye, EyeOff } from 'lucide-react';

interface User {
  id: number;
  username: string;
}

interface UserWithIps extends User {
  ipAddresses?: string[];
}

interface UserFormData {
  username: string;
  password: string;
}

export default function UserManagement() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateAdminDialogOpen, setIsCreateAdminDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [usersWithIps, setUsersWithIps] = useState<UserWithIps[]>([]);

  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch IP whitelist to match with users
  const { data: ipWhitelist = [] } = useQuery({
    queryKey: ['/api/ip-whitelist'],
  });

  // Fetch access logs to find user IP associations
  const { data: accessLogs = [] } = useQuery({
    queryKey: ['/api/access-logs'],
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (data: UserFormData) => apiRequest('POST', '/api/users', { ...data, role: 'user' }),
    onSuccess: () => {
      toast({
        title: "User Created",
        description: "New user has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsCreateDialogOpen(false);
      setFormData({ username: '', password: '' });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: (data: UserFormData) => apiRequest('POST', '/api/users', { ...data, role: 'admin' }),
    onSuccess: () => {
      toast({
        title: "Admin Created",
        description: "New admin user has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsCreateAdminDialogOpen(false);
      setFormData({ username: '', password: '' });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create admin",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserFormData> }) => 
      apiRequest('PUT', `/api/users/${id}`, data),
    onSuccess: () => {
      toast({
        title: "User Updated",
        description: "User has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      setFormData({ username: '', password: '' });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/users/${id}`),
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.username && formData.password) {
      createUserMutation.mutate(formData);
    }
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.username && formData.password) {
      createAdminMutation.mutate(formData);
    }
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser && (formData.username || formData.password)) {
      const updateData: Partial<UserFormData> = {};
      
      if (formData.username && formData.username !== editingUser.username) {
        updateData.username = formData.username;
      }
      
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      updateUserMutation.mutate({
        id: editingUser.id,
        data: updateData
      });
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({ username: user.username, password: '' });
    setShowPassword(false);
    setIsEditDialogOpen(true);
  };

  // Process users to include their IP addresses
  React.useEffect(() => {
    const processUsersWithIps = () => {
      const userIpMap: { [key: string]: string[] } = {};
      
      // Get IPs from access logs where users added their IP
      accessLogs.forEach((log: any) => {
        if (log.eventType === 'user_ip_add' && log.userId) {
          const user = users.find(u => u.id === log.userId);
          if (user) {
            if (!userIpMap[user.username]) {
              userIpMap[user.username] = [];
            }
            if (!userIpMap[user.username].includes(log.ipAddress)) {
              userIpMap[user.username].push(log.ipAddress);
            }
          }
        }
      });

      // Also check IP whitelist descriptions for user associations
      ipWhitelist.forEach((ip: any) => {
        const descriptionLower = ip.description.toLowerCase();
        users.forEach(user => {
          if (descriptionLower.includes(user.username.toLowerCase()) || 
              descriptionLower.includes('user:') || 
              descriptionLower.includes(user.username)) {
            if (!userIpMap[user.username]) {
              userIpMap[user.username] = [];
            }
            if (!userIpMap[user.username].includes(ip.ipAddress)) {
              userIpMap[user.username].push(ip.ipAddress);
            }
          }
        });
      });

      const processedUsers = users.map(user => ({
        ...user,
        ipAddresses: userIpMap[user.username] || []
      }));

      setUsersWithIps(processedUsers);
    };

    if (users.length > 0) {
      processUsersWithIps();
    }
  }, [users, ipWhitelist, accessLogs]);

  const handleDeleteUser = (id: number, username: string) => {
    if (confirm(`Are you sure you want to delete user "${username}"?`)) {
      deleteUserMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading users...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage admin users who can access the system
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new regular user to the system
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <Label htmlFor="create-username">Username</Label>
                    <Input
                      id="create-username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Enter username"
                      required
                      minLength={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-password">Password</Label>
                    <Input
                      id="create-password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createUserMutation.isPending}>
                      {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateAdminDialogOpen} onOpenChange={setIsCreateAdminDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Shield className="h-4 w-4 mr-2" />
                  Add Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Admin</DialogTitle>
                  <DialogDescription>
                    Add a new admin user with full system access
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  <div>
                    <Label htmlFor="create-admin-username">Username</Label>
                    <Input
                      id="create-admin-username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Enter admin username"
                      required
                      minLength={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-admin-password">Password</Label>
                    <Input
                      id="create-admin-password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter admin password"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateAdminDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createAdminMutation.isPending}>
                      {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Associated IPs</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersWithIps.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.ipAddresses && user.ipAddresses.length > 0 ? (
                      user.ipAddresses.map((ip, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 text-xs font-mono bg-blue-100 text-blue-800 rounded"
                        >
                          {ip}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500">No IPs assigned</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id, user.username)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {usersWithIps.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No users found. Create your first admin user.
          </div>
        )}
      </CardContent>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update username and/or password for {editingUser?.username}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
                required
                minLength={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-password">New Password (Optional)</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password (leave empty to keep current)"
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to keep current password
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}