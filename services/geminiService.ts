import { GoogleGenAI, Type } from "@google/genai";
import { TaskPriority } from "../types";

// Initialize the AI client with the API key from environment variables
// The API key is injected by Vite's define plugin during build.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTaskDescription = async (title: string): Promise<{ description: string, priority: TaskPriority }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Provide a detailed and actionable task description and priority level for a software intern task titled: "${title}".`,
      config: {
        systemInstruction: "You are an expert technical lead managing an intern. Generate a comprehensive task description (approx 2-3 sentences) that outlines the objective, specific actions to take, and what success looks like. Also assign a priority (LOW, MEDIUM, HIGH) based on the task nature: LOW for learning/setup, MEDIUM for development/features, HIGH for bugs/critical deadlines.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
          },
          required: ["description", "priority"],
        },
      },
    });
    
    const result = JSON.parse(response.text || "{}");
    
    // Default to MEDIUM if something goes wrong with the enum mapping
    let priority = TaskPriority.MEDIUM;
    if (result.priority === "LOW") priority = TaskPriority.LOW;
    if (result.priority === "HIGH") priority = TaskPriority.HIGH;

    return {
      description: result.description || "Could not generate description.",
      priority: priority
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { description: "Error generating description. Please try again.", priority: TaskPriority.MEDIUM };
  }
};

export const improveLogEntry = async (entry: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Rewrite the following internship daily log entry to be more professional and concise, highlighting key achievements. Keep the tone humble but clear: "${entry}"`,
    });
    return response.text || entry;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return entry; // Fallback to original
  }
};

export const suggestSkillCategory = async (skillName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Categorize the skill "${skillName}" into exactly one of these categories: Technical, Soft Skill, Business.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: ["Technical", "Soft Skill", "Business"] },
          },
        },
      },
    });
    const result = JSON.parse(response.text || "{}");
    return result.category || "Technical";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Technical"; // Fallback
  }
};