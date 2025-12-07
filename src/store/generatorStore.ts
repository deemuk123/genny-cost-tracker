import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Generator, 
  HourMeterReading, 
  FuelPurchase, 
  FuelIssue, 
  MonthlyStockCheck,
  FuelStock,
  FuelType
} from '@/types/generator';

interface GeneratorStore {
  generators: Generator[];
  hourReadings: HourMeterReading[];
  fuelPurchases: FuelPurchase[];
  fuelIssues: FuelIssue[];
  monthlyStockChecks: MonthlyStockCheck[];
  fuelStock: FuelStock;

  // Generator actions
  addGenerator: (generator: Omit<Generator, 'id' | 'createdAt' | 'isActive'>) => void;
  updateGenerator: (id: string, updates: Partial<Generator>) => void;
  deactivateGenerator: (id: string) => void;
  
  // Hour reading actions
  addHourReading: (reading: Omit<HourMeterReading, 'id' | 'createdAt' | 'hoursRun'>) => void;
  getLastReading: (generatorId: string) => HourMeterReading | undefined;
  
  // Fuel purchase actions
  addFuelPurchase: (purchase: Omit<FuelPurchase, 'id' | 'createdAt' | 'totalAmount'>) => void;
  
  // Fuel issue actions
  addFuelIssue: (issue: Omit<FuelIssue, 'id' | 'createdAt' | 'stockAfterIssue'>) => void;
  
  // Stock check actions
  addMonthlyStockCheck: (check: Omit<MonthlyStockCheck, 'id' | 'createdAt'>) => void;

  // Calculations
  getTotalHoursForPeriod: (generatorId: string, from: Date, to: Date) => number;
  getTotalFuelIssuedForPeriod: (generatorId: string, from: Date, to: Date) => number;
  getAvgFuelCostPerLitre: (fuelType: FuelType, upToDate: Date) => number;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useGeneratorStore = create<GeneratorStore>()(
  persist(
    (set, get) => ({
      generators: [],
      hourReadings: [],
      fuelPurchases: [],
      fuelIssues: [],
      monthlyStockChecks: [],
      fuelStock: { petrol: 0, diesel: 0 },

      addGenerator: (generator) => {
        const newGenerator: Generator = {
          ...generator,
          id: generateId(),
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          generators: [...state.generators, newGenerator],
          fuelStock: {
            ...state.fuelStock,
            [generator.fuelType]: state.fuelStock[generator.fuelType] + generator.initialFuelStock,
          },
        }));
      },

      updateGenerator: (id, updates) => {
        set((state) => ({
          generators: state.generators.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }));
      },

      deactivateGenerator: (id) => {
        set((state) => ({
          generators: state.generators.map((g) =>
            g.id === id ? { ...g, isActive: false } : g
          ),
        }));
      },

      addHourReading: (reading) => {
        const hoursRun = reading.closingHour - reading.openingHour;
        const newReading: HourMeterReading = {
          ...reading,
          id: generateId(),
          hoursRun,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          hourReadings: [...state.hourReadings, newReading],
        }));
      },

      getLastReading: (generatorId) => {
        const readings = get().hourReadings
          .filter((r) => r.generatorId === generatorId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return readings[0];
      },

      addFuelPurchase: (purchase) => {
        const totalAmount = purchase.quantity * purchase.ratePerLitre;
        const newPurchase: FuelPurchase = {
          ...purchase,
          id: generateId(),
          totalAmount,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          fuelPurchases: [...state.fuelPurchases, newPurchase],
          fuelStock: {
            ...state.fuelStock,
            [purchase.fuelType]: state.fuelStock[purchase.fuelType] + purchase.quantity,
          },
        }));
      },

      addFuelIssue: (issue) => {
        const currentStock = get().fuelStock[issue.fuelType];
        const stockAfterIssue = currentStock - issue.quantity;
        const newIssue: FuelIssue = {
          ...issue,
          id: generateId(),
          stockAfterIssue,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          fuelIssues: [...state.fuelIssues, newIssue],
          fuelStock: {
            ...state.fuelStock,
            [issue.fuelType]: stockAfterIssue,
          },
        }));
      },

      addMonthlyStockCheck: (check) => {
        const newCheck: MonthlyStockCheck = {
          ...check,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          monthlyStockChecks: [...state.monthlyStockChecks, newCheck],
          fuelStock: {
            ...state.fuelStock,
            [check.fuelType]: check.physicalClosing,
          },
        }));
      },

      getTotalHoursForPeriod: (generatorId, from, to) => {
        return get()
          .hourReadings.filter((r) => {
            const date = new Date(r.date);
            return r.generatorId === generatorId && date >= from && date <= to;
          })
          .reduce((sum, r) => sum + r.hoursRun, 0);
      },

      getTotalFuelIssuedForPeriod: (generatorId, from, to) => {
        return get()
          .fuelIssues.filter((i) => {
            const date = new Date(i.date);
            return i.generatorId === generatorId && date >= from && date <= to;
          })
          .reduce((sum, i) => sum + i.quantity, 0);
      },

      getAvgFuelCostPerLitre: (fuelType, upToDate) => {
        const purchases = get().fuelPurchases.filter(
          (p) => p.fuelType === fuelType && new Date(p.date) <= upToDate
        );
        if (purchases.length === 0) return 0;
        
        const totalQty = purchases.reduce((sum, p) => sum + p.quantity, 0);
        const totalCost = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
        return totalQty > 0 ? totalCost / totalQty : 0;
      },
    }),
    {
      name: 'generator-store',
    }
  )
);
