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
import { FuelType } from '@/types/generator';
import { Fuel, Plus, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export function FuelPurchase() {
  const { fuelPurchases, fuelStock, addFuelPurchase } = useGeneratorStore();
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    fuelType: 'diesel' as FuelType,
    quantity: '',
    ratePerLitre: '',
    vendor: '',
  });

  const recentPurchases = [...fuelPurchases]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantity = parseFloat(formData.quantity);
    const rate = parseFloat(formData.ratePerLitre);

    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a valid quantity.',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(rate) || rate <= 0) {
      toast({
        title: 'Invalid Rate',
        description: 'Please enter a valid rate per litre.',
        variant: 'destructive',
      });
      return;
    }

    addFuelPurchase({
      date: formData.date,
      fuelType: formData.fuelType,
      quantity,
      ratePerLitre: rate,
      vendor: formData.vendor || undefined,
    });

    toast({
      title: 'Purchase Recorded',
      description: `Added ${quantity} L of ${formData.fuelType} at ₹${rate}/L`,
    });

    setFormData(prev => ({
      ...prev,
      quantity: '',
      ratePerLitre: '',
      vendor: '',
    }));
  };

  const totalAmount = () => {
    const qty = parseFloat(formData.quantity) || 0;
    const rate = parseFloat(formData.ratePerLitre) || 0;
    return qty * rate;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Fuel Purchase</h1>
        <p className="text-muted-foreground mt-1">
          Record fuel purchases to update your main stock
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
        {/* Purchase Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Record Purchase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fuel Type</Label>
                  <Select
                    value={formData.fuelType}
                    onValueChange={(value: FuelType) => setFormData({ ...formData, fuelType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="petrol">Petrol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity (Litres)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 500"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rate per Litre (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 89.50"
                    value={formData.ratePerLitre}
                    onChange={(e) => setFormData({ ...formData, ratePerLitre: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vendor (Optional)</Label>
                <Input
                  placeholder="e.g., Indian Oil"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                />
              </div>

              {totalAmount() > 0 && (
                <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Amount</span>
                    <span className="font-heading font-bold text-2xl text-secondary">
                      ₹{totalAmount().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              <Button type="submit" variant="secondary" className="w-full" size="lg">
                <Plus className="w-5 h-5" />
                Record Purchase
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Purchases */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPurchases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No purchases recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentPurchases.map((purchase) => (
                  <div 
                    key={purchase.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        purchase.fuelType === 'diesel' ? 'bg-fuel-diesel' : 'bg-warning'
                      }`}>
                        <Fuel className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium capitalize">{purchase.fuelType}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(purchase.date), 'MMM dd, yyyy')}
                          {purchase.vendor && ` • ${purchase.vendor}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-heading font-bold">{purchase.quantity} L</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{purchase.totalAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
