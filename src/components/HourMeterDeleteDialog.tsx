import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { HourMeterReading, Generator } from '@/types/generator';
import { useDeleteHourReading } from '@/hooks/useGeneratorData';
import { formatDecimalAsHoursMinutes } from '@/lib/hourMeterUtils';
import { Loader2 } from 'lucide-react';

interface HourMeterDeleteDialogProps {
  reading: HourMeterReading | null;
  generator: Generator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HourMeterDeleteDialog({ reading, generator, open, onOpenChange }: HourMeterDeleteDialogProps) {
  const deleteReading = useDeleteHourReading();

  const handleDelete = async () => {
    if (!reading) return;
    
    await deleteReading.mutateAsync(reading.id);
    onOpenChange(false);
  };

  if (!reading || !generator) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Hour Reading</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this hour reading? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Generator:</span>
            <span className="font-medium">{generator.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date:</span>
            <span className="font-medium">{reading.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Opening:</span>
            <span className="font-medium">{formatDecimalAsHoursMinutes(reading.opening_hour)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Closing:</span>
            <span className="font-medium">{formatDecimalAsHoursMinutes(reading.closing_hour)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hours Run:</span>
            <span className="font-medium">{formatDecimalAsHoursMinutes(reading.hours_run || 0)}</span>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteReading.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteReading.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteReading.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
