import { LoanInputs, LoanResults, AmortizationPoint } from '../types';

export const calculateLoan = (inputs: LoanInputs): LoanResults => {
  const { loanAmount, interestRate, tenureYears } = inputs;
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;

  // EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
  const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
  const monthlyEMI = isFinite(emi) ? emi : 0;
  const totalPayment = monthlyEMI * totalMonths;
  const totalInterest = Math.max(0, totalPayment - loanAmount);

  const amortizationData: AmortizationPoint[] = [];
  let remainingBalance = loanAmount;

  for (let year = 1; year <= tenureYears; year++) {
    let yearlyInterest = 0;
    let yearlyPrincipal = 0;
    for (let month = 1; month <= 12; month++) {
      const interestForMonth = remainingBalance * monthlyRate;
      const principalForMonth = monthlyEMI - interestForMonth;
      yearlyInterest += interestForMonth;
      yearlyPrincipal += principalForMonth;
      remainingBalance -= principalForMonth;
    }
    amortizationData.push({
      year,
      principalPaid: yearlyPrincipal,
      interestPaid: yearlyInterest,
      remainingBalance: Math.max(0, remainingBalance)
    });
  }

  return {
    monthlyEMI,
    totalInterest,
    totalPayment,
    amortizationData
  };
};
