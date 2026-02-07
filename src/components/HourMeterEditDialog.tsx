import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HourMeterReading, Generator } from '@/types/generator';
import { useUpdateHourReading } from '@/hooks/useGeneratorData';
import { decimalToHoursMinutes, hoursMinutesToDecimal, formatDecimalAsHoursMinutes } from '@/lib/hourMeterUtils';
import { AlertCircle, Loader2 } from 'lucide-react';

interface HourMeterEditDialogProps {
  reading: HourMeterReading | null;
  generator: Generator | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HourMeterEditDialog({ reading, generator, open, onOpenChange }: HourMeterEditDialogProps) {
  const [openingHours, setOpeningHours] = useState('');
  const [openingMinutes, setOpeningMinutes] = useState('');
  const [closingHours, setClosingHours] = useState('');
  const [closingMinutes, setClosingMinutes] = useState('');
  
  const updateReading = useUpdateHourReading();

  useEffect(() => {
    if (reading) {
      const opening = decimalToHoursMinutes(reading.opening_hour);
      const closing = decimalToHoursMinutes(reading.closing_hour);
      setOpeningHours(opening.hours.toString());
      setOpeningMinutes(opening.minutes.toString().padStart(2, '0'));
      setClosingHours(closing.hours.toString());
      setClosingMinutes(closing.minutes.toString().padStart(2, '0'));
    }
  }, [reading]);

  const getOpeningDecimal = (): number | null => {
    const hours = parseInt(openingHours, 10);
    const minutes = parseInt(openingMinutes || '0', 10);
    if (isNaN(hours) || isNaN(minutes) || minutes < 0 || minutes >= 60) return null;
    return hoursMinutesToDecimal(hours, minutes);
  };

  const getClosingDecimal = (): number | null => {
    const hours = parseInt(closingHours, 10);
    const minutes = parseInt(closingMinutes || '0', 10);
    if (isNaN(hours) || isNaN(minutes) || minutes < 0 || minutes >= 60) return null;
    return hoursMinutesToDecimal(hours, minutes);
  };

  const openingDecimal = getOpeningDecimal();
  const closingDecimal = getClosingDecimal();
  const isValid = openingDecimal !== null && closingDecimal !== null && closingDecimal >= openingDecimal;
  const isInvalid = closingDecimal !== null && openingDecimal !== null && closingDecimal < openingDecimal;

  const handleSave = async () => {
    if (!reading || !isValid || openingDecimal === null || closingDecimal === null) return;

    await updateReading.mutateAsync({
      id: reading.id,
      data: {
        opening_hour: openingDecimal,
        closing_hour: closingDecimal,
      },
    });

    onOpenChange(false);
  };

  if (!reading || !generator) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Hour Reading</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <span className="font-medium">{generator.name}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{reading.date}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Opening Hour (HHHH:MM)</Label>
              <div className="mt-1 flex gap-1">
                <Input
                  type="number"
                  placeholder="HHHH"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  className="font-heading font-bold text-lg w-20"
                  min={0}
                />
                <span className="self-center font-bold text-lg">:</span>
                <Input
                  type="number"
                  placeholder="MM"
                  value={openingMinutes}
                  onChange={(e) => setOpeningMinutes(e.target.value)}
                  className="font-heading font-bold text-lg w-16"
                  min={0}
                  max={59}
                />
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">Closing Hour (HHHH:MM)</Label>
              <div className="mt-1 flex gap-1">
                <Input
                  type="number"
                  placeholder="HHHH"
                  value={closingHours}
                  onChange={(e) => setClosingHours(e.target.value)}
                  className="font-heading font-bold text-lg w-20"
                  min={0}
                />
                <span className="self-center font-bold text-lg">:</span>
                <Input
                  type="number"
                  placeholder="MM"
                  value={closingMinutes}
                  onChange={(e) => setClosingMinutes(e.target.value)}
                  className="font-heading font-bold text-lg w-16"
                  min={0}
                  max={59}
                />
              </div>
            </div>
          </div>

          {isValid && openingDecimal !== null && closingDecimal !== null && (
            <div className="text-center p-3 rounded-lg bg-secondary/10 border border-secondary/20">
              <span className="text-sm text-muted-foreground">Hours Run</span>
              <p className="font-heading font-bold text-2xl text-secondary">
                {formatDecimalAsHoursMinutes(closingDecimal - openingDecimal)}
              </p>
            </div>
          )}

          {isInvalid && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              Closing must be ≥ opening hour
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!isValid || updateReading.isPending}
          >
            {updateReading.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
