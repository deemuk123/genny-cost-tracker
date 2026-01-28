import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useGenerators, useHourReadings } from '@/hooks/useGeneratorData';
import { formatDecimalAsHoursMinutes } from '@/lib/hourMeterUtils';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar, Loader2, FileSpreadsheet } from 'lucide-react';
import { HourMeterReading, Generator } from '@/types/generator';

export function DailyHourReport() {
  const today = new Date();
  const [fromDate, setFromDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));

  const { data: generators = [], isLoading: loadingGenerators } = useGenerators();
  const { data: readings = [], isLoading: loadingReadings } = useHourReadings({ from: fromDate, to: toDate });

  const activeGenerators = useMemo(() => 
    generators.filter(g => g.is_active).sort((a, b) => a.name.localeCompare(b.name)),
    [generators]
  );

  // Pivot data by date
  const pivotedData = useMemo(() => {
    const dateMap = new Map<string, Map<string, HourMeterReading>>();
    
    readings.forEach(reading => {
      if (!dateMap.has(reading.date)) {
        dateMap.set(reading.date, new Map());
      }
      dateMap.get(reading.date)!.set(reading.generator_id, reading);
    });

    // Sort dates in descending order
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => b.localeCompare(a));
    
    return sortedDates.map(date => ({
      date,
      readings: dateMap.get(date)!,
    }));
  }, [readings]);

  // Calculate totals per generator
  const totals = useMemo(() => {
    const totalsByGenerator = new Map<string, number>();
    
    readings.forEach(reading => {
      const current = totalsByGenerator.get(reading.generator_id) || 0;
      totalsByGenerator.set(reading.generator_id, current + (reading.hours_run || 0));
    });

    return totalsByGenerator;
  }, [readings]);

  const grandTotal = useMemo(() => 
    Array.from(totals.values()).reduce((sum, hours) => sum + hours, 0),
    [totals]
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Daily Hour Report</h1>
          <p className="text-muted-foreground mt-1">
            View daily running hours for all generators
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{pivotedData.length} days with readings</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Hour Meter Readings
          </CardTitle>
          <CardDescription>
            Daily opening, closing, and run hours for each generator
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeGenerators.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active generators found. Add generators first.
            </div>
          ) : pivotedData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No readings found for the selected date range.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[120px]">Date</TableHead>
                    {activeGenerators.map(gen => (
                      <TableHead key={`${gen.id}-header`} colSpan={3} className="text-center border-l">
                        {gen.name}
                      </TableHead>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10"></TableHead>
                    {activeGenerators.map(gen => (
                      <>
                        <TableHead key={`${gen.id}-open`} className="text-center text-xs border-l">Open</TableHead>
                        <TableHead key={`${gen.id}-close`} className="text-center text-xs">Close</TableHead>
                        <TableHead key={`${gen.id}-run`} className="text-center text-xs font-semibold">Run</TableHead>
                      </>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pivotedData.map(({ date, readings: dateReadings }) => (
                    <TableRow key={date}>
                      <TableCell className="sticky left-0 bg-background z-10 font-medium">
                        {format(new Date(date), 'MMM dd, yyyy')}
                      </TableCell>
                      {activeGenerators.map(gen => {
                        const reading = dateReadings.get(gen.id);
                        return (
                          <>
                            <TableCell key={`${gen.id}-${date}-open`} className="text-center border-l tabular-nums">
                              {reading ? formatDecimalAsHoursMinutes(reading.opening_hour) : '-'}
                            </TableCell>
                            <TableCell key={`${gen.id}-${date}-close`} className="text-center tabular-nums">
                              {reading ? formatDecimalAsHoursMinutes(reading.closing_hour) : '-'}
                            </TableCell>
                            <TableCell key={`${gen.id}-${date}-run`} className="text-center font-medium tabular-nums">
                              {reading?.hours_run ? formatDecimalAsHoursMinutes(reading.hours_run) : '-'}
                            </TableCell>
                          </>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="sticky left-0 bg-muted/50 z-10 font-bold">TOTALS</TableCell>
                    {activeGenerators.map(gen => {
                      const genTotal = totals.get(gen.id) || 0;
                      return (
                        <>
                          <TableCell key={`${gen.id}-total-open`} className="border-l"></TableCell>
                          <TableCell key={`${gen.id}-total-close`}></TableCell>
                          <TableCell key={`${gen.id}-total-run`} className="text-center font-bold tabular-nums">
                            {formatDecimalAsHoursMinutes(genTotal)}
                          </TableCell>
                        </>
                      );
                    })}
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grand Total */}
      {pivotedData.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Grand Total (All Generators)</span>
              <span className="text-2xl font-bold text-primary">
                {formatDecimalAsHoursMinutes(grandTotal)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
