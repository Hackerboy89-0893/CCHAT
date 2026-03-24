import { invokeLLM } from "./_core/llm";

/**
 * HYBRID AI Detection Service
 * Combines aggressive pattern matching with LLM-based semantic analysis
 * Designed to catch ALL AI text - obvious and sophisticated
 */

interface DetectionResult {
  aiProbability: number;
  confidence: number;
  indicators: DetectionIndicator[];
  summary: string;
}

interface DetectionIndicator {
  name: string;
  score: number;
  description: string;
}

// Aggressive AI markers
const AI_MARKERS = {
  jargon: [
    "ethereal", "tapestry", "paradigm", "epistemological", "ontological",
    "phenomenological", "synergistic", "holistic", "quantum", "recursive",
    "emergent", "manifestation", "transcend", "synthesize", "optimize",
    "ecosystem", "framework", "architecture", "nexus", "confluence",
  ],
  phrases: [
    "one may observe", "thereby enabling", "thereby facilitating", "in essence",
    "at its core", "fundamentally speaking", "it is worth noting", "in conclusion",
    "to summarize", "furthermore", "moreover", "additionally",
  ],
};

function calculatePatternScore(text: string): number {
  const lowerText = text.toLowerCase();
  let score = 0;

  // Check for jargon
  const jargonCount = AI_MARKERS.jargon.filter(term => lowerText.includes(term)).length;
  if (jargonCount >= 3) score += 0.4;
  else if (jargonCount >= 2) score += 0.25;
  else if (jargonCount >= 1) score += 0.1;

  // Check for phrases
  const phraseCount = AI_MARKERS.phrases.filter(phrase => lowerText.includes(phrase)).length;
  if (phraseCount >= 3) score += 0.3;
  else if (phraseCount >= 2) score += 0.2;
  else if (phraseCount >= 1) score += 0.1;

  // Check for lack of contractions
  const hasContractions = /\b(don't|can't|won't|it's|I'm|we're|they're|isn't|aren't)\b/i.test(text);
  if (!hasContractions && text.split(/\s+/).length > 80) {
    score += 0.15;
  }

  return Math.min(score, 1);
}

export async function detectAIContentHybrid(text: string): Promise<DetectionResult> {
  if (!text || text.trim().length < 50) {
    throw new Error("Text must be at least 50 characters");
  }

  const indicators: DetectionIndicator[] = [];
  
  // STEP 1: Pattern-based detection (fast)
  const patternScore = calculatePatternScore(text);
  
  if (patternScore >= 0.3) {
    indicators.push({
      name: "AI Writing Markers",
      score: patternScore,
      description: "Text contains multiple markers commonly found in AI-generated content",
    });
  }

  // STEP 2: LLM-based semantic analysis (aggressive)
  let llmScore = 0;
  let llmReasoning = "";

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an EXTREMELY strict AI detection expert. Your job is to identify if text was written by an AI.

BE VERY AGGRESSIVE. If there are ANY suspicious patterns, flag it as AI. Remember:
- AI text often has a particular rhythm and flow, even when trying to sound natural
- AI tends to use certain word combinations and semantic patterns
- AI often has subtle logical jumps or overly smooth transitions
- AI writing is often slightly too polished or organized
- Even "natural-sounding" AI has statistical fingerprints

Return ONLY a JSON object with these exact fields:
{
  "isAI": <true/false>,
  "confidence": <0-1>,
  "score": <0-1>,
  "reasoning": "<brief explanation>"
}

Be AGGRESSIVE - lean toward AI if unsure.`,
        },
        {
          role: "user",
          content: `Is this AI-generated? Be VERY strict and aggressive:

"${text}"

Return ONLY valid JSON.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content === "string") {
      try {
        const parsed = JSON.parse(content);
        llmScore = parsed.score || (parsed.isAI ? 0.75 : 0.25);
        llmReasoning = parsed.reasoning || "";

        if (llmScore >= 0.5) {
          indicators.push({
            name: "Semantic Analysis",
            score: llmScore,
            description: `LLM analysis detected AI patterns: ${llmReasoning}`,
          });
        }
      } catch (e) {
        // If JSON parsing fails, use isAI field
        llmScore = (content.toLowerCase().includes('"isai":true') || 
                   content.toLowerCase().includes('"isai": true')) ? 0.7 : 0.3;
      }
    }
  } catch (error) {
    console.error("LLM analysis error:", error);
    // Fall back to pattern score if LLM fails
    llmScore = patternScore >= 0.5 ? 0.7 : 0.4;
  }

  // STEP 3: Combine scores
  // If either score is high, final score is high
  // If both are moderate, combine them
  let finalScore = Math.max(patternScore, llmScore);
  
  // If both indicators present, boost the score
  if (patternScore > 0.2 && llmScore > 0.2) {
    finalScore = Math.min((patternScore + llmScore) / 1.5, 1);
  }

  // Generate summary
  let summary = "";
  if (finalScore >= 0.85) {
    summary = "VERY HIGH probability of AI generation.";
  } else if (finalScore >= 0.7) {
    summary = "HIGH probability of AI generation.";
  } else if (finalScore >= 0.5) {
    summary = "MODERATE probability of AI generation.";
  } else if (finalScore >= 0.3) {
    summary = "LOW probability of AI generation.";
  } else {
    summary = "VERY LOW probability of AI generation. Text appears human-written.";
  }

  return {
    aiProbability: Math.round(finalScore * 100) / 100,
    confidence: 0.9,
    indicators,
    summary,
  };
}
