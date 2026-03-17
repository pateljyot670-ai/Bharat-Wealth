
import { GoogleGenAI, Type } from "@google/genai";
import { SIPInputs, SIPResults, AIInsight } from "../types";

export const getFinancialInsights = async (inputs: SIPInputs, results: SIPResults): Promise<AIInsight | null> => {
  let apiKey: string | undefined;
  
  try {
    // Attempt to access process.env safely
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
      // Wait a bit before retrying
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw lastError;
};
