import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGenerators, useHourReadings } from '@/hooks/useGeneratorData';
import { HourMeterReading, Generator } from '@/types/generator';
import { formatDecimalAsHoursMinutes } from '@/lib/hourMeterUtils';
import { Pencil, Trash2, Loader2, History, Search } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { HourMeterEditDialog } from './HourMeterEditDialog';
import { HourMeterDeleteDialog } from './HourMeterDeleteDialog';

export function HourMeterHistory() {
  const { data: generators = [], isLoading: loadingGenerators } = useGenerators();
  const [selectedGenerator, setSelectedGenerator] = useState<string>('all');
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [editReading, setEditReading] = useState<HourMeterReading | null>(null);
  const [deleteReading, setDeleteReading] = useState<HourMeterReading | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: hourReadings = [], isLoading: loadingReadings } = useHourReadings({
    generatorId: selectedGenerator !== 'all' ? selectedGenerator : undefined,
    from: fromDate,
    to: toDate,
  });

  const activeGenerators = generators.filter(g => g.is_active);

  const generatorMap = useMemo(() => {
    const map: Record<string, Generator> = {};
    generators.forEach(g => { map[g.id] = g; });
    return map;
  }, [generators]);

  const handleEdit = (reading: HourMeterReading) => {
    setEditReading(reading);
    setEditDialogOpen(true);
  };

  const handleDelete = (reading: HourMeterReading) => {
    setDeleteReading(reading);
    setDeleteDialogOpen(true);
  };

  const isLoading = loadingGenerators || loadingReadings;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Hour Reading History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label className="text-sm text-muted-foreground">Generator</Label>
            <Select value={selectedGenerator} onValueChange={setSelectedGenerator}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select generator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Generators</SelectItem>
                {activeGenerators.map(gen => (
                  <SelectItem key={gen.id} value={gen.id}>{gen.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">From Date</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">To Date</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : hourReadings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No readings found for the selected filters.</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Generator</TableHead>
                  <TableHead className="text-right">Opening</TableHead>
                  <TableHead className="text-right">Closing</TableHead>
                  <TableHead className="text-right">Hours Run</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hourReadings.map((reading) => {
                  const generator = generatorMap[reading.generator_id];
                  return (
                    <TableRow key={reading.id}>
                      <TableCell className="font-medium">{reading.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {generator?.name || 'Unknown'}
                          {generator && (
                            <span className={`px-1.5 py-0.5 rounded text-xs ${
                              generator.fuel_type === 'diesel' 
                                ? 'bg-fuel-diesel/10 text-fuel-diesel' 
                                : 'bg-warning/10 text-warning'
                            }`}>
                              {generator.fuel_type}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatDecimalAsHoursMinutes(reading.opening_hour)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatDecimalAsHoursMinutes(reading.closing_hour)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-secondary">
                        {formatDecimalAsHoursMinutes(reading.hours_run || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(reading)}
                            className="h-8 w-8"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(reading)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Showing {hourReadings.length} reading(s) • Edit or delete entries if there are mistakes
        </p>

        {/* Edit Dialog */}
        <HourMeterEditDialog
          reading={editReading}
          generator={editReading ? generatorMap[editReading.generator_id] : null}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />

        {/* Delete Dialog */}
        <HourMeterDeleteDialog
          reading={deleteReading}
          generator={deleteReading ? generatorMap[deleteReading.generator_id] : null}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        />
      </CardContent>
    </Card>
  );
}
