import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useGeneratorStore } from '@/store/generatorStore';
import { Generator, FuelType } from '@/types/generator';
import { Plus, Settings, MapPin, Fuel, Calendar, Gauge, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export function GeneratorSetup() {
  const { generators, addGenerator, deactivateGenerator } = useGeneratorStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    fuelType: 'diesel' as FuelType,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    initialHourReading: '',
    initialFuelStock: '',
  });

  const activeGenerators = generators.filter(g => g.isActive);
  const inactiveGenerators = generators.filter(g => !g.isActive);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location || !formData.capacity) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    addGenerator({
      name: formData.name,
      location: formData.location,
      capacity: parseFloat(formData.capacity),
      fuelType: formData.fuelType,
      startDate: formData.startDate,
      initialHourReading: parseFloat(formData.initialHourReading) || 0,
      initialFuelStock: parseFloat(formData.initialFuelStock) || 0,
    });

    toast({
      title: 'Generator Added',
      description: `${formData.name} has been added successfully.`,
    });

    setFormData({
      name: '',
      location: '',
      capacity: '',
      fuelType: 'diesel',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      initialHourReading: '',
      initialFuelStock: '',
    });
    setIsDialogOpen(false);
  };

  const handleDeactivate = (gen: Generator) => {
    deactivateGenerator(gen.id);
    toast({
      title: 'Generator Deactivated',
      description: `${gen.name} has been deactivated. Historical data is preserved.`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Generators</h1>
          <p className="text-muted-foreground mt-1">
            Manage your diesel and petrol generators
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="lg">
              <Plus className="w-5 h-5" />
              Add Generator
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle className="font-heading">Add New Generator</DialogTitle>
                <DialogDescription>
                  Enter the details of your new generator. Initial readings help track accurate data.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Generator Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., DG-1"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      placeholder="e.g., Main Building"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity (kVA) *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      placeholder="e.g., 500"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuelType">Fuel Type</Label>
                    <Select
                      value={formData.fuelType}
                      onValueChange={(value: FuelType) => setFormData({ ...formData, fuelType: value })}
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
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="initialHour">Initial Hour Reading</Label>
                    <Input
                      id="initialHour"
                      type="number"
                      placeholder="e.g., 0"
                      value={formData.initialHourReading}
                      onChange={(e) => setFormData({ ...formData, initialHourReading: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initialFuel">Initial Fuel Stock (L)</Label>
                    <Input
                      id="initialFuel"
                      type="number"
                      placeholder="e.g., 100"
                      value={formData.initialFuelStock}
                      onChange={(e) => setFormData({ ...formData, initialFuelStock: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="secondary">
                  Add Generator
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Generators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeGenerators.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <Settings className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <h3 className="font-heading font-semibold text-lg mt-4">No Generators Added</h3>
              <p className="text-muted-foreground mt-1">
                Click "Add Generator" to set up your first DG.
              </p>
            </CardContent>
          </Card>
        ) : (
          activeGenerators.map((gen, index) => (
            <Card 
              key={gen.id} 
              className="animate-slide-up group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{gen.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {gen.location}
                    </CardDescription>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate {gen.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will deactivate the generator but preserve all historical data for reports.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeactivate(gen)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Deactivate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Gauge className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="font-medium">{gen.capacity} kVA</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Fuel className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Fuel:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      gen.fuelType === 'diesel' 
                        ? 'bg-fuel-diesel/10 text-fuel-diesel' 
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {gen.fuelType.charAt(0).toUpperCase() + gen.fuelType.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Started:</span>
                    <span className="font-medium">{format(new Date(gen.startDate), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Inactive Generators */}
      {inactiveGenerators.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-heading font-semibold text-lg text-muted-foreground">Inactive Generators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveGenerators.map((gen) => (
              <Card key={gen.id} className="opacity-60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{gen.name}</CardTitle>
                  <CardDescription>{gen.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="text-xs px-2 py-1 bg-muted rounded-full">Deactivated</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
