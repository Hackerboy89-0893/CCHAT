import { invokeLLM } from "./_core/llm";

/**
 * LLM-Based AI Detection Service
 * Uses the LLM itself to recognize AI-generated text patterns
 * Can catch both obvious and sophisticated AI outputs
 */

interface DetectionResult {
  aiProbability: number;
  confidence: number;
  indicators: DetectionIndicator[];
  summary: string;
  reasoning: string;
}

interface DetectionIndicator {
  name: string;
  score: number;
  description: string;
}

export async function detectAIContentLLM(text: string): Promise<DetectionResult> {
  if (!text || text.trim().length < 50) {
    throw new Error("Text must be at least 50 characters");
  }

  try {
    // Use LLM to analyze for AI fingerprints
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert AI detection specialist. Your task is to analyze text and determine if it was written by an AI (like ChatGPT, Claude, etc.) or by a human.

You must be VERY STRICT and AGGRESSIVE in your analysis. If there are ANY signs of AI generation, flag it. Remember:
- AI text often has a particular flow and structure, even when it tries to sound natural
- AI tends to be slightly too polished, too organized, too coherent
- AI often uses certain semantic patterns and word choices that are statistically different from human writing
- Even "natural-sounding" AI text has subtle fingerprints

Return a probability between 0 and 1, where:
- 0.9-1.0 = Almost certainly AI
- 0.7-0.9 = Very likely AI
- 0.5-0.7 = Probably AI
- 0.3-0.5 = Possibly AI
- 0.1-0.3 = Probably human
- 0.0-0.1 = Almost certainly human

Be AGGRESSIVE - if you're unsure, lean toward AI.`,
        },
        {
          role: "user",
          content: `Analyze this text for AI generation. Be very strict and aggressive - if there are ANY signs of AI, flag it as AI.

Text to analyze:
"${text}"

Respond with ONLY valid JSON in this exact format:
{
  "aiProbability": <number 0-1>,
  "confidence": <number 0-1>,
  "indicators": [
    {"name": "<indicator name>", "score": <0-1>, "description": "<explanation>"}
  ],
  "reasoning": "<detailed explanation of why you think this is/isn't AI>"
}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ai_detection",
          strict: true,
          schema: {
            type: "object",
            properties: {
              aiProbability: { type: "number" },
              confidence: { type: "number" },
              indicators: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    score: { type: "number" },
                    description: { type: "string" },
                  },
                  required: ["name", "score", "description"],
                },
              },
              reasoning: { type: "string" },
            },
            required: ["aiProbability", "confidence", "indicators", "reasoning"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content === "string") {
      const parsed = JSON.parse(content);

      // Generate summary based on probability
      let summary = "";
      if (parsed.aiProbability >= 0.85) {
        summary = "VERY HIGH probability of AI generation.";
      } else if (parsed.aiProbability >= 0.7) {
        summary = "HIGH probability of AI generation.";
      } else if (parsed.aiProbability >= 0.5) {
        summary = "MODERATE probability of AI generation.";
      } else if (parsed.aiProbability >= 0.3) {
        summary = "LOW probability of AI generation.";
      } else {
        summary = "VERY LOW probability of AI generation. Text appears human-written.";
      }

      return {
        aiProbability: Math.round(parsed.aiProbability * 100) / 100,
        confidence: Math.round(parsed.confidence * 100) / 100,
        indicators: parsed.indicators || [],
        summary,
        reasoning: parsed.reasoning || "",
      };
    }

    throw new Error("Invalid LLM response format");
  } catch (error) {
    console.error("AI detection error:", error);
    throw new Error("Failed to analyze text. Please try again.");
  }
}
