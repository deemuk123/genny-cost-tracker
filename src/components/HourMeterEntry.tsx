import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGenerators, useHourReadings, useAddHourReading, useLastHourReading } from '@/hooks/useGeneratorData';
import { hourReadingApi } from '@/services/api';
import { Clock, AlertCircle, Check, ArrowRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

export function HourMeterEntry() {
  const { data: generators = [], isLoading: loadingGenerators } = useGenerators();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [openingHours, setOpeningHours] = useState<Record<string, number>>({});
  
  const { data: hourReadings = [], isLoading: loadingReadings } = useHourReadings();
  const addHourReading = useAddHourReading();
  
  const activeGenerators = generators.filter(g => g.is_active);

  // Fetch opening hours for all active generators
  useEffect(() => {
    const fetchOpeningHours = async () => {
      const hours: Record<string, number> = {};
      for (const gen of activeGenerators) {
        try {
          const lastReading = await hourReadingApi.getLastReading(gen.id);
          hours[gen.id] = lastReading;
        } catch {
          hours[gen.id] = gen.initial_hour_reading || 0;
        }
      }
      setOpeningHours(hours);
    };
    
    if (activeGenerators.length > 0) {
      fetchOpeningHours();
    }
  }, [activeGenerators.length]);

  const getOpeningHour = (generatorId: string) => {
    return openingHours[generatorId] ?? 0;
  };

  const hasEntryForDate = (generatorId: string, date: string) => {
    return hourReadings.some(r => r.generator_id === generatorId && r.date === date);
  };

  const handleSubmit = async (generatorId: string) => {
    const closingHour = parseFloat(entries[generatorId]);
    const openingHour = getOpeningHour(generatorId);
    
    if (isNaN(closingHour)) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid closing hour reading.',
        variant: 'destructive',
      });
      return;
    }

    if (closingHour < openingHour) {
      toast({
        title: 'Invalid Reading',
        description: 'Closing hour must be greater than or equal to opening hour.',
        variant: 'destructive',
      });
      return;
    }

    if (hasEntryForDate(generatorId, selectedDate)) {
      toast({
        title: 'Entry Exists',
        description: 'An entry for this date already exists.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addHourReading.mutateAsync({
        generator_id: generatorId,
        date: selectedDate,
        opening_hour: openingHour,
        closing_hour: closingHour,
      });

      const gen = generators.find(g => g.id === generatorId);
      const hoursRun = closingHour - openingHour;
      
      toast({
        title: 'Entry Saved',
        description: `${gen?.name} ran for ${hoursRun.toFixed(1)} hours.`,
      });

      setEntries(prev => ({ ...prev, [generatorId]: '' }));
      // Update opening hours for next entry
      setOpeningHours(prev => ({ ...prev, [generatorId]: closingHour }));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save entry',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitAll = async () => {
    let successCount = 0;
    
    for (const gen of activeGenerators) {
      if (entries[gen.id] && !hasEntryForDate(gen.id, selectedDate)) {
        const closingHour = parseFloat(entries[gen.id]);
        const openingHour = getOpeningHour(gen.id);
        
        if (!isNaN(closingHour) && closingHour >= openingHour) {
          try {
            await addHourReading.mutateAsync({
              generator_id: gen.id,
              date: selectedDate,
              opening_hour: openingHour,
              closing_hour: closingHour,
            });
            successCount++;
            setOpeningHours(prev => ({ ...prev, [gen.id]: closingHour }));
          } catch (error) {
            console.error(`Failed to save entry for ${gen.name}:`, error);
          }
        }
      }
    }

    if (successCount > 0) {
      toast({
        title: 'Entries Saved',
        description: `Successfully saved ${successCount} entry(s).`,
      });
      setEntries({});
    } else {
      toast({
        title: 'No Entries',
        description: 'No valid entries to save.',
        variant: 'destructive',
      });
    }
  };

  const isLoading = loadingGenerators || loadingReadings;

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
        <h1 className="text-3xl font-heading font-bold text-foreground">Daily Hour Meter Entry</h1>
        <p className="text-muted-foreground mt-1">
          Enter closing hour readings for each generator. Opening hours are auto-filled.
        </p>
      </div>

      {/* Date Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="date" className="text-sm text-muted-foreground">Entry Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 max-w-xs"
              />
            </div>
            <Button 
              variant="secondary" 
              size="lg"
              onClick={handleSubmitAll}
              disabled={activeGenerators.length === 0 || addHourReading.isPending}
            >
              <Check className="w-5 h-5" />
              Save All Entries
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generator Entries */}
      {activeGenerators.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <h3 className="font-heading font-semibold text-lg mt-4">No Generators Available</h3>
            <p className="text-muted-foreground mt-1">
              Add generators first to start recording hour readings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeGenerators.map((gen, index) => {
            const openingHour = getOpeningHour(gen.id);
            const hasEntry = hasEntryForDate(gen.id, selectedDate);
            const existingEntry = hourReadings.find(
              r => r.generator_id === gen.id && r.date === selectedDate
            );

            return (
              <Card 
                key={gen.id}
                className={`animate-slide-up ${hasEntry ? 'border-success/50 bg-success/5' : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {gen.name}
                        {hasEntry && <Check className="w-5 h-5 text-success" />}
                      </CardTitle>
                      <CardDescription>{gen.location}</CardDescription>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      gen.fuel_type === 'diesel' 
                        ? 'bg-fuel-diesel/10 text-fuel-diesel' 
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {gen.fuel_type}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {hasEntry ? (
                    <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Opening</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Closing</span>
                      </div>
                      <div className="flex items-center justify-between font-heading font-bold text-lg">
                        <span>{existingEntry?.opening_hour.toFixed(1)}</span>
                        <span className="text-success">{existingEntry?.closing_hour.toFixed(1)}</span>
                      </div>
                      <div className="text-center mt-3 pt-3 border-t border-success/20">
                        <span className="text-sm text-muted-foreground">Hours Run</span>
                        <p className="font-heading font-bold text-2xl text-success">
                          {(existingEntry?.hours_run || 0).toFixed(1)} hrs
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Opening Hour</Label>
                          <div className="mt-1 p-3 rounded-lg bg-muted/50 font-heading font-bold text-lg">
                            {openingHour.toFixed(1)}
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground mt-6" />
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Closing Hour *</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="Enter closing"
                            value={entries[gen.id] || ''}
                            onChange={(e) => setEntries(prev => ({
                              ...prev,
                              [gen.id]: e.target.value
                            }))}
                            className="mt-1 font-heading font-bold text-lg"
                          />
                        </div>
                      </div>
                      
                      {entries[gen.id] && parseFloat(entries[gen.id]) >= openingHour && (
                        <div className="text-center p-3 rounded-lg bg-secondary/10 border border-secondary/20">
                          <span className="text-sm text-muted-foreground">Hours Run</span>
                          <p className="font-heading font-bold text-2xl text-secondary">
                            {(parseFloat(entries[gen.id]) - openingHour).toFixed(1)} hrs
                          </p>
                        </div>
                      )}

                      {entries[gen.id] && parseFloat(entries[gen.id]) < openingHour && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                          <AlertCircle className="w-4 h-4" />
                          Closing must be ≥ opening hour
                        </div>
                      )}

                      <Button 
                        variant="secondary" 
                        className="w-full"
                        onClick={() => handleSubmit(gen.id)}
                        disabled={!entries[gen.id] || parseFloat(entries[gen.id]) < openingHour || addHourReading.isPending}
                      >
                        Save Entry
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
