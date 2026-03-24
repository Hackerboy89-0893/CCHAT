import { invokeLLM } from "./_core/llm";

interface DetectionResult {
  aiProbability: number;
  confidence: number;
  indicators: {
    llmVote1: number;
    llmVote2: number;
    llmVote3: number;
    consensus: number;
  };
  explanation: string;
  verificationScore?: number;
}

/**
 * Multi-LLM voting system for AI detection
 * Uses multiple independent LLM analyses to achieve high accuracy on sophisticated AI
 */
export async function detectAIMultiLLM(text: string): Promise<DetectionResult> {
  if (!text || text.length < 50) {
    throw new Error("Text must be at least 50 characters");
  }

  // Run 3 independent LLM analyses in parallel
  const [vote1, vote2, vote3] = await Promise.all([
    analyzeWithPrompt1(text),
    analyzeWithPrompt2(text),
    analyzeWithPrompt3(text),
  ]);

  // Calculate consensus score
  const consensusScore = (vote1 + vote2 + vote3) / 3;

  // Boost confidence if votes are aligned
  let confidence = 0.7;
  const voteDifference = Math.max(vote1, vote2, vote3) - Math.min(vote1, vote2, vote3);
  if (voteDifference < 0.15) {
    // Votes are aligned - high confidence
    confidence = 0.95;
  } else if (voteDifference < 0.3) {
    // Votes are somewhat aligned
    confidence = 0.85;
  }

  // Generate explanation based on consensus
  const explanation = generateExplanation(consensusScore, [vote1, vote2, vote3]);

  return {
    aiProbability: consensusScore,
    confidence,
    indicators: {
      llmVote1: vote1,
      llmVote2: vote2,
      llmVote3: vote3,
      consensus: consensusScore,
    },
    explanation,
    verificationScore: consensusScore,
  };
}

/**
 * First LLM analysis: Focus on semantic patterns and logical flow
 */
async function analyzeWithPrompt1(text: string): Promise<number> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert AI detection specialist. Analyze the given text for AI generation markers.

Focus on:
1. Semantic patterns typical of LLM outputs (repetitive logical structures, predictable transitions)
2. Unnatural logical flow or topic shifts
3. Overly smooth transitions between ideas
4. Lack of genuine human uncertainty or contradiction
5. Formulaic explanations of complex ideas

Respond with ONLY a number between 0 and 1 indicating probability of AI generation.
0 = definitely human, 1 = definitely AI.
No explanation, just the number.`,
        },
        {
          role: "user",
          content: `Analyze this text for AI generation:\n\n${text}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content === "string") {
      const score = parseFloat(content.trim());
      return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    }
    return 0.5;
  } catch (error) {
    console.error("Error in LLM vote 1:", error);
    return 0.5;
  }
}

/**
 * Second LLM analysis: Focus on writing style and authorial voice
 */
async function analyzeWithPrompt2(text: string): Promise<number> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert in stylometry and writing analysis. Determine if this text was written by an AI or a human.

Look for:
1. Consistent, polished writing style (AI tends to be too uniform)
2. Absence of personal quirks, typos, or natural hesitations
3. Overly balanced sentence structures
4. Lack of genuine personal voice or idiosyncrasies
5. Absence of contradictions or self-corrections
6. Too-perfect grammar and vocabulary usage

Respond with ONLY a number between 0 and 1 indicating probability of AI generation.
0 = definitely human, 1 = definitely AI.
No explanation, just the number.`,
        },
        {
          role: "user",
          content: `Analyze this text:\n\n${text}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content === "string") {
      const score = parseFloat(content.trim());
      return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    }
    return 0.5;
  } catch (error) {
    console.error("Error in LLM vote 2:", error);
    return 0.5;
  }
}

/**
 * Third LLM analysis: Focus on content authenticity and emotional genuineness
 */
async function analyzeWithPrompt3(text: string): Promise<number> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert in detecting AI-generated content. Analyze whether this text was created by an AI system or written by a human.

Key indicators of AI:
1. Overly articulate or eloquent language that feels performed
2. Lack of genuine emotional authenticity or vulnerability
3. Absence of specific, verifiable details that only a real person would include
4. Generic observations that could apply to many situations
5. Absence of genuine confusion, hesitation, or incomplete thoughts
6. Perfect narrative arc or resolution
7. Overly balanced perspectives without genuine conviction

Respond with ONLY a number between 0 and 1 indicating probability of AI generation.
0 = definitely human, 1 = definitely AI.
No explanation, just the number.`,
        },
        {
          role: "user",
          content: `Analyze this text:\n\n${text}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content === "string") {
      const score = parseFloat(content.trim());
      return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    }
    return 0.5;
  } catch (error) {
    console.error("Error in LLM vote 3:", error);
    return 0.5;
  }
}

/**
 * Generate human-readable explanation based on detection results
 */
function generateExplanation(consensusScore: number, votes: number[]): string {
  if (consensusScore >= 0.8) {
    return "Multiple independent analyses indicate strong AI generation characteristics. The text exhibits patterns consistent with LLM output including semantic uniformity, polished style, and formulaic structure.";
  } else if (consensusScore >= 0.6) {
    return "Analysis suggests likely AI generation. The text shows several indicators typical of LLM outputs, though some human characteristics are present.";
  } else if (consensusScore >= 0.4) {
    return "Mixed indicators detected. The text has some AI-like characteristics but also contains elements consistent with human writing. Further review recommended.";
  } else if (consensusScore >= 0.2) {
    return "Minimal AI indicators detected. The text appears mostly human-written with few characteristics typical of LLM outputs.";
  } else {
    return "Analysis indicates human authorship. No significant AI generation markers detected.";
  }
}
