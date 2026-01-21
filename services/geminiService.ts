
import { GoogleGenAI } from "@google/genai";
import { Artwork, Guest } from "../types";

// Always use the process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGuestCritique = async (artwork: Artwork, guest: Guest): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `당신은 "${guest.name}"입니다. 성격은 "${guest.personality}"이며, 말투는 "${guest.speechStyle}"입니다.
      지금 미술관에서 "${artwork.title}"(작가: ${artwork.artist})이라는 작품을 보고 있습니다.
      작품 설명: "${artwork.description}".
      이 작품을 보고 당신의 성격과 말투를 완벽히 반영하여 1~2문장으로 짧은 한국어 감상평을 남겨주세요.`,
      config: {
        temperature: 0.9,
      }
    });
    // Use the .text property directly instead of .text() method
    return response.text?.trim() || "흠, 흥미로운 작품이군.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "정말 멋진 그림이네요.";
  }
};