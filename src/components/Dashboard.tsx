import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGenerators, useHourReadings, useFuelStock, useFuelIssues } from '@/hooks/useGeneratorData';
import { Clock, Fuel, Zap, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { 
  getCurrentNepaliDate, 
  getNepaliMonthName, 
  getFiscalYear,
  formatBothDates 
} from '@/lib/nepaliCalendar';

export function Dashboard() {
  const { data: generators = [], isLoading: loadingGenerators } = useGenerators();
  const defaultStock = { diesel: 0, petrol: 0 };
  const { data: fuelStock = defaultStock, isLoading: loadingStock } = useFuelStock();
  
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const todayStr = format(today, 'yyyy-MM-dd');
  
  const { data: hourReadings = [], isLoading: loadingReadings } = useHourReadings({
    from: format(monthStart, 'yyyy-MM-dd'),
    to: format(monthEnd, 'yyyy-MM-dd'),
  });
  
  const { data: fuelIssues = [], isLoading: loadingIssues } = useFuelIssues();
  
  const activeGenerators = generators.filter(g => g.is_active);
  
  // Calculate this month's total hours
  const thisMonthHours = hourReadings.reduce((total, reading) => {
    return total + (reading.hours_run || 0);
  }, 0);

  // Get today's readings
  const todayReadings = hourReadings.filter(r => r.date === todayStr);

  // Generators without today's reading
  const generatorsNeedingEntry = activeGenerators.filter(
    gen => !todayReadings.find(r => r.generator_id === gen.id)
  );

  // Recent fuel issues
  const recentIssues = [...fuelIssues]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const isLoading = loadingGenerators || loadingStock || loadingReadings || loadingIssues;

  const stats = [
    {
      title: 'Active Generators',
      value: activeGenerators.length,
      icon: Zap,
      color: 'bg-secondary/10 text-secondary',
      iconBg: 'bg-secondary',
    },
    {
      title: 'Hours This Month',
      value: `${thisMonthHours.toFixed(1)} hrs`,
      icon: Clock,
      color: 'bg-primary/10 text-primary',
      iconBg: 'bg-primary',
    },
    {
      title: 'Diesel Stock',
      value: `${fuelStock.diesel.toFixed(1)} L`,
      icon: Fuel,
      color: 'bg-fuel-diesel/10 text-fuel-diesel',
      iconBg: 'bg-fuel-diesel',
    },
    {
      title: 'Petrol Stock',
      value: `${fuelStock.petrol.toFixed(1)} L`,
      icon: Fuel,
      color: 'bg-warning/10 text-warning',
      iconBg: 'bg-warning',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview for {getNepaliMonthName(getCurrentNepaliDate().month)} {getCurrentNepaliDate().year} BS
          <span className="text-muted-foreground/70"> • {format(today, 'MMMM yyyy')}</span>
        </p>
        <p className="text-sm text-primary mt-1">
          {getFiscalYear(today)}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={stat.title} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-heading font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert for missing entries */}
      {generatorsNeedingEntry.length > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-warning flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-warning-foreground" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-foreground">Pending Hour Entries</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {generatorsNeedingEntry.length} generator(s) need today's closing hour reading:
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {generatorsNeedingEntry.map(gen => (
                    <span
                      key={gen.id}
                      className="px-3 py-1 bg-warning/20 text-warning-foreground rounded-full text-sm font-medium"
                    >
                      {gen.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generator Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {activeGenerators.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <Zap className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <h3 className="font-heading font-semibold text-lg mt-4">No Generators Yet</h3>
              <p className="text-muted-foreground mt-1">
                Add your first generator to start tracking hours and costs.
              </p>
            </CardContent>
          </Card>
        ) : (
          activeGenerators.map((gen, index) => {
            const genReadings = hourReadings.filter(r => r.generator_id === gen.id);
            const monthHours = genReadings.reduce((sum, r) => sum + (r.hours_run || 0), 0);
            const todayReading = todayReadings.find(r => r.generator_id === gen.id);
            
            return (
              <Card 
                key={gen.id} 
                className="animate-slide-up"
                style={{ animationDelay: `${(index + 4) * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{gen.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{gen.location}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      gen.fuel_type === 'diesel' 
                        ? 'bg-fuel-diesel/10 text-fuel-diesel' 
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {gen.fuel_type.charAt(0).toUpperCase() + gen.fuel_type.slice(1)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Capacity</span>
                      <span className="font-medium">{gen.capacity_kva} kVA</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Hours this month</span>
                      <span className="font-heading font-bold text-secondary">{monthHours.toFixed(1)} hrs</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Today's entry</span>
                      {todayReading ? (
                        <span className="text-sm font-medium text-success">
                          ✓ {(todayReading.hours_run || 0).toFixed(1)} hrs
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-warning">Pending</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Recent Activity */}
      {recentIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Fuel Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentIssues.map(issue => {
                const gen = generators.find(g => g.id === issue.generator_id);
                return (
                  <div 
                    key={issue.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        issue.fuel_type === 'diesel' ? 'bg-fuel-diesel' : 'bg-warning'
                      }`}>
                        <Fuel className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{gen?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                          {formatBothDates(new Date(issue.date))}
                        </p>
                      </div>
                    </div>
                    <span className="font-heading font-bold">{issue.quantity_litres} L</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
