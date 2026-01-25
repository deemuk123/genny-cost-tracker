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
import { useGenerators, useCostReport } from '@/hooks/useGeneratorData';
import { BarChart3, Clock, Fuel, IndianRupee, TrendingUp, Download, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { 
  getCurrentNepaliDate, 
  getNepaliMonthName,
  getFiscalYearMonths,
  getNepaliMonthRange 
} from '@/lib/nepaliCalendar';

export function CostReports() {
  const { data: generators = [], isLoading: loadingGenerators } = useGenerators();
  
  const today = new Date();
  const nepaliDate = getCurrentNepaliDate();
  const [fromDate, setFromDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [filterGeneratorId, setFilterGeneratorId] = useState('all');
  const [periodType, setPeriodType] = useState<'custom' | 'nepali-month' | 'fy'>('custom');
  const [selectedNepaliMonth, setSelectedNepaliMonth] = useState(`${nepaliDate.year}-${nepaliDate.month}`);
  const [selectedFY, setSelectedFY] = useState(nepaliDate.month >= 4 ? nepaliDate.year : nepaliDate.year - 1);

  const { data: costReportData, isLoading: loadingReport } = useCostReport({
    from: fromDate,
    to: toDate,
    generatorId: filterGeneratorId !== 'all' ? filterGeneratorId : undefined,
  });

  // Get available Nepali months for selection
  const nepaliMonthOptions = [];
  for (let y = nepaliDate.year; y >= nepaliDate.year - 2; y--) {
    for (let m = 12; m >= 1; m--) {
      nepaliMonthOptions.push({ year: y, month: m, label: `${getNepaliMonthName(m)} ${y} BS` });
    }
  }

  // Get fiscal year options
  const fyOptions = [];
  for (let y = selectedFY; y >= selectedFY - 3; y--) {
    fyOptions.push({ year: y, label: `FY ${y}/${y + 1}` });
  }

  // Handle period type changes
  const handleNepaliMonthChange = (value: string) => {
    setSelectedNepaliMonth(value);
    const [year, month] = value.split('-').map(Number);
    const range = getNepaliMonthRange(year, month);
    setFromDate(format(range.start, 'yyyy-MM-dd'));
    setToDate(format(range.end, 'yyyy-MM-dd'));
  };

  const handleFYChange = (year: number) => {
    setSelectedFY(year);
    const months = getFiscalYearMonths(year);
    const startRange = getNepaliMonthRange(months[0].year, months[0].month);
    const endRange = getNepaliMonthRange(months[11].year, months[11].month);
    setFromDate(format(startRange.start, 'yyyy-MM-dd'));
    setToDate(format(endRange.end, 'yyyy-MM-dd'));
  };

  const activeGenerators = generators.filter(g => g.is_active);
  const reports = costReportData?.generators || [];
  const grandTotals = costReportData?.totals || { totalHours: 0, totalFuelIssued: 0, totalCost: 0 };
  const avgHourlyCost = grandTotals.totalHours > 0 ? grandTotals.totalCost / grandTotals.totalHours : 0;

  const isLoading = loadingGenerators || loadingReport;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Hours & Cost Report</h1>
        <p className="text-muted-foreground mt-1">
          Analyze running hours, fuel consumption, and costs for any period
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Period Type Selector */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={periodType === 'nepali-month' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => {
                  setPeriodType('nepali-month');
                  handleNepaliMonthChange(selectedNepaliMonth);
                }}
              >
                Nepali Month
              </Button>
              <Button
                variant={periodType === 'fy' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => {
                  setPeriodType('fy');
                  handleFYChange(selectedFY);
                }}
              >
                Fiscal Year
              </Button>
              <Button
                variant={periodType === 'custom' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setPeriodType('custom')}
              >
                Custom Range
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {periodType === 'nepali-month' && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Nepali Month</Label>
                  <Select
                    value={selectedNepaliMonth}
                    onValueChange={handleNepaliMonthChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {nepaliMonthOptions.map(opt => (
                        <SelectItem key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {periodType === 'fy' && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Fiscal Year (Shrawan - Ashadh)</Label>
                  <Select
                    value={selectedFY.toString()}
                    onValueChange={(v) => handleFYChange(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fyOptions.map(opt => (
                        <SelectItem key={opt.year} value={opt.year.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {periodType === 'custom' && (
                <>
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Generator</Label>
                <Select
                  value={filterGeneratorId}
                  onValueChange={setFilterGeneratorId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Generators</SelectItem>
                    {activeGenerators.map(gen => (
                      <SelectItem key={gen.id} value={gen.id}>{gen.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="stat-glow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="text-3xl font-heading font-bold">{grandTotals.totalHours.toFixed(1)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <Clock className="w-6 h-6 text-secondary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Fuel Consumed</p>
                    <p className="text-3xl font-heading font-bold">{grandTotals.totalFuelIssued.toFixed(1)} L</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-fuel-diesel flex items-center justify-center">
                    <Fuel className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Fuel Cost</p>
                    <p className="text-3xl font-heading font-bold">
                      ₹{grandTotals.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                    <IndianRupee className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-secondary/50 bg-secondary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Hourly Cost</p>
                    <p className="text-3xl font-heading font-bold text-secondary">
                      ₹{avgHourlyCost.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-secondary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Generator-wise Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No data available for the selected period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Generator</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Hours Run</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Fuel Used</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">L/Hour</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Fuel Cost</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">₹/Hour</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report) => (
                        <tr key={report.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{report.name}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                report.fuelType === 'diesel' 
                                  ? 'bg-fuel-diesel/10 text-fuel-diesel' 
                                  : 'bg-warning/10 text-warning'
                              }`}>
                                {report.fuelType}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-heading font-bold">
                            {report.totalHours.toFixed(1)} hrs
                          </td>
                          <td className="py-4 px-4 text-right font-heading">
                            {report.totalFuelIssued.toFixed(1)} L
                          </td>
                          <td className="py-4 px-4 text-right">
                            {report.avgConsumption.toFixed(2)}
                          </td>
                          <td className="py-4 px-4 text-right font-heading">
                            ₹{report.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-heading font-bold text-secondary">
                              ₹{report.hourlyCost.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/50">
                        <td className="py-4 px-4 font-bold">Total</td>
                        <td className="py-4 px-4 text-right font-heading font-bold">
                          {grandTotals.totalHours.toFixed(1)} hrs
                        </td>
                        <td className="py-4 px-4 text-right font-heading font-bold">
                          {grandTotals.totalFuelIssued.toFixed(1)} L
                        </td>
                        <td className="py-4 px-4 text-right font-heading">
                          {grandTotals.totalHours > 0 
                            ? (grandTotals.totalFuelIssued / grandTotals.totalHours).toFixed(2)
                            : '-'}
                        </td>
                        <td className="py-4 px-4 text-right font-heading font-bold">
                          ₹{grandTotals.totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-heading font-bold text-secondary">
                            ₹{avgHourlyCost.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insight Cards */}
          {reports.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <Card key={report.id} className="animate-slide-up">
                  <CardContent className="p-6">
                    <h3 className="font-heading font-bold text-lg mb-4">{report.name}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                        <span className="text-sm text-muted-foreground">Hours this period</span>
                        <span className="font-heading font-bold">{report.totalHours.toFixed(1)} hrs</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                        <span className="text-sm text-muted-foreground">Fuel efficiency</span>
                        <span className="font-heading font-bold">{report.avgConsumption.toFixed(2)} L/hr</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded bg-secondary/10 border border-secondary/20">
                        <span className="text-sm font-medium">Cost per hour</span>
                        <span className="font-heading font-bold text-xl text-secondary">
                          ₹{report.hourlyCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
