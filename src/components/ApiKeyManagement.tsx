import { useState } from 'react';
import { Plus, Copy, Trash2, Key, AlertTriangle, CheckCircle, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/hooks/useGeneratorData';

export function ApiKeyManagement() {
  const { toast } = useToast();
  const { data: apiKeys = [], isLoading } = useApiKeys();
  const createKeyMutation = useCreateApiKey();
  const revokeKeyMutation = useRevokeApiKey();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    permissions: ['reports:read'],
    expiresAt: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createKeyMutation.mutateAsync({
        name: formData.name,
        permissions: formData.permissions,
        expires_at: formData.expiresAt || null,
      });
      setNewKeySecret(result.secretKey);
      toast({ title: 'API key created successfully' });
    } catch (error: any) {
      toast({ title: 'Failed to create API key', description: error.message, variant: 'destructive' });
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeKeyMutation.mutateAsync(id);
      toast({ title: 'API key revoked' });
    } catch (error: any) {
      toast({ title: 'Failed to revoke key', description: error.message, variant: 'destructive' });
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

  const activeKeys = apiKeys.filter((k) => k.is_active);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{apiKeys.length}</p>
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
            API Documentation
          </CardTitle>
          <CardDescription>Use these endpoints to fetch reports from external systems</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Authentication Section */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h4 className="font-semibold text-foreground mb-2">🔐 Authentication</h4>
            <p className="text-sm text-muted-foreground mb-3">
              All API requests require a Bearer token in the Authorization header:
            </p>
            <div className="rounded-lg bg-muted p-3 font-mono text-sm">
              <code className="text-foreground">Authorization: Bearer {'<YOUR_API_KEY>'}</code>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Generate an API key above. Keys with <Badge variant="secondary" className="text-xs">reports:read</Badge> permission can access all report endpoints.
            </p>
          </div>

          {/* Cost Report Endpoint */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              📊 Cost Report API
            </h4>
            <p className="text-sm text-muted-foreground">
              Get aggregated cost data including fuel usage, running hours, and costs per generator.
            </p>
            <div className="rounded-lg bg-muted p-4 font-mono text-sm">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-600">GET</Badge>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`https://rowhywtqfpmnjrodiufu.supabase.co/functions/v1/external-cost-report`)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <code className="text-foreground break-all text-xs">
                https://rowhywtqfpmnjrodiufu.supabase.co/functions/v1/external-cost-report?from=2024-01-01&to=2024-01-31
              </code>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Query Parameters:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><code className="bg-muted px-1 rounded">from</code> - Start date (YYYY-MM-DD) - <span className="text-destructive">Required</span></li>
                <li><code className="bg-muted px-1 rounded">to</code> - End date (YYYY-MM-DD) - <span className="text-destructive">Required</span></li>
                <li><code className="bg-muted px-1 rounded">generatorId</code> - Filter by generator UUID - Optional</li>
              </ul>
            </div>
            <div className="text-sm text-muted-foreground">
              <p><strong>Response includes:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Total running hours per generator</li>
                <li>Total fuel issued (litres)</li>
                <li>Average fuel consumption (litres/hour)</li>
                <li>Total fuel cost and hourly cost</li>
                <li>Grand totals across all generators</li>
              </ul>
            </div>
          </div>

          {/* Hour Readings Endpoint */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              ⏱️ Daily Hour Readings API
            </h4>
            <p className="text-sm text-muted-foreground">
              Get detailed daily hour meter readings with opening/closing hours for each generator.
            </p>
            <div className="rounded-lg bg-muted p-4 font-mono text-sm">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-600">GET</Badge>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`https://rowhywtqfpmnjrodiufu.supabase.co/functions/v1/external-hour-readings`)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <code className="text-foreground break-all text-xs">
                https://rowhywtqfpmnjrodiufu.supabase.co/functions/v1/external-hour-readings?from=2024-01-01&to=2024-01-31
              </code>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Query Parameters:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><code className="bg-muted px-1 rounded">from</code> - Start date (YYYY-MM-DD) - <span className="text-destructive">Required</span></li>
                <li><code className="bg-muted px-1 rounded">to</code> - End date (YYYY-MM-DD) - <span className="text-destructive">Required</span></li>
              </ul>
            </div>
            <div className="text-sm text-muted-foreground">
              <p><strong>Response includes:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>List of active generators with IDs and names</li>
                <li>Daily readings grouped by date</li>
                <li>Opening hour, closing hour, and hours run per generator per day</li>
                <li>Total hours by generator and grand total</li>
              </ul>
            </div>
          </div>

          {/* Example Response */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              📋 Example cURL Request
            </h4>
            <div className="rounded-lg bg-muted p-4 font-mono text-xs overflow-x-auto">
              <pre className="text-foreground whitespace-pre-wrap">{`curl -X GET \\
  "https://rowhywtqfpmnjrodiufu.supabase.co/functions/v1/external-hour-readings?from=2024-01-01&to=2024-01-31" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</pre>
            </div>
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
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No API keys created yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
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
                      <code className="text-sm text-muted-foreground">{key.key_prefix}...</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={key.is_active ? 'default' : 'secondary'}>
                          {key.is_active ? 'Active' : 'Revoked'}
                        </Badge>
                        {key.expires_at && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expires {new Date(key.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      {key.is_active && (
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
                                onClick={() => handleRevoke(key.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
