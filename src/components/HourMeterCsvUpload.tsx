import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGenerators } from '@/hooks/useGeneratorData';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, AlertCircle, Check, X, Download, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface CsvRow {
  generator_name: string;
  date: string;
  opening_hour: string;
  closing_hour: string;
  notes?: string;
}

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

export function HourMeterCsvUpload() {
  const { data: generators = [] } = useGenerators();
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const activeGenerators = generators.filter(g => g.is_active);

  const downloadTemplate = () => {
    const headers = ['generator_name', 'date', 'opening_hour', 'closing_hour', 'notes'];
    const exampleRows = activeGenerators.slice(0, 2).map(gen => 
      `${gen.name},2024-01-15,1250.5,1258.75,Sample note`
    );
    
    const csvContent = [
      headers.join(','),
      ...exampleRows,
      exampleRows.length === 0 ? 'Generator 1,2024-01-15,1250.5,1258.75,Sample note' : ''
    ].filter(Boolean).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hour_meter_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseHourValue = (value: string): number | null => {
    // Support both decimal (1258.5) and HH:MM format (1258:30)
    const trimmed = value.trim();
    
    if (trimmed.includes(':')) {
      const [hours, minutes] = trimmed.split(':').map(v => parseInt(v, 10));
      if (isNaN(hours) || isNaN(minutes) || minutes < 0 || minutes >= 60) return null;
      return hours + (minutes / 60);
    }
    
    const num = parseFloat(trimmed);
    return isNaN(num) ? null : num;
  };

  const validateRow = (row: CsvRow): ParsedRow => {
    const generator = activeGenerators.find(
      g => g.name.toLowerCase().trim() === row.generator_name.toLowerCase().trim()
    );

    if (!generator) {
      return {
        generator_id: '',
        generator_name: row.generator_name,
        date: row.date,
        opening_hour: 0,
        closing_hour: 0,
        notes: row.notes || null,
        isValid: false,
        error: `Generator "${row.generator_name}" not found`,
      };
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(row.date)) {
      return {
        generator_id: generator.id,
        generator_name: row.generator_name,
        date: row.date,
        opening_hour: 0,
        closing_hour: 0,
        notes: row.notes || null,
        isValid: false,
        error: 'Invalid date format (use YYYY-MM-DD)',
      };
    }

    const opening = parseHourValue(row.opening_hour);
    const closing = parseHourValue(row.closing_hour);

    if (opening === null) {
      return {
        generator_id: generator.id,
        generator_name: row.generator_name,
        date: row.date,
        opening_hour: 0,
        closing_hour: 0,
        notes: row.notes || null,
        isValid: false,
        error: 'Invalid opening hour value',
      };
    }

    if (closing === null) {
      return {
        generator_id: generator.id,
        generator_name: row.generator_name,
        date: row.date,
        opening_hour: opening,
        closing_hour: 0,
        notes: row.notes || null,
        isValid: false,
        error: 'Invalid closing hour value',
      };
    }

    if (closing < opening) {
      return {
        generator_id: generator.id,
        generator_name: row.generator_name,
        date: row.date,
        opening_hour: opening,
        closing_hour: closing,
        notes: row.notes || null,
        isValid: false,
        error: 'Closing hour must be ≥ opening hour',
      };
    }

    return {
      generator_id: generator.id,
      generator_name: generator.name,
      date: row.date,
      opening_hour: opening,
      closing_hour: closing,
      notes: row.notes?.trim() || null,
      isValid: true,
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: 'Invalid CSV',
          description: 'CSV must have a header row and at least one data row',
          variant: 'destructive',
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['generator_name', 'date', 'opening_hour', 'closing_hour'];
      
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        toast({
          title: 'Missing Headers',
          description: `Required columns: ${missingHeaders.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }

      const rows: CsvRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 4) continue;

        rows.push({
          generator_name: values[headers.indexOf('generator_name')] || '',
          date: values[headers.indexOf('date')] || '',
          opening_hour: values[headers.indexOf('opening_hour')] || '',
          closing_hour: values[headers.indexOf('closing_hour')] || '',
          notes: headers.includes('notes') ? values[headers.indexOf('notes')] : undefined,
        });
      }

      const validated = rows.map(validateRow);
      setParsedData(validated);
    };

    reader.readAsText(file);
  };

  const handleUpload = async () => {
    const validRows = parsedData.filter(row => row.isValid);
    
    if (validRows.length === 0) {
      toast({
        title: 'No Valid Rows',
        description: 'Please fix the errors before uploading',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const insertData = validRows.map(row => ({
        generator_id: row.generator_id,
        date: row.date,
        opening_hour: row.opening_hour,
        closing_hour: row.closing_hour,
        notes: row.notes,
      }));

      const { error } = await supabase
        .from('hour_meter_readings')
        .insert(insertData);

      if (error) throw error;

      toast({
        title: 'Upload Successful',
        description: `${validRows.length} records imported successfully`,
      });

      // Reset state
      setParsedData([]);
      setFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['hourReadings'] });
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to import data',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearData = () => {
    setParsedData([]);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        {/* Instructions */}
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>CSV Format:</strong> generator_name, date (YYYY-MM-DD), opening_hour, closing_hour, notes (optional)
            <br />
            <span className="text-muted-foreground text-xs">
              Hour values can be decimal (1258.5) or HH:MM format (1258:30)
            </span>
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="csv-file" className="sr-only">Upload CSV</Label>
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

        {/* Preview Table */}
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
              <Button variant="ghost" size="sm" onClick={clearData}>
                Clear
              </Button>
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
                  {parsedData.map((row, idx) => (
                    <TableRow key={idx} className={!row.isValid ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        {row.isValid ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{row.generator_name}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.opening_hour.toFixed(2)}</TableCell>
                      <TableCell>{row.closing_hour.toFixed(2)}</TableCell>
                      <TableCell>
                        {row.isValid ? (row.closing_hour - row.opening_hour).toFixed(2) : '-'}
                      </TableCell>
                      <TableCell className="text-destructive text-xs">
                        {row.error}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={clearData}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={validCount === 0 || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {validCount} Records
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
