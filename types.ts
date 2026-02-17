
export type CalculationMode = 'SIP' | 'Lumpsum';
export type Frequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';

export interface SIPResults {
  totalInvested: number;
  estimatedReturns: number;
  totalValue: number;
  yearlyData: GrowthDataPoint[];
}

export interface GrowthDataPoint {
  year: number;
  invested: number;
  totalValue: number;
}

export interface SIPInputs {
  investmentAmount: number; // Periodic for SIP, One-time for Lumpsum
  expectedReturn: number;
  periodYears: number;
  mode: CalculationMode;
  frequency: Frequency;
}

export interface AIInsight {
  analysis: string;
  proTip: string;
  warning: string;
}
