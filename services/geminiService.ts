import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ReceiptData } from "../types";

// Helper to get the AI client safely
// This prevents the app from crashing at startup if the API key is missing
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to encode file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const receiptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          price: { type: Type.NUMBER },
          id: { type: Type.STRING, description: "A unique identifier for the item (e.g., item_1)" },
        },
        required: ["name", "price", "id"],
      },
    },
    subtotal: { type: Type.NUMBER },
    tax: { type: Type.NUMBER },
    tip: { type: Type.NUMBER },
    total: { type: Type.NUMBER },
    currency: { type: Type.STRING, description: "Currency symbol, e.g., $, €, £" },
  },
  required: ["items", "subtotal", "tax", "total", "currency"],
};

export const parseReceiptImage = async (base64Data: string, mimeType: string): Promise<ReceiptData> => {
  const modelId = "gemini-3-pro-preview";

  const prompt = `
    Analyze this receipt image. Extract all line items with their prices.
    Also extract the subtotal, tax, and total. If a tip is written or included, extract it (default to 0 if not found).
    Return the data in a strict JSON format matching the schema.
    Assign a unique 'id' to each item (e.g., '1', '2', '3').
  `;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);
    
    // Add empty assignedTo arrays to items
    const itemsWithAssignments = data.items.map((item: any) => ({
      ...item,
      assignedTo: [],
    }));

    return {
      ...data,
      items: itemsWithAssignments,
      tip: data.tip || 0, // Ensure tip exists
    };

  } catch (error) {
    console.error("Error parsing receipt:", error);
    throw error;
  }
};

const updateResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    message: { type: Type.STRING, description: "A conversational response to the user." },
    updatedReceipt: { 
      type: Type.OBJECT,
      description: "The fully updated receipt object with modified assignments.",
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: {type: Type.STRING},
              name: {type: Type.STRING},
              price: {type: Type.NUMBER},
              assignedTo: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        },
        subtotal: { type: Type.NUMBER },
        tax: { type: Type.NUMBER },
        tip: { type: Type.NUMBER },
        total: { type: Type.NUMBER },
        currency: { type: Type.STRING },
      }
    },
  },
  required: ["message"],
};

export const processChatCommand = async (
  currentReceipt: ReceiptData,
  userMessage: string,
  attendees: string[] = []
): Promise<{ message: string; updatedReceipt?: ReceiptData }> => {
  
  const modelId = "gemini-3-pro-preview";

  const prompt = `
    You are a helpful bill-splitting assistant.
    
    Context - Attendees at the table:
    ${JSON.stringify(attendees)}
    
    Current Receipt State:
    ${JSON.stringify(currentReceipt, null, 2)}
    
    User Message:
    "${userMessage}"
    
    Instructions:
    1. Interpret the user's message to assign items to people from the attendees list.
    2. Update the 'assignedTo' array for the relevant items in the receipt.
    3. If a user says "Tom had the burger", add "Tom" to the burger's assignedTo list. 
       (Match "Tom" to the closest name in the attendees list if possible).
    4. If multiple people shared an item (e.g., "Tom and Jerry shared the fries"), add both names.
    5. If the user asks a question about the bill, just answer it in the 'message' field and return the receipt unchanged.
    6. If the user explicitly sets a tip (e.g., "Add $10 tip" or "20% tip"), update the 'tip' field.
    7. Return a JSON object with a 'message' (response to user) and 'updatedReceipt' (the full updated state).
    8. Be smart about matching item names (fuzzy match).
  `;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: updateResponseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text);
  } catch (error) {
    console.error("Error processing chat command:", error);
    throw error;
  }
};