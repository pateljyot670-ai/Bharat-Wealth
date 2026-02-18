
import { GoogleGenAI, Type } from "@google/genai";
import { SIPInputs, SIPResults, AIInsight } from "../types";

export const getFinancialInsights = async (inputs: SIPInputs, results: SIPResults): Promise<AIInsight | null> => {
  // FIX: Per coding guidelines, API key must be sourced directly from process.env.API_KEY without fallbacks.
  const ai = new GoogleGenAI({ apiKey: Import.meta.env.VITE_GEMINI_API_KEY });
  
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
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

    const text = response.text?.trim();
    if (text) {
      return JSON.parse(text) as AIInsight;
    }
    return null;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};
