
import { GoogleGenAI, Type } from "@google/genai";
import { SIPInputs, SIPResults, LoanInputs, LoanResults, SWPInputs, SWPResults, AIInsight, CalculationMode } from "../types";

export const getFinancialInsights = async (inputs: SIPInputs, results: SIPResults): Promise<AIInsight | null> => {
  let apiKey: string | undefined;
  
  try {
    apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined;
  } catch (e) {
    console.warn("Could not access process.env directly:", e);
  }
  
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not defined in the environment.");
    throw new Error("AI Service is currently unavailable. Please check back later.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const frequencyText = inputs.mode === 'SIP' ? `${inputs.frequency} SIP` : 'One-time Lumpsum';
  
  const prompt = `
    Analyze the following investment plan for an Indian investor and provide a structured JSON response.
    Details:
    - Type: ${frequencyText}
    - Amount: ₹${inputs.investmentAmount.toLocaleString('en-IN')}
    - Return Rate: ${inputs.expectedReturn}% p.a.
    - Horizon: ${inputs.periodYears} years
    - Final Value: ₹${results.totalValue.toLocaleString('en-IN')}
    
    Provide a concise analysis, one pro tip, and one warning.
  `;

  let lastError: any;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are a professional financial advisor specializing in the Indian market. Provide structured, actionable investment insights in JSON format.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: {
                type: Type.STRING,
                description: "A brief analysis of this wealth accumulation plan in the context of Indian market trends."
              },
              proTip: {
                type: Type.STRING,
                description: "A single, actionable 'Pro Tip' for an Indian investor regarding their commitment."
              },
              warning: {
                type: Type.STRING,
                description: "A single, realistic warning or consideration (e.g., taxation or inflation impact)."
              }
            },
            required: ["analysis", "proTip", "warning"]
          }
        }
      });

      const text = response.text;
      if (text) {
        const cleanText = text.replace(/```json\n?|```/g, '').trim();
        return JSON.parse(cleanText) as AIInsight;
      }
      throw new Error("Empty response from AI");

    } catch (error: any) {
      lastError = error;
      console.error(`Gemini API Error (Attempt ${attempt}):`, error);
      if (error.message?.includes("API_KEY_INVALID")) {
        throw new Error("Invalid API Key. Please check your Gemini API configuration.");
      }
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw lastError;
};

export const chatWithAI = async (message: string, context: { mode: CalculationMode, inputs: any, results: any }): Promise<string> => {
  let apiKey: string | undefined;
  try {
    apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined;
  } catch (e) {
    console.warn("Could not access process.env directly:", e);
  }
  
  if (!apiKey) {
    throw new Error("AI Service is currently unavailable.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const { mode, inputs, results } = context;

  let planDetails = '';
  if (mode === 'SIP' || mode === 'Lumpsum') {
    const sip = inputs as SIPInputs;
    const res = results as SIPResults;
    planDetails = `
      - Type: ${sip.mode === 'SIP' ? `${sip.frequency} SIP` : 'Lumpsum'}
      - Amount: ₹${sip.investmentAmount.toLocaleString('en-IN')}
      - Expected Return: ${sip.expectedReturn}% p.a.
      - Horizon: ${sip.periodYears} years
      - Estimated Final Value: ₹${res.totalValue.toLocaleString('en-IN')}
      - Total Invested: ₹${res.totalInvested.toLocaleString('en-IN')}
    `;
  } else if (mode === 'Loan') {
    const loan = inputs as LoanInputs;
    const res = results as LoanResults;
    planDetails = `
      - Type: Loan EMI
      - Loan Amount: ₹${loan.loanAmount.toLocaleString('en-IN')}
      - Interest Rate: ${loan.interestRate}% p.a.
      - Tenure: ${loan.tenureYears} years
      - Monthly EMI: ₹${res.monthlyEMI.toLocaleString('en-IN')}
      - Total Interest: ₹${res.totalInterest.toLocaleString('en-IN')}
      - Total Payment: ₹${res.totalPayment.toLocaleString('en-IN')}
    `;
  } else if (mode === 'SWP') {
    const swp = inputs as SWPInputs;
    const res = results as SWPResults;
    planDetails = `
      - Type: Systematic Withdrawal Plan (SWP)
      - Total Investment: ₹${swp.totalInvestment.toLocaleString('en-IN')}
      - Monthly Withdrawal: ₹${swp.withdrawalAmount.toLocaleString('en-IN')}
      - Expected Return: ${swp.expectedReturn}% p.a.
      - Period: ${swp.periodYears} years
      - Total Withdrawn: ₹${res.totalWithdrawn.toLocaleString('en-IN')}
      - Final Balance: ₹${res.finalBalance.toLocaleString('en-IN')}
    `;
  }

  const systemPrompt = `
    You are Bharat Wealth AI, a friendly and professional financial advisor for Indian investors.
    The user is currently looking at this ${mode} plan:
    ${planDetails}

    Answer the user's questions about this plan or general financial topics (SIP, Lumpsum, Loan EMI, SWP, Mutual Funds, Inflation, Taxation in India).
    Keep responses concise, helpful, and easy to understand. Use emojis where appropriate.
    Always clarify that you provide information, not certified financial advice.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: message }] }],
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error: any) {
    console.error("Chat AI Error:", error);
    throw new Error("Failed to get response from AI. Please try again.");
  }
};

