import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Copy, Trash2, Key, AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiKeyApi } from '@/services/userApi';
import { ApiKey, CreateApiKeyRequest } from '@/types/user';

// Mock data for development
const mockApiKeys: ApiKey[] = [
  {
    id: '1',
    name: 'ERP System Integration',
    keyPrefix: 'gk_live_8x',
    permissions: ['reports:read'],
    createdBy: '1',
    createdByName: 'Deepesh K. Sharma',
    isActive: true,
    createdAt: '2024-01-15',
    lastUsedAt: '2024-03-10',
  },
  {
    id: '2',
    name: 'Analytics Dashboard',
    keyPrefix: 'gk_live_4y',
    permissions: ['reports:read'],
    createdBy: '1',
    createdByName: 'Deepesh K. Sharma',
    isActive: true,
    createdAt: '2024-02-20',
    expiresAt: '2025-02-20',
  },
];

export function ApiKeyManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const useApi = import.meta.env.VITE_USE_API === 'true';

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateApiKeyRequest>({
    name: '',
    permissions: ['reports:read'],
    expiresAt: '',
  });

  // Fetch API keys
  const { data: apiKeys = mockApiKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiKeyApi.getAll,
    enabled: useApi,
  });

  // Create API key mutation
  const createKeyMutation = useMutation({
    mutationFn: apiKeyApi.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setNewKeySecret(response.secretKey);
      toast({ title: 'API key created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create API key', description: error.message, variant: 'destructive' });
    },
  });

  // Revoke API key mutation
  const revokeKeyMutation = useMutation({
    mutationFn: apiKeyApi.revoke,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast({ title: 'API key revoked' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to revoke key', description: error.message, variant: 'destructive' });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo, generate a mock key
    if (!useApi) {
      const mockSecretKey = `gk_live_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 34)}`;
      setNewKeySecret(mockSecretKey);
      toast({ title: 'API key created successfully' });
    } else {
      createKeyMutation.mutate(formData);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setNewKeySecret(null);
    setFormData({ name: '', permissions: ['reports:read'], expiresAt: '' });
  };

  const activeKeys = apiKeys.filter((k) => k.isActive);
  const totalRequests = 1247; // Mock data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">API Keys</h1>
          <p className="text-muted-foreground mt-1">Manage API keys for external system integrations</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Generate API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            {!newKeySecret ? (
              <>
                <DialogHeader>
                  <DialogTitle>Generate New API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key for external system integration
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="key-name">Key Name</Label>
                      <Input
                        id="key-name"
                        placeholder="e.g., ERP System Integration"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        A descriptive name to identify this API key
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expires">Expiration (Optional)</Label>
                      <Input
                        id="expires"
                        type="date"
                        value={formData.expiresAt}
                        onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty for non-expiring key
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/50 p-4">
                      <h4 className="font-medium text-sm mb-2">Permissions</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">reports:read</Badge>
                        <span className="text-xs text-muted-foreground">Cost report access</span>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={closeCreateDialog}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createKeyMutation.isPending}>
                      {createKeyMutation.isPending ? 'Generating...' : 'Generate Key'}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    API Key Created
                  </DialogTitle>
                  <DialogDescription>
                    Copy your API key now. You won't be able to see it again!
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-700">
                        This is the only time you'll see this API key. Store it securely!
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Your API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newKeySecret}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(newKeySecret)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={closeCreateDialog}>Done</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeKeys.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalRequests.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rate Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">100/hr</p>
          </CardContent>
        </Card>
      </div>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            API Endpoint
          </CardTitle>
          <CardDescription>Use this endpoint to fetch cost reports from external systems</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4 font-mono text-sm">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-600">GET</Badge>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard('/api/generator/external/cost-report')}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <code className="text-foreground">/api/generator/external/cost-report?from=2024-01-01&to=2024-01-31</code>
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p><strong>Headers:</strong> Authorization: Bearer {'<API_KEY>'}</p>
            <p><strong>Query Parameters:</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li><code>from</code> - Start date (YYYY-MM-DD) - Required</li>
              <li><code>to</code> - End date (YYYY-MM-DD) - Required</li>
              <li><code>generatorId</code> - Filter by generator ID - Optional</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Active and revoked API keys</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{key.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm text-muted-foreground">{key.keyPrefix}...</code>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{key.createdByName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={key.isActive ? 'default' : 'secondary'}>
                        {key.isActive ? 'Active' : 'Revoked'}
                      </Badge>
                      {key.expiresAt && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires {new Date(key.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell className="text-right">
                    {key.isActive && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to revoke this API key? Any systems using this key will
                              immediately lose access. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => revokeKeyMutation.mutate(key.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Revoke Key
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
