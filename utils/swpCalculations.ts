import { SWPInputs, SWPResults, SWPDataPoint } from '../types';

export const calculateSWP = (inputs: SWPInputs): SWPResults => {
  const { totalInvestment, withdrawalAmount, expectedReturn, periodYears } = inputs;
  const monthlyRate = expectedReturn / 12 / 100;
  
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
    yearlyData.push({
      year,
      withdrawn: totalWithdrawn,
      balance: currentBalance
    });
  }

  return {
    totalWithdrawn,
    finalBalance: currentBalance,
    yearlyData
  };
};
