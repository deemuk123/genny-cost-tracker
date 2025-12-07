import { useState, useMemo } from 'react';
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
import { BarChart3, Check, TrendingUp, TrendingDown } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { 
  getCurrentNepaliDate,
  getNepaliMonthName,
  getNepaliMonthRange,
  NEPALI_MONTHS
} from '@/lib/nepaliCalendar';

export function MonthlyStock() {
  const { 
    fuelPurchases, 
    fuelIssues, 
    fuelStock, 
    monthlyStockChecks,
    addMonthlyStockCheck 
  } = useGeneratorStore();
  
  const nepaliDate = getCurrentNepaliDate();
  const [selectedNepaliMonth, setSelectedNepaliMonth] = useState(`${nepaliDate.year}-${nepaliDate.month}`);
  const [fuelType, setFuelType] = useState<FuelType>('diesel');
  const [physicalStock, setPhysicalStock] = useState('');

  // Parse selected Nepali month
  const [selectedYear, selectedMonth] = selectedNepaliMonth.split('-').map(Number);
  
  // Get the date range for the selected Nepali month
  const { start: monthStart, end: monthEnd } = getNepaliMonthRange(selectedYear, selectedMonth);

  // Generate Nepali month options
  const nepaliMonthOptions = [];
  for (let y = nepaliDate.year; y >= nepaliDate.year - 2; y--) {
    for (let m = 12; m >= 1; m--) {
      nepaliMonthOptions.push({ 
        year: y, 
        month: m, 
        value: `${y}-${m}`,
        label: `${getNepaliMonthName(m)} ${y} BS` 
      });
    }
  }

  // Calculate stock movement for the month
  const stockMovement = useMemo(() => {
    // Get previous month's closing as opening
    const prevMonth = subMonths(monthStart, 1);
    const prevCheck = monthlyStockChecks.find(
      c => c.fuelType === fuelType && 
      format(new Date(c.date), 'yyyy-MM') === format(prevMonth, 'yyyy-MM')
    );
    const opening = prevCheck?.physicalClosing || 0;

    // Calculate purchases for this month
    const purchases = fuelPurchases
      .filter(p => {
        const date = new Date(p.date);
        return p.fuelType === fuelType && date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, p) => sum + p.quantity, 0);

    // Calculate issues for this month
    const issues = fuelIssues
      .filter(i => {
        const date = new Date(i.date);
        return i.fuelType === fuelType && date >= monthStart && date <= monthEnd;
      })
      .reduce((sum, i) => sum + i.quantity, 0);

    const theoretical = opening + purchases - issues;

    return {
      opening,
      purchases,
      issues,
      theoretical,
    };
  }, [selectedMonth, fuelType, fuelPurchases, fuelIssues, monthlyStockChecks, monthStart, monthEnd]);

  // Check if there's already a stock check for this month
  const existingCheck = monthlyStockChecks.find(
    c => c.fuelType === fuelType && format(new Date(c.date), 'yyyy-MM') === format(monthEnd, 'yyyy-MM')
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const physical = parseFloat(physicalStock);
    if (isNaN(physical) || physical < 0) {
      toast({
        title: 'Invalid Stock',
        description: 'Please enter a valid physical stock count.',
        variant: 'destructive',
      });
      return;
    }

    addMonthlyStockCheck({
      date: format(monthEnd, 'yyyy-MM-dd'),
      fuelType,
      openingStock: stockMovement.opening,
      totalPurchases: stockMovement.purchases,
      totalIssues: stockMovement.issues,
      theoreticalClosing: stockMovement.theoretical,
      physicalClosing: physical,
      variance: physical - stockMovement.theoretical,
    });

    toast({
      title: 'Stock Check Saved',
      description: `Monthly stock check for ${fuelType} recorded.`,
    });

    setPhysicalStock('');
  };

  const variance = existingCheck 
    ? existingCheck.variance 
    : (physicalStock ? parseFloat(physicalStock) - stockMovement.theoretical : 0);

  // Recent stock checks
  const recentChecks = [...monthlyStockChecks]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Monthly Fuel Stock</h1>
        <p className="text-muted-foreground mt-1">
          Perform physical stock count and compare with theoretical balance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Check Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Stock Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nepali Month</Label>
                  <Select
                    value={selectedNepaliMonth}
                    onValueChange={setSelectedNepaliMonth}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {nepaliMonthOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {format(monthStart, 'MMM d')} - {format(monthEnd, 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Fuel Type</Label>
                  <Select
                    value={fuelType}
                    onValueChange={(value: FuelType) => setFuelType(value)}
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

              {/* Stock Movement Summary */}
              <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Opening Stock</span>
                  <span className="font-heading font-bold">{stockMovement.opening.toFixed(1)} L</span>
                </div>
                <div className="flex justify-between items-center text-secondary">
                  <span className="text-sm">+ Purchases</span>
                  <span className="font-heading font-bold">{stockMovement.purchases.toFixed(1)} L</span>
                </div>
                <div className="flex justify-between items-center text-destructive">
                  <span className="text-sm">- Issues to DGs</span>
                  <span className="font-heading font-bold">{stockMovement.issues.toFixed(1)} L</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-sm font-medium">Theoretical Closing</span>
                  <span className="font-heading font-bold text-lg">{stockMovement.theoretical.toFixed(1)} L</span>
                </div>
              </div>

              {existingCheck ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Check className="w-5 h-5 text-success" />
                      <span className="font-medium">Stock Check Completed</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Physical Stock</span>
                        <span className="font-heading font-bold">{existingCheck.physicalClosing.toFixed(1)} L</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Variance</span>
                        <span className={`font-heading font-bold flex items-center gap-1 ${
                          existingCheck.variance > 0 ? 'text-success' : 
                          existingCheck.variance < 0 ? 'text-destructive' : ''
                        }`}>
                          {existingCheck.variance > 0 ? <TrendingUp className="w-4 h-4" /> : 
                           existingCheck.variance < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                          {existingCheck.variance > 0 ? '+' : ''}{existingCheck.variance.toFixed(1)} L
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Physical Stock Count (Litres)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Enter actual stock count"
                      value={physicalStock}
                      onChange={(e) => setPhysicalStock(e.target.value)}
                    />
                  </div>

                  {physicalStock && (
                    <div className={`p-4 rounded-lg border ${
                      variance > 0 ? 'bg-success/10 border-success/20' :
                      variance < 0 ? 'bg-destructive/10 border-destructive/20' :
                      'bg-muted/50 border-border'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Variance</span>
                        <span className={`font-heading font-bold text-xl flex items-center gap-1 ${
                          variance > 0 ? 'text-success' : 
                          variance < 0 ? 'text-destructive' : ''
                        }`}>
                          {variance > 0 ? <TrendingUp className="w-5 h-5" /> : 
                           variance < 0 ? <TrendingDown className="w-5 h-5" /> : null}
                          {variance > 0 ? '+' : ''}{variance.toFixed(1)} L
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {variance > 0 ? 'Gain - More fuel than expected' :
                         variance < 0 ? 'Loss - Less fuel than expected' :
                         'Perfect match!'}
                      </p>
                    </div>
                  )}

                  <Button type="submit" variant="secondary" className="w-full" size="lg">
                    <Check className="w-5 h-5" />
                    Save Stock Check
                  </Button>
                </>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Recent Stock Checks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Stock Checks</CardTitle>
          </CardHeader>
          <CardContent>
            {recentChecks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No stock checks recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentChecks.map((check) => (
                  <div 
                    key={check.id}
                    className="p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          check.fuelType === 'diesel' 
                            ? 'bg-fuel-diesel/10 text-fuel-diesel' 
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {check.fuelType}
                        </span>
                        <span className="font-medium">
                          {format(new Date(check.date), 'MMM yyyy')}
                        </span>
                      </div>
                      <span className={`font-heading font-bold flex items-center gap-1 ${
                        check.variance > 0 ? 'text-success' : 
                        check.variance < 0 ? 'text-destructive' : ''
                      }`}>
                        {check.variance > 0 ? '+' : ''}{check.variance.toFixed(1)} L
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>Theoretical: {check.theoreticalClosing.toFixed(1)} L</div>
                      <div>Physical: {check.physicalClosing.toFixed(1)} L</div>
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
