import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useGenerators, useFuelIssues, useFuelStock, useAddFuelIssue, useFuelPurchases } from '@/hooks/useGeneratorData';
import { FuelStockLevels } from '@/types/generator';
import { Droplets, AlertTriangle, ArrowRight, Fuel, Loader2, Download, Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { downloadCsv } from '@/lib/csvExport';

export function FuelIssue() {
  const defaultStock: FuelStockLevels = { diesel: 0, petrol: 0 };
  const { data: generators = [], isLoading: loadingGenerators } = useGenerators();
  const { data: fuelIssues = [], isLoading: loadingIssues } = useFuelIssues();
  const { data: fuelStock = defaultStock, isLoading: loadingStock } = useFuelStock();
  const { data: fuelPurchases = [], isLoading: loadingPurchases } = useFuelPurchases();
  const addFuelIssue = useAddFuelIssue();
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    generator_id: '',
    quantity_litres: '',
  });

  const [historyFilter, setHistoryFilter] = useState({
    generator_id: 'all',
    fuel_type: 'all' as 'all' | 'diesel' | 'petrol',
    from: '',
    to: '',
    search: '',
  });

  const [purchaseFilter, setPurchaseFilter] = useState({
    fuel_type: 'all' as 'all' | 'diesel' | 'petrol',
    from: '',
    to: '',
    search: '',
  });

  const activeGenerators = generators.filter(g => g.is_active);
  const selectedGenerator = generators.find(g => g.id === formData.generator_id);

  const sortedIssues = [...fuelIssues].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredIssues = sortedIssues.filter((issue) => {
    const gen = generators.find(g => g.id === issue.generator_id);
    if (historyFilter.generator_id !== 'all' && issue.generator_id !== historyFilter.generator_id) return false;
    if (historyFilter.fuel_type !== 'all' && issue.fuel_type !== historyFilter.fuel_type) return false;
    if (historyFilter.from && issue.date < historyFilter.from) return false;
    if (historyFilter.to && issue.date > historyFilter.to) return false;
    if (historyFilter.search) {
      const q = historyFilter.search.toLowerCase();
      const hay = `${gen?.name ?? ''} ${issue.fuel_type} ${issue.notes ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const totalFiltered = filteredIssues.reduce((s, i) => s + Number(i.quantity_litres || 0), 0);

  const sortedPurchases = [...fuelPurchases].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredPurchases = sortedPurchases.filter((p) => {
    if (purchaseFilter.fuel_type !== 'all' && p.fuel_type !== purchaseFilter.fuel_type) return false;
    if (purchaseFilter.from && p.date < purchaseFilter.from) return false;
    if (purchaseFilter.to && p.date > purchaseFilter.to) return false;
    if (purchaseFilter.search) {
      const q = purchaseFilter.search.toLowerCase();
      const hay = `${p.vendor ?? ''} ${p.invoice_number ?? ''} ${p.fuel_type} ${p.notes ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const totalPurchasedLitres = filteredPurchases.reduce((s, p) => s + Number(p.quantity_litres || 0), 0);
  const totalPurchasedAmount = filteredPurchases.reduce((s, p) => s + Number(p.total_amount || 0), 0);

  const handleExportCsv = () => {
    if (filteredIssues.length === 0) {
      toast({ title: 'Nothing to export', description: 'No issues match the current filters.' });
      return;
    }
    const rows = filteredIssues.map((i) => {
      const gen = generators.find(g => g.id === i.generator_id);
      return {
        Date: i.date,
        Generator: gen?.name ?? 'Unknown',
        'Fuel Type': i.fuel_type,
        'Quantity (L)': Number(i.quantity_litres).toFixed(2),
        'Stock After Issue (L)': i.stock_after_issue != null ? Number(i.stock_after_issue).toFixed(2) : '',
        Notes: i.notes ?? '',
      };
    });
    downloadCsv(`fuel-issues-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`, rows);
  };

  const handleExportPurchasesCsv = () => {
    if (filteredPurchases.length === 0) {
      toast({ title: 'Nothing to export', description: 'No purchases match the current filters.' });
      return;
    }
    const rows = filteredPurchases.map((p) => ({
      Date: p.date,
      'Fuel Type': p.fuel_type,
      'Quantity (L)': Number(p.quantity_litres).toFixed(2),
      'Rate (per L)': Number(p.rate_per_litre).toFixed(2),
      'Total Amount': p.total_amount != null ? Number(p.total_amount).toFixed(2) : '',
      Vendor: p.vendor ?? '',
      'Invoice #': p.invoice_number ?? '',
      Notes: p.notes ?? '',
    }));
    downloadCsv(`fuel-purchases-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`, rows);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.generator_id) {
      toast({
        title: 'Select Generator',
        description: 'Please select a generator to issue fuel to.',
        variant: 'destructive',
      });
      return;
    }

    const quantity = parseFloat(formData.quantity_litres);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a valid quantity.',
        variant: 'destructive',
      });
      return;
    }

    const fuelType = selectedGenerator?.fuel_type || 'diesel';
    const currentStock = fuelStock[fuelType];

    if (quantity > currentStock) {
      toast({
        title: 'Insufficient Stock',
        description: `Only ${currentStock.toFixed(1)} L of ${fuelType} available.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await addFuelIssue.mutateAsync({
        date: formData.date,
        generator_id: formData.generator_id,
        fuel_type: fuelType,
        quantity_litres: quantity,
      });

      toast({
        title: 'Fuel Issued',
        description: `${quantity} L of ${fuelType} issued to ${selectedGenerator?.name}`,
      });

      setFormData(prev => ({
        ...prev,
        generator_id: '',
        quantity_litres: '',
      }));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to issue fuel',
        variant: 'destructive',
      });
    }
  };

  const stockAfterIssue = () => {
    if (!selectedGenerator) return null;
    const quantity = parseFloat(formData.quantity_litres) || 0;
    return fuelStock[selectedGenerator.fuel_type] - quantity;
  };

  const isLoading = loadingGenerators || loadingIssues || loadingStock || loadingPurchases;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Issue Fuel to Generator</h1>
        <p className="text-muted-foreground mt-1">
          Record fuel refills to each generator from your main stock
        </p>
      </div>

      {/* Stock Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-fuel-diesel/30 bg-fuel-diesel/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Diesel Stock</p>
                <p className="text-3xl font-heading font-bold text-fuel-diesel">{fuelStock.diesel.toFixed(1)} L</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-fuel-diesel flex items-center justify-center">
                <Fuel className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Petrol Stock</p>
                <p className="text-3xl font-heading font-bold text-warning">{fuelStock.petrol.toFixed(1)} L</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-warning flex items-center justify-center">
                <Fuel className="w-7 h-7 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issue Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="w-5 h-5" />
              Issue Fuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Select Generator</Label>
                <Select
                  value={formData.generator_id}
                  onValueChange={(value) => setFormData({ ...formData, generator_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a generator" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeGenerators.map((gen) => (
                      <SelectItem key={gen.id} value={gen.id}>
                        <div className="flex items-center gap-2">
                          <span>{gen.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            gen.fuel_type === 'diesel' 
                              ? 'bg-fuel-diesel/10 text-fuel-diesel' 
                              : 'bg-warning/10 text-warning'
                          }`}>
                            {gen.fuel_type}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedGenerator && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <p className="text-muted-foreground">
                    {selectedGenerator.name} uses <span className="font-medium capitalize">{selectedGenerator.fuel_type}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Available: <span className="font-medium">{fuelStock[selectedGenerator.fuel_type].toFixed(1)} L</span>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Quantity (Litres)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g., 50"
                  value={formData.quantity_litres}
                  onChange={(e) => setFormData({ ...formData, quantity_litres: e.target.value })}
                />
              </div>

              {selectedGenerator && formData.quantity_litres && (
                <div className="p-4 rounded-lg bg-accent border border-accent-foreground/10">
                  <div className="flex items-center justify-between text-sm">
                    <span>Current Stock</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span>After Issue</span>
                  </div>
                  <div className="flex items-center justify-between font-heading font-bold text-lg mt-2">
                    <span>{fuelStock[selectedGenerator.fuel_type].toFixed(1)} L</span>
                    <span className={stockAfterIssue()! >= 0 ? 'text-secondary' : 'text-destructive'}>
                      {stockAfterIssue()!.toFixed(1)} L
                    </span>
                  </div>
                </div>
              )}

              {stockAfterIssue() !== null && stockAfterIssue()! < 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Insufficient stock available
                </div>
              )}

              <Button 
                type="submit" 
                variant="secondary" 
                className="w-full" 
                size="lg"
                disabled={!selectedGenerator || stockAfterIssue()! < 0 || addFuelIssue.isPending}
              >
                <Droplets className="w-5 h-5" />
                {addFuelIssue.isPending ? 'Issuing...' : 'Issue Fuel'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Latest 10 quick view */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Issues</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedIssues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No fuel issues recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {sortedIssues.slice(0, 10).map((issue) => {
                  const gen = generators.find(g => g.id === issue.generator_id);
                  return (
                    <div
                      key={issue.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          issue.fuel_type === 'diesel' ? 'bg-fuel-diesel' : 'bg-warning'
                        }`}>
                          <Droplets className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{gen?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(issue.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-heading font-bold">{issue.quantity_litres} L</p>
                        <p className="text-sm text-muted-foreground capitalize">{issue.fuel_type}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Issues — full history with filters & CSV export */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>All Fuel Issues</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredIssues.length} record{filteredIssues.length === 1 ? '' : 's'} • Total {totalFiltered.toFixed(2)} L
              </p>
            </div>
            <Button variant="outline" onClick={handleExportCsv}>
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Generator</Label>
              <Select
                value={historyFilter.generator_id}
                onValueChange={(v) => setHistoryFilter({ ...historyFilter, generator_id: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All generators</SelectItem>
                  {generators.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fuel Type</Label>
              <Select
                value={historyFilter.fuel_type}
                onValueChange={(v) => setHistoryFilter({ ...historyFilter, fuel_type: v as 'all' | 'diesel' | 'petrol' })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="petrol">Petrol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input
                type="date"
                value={historyFilter.from}
                onChange={(e) => setHistoryFilter({ ...historyFilter, from: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input
                type="date"
                value={historyFilter.to}
                onChange={(e) => setHistoryFilter({ ...historyFilter, to: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Generator, notes…"
                  value={historyFilter.search}
                  onChange={(e) => setHistoryFilter({ ...historyFilter, search: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Generator</th>
                  <th className="px-3 py-2 font-medium">Fuel</th>
                  <th className="px-3 py-2 font-medium text-right">Quantity (L)</th>
                  <th className="px-3 py-2 font-medium text-right">Stock After (L)</th>
                  <th className="px-3 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                      No issues match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredIssues.map((issue) => {
                    const gen = generators.find(g => g.id === issue.generator_id);
                    return (
                      <tr key={issue.id} className="border-t hover:bg-muted/30">
                        <td className="px-3 py-2 whitespace-nowrap">{format(new Date(issue.date), 'yyyy-MM-dd')}</td>
                        <td className="px-3 py-2">{gen?.name ?? 'Unknown'}</td>
                        <td className="px-3 py-2 capitalize">{issue.fuel_type}</td>
                        <td className="px-3 py-2 text-right font-medium">{Number(issue.quantity_litres).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {issue.stock_after_issue != null ? Number(issue.stock_after_issue).toFixed(2) : '—'}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{issue.notes ?? ''}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
