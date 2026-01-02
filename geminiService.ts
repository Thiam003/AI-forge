
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { ProjectFile, ChatMessage } from "./types";

const MODEL_NAME = 'gemini-3-pro-preview';

export async function generateProjectResponse(
  prompt: string,
  history: ChatMessage[],
  files: ProjectFile[]
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const fileParts: Part[] = files.map(file => {
    if (file.isText) {
      return { text: `File: ${file.name}\nContent:\n${file.content}\n---` };
    } else {
      return {
        inlineData: {
          data: file.content,
          mimeType: file.type
        }
      };
    }
  });

  const systemInstruction = `You are a world-class Full Stack Engineer and Game Developer.
CRITICAL: You MUST provide the full, complete source code. Do not describe it; write it.
For the user to see a real preview, you MUST include one block of code wrapped in \`\`\`html that contains a standalone, functional version of the app/game (including CSS and JS inline). 
Label this block clearly or ensure it is the main block.
Refer to any uploaded files (images, docs, etc.) provided in the context.
If the user asks for a game, use Phaser, Three.js, or vanilla Canvas as needed.
ALWAYS prioritize providing executable code over explanations.`;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [
      { role: 'user', parts: [...fileParts, { text: prompt }] }
    ],
    config: {
      systemInstruction,
      temperature: 0.2, // Lower temperature for more consistent code output
      thinkingConfig: { thinkingBudget: 8000 } // More thinking for complex code
    }
  });

  return response.text || "No response generated.";
}
