import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, UserX, UserCheck, Search, Shield, Crown, Wrench, Eye, Gauge } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { userApi } from '@/services/userApi';
import { User, UserRole, CreateUserRequest } from '@/types/user';
import { useAuth } from '@/hooks/useAuth';

const roleConfig: Record<UserRole, { label: string; icon: typeof Crown; color: string }> = {
  super_admin: { label: 'Super Admin', icon: Crown, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  admin: { label: 'Admin', icon: Shield, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  maintenance: { label: 'Maintenance', icon: Wrench, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  operator: { label: 'Operator', icon: Gauge, color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  viewer: { label: 'Viewer', icon: Eye, color: 'bg-muted text-muted-foreground border-border' },
};


export function UserManagement() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    name: '',
    role: 'viewer',
  });

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.getAll,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User created successfully' });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create user', description: error.message, variant: 'destructive' });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User updated successfully' });
      setEditingUser(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update user', description: error.message, variant: 'destructive' });
    },
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? userApi.deactivate(id) : userApi.reactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User status updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update status', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({ email: '', name: '', role: 'viewer' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: formData });
    } else {
      createUserMutation.mutate(formData);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ email: user.email, name: user.name, role: user.role });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEditRole = (targetRole: UserRole): boolean => {
    // Only super_admin can assign admin or super_admin roles
    if (currentUser?.role !== 'super_admin' && (targetRole === 'admin' || targetRole === 'super_admin')) {
      return false;
    }
    return true;
  };

  const getRoleOptions = (): UserRole[] => {
    if (currentUser?.role === 'super_admin') {
      return ['admin', 'maintenance', 'operator', 'viewer'];
    }
    return ['maintenance', 'operator', 'viewer'];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage user accounts and role assignments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account with assigned role</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {getRoleOptions().map((role) => {
                        const config = roleConfig[role];
                        return (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              <config.icon className="w-4 h-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{users.filter((u) => u.isActive).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Maintenance Team</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {users.filter((u) => u.role === 'maintenance').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Operators</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {users.filter((u) => u.role === 'operator').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const config = roleConfig[user.role];
                const RoleIcon = config.icon;
                const isSelf = user.id === currentUser?.id;
                const isSuperAdmin = user.role === 'super_admin';

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`gap-1 ${config.color}`}>
                        <RoleIcon className="w-3 h-3" />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog
                          open={editingUser?.id === user.id}
                          onOpenChange={(open) => !open && setEditingUser(null)}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                              disabled={isSuperAdmin && !isSelf}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit User</DialogTitle>
                              <DialogDescription>Update user information and role</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-email">Email</Label>
                                  <Input id="edit-email" type="email" value={formData.email} disabled />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-name">Full Name</Label>
                                  <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                  />
                                </div>
                                {!isSuperAdmin && (
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-role">Role</Label>
                                    <Select
                                      value={formData.role}
                                      onValueChange={(value: UserRole) =>
                                        setFormData({ ...formData, role: value })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getRoleOptions().map((role) => {
                                          const cfg = roleConfig[role];
                                          return (
                                            <SelectItem key={role} value={role}>
                                              <div className="flex items-center gap-2">
                                                <cfg.icon className="w-4 h-4" />
                                                {cfg.label}
                                              </div>
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={updateUserMutation.isPending}>
                                  {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatusMutation.mutate({ id: user.id, isActive: user.isActive })}
                          disabled={isSelf || isSuperAdmin}
                        >
                          {user.isActive ? (
                            <UserX className="w-4 h-4 text-destructive" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
