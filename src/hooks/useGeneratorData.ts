import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generatorApi, hourReadingApi, fuelPurchaseApi, fuelIssueApi, stockCheckApi, reportsApi } from '@/services/api';
import { Generator, HourMeterReading, FuelPurchase, FuelIssue, MonthlyStockCheck } from '@/types/generator';
import { useToast } from '@/hooks/use-toast';

// Check if we should use API or local store
const USE_API = import.meta.env.VITE_USE_API === 'true';

// Generators Hooks
export function useGenerators() {
  return useQuery({
    queryKey: ['generators'],
    queryFn: generatorApi.getAll,
    enabled: USE_API,
  });
}

export function useAddGenerator() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: generatorApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generators'] });
      toast({ title: 'Generator added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add generator', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateGenerator() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Generator> }) => generatorApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generators'] });
      toast({ title: 'Generator updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update generator', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeactivateGenerator() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: generatorApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generators'] });
      toast({ title: 'Generator deactivated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to deactivate generator', description: error.message, variant: 'destructive' });
    },
  });
}

// Hour Readings Hooks
export function useHourReadings(params?: { generatorId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['hourReadings', params],
    queryFn: () => hourReadingApi.getAll(params),
    enabled: USE_API,
  });
}

export function useAddHourReading() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: hourReadingApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hourReadings'] });
      toast({ title: 'Hour reading saved' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to save reading', description: error.message, variant: 'destructive' });
    },
  });
}

// Fuel Purchase Hooks
export function useFuelPurchases(params?: { from?: string; to?: string; fuelType?: string }) {
  return useQuery({
    queryKey: ['fuelPurchases', params],
    queryFn: () => fuelPurchaseApi.getAll(params),
    enabled: USE_API,
  });
}

export function useAddFuelPurchase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: fuelPurchaseApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelPurchases'] });
      queryClient.invalidateQueries({ queryKey: ['fuelStock'] });
      toast({ title: 'Fuel purchase recorded' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to record purchase', description: error.message, variant: 'destructive' });
    },
  });
}

export function useFuelStock() {
  return useQuery({
    queryKey: ['fuelStock'],
    queryFn: fuelPurchaseApi.getStock,
    enabled: USE_API,
  });
}

// Fuel Issue Hooks
export function useFuelIssues(params?: { generatorId?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['fuelIssues', params],
    queryFn: () => fuelIssueApi.getAll(params),
    enabled: USE_API,
  });
}

export function useAddFuelIssue() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: fuelIssueApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuelIssues'] });
      queryClient.invalidateQueries({ queryKey: ['fuelStock'] });
      toast({ title: 'Fuel issued successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to issue fuel', description: error.message, variant: 'destructive' });
    },
  });
}

// Stock Check Hooks
export function useStockChecks(params?: { year?: number; month?: number }) {
  return useQuery({
    queryKey: ['stockChecks', params],
    queryFn: () => stockCheckApi.getAll(params),
    enabled: USE_API,
  });
}

export function useAddStockCheck() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: stockCheckApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockChecks'] });
      toast({ title: 'Stock check recorded' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to record stock check', description: error.message, variant: 'destructive' });
    },
  });
}

// Reports Hooks
export function useCostReport(params: { from: string; to: string; generatorId?: string }) {
  return useQuery({
    queryKey: ['costReport', params],
    queryFn: () => reportsApi.getCostReport(params),
    enabled: USE_API && !!params.from && !!params.to,
  });
}
