import { GoogleGenAI, Type } from "@google/genai";
import { Disk, TowerId } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to format the board for the AI
const formatBoardForAI = (towers: Disk[][]) => {
  return JSON.stringify({
    tower_0_left: towers[0],
    tower_1_middle: towers[1],
    tower_2_right: towers[2],
  });
};

export const getAiGuidance = async (
  towers: Disk[][],
  moveCount: number,
  lastMove: string | null
): Promise<string> => {
  if (!apiKey) {
    return "Please configure your API_KEY to use the AI Tutor.";
  }

  const boardState = formatBoardForAI(towers);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        Current Board State (arrays represent disks from bottom to top, numbers are disk sizes): 
        ${boardState}
        
        Move Count: ${moveCount}
        Last Action: ${lastMove || "Game Start"}

        You are a helpful Computer Science Tutor teaching the Tower of Hanoi and Recursion.
        Analyze the current board. 
        1. If the user is doing well, encourage them briefly.
        2. If the user is stuck or making a non-optimal move, explain the logic of the next best move based on the recursive algorithm.
        3. Keep it short (max 2 sentences).
        4. Occasionally mention how this relates to the recursive algorithm (breaking the problem into n-1).
      `,
      config: {
        systemInstruction: "You are a friendly, concise AI game tutor.",
        temperature: 0.7,
        maxOutputTokens: 150,
      }
    });

    return response.text || "Keep going! You're doing great.";
  } catch (error) {
    console.error("AI Error:", error);
    return "I'm having trouble analyzing the board right now. Please try again.";
  }
};
