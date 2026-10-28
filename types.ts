
export type CalculationMode = 'SIP' | 'Lumpsum' | 'Loan' | 'SWP';
export type Frequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';

export interface SIPResults {
  totalInvested: number;
  estimatedReturns: number;
  totalValue: number;
  realValue: number;
  inflationRate: number;
  yearlyData: GrowthDataPoint[];
}

export interface LoanResults {
  monthlyEMI: number;
  totalInterest: number;
  totalPayment: number;
  amortizationData: AmortizationPoint[];
}

export type TaxHoldingPeriod = 'long-term' | 'short-term';

export interface CapitalGainsTaxResult {
  holdingPeriod: TaxHoldingPeriod;
  grossGains: number;
  exemptionLimit: number;
  taxableGains: number;
  taxRatePercent: number;
  taxAmount: number;
  netReturns: number;
  netTotalValue: number;
  effectiveTaxRate: number;
  taxRuleDescription: string;
}

export interface SWPResults {
  totalInvestment?: number;
  totalWithdrawn: number;
  finalBalance: number;
  realFinalBalance: number;
  inflationRate: number;
  yearlyData: SWPDataPoint[];
}

export interface GrowthDataPoint {
  year: number;
  invested: number;
  totalValue: number;
  realValue: number;
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
  realBalance: number;
}

export interface SIPInputs {
  investmentAmount: number;
  expectedReturn: number;
  periodYears: number;
  mode: CalculationMode;
  frequency: Frequency;
  inflationRate: number;
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
  inflationRate: number;
}

export interface AIInsight {
  analysis: string;
  proTip: string;
  warning: string;
}
