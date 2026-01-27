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
import { useGenerators, useAddGenerator, useDeactivateGenerator, useUpdateGenerator } from '@/hooks/useGeneratorData';
import { Generator, FuelType } from '@/types/generator';
import { Plus, Settings, MapPin, Fuel, Calendar, Gauge, Trash2, Loader2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface GeneratorFormData {
  name: string;
  location: string;
  capacity_kva: string;
  fuel_type: FuelType;
  start_date: string;
  initial_hour_reading: string;
  initial_fuel_stock: string;
}

const defaultFormData: GeneratorFormData = {
  name: '',
  location: '',
  capacity_kva: '',
  fuel_type: 'diesel',
  start_date: format(new Date(), 'yyyy-MM-dd'),
  initial_hour_reading: '',
  initial_fuel_stock: '',
};

export function GeneratorSetup() {
  const { data: generators = [], isLoading } = useGenerators();
  const addGenerator = useAddGenerator();
  const deactivateGenerator = useDeactivateGenerator();
  const updateGenerator = useUpdateGenerator();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGenerator, setEditingGenerator] = useState<Generator | null>(null);
  const [formData, setFormData] = useState<GeneratorFormData>(defaultFormData);

  const activeGenerators = generators.filter(g => g.is_active);
  const inactiveGenerators = generators.filter(g => !g.is_active);

  const resetForm = () => {
    setFormData(defaultFormData);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location || !formData.capacity_kva) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addGenerator.mutateAsync({
        name: formData.name,
        location: formData.location,
        capacity_kva: parseFloat(formData.capacity_kva),
        fuel_type: formData.fuel_type,
        start_date: formData.start_date,
        initial_hour_reading: parseFloat(formData.initial_hour_reading) || 0,
        initial_fuel_stock: parseFloat(formData.initial_fuel_stock) || 0,
      });

      toast({
        title: 'Generator Added',
        description: `${formData.name} has been added successfully.`,
      });

      resetForm();
      setIsAddDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add generator',
        variant: 'destructive',
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingGenerator) return;
    
    if (!formData.name || !formData.location || !formData.capacity_kva) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateGenerator.mutateAsync({
        id: editingGenerator.id,
        data: {
          name: formData.name,
          location: formData.location,
          capacity_kva: parseFloat(formData.capacity_kva),
          fuel_type: formData.fuel_type,
        },
      });

      toast({
        title: 'Generator Updated',
        description: `${formData.name} has been updated successfully.`,
      });

      resetForm();
      setEditingGenerator(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update generator',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (gen: Generator) => {
    setFormData({
      name: gen.name,
      location: gen.location || '',
      capacity_kva: gen.capacity_kva?.toString() || '',
      fuel_type: gen.fuel_type,
      start_date: gen.start_date,
      initial_hour_reading: gen.initial_hour_reading?.toString() || '0',
      initial_fuel_stock: gen.initial_fuel_stock?.toString() || '0',
    });
    setEditingGenerator(gen);
  };

  const handleDeactivate = async (gen: Generator) => {
    try {
      await deactivateGenerator.mutateAsync(gen.id);
      toast({
        title: 'Generator Deactivated',
        description: `${gen.name} has been deactivated. Historical data is preserved.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to deactivate generator',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const GeneratorForm = ({ isEdit = false, onSubmit }: { isEdit?: boolean; onSubmit: (e: React.FormEvent) => void }) => (
    <form onSubmit={onSubmit}>
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
              value={formData.capacity_kva}
              onChange={(e) => setFormData({ ...formData, capacity_kva: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fuelType">Fuel Type</Label>
            <Select
              value={formData.fuel_type}
              onValueChange={(value: FuelType) => setFormData({ ...formData, fuel_type: value })}
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
        {!isEdit && (
          <>
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initialHour">Initial Hour Reading</Label>
                <Input
                  id="initialHour"
                  type="number"
                  placeholder="e.g., 0"
                  value={formData.initial_hour_reading}
                  onChange={(e) => setFormData({ ...formData, initial_hour_reading: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="initialFuel">Initial Fuel Stock (L)</Label>
                <Input
                  id="initialFuel"
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.initial_fuel_stock}
                  onChange={(e) => setFormData({ ...formData, initial_fuel_stock: e.target.value })}
                />
              </div>
            </div>
          </>
        )}
      </div>
      <DialogFooter>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            resetForm();
            isEdit ? setEditingGenerator(null) : setIsAddDialogOpen(false);
          }}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="secondary" 
          disabled={isEdit ? updateGenerator.isPending : addGenerator.isPending}
        >
          {isEdit 
            ? (updateGenerator.isPending ? 'Updating...' : 'Update Generator')
            : (addGenerator.isPending ? 'Adding...' : 'Add Generator')
          }
        </Button>
      </DialogFooter>
    </form>
  );

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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="lg" onClick={resetForm}>
              <Plus className="w-5 h-5" />
              Add Generator
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-heading">Add New Generator</DialogTitle>
              <DialogDescription>
                Enter the details of your new generator. Initial readings help track accurate data.
              </DialogDescription>
            </DialogHeader>
            <GeneratorForm onSubmit={handleAddSubmit} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingGenerator} onOpenChange={(open) => !open && setEditingGenerator(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Generator</DialogTitle>
            <DialogDescription>
              Update the generator details. Start date and initial readings cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <GeneratorForm isEdit onSubmit={handleEditSubmit} />
        </DialogContent>
      </Dialog>

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
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleEdit(gen)}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
                    </Button>
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
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Gauge className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="font-medium">{gen.capacity_kva} kVA</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Fuel className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Fuel:</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      gen.fuel_type === 'diesel' 
                        ? 'bg-fuel-diesel/10 text-fuel-diesel' 
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {gen.fuel_type.charAt(0).toUpperCase() + gen.fuel_type.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Started:</span>
                    <span className="font-medium">{format(new Date(gen.start_date), 'MMM dd, yyyy')}</span>
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
