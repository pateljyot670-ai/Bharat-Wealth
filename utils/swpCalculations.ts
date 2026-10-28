import { SWPInputs, SWPResults, SWPDataPoint } from '../types';

export const calculateSWP = (inputs: SWPInputs): SWPResults => {
  const { totalInvestment, withdrawalAmount, expectedReturn, periodYears, inflationRate = 6 } = inputs;
  const monthlyRate = expectedReturn / 12 / 100;
  const annualInflation = Math.max(0, inflationRate) / 100;
  
  let currentBalance = totalInvestment;
  let totalWithdrawn = 0;
  const yearlyData: SWPDataPoint[] = [];

  for (let year = 1; year <= periodYears; year++) {
    let yearlyWithdrawn = 0;
    for (let month = 1; month <= 12; month++) {
      // Withdrawal happens at the beginning of the month
      if (currentBalance >= withdrawalAmount) {
        currentBalance -= withdrawalAmount;
        totalWithdrawn += withdrawalAmount;
        yearlyWithdrawn += withdrawalAmount;
      } else {
        totalWithdrawn += currentBalance;
        yearlyWithdrawn += currentBalance;
        currentBalance = 0;
      }
      // Interest is calculated on the remaining balance
      currentBalance *= (1 + monthlyRate);
    }
    
    const realBalance = currentBalance / Math.pow(1 + annualInflation, year);

    yearlyData.push({
      year,
      withdrawn: Math.round(totalWithdrawn),
      balance: Math.round(currentBalance),
      realBalance: Math.round(realBalance)
    });
  }

  const finalBalance = Math.round(currentBalance);
  const realFinalBalance = Math.round(currentBalance / Math.pow(1 + annualInflation, periodYears));

  return {
    totalWithdrawn: Math.round(totalWithdrawn),
    finalBalance,
    realFinalBalance,
    inflationRate,
    yearlyData
  };
};
