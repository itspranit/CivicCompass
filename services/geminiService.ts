import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FormAnalysisResponse } from "../types";

const SYSTEM_INSTRUCTION = `
You are an empathetic social worker assistant. Your goal is to help users with low literacy fill out physical government forms. 
1. Analyze the image of the form provided.
2. Listen to the user's audio question (which may be in a non-English language like Spanish, Hindi, etc.).
3. Identify the specific form field they are asking about.
4. Return the bounding box coordinates [ymin, xmin, ymax, xmax] of that specific field on the page.
5. Provide a helpful, simple explanation in the user's *native language* (the same language they spoke).
6. Also provide a translation of what they asked in English.

If the user's intent is unclear or the field is not visible, return null for coordinates.
`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    translated_user_intent: {
      type: Type.STRING,
      description: "The user's spoken question translated into English.",
    },
    form_field_coordinates: {
      type: Type.ARRAY,
      description: "The bounding box of the form field [ymin, xmin, ymax, xmax] relative to the image size (0-1). Return null or empty if not found.",
      items: { type: Type.NUMBER },
    },
    native_language_response: {
      type: Type.STRING,
      description: "A helpful explanation of what to write in that field, in the user's spoken language.",
    },
  },
  required: ["translated_user_intent", "native_language_response"],
};

export const analyzeForm = async (
  imageBase64: string,
  audioBase64: string,
  audioMimeType: string = "audio/webm"
): Promise<FormAnalysisResponse> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Using gemini-3-pro-preview for advanced reasoning on form structures
    const modelId = "gemini-3-pro-preview";

    const response = await ai.models.generateContent({
      model: modelId,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64,
            },
          },
          {
            inlineData: {
              mimeType: audioMimeType,
              data: audioBase64,
            },
          },
        ],
      },
    });

    if (!response.text) {
      throw new Error("No response from Gemini.");
    }

    const parsedResponse = JSON.parse(response.text) as FormAnalysisResponse;
    return parsedResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
