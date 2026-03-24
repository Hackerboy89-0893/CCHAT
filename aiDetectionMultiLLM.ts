import { invokeLLM } from "./_core/llm";

interface DetectionResult {
  aiProbability: number;
  confidence: number;
  indicators: {
    tokenProbability: number;
    regenerationSimilarity: number;
    combined: number;
  };
  explanation: string;
}

/**
 * Final AI detection using:
 * 1. Token probability analysis - AI text has predictably high token probabilities
 * 2. Semantic similarity regeneration - AI text regenerates similarly to itself
 */
export async function detectAIFinal(text: string): Promise<DetectionResult> {
  if (!text || text.length < 50) {
    throw new Error("Text must be at least 50 characters");
  }

  // Run both detection methods in parallel
  const [tokenProbScore, regenerationScore] = await Promise.all([
    analyzeTokenProbabilities(text),
    analyzeRegenerationSimilarity(text),
  ]);

  // Combine scores: 60% token probability, 40% regeneration similarity
  const combinedScore = tokenProbScore * 0.6 + regenerationScore * 0.4;

  // Calculate confidence based on agreement between methods
  const scoreDifference = Math.abs(tokenProbScore - regenerationScore);
  let confidence = 0.7;
  if (scoreDifference < 0.15) {
    confidence = 0.95; // Methods agree strongly
  } else if (scoreDifference < 0.3) {
    confidence = 0.85; // Methods mostly agree
  }

  const explanation = generateExplanation(combinedScore, tokenProbScore, regenerationScore);

  return {
    aiProbability: combinedScore,
    confidence,
    indicators: {
      tokenProbability: tokenProbScore,
      regenerationSimilarity: regenerationScore,
      combined: combinedScore,
    },
    explanation,
  };
}

/**
 * Analyze token probability distribution
 * AI text tends to have higher, more predictable token probabilities
 * Human text has more varied probability distribution
 */
async function analyzeTokenProbabilities(text: string): Promise<number> {
  try {
    // Use LLM to analyze the text's token probability characteristics
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert in statistical text analysis. Analyze the given text for AI generation markers based on token probability characteristics.

Key indicators of AI-generated text:
1. Overly predictable word choices (high token probability)
2. Consistent, safe vocabulary selections
3. Lack of rare or unexpected word combinations
4. Smooth, predictable transitions between ideas
5. Absence of low-probability (creative/risky) word choices

Respond with ONLY a number between 0 and 1 indicating probability of AI generation based on token probability patterns.
0 = human-like varied probabilities, 1 = AI-like predictable probabilities.
No explanation, just the number.`,
        },
        {
          role: "user",
          content: `Analyze token probability characteristics:\n\n${text}`,
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
    console.error("Error in token probability analysis:", error);
    return 0.5;
  }
}

/**
 * Analyze semantic similarity between original and regenerated text
 * AI text regenerates very similarly to itself
 * Human text regenerates with more variation
 */
async function analyzeRegenerationSimilarity(text: string): Promise<number> {
  try {
    // Extract key concepts from original text
    const conceptResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Extract the main concepts, arguments, and narrative structure from the given text in 1-2 sentences.",
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const concepts = typeof conceptResponse.choices[0]?.message?.content === "string" 
      ? conceptResponse.choices[0].message.content 
      : "";

    // Regenerate text based on those concepts
    const regeneratedResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Based on the given concepts, write a paragraph in a similar style and tone. Make it sound natural and authentic.",
        },
        {
          role: "user",
          content: `Concepts: ${concepts}\n\nWrite a paragraph based on these concepts:`,
        },
      ],
    });

    const regeneratedText = typeof regeneratedResponse.choices[0]?.message?.content === "string"
      ? regeneratedResponse.choices[0].message.content
      : "";

    // Compare similarity using LLM
    const similarityResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Compare the semantic similarity between two texts. 
          
AI-generated text tends to regenerate very similarly to itself (high similarity).
Human-written text tends to regenerate with more variation (lower similarity).

Respond with ONLY a number between 0 and 1 indicating how similar the regenerated text is to the original.
0 = very different (human-like), 1 = very similar (AI-like).
No explanation, just the number.`,
        },
        {
          role: "user",
          content: `Original text:\n${text}\n\nRegenerated text:\n${regeneratedText}\n\nHow similar are they?`,
        },
      ],
    });

    const content = similarityResponse.choices[0]?.message?.content;
    if (typeof content === "string") {
      const score = parseFloat(content.trim());
      return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    }
    return 0.5;
  } catch (error) {
    console.error("Error in regeneration similarity analysis:", error);
    return 0.5;
  }
}

/**
 * Generate human-readable explanation
 */
function generateExplanation(combinedScore: number, tokenScore: number, regenerationScore: number): string {
  if (combinedScore >= 0.8) {
    return `Strong AI generation indicators detected. Token probability analysis shows predictable word choices (${(tokenScore * 100).toFixed(0)}%), and regeneration similarity is high (${(regenerationScore * 100).toFixed(0)}%), both characteristic of LLM outputs.`;
  } else if (combinedScore >= 0.6) {
    return `Likely AI-generated. Multiple indicators suggest LLM authorship including predictable token patterns and high regeneration similarity.`;
  } else if (combinedScore >= 0.4) {
    return `Mixed indicators detected. Some AI characteristics present but also human-like elements. Further review recommended.`;
  } else if (combinedScore >= 0.2) {
    return `Minimal AI indicators. Text appears mostly human-written with few LLM characteristics.`;
  } else {
    return `Analysis indicates human authorship. No significant AI generation markers detected.`;
  }
}
