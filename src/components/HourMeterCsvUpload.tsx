import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGenerators } from '@/hooks/useGeneratorData';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, AlertCircle, Check, X, Download, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ParsedRow {
  generator_id: string;
  generator_name: string;
  date: string;
  opening_hour: number;
  closing_hour: number;
  notes: string | null;
  isValid: boolean;
  error?: string;
}

const parseHourValue = (value: string): number | null => {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return null;
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map(v => parseInt(v, 10));
    const [h, m] = [parts[0], parts[1] ?? 0];
    if (isNaN(h) || isNaN(m) || m < 0 || m >= 60) return null;
    return h + m / 60;
  }
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
};

const parseDateValue = (value: string): string | null => {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return null;
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  // M/D/YYYY or MM/DD/YYYY
  const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, mo, d, y] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
};

export function HourMeterCsvUpload() {
  const { data: generators = [] } = useGenerators();
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedGeneratorId, setSelectedGeneratorId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const activeGenerators = generators.filter(g => g.is_active);

  const downloadTemplate = () => {
    const csvContent = [
      'Date,Start Time,End Time,Run Time',
      '4/14/2022,106:40,106:45,0:05',
      '4/15/2022,106:45,106:50,0:05',
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hour_meter_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCsv = (text: string): ParsedRow[] => {
    const generator = activeGenerators.find(g => g.id === selectedGeneratorId);
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    // Detect format
    const hasGeneratorName = headers.includes('generator_name');
    // Per-generator format columns
    const dateIdx = headers.findIndex(h => h === 'date');
    const openIdx = headers.findIndex(h => h === 'opening_hour' || h === 'start time' || h === 'start_time' || h === 'start');
    const closeIdx = headers.findIndex(h => h === 'closing_hour' || h === 'end time' || h === 'end_time' || h === 'end');
    const notesIdx = headers.indexOf('notes');
    const genNameIdx = headers.indexOf('generator_name');

    if (dateIdx < 0 || openIdx < 0 || closeIdx < 0) return [];

    const out: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(',').map(v => v.trim());
      const rawDate = vals[dateIdx] ?? '';
      const rawOpen = vals[openIdx] ?? '';
      const rawClose = vals[closeIdx] ?? '';
      const rawNotes = notesIdx >= 0 ? vals[notesIdx] : undefined;

      // Skip blank rows
      if (!rawDate && !rawOpen && !rawClose) continue;

      // Resolve generator
      let gen = generator;
      let genName = generator?.name ?? '';
      if (hasGeneratorName) {
        const name = (vals[genNameIdx] ?? '').trim();
        gen = activeGenerators.find(g => g.name.toLowerCase() === name.toLowerCase());
        genName = name;
      }
      if (!gen) {
        out.push({
          generator_id: '', generator_name: genName || '(none)', date: rawDate,
          opening_hour: 0, closing_hour: 0, notes: rawNotes ?? null,
          isValid: false, error: hasGeneratorName ? `Generator "${genName}" not found` : 'Select a generator',
        });
        continue;
      }

      // Skip rows with empty start/end (idle days)
      if (!rawOpen || !rawClose) continue;

      const date = parseDateValue(rawDate);
      if (!date) {
        out.push({
          generator_id: gen.id, generator_name: gen.name, date: rawDate,
          opening_hour: 0, closing_hour: 0, notes: rawNotes ?? null,
          isValid: false, error: 'Invalid date (use M/D/YYYY or YYYY-MM-DD)',
        });
        continue;
      }
      const opening = parseHourValue(rawOpen);
      const closing = parseHourValue(rawClose);
      if (opening === null || closing === null) {
        out.push({
          generator_id: gen.id, generator_name: gen.name, date,
          opening_hour: opening ?? 0, closing_hour: closing ?? 0, notes: rawNotes ?? null,
          isValid: false, error: 'Invalid hour value',
        });
        continue;
      }
      if (closing < opening) {
        out.push({
          generator_id: gen.id, generator_name: gen.name, date,
          opening_hour: opening, closing_hour: closing, notes: rawNotes ?? null,
          isValid: false, error: 'Closing hour must be ≥ opening hour',
        });
        continue;
      }
      out.push({
        generator_id: gen.id, generator_name: gen.name, date,
        opening_hour: opening, closing_hour: closing,
        notes: rawNotes?.trim() || null, isValid: true,
      });
    }
    return out;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const validated = parseCsv(text);
      if (validated.length === 0) {
        toast({
          title: 'Could not parse CSV',
          description: 'Expected headers like Date, Start Time, End Time — or generator_name, date, opening_hour, closing_hour',
          variant: 'destructive',
        });
        return;
      }
      setParsedData(validated);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    const validRows = parsedData.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast({ title: 'No Valid Rows', description: 'Fix errors first', variant: 'destructive' });
      return;
    }
    setIsUploading(true);
    try {
      const insertData = validRows.map(r => ({
        generator_id: r.generator_id,
        date: r.date,
        opening_hour: r.opening_hour,
        closing_hour: r.closing_hour,
        notes: r.notes,
      }));
      // Chunk inserts to avoid payload limits
      const chunkSize = 500;
      for (let i = 0; i < insertData.length; i += chunkSize) {
        const chunk = insertData.slice(i, i + chunkSize);
        const { error } = await supabase.from('hour_meter_readings').insert(chunk);
        if (error) throw error;
      }
      toast({ title: 'Upload Successful', description: `${validRows.length} records imported` });
      setParsedData([]); setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['hourReadings'] });
    } catch (error: any) {
      toast({ title: 'Upload Failed', description: error.message || 'Failed', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const clearData = () => {
    setParsedData([]); setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validCount = parsedData.filter(r => r.isValid).length;
  const invalidCount = parsedData.filter(r => !r.isValid).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          CSV Upload - Historical Data
        </CardTitle>
        <CardDescription>
          Upload historical hour meter readings in bulk via CSV file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>Supported formats:</strong>
            <ul className="list-disc ml-5 mt-1 text-sm">
              <li>Per-generator: <code>Date, Start Time, End Time, Run Time</code> — pick the generator below.</li>
              <li>Multi-generator: <code>generator_name, date, opening_hour, closing_hour, notes</code></li>
            </ul>
            <span className="text-muted-foreground text-xs block mt-1">
              Dates: M/D/YYYY or YYYY-MM-DD. Times: HH:MM, HH:MM:SS, or decimal. Empty Start/End rows are skipped.
            </span>
          </AlertDescription>
        </Alert>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-sm">Generator (for per-generator CSVs)</Label>
            <Select value={selectedGeneratorId} onValueChange={setSelectedGeneratorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a generator" />
              </SelectTrigger>
              <SelectContent>
                {activeGenerators.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name} {g.location ? `— ${g.location}` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" /> Template
            </Button>
            <Input
              id="csv-file"
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="cursor-pointer"
            />
          </div>
        </div>

        {fileName && <div className="text-xs text-muted-foreground">File: {fileName}</div>}

        {parsedData.length > 0 && (
          <>
            <div className="flex items-center justify-between py-2">
              <div className="flex gap-4 text-sm">
                <span className="text-success flex items-center gap-1">
                  <Check className="w-4 h-4" /> {validCount} valid
                </span>
                {invalidCount > 0 && (
                  <span className="text-destructive flex items-center gap-1">
                    <X className="w-4 h-4" /> {invalidCount} errors
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={clearData}>Clear</Button>
            </div>

            <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">Status</TableHead>
                    <TableHead>Generator</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Opening</TableHead>
                    <TableHead>Closing</TableHead>
                    <TableHead>Hours Run</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 200).map((row, idx) => (
                    <TableRow key={idx} className={!row.isValid ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        {row.isValid ? <Check className="w-4 h-4 text-success" /> : <AlertCircle className="w-4 h-4 text-destructive" />}
                      </TableCell>
                      <TableCell className="font-medium">{row.generator_name}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.opening_hour.toFixed(2)}</TableCell>
                      <TableCell>{row.closing_hour.toFixed(2)}</TableCell>
                      <TableCell>{row.isValid ? (row.closing_hour - row.opening_hour).toFixed(2) : '-'}</TableCell>
                      <TableCell className="text-destructive text-xs">{row.error}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedData.length > 200 && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  Showing first 200 of {parsedData.length} rows
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={clearData}>Cancel</Button>
              <Button onClick={handleUpload} disabled={validCount === 0 || isUploading}>
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Upload {validCount} Records</>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
