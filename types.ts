
export type CalculationMode = 'SIP' | 'Lumpsum' | 'Loan' | 'SWP';
export type Frequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';

export interface SIPResults {
  totalInvested: number;
  estimatedReturns: number;
  totalValue: number;
  yearlyData: GrowthDataPoint[];
}

export interface LoanResults {
  monthlyEMI: number;
  totalInterest: number;
  totalPayment: number;
  amortizationData: AmortizationPoint[];
}

export interface SWPResults {
  totalWithdrawn: number;
  finalBalance: number;
  yearlyData: SWPDataPoint[];
}

export interface GrowthDataPoint {
  year: number;
  invested: number;
  totalValue: number;
}

export interface AmortizationPoint {
  year: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
}

export interface SWPDataPoint {
  year: number;
  withdrawn: number;
  balance: number;
}

export interface SIPInputs {
  investmentAmount: number;
  expectedReturn: number;
  periodYears: number;
  mode: CalculationMode;
  frequency: Frequency;
}

export interface LoanInputs {
  loanAmount: number;
  interestRate: number;
  tenureYears: number;
}

export interface SWPInputs {
  totalInvestment: number;
  withdrawalAmount: number;
  expectedReturn: number;
  periodYears: number;
}

export interface AIInsight {
  analysis: string;
  proTip: string;
  warning: string;
}
