
import { SIPInputs, SIPResults, GrowthDataPoint, Frequency } from '../types';

const getFrequencyFactor = (freq: Frequency): number => {
  switch (freq) {
    case 'Daily': return 365;
    case 'Weekly': return 52;
    case 'Monthly': return 12;
    case 'Quarterly': return 4;
    default: return 12;
  }
};

export const calculateWealth = (inputs: SIPInputs): SIPResults => {
  const { investmentAmount, expectedReturn, periodYears, mode, frequency, inflationRate = 6 } = inputs;
  const yearlyData: GrowthDataPoint[] = [];
  const annualInflation = Math.max(0, inflationRate) / 100;
  
  if (mode === 'SIP') {
    const frequencyFactor = getFrequencyFactor(frequency);
    const periodicRate = expectedReturn / frequencyFactor / 100;

    for (let year = 1; year <= periodYears; year++) {
      const totalPeriods = year * frequencyFactor;
      const invested = investmentAmount * totalPeriods;
      
      // Future Value of an Annuity Due: FV = P * [((1 + r)^n - 1) / r] * (1 + r)
      const futureValue = investmentAmount * 
        ((Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate) * 
        (1 + periodicRate);

      // Real purchasing power adjusted for inflation over 'year' years
      const realValue = futureValue / Math.pow(1 + annualInflation, year);

      yearlyData.push({
        year,
        invested: Math.round(invested),
        totalValue: Math.round(futureValue),
        realValue: Math.round(realValue),
      });
    }
  } else {
    // Lumpsum calculation: A = P(1 + r)^n
    const annualRate = expectedReturn / 100;
    
    for (let year = 1; year <= periodYears; year++) {
      const invested = investmentAmount;
      const futureValue = investmentAmount * Math.pow(1 + annualRate, year);
      const realValue = futureValue / Math.pow(1 + annualInflation, year);

      yearlyData.push({
        year,
        invested: Math.round(invested),
        totalValue: Math.round(futureValue),
        realValue: Math.round(realValue),
      });
    }
  }

  const lastYear = yearlyData[yearlyData.length - 1];
  const frequencyFactor = getFrequencyFactor(frequency);
  const totalInvested = mode === 'SIP' ? investmentAmount * periodYears * frequencyFactor : investmentAmount;
  const totalValue = lastYear ? lastYear.totalValue : 0;
  const realValue = lastYear ? lastYear.realValue : 0;
  const estimatedReturns = totalValue - totalInvested;

  return {
    totalInvested: Math.round(totalInvested),
    estimatedReturns: Math.round(estimatedReturns),
    totalValue: Math.round(totalValue),
    realValue: Math.round(realValue),
    inflationRate,
    yearlyData,
  };
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
};
