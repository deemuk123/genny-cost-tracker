export type FuelType = 'petrol' | 'diesel';

export interface Generator {
  id: string;
  name: string;
  location: string;
  capacity: number; // kVA
  fuelType: FuelType;
  startDate: string;
  initialHourReading: number;
  initialFuelStock: number;
  isActive: boolean;
  createdAt: string;
}

export interface HourMeterReading {
  id: string;
  generatorId: string;
  date: string;
  openingHour: number;
  closingHour: number;
  hoursRun: number;
  createdAt: string;
}

export interface FuelPurchase {
  id: string;
  date: string;
  fuelType: FuelType;
  quantity: number; // litres
  ratePerLitre: number;
  totalAmount: number;
  vendor?: string;
  createdAt: string;
}

export interface FuelIssue {
  id: string;
  date: string;
  generatorId: string;
  fuelType: FuelType;
  quantity: number; // litres
  stockAfterIssue: number;
  createdAt: string;
}

export interface MonthlyStockCheck {
  id: string;
  date: string;
  fuelType: FuelType;
  openingStock: number;
  totalPurchases: number;
  totalIssues: number;
  theoreticalClosing: number;
  physicalClosing: number;
  variance: number;
  createdAt: string;
}

export interface FuelStock {
  petrol: number;
  diesel: number;
}

export interface GeneratorReport {
  generatorId: string;
  generatorName: string;
  totalHours: number;
  totalFuelUsed: number;
  avgConsumption: number; // litres per hour
  totalFuelCost: number;
  hourlyCost: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}
