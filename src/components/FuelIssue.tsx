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
import { useGeneratorStore } from '@/store/generatorStore';
import { Droplets, AlertTriangle, ArrowRight, Fuel } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export function FuelIssue() {
  const { generators, fuelIssues, fuelStock, addFuelIssue } = useGeneratorStore();
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    generatorId: '',
    quantity: '',
  });

  const activeGenerators = generators.filter(g => g.isActive);
  const selectedGenerator = generators.find(g => g.id === formData.generatorId);
  
  const recentIssues = [...fuelIssues]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.generatorId) {
      toast({
        title: 'Select Generator',
        description: 'Please select a generator to issue fuel to.',
        variant: 'destructive',
      });
      return;
    }

    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a valid quantity.',
        variant: 'destructive',
      });
      return;
    }

    const fuelType = selectedGenerator?.fuelType || 'diesel';
    const currentStock = fuelStock[fuelType];

    if (quantity > currentStock) {
      toast({
        title: 'Insufficient Stock',
        description: `Only ${currentStock.toFixed(1)} L of ${fuelType} available.`,
        variant: 'destructive',
      });
      return;
    }

    addFuelIssue({
      date: formData.date,
      generatorId: formData.generatorId,
      fuelType,
      quantity,
    });

    toast({
      title: 'Fuel Issued',
      description: `${quantity} L of ${fuelType} issued to ${selectedGenerator?.name}`,
    });

    setFormData(prev => ({
      ...prev,
      generatorId: '',
      quantity: '',
    }));
  };

  const stockAfterIssue = () => {
    if (!selectedGenerator) return null;
    const quantity = parseFloat(formData.quantity) || 0;
    return fuelStock[selectedGenerator.fuelType] - quantity;
  };

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
                  value={formData.generatorId}
                  onValueChange={(value) => setFormData({ ...formData, generatorId: value })}
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
                            gen.fuelType === 'diesel' 
                              ? 'bg-fuel-diesel/10 text-fuel-diesel' 
                              : 'bg-warning/10 text-warning'
                          }`}>
                            {gen.fuelType}
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
                    {selectedGenerator.name} uses <span className="font-medium capitalize">{selectedGenerator.fuelType}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Available: <span className="font-medium">{fuelStock[selectedGenerator.fuelType].toFixed(1)} L</span>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Quantity (Litres)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g., 50"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>

              {selectedGenerator && formData.quantity && (
                <div className="p-4 rounded-lg bg-accent border border-accent-foreground/10">
                  <div className="flex items-center justify-between text-sm">
                    <span>Current Stock</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span>After Issue</span>
                  </div>
                  <div className="flex items-center justify-between font-heading font-bold text-lg mt-2">
                    <span>{fuelStock[selectedGenerator.fuelType].toFixed(1)} L</span>
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
                disabled={!selectedGenerator || stockAfterIssue()! < 0}
              >
                <Droplets className="w-5 h-5" />
                Issue Fuel
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Issues</CardTitle>
          </CardHeader>
          <CardContent>
            {recentIssues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No fuel issues recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentIssues.map((issue) => {
                  const gen = generators.find(g => g.id === issue.generatorId);
                  return (
                    <div 
                      key={issue.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          issue.fuelType === 'diesel' ? 'bg-fuel-diesel' : 'bg-warning'
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
                        <p className="font-heading font-bold">{issue.quantity} L</p>
                        <p className="text-sm text-muted-foreground capitalize">{issue.fuelType}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
