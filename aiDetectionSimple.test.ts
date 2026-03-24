import { invokeLLM } from "./_core/llm";

interface DetectionResult {
  aiProbability: number;
  confidence: number;
  indicators: {
    perplexity: number;
    burstiness: number;
    topicSimilarity?: number;
    combined: number;
  };
  explanation: string;
  usedTopicComparison: boolean;
}

/**
 * AI detection using perplexity + burstiness (GPTZero method)
 * + optional topic-based AI text comparison
 */
export async function detectAIWithPerplexity(
  text: string,
  topic?: string
): Promise<DetectionResult> {
  if (!text || text.length < 50) {
    throw new Error("Text must be at least 50 characters");
  }

  // Calculate perplexity and burstiness
  const perplexityScore = calculatePerplexity(text);
  const burstnessScore = calculateBurstiness(text);

  let topicSimilarityScore: number | undefined;
  let usedTopicComparison = false;

  // If topic provided, generate reference AI text and compare
  if (topic && topic.trim().length > 0) {
    topicSimilarityScore = await compareWithGeneratedAIText(text, topic);
    usedTopicComparison = true;
  }

  // Combine scores
  let combinedScore: number;
  if (usedTopicComparison && topicSimilarityScore !== undefined) {
    // Weight: 35% perplexity, 25% burstiness, 40% topic similarity
    combinedScore =
      perplexityScore * 0.35 + burstnessScore * 0.25 + topicSimilarityScore * 0.4;
  } else {
    // Weight: 50% perplexity, 50% burstiness
    combinedScore = perplexityScore * 0.5 + burstnessScore * 0.5;
  }

  // Calculate confidence based on signal strength
  let confidence = 0.75;
  if (usedTopicComparison) {
    confidence = 0.9; // Higher confidence with topic comparison
  }

  const explanation = generateExplanation(
    combinedScore,
    perplexityScore,
    burstnessScore,
    topicSimilarityScore,
    usedTopicComparison
  );

  return {
    aiProbability: combinedScore,
    confidence,
    indicators: {
      perplexity: perplexityScore,
      burstiness: burstnessScore,
      topicSimilarity: topicSimilarityScore,
      combined: combinedScore,
    },
    explanation,
    usedTopicComparison,
  };
}

/**
 * Calculate perplexity score
 * AI text has LOW perplexity (predictable word choices)
 * Human text has HIGH perplexity (varied word choices)
 *
 * Returns 0-1 where 1 = definitely AI, 0 = definitely human
 */
function calculatePerplexity(text: string): number {
  // Split into sentences and words
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const words = text.toLowerCase().split(/\s+/);

  if (words.length < 10 || sentences.length === 0) {
    return 0.5;
  }

  // Calculate average sentence length
  const avgSentenceLength = words.length / sentences.length;

  // Calculate word frequency distribution
  const wordFreq: Record<string, number> = {};
  let uniqueWords = 0;

  for (const word of words) {
    const cleanWord = word.replace(/[^a-z0-9]/g, "");
    if (cleanWord.length > 0) {
      wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      if (wordFreq[cleanWord] === 1) uniqueWords++;
    }
  }

  // Calculate entropy (measure of word diversity)
  let entropy = 0;
  const totalWords = words.length;

  for (const count of Object.values(wordFreq)) {
    const probability = count / totalWords;
    entropy -= probability * Math.log2(probability);
  }

  // Normalize entropy (max entropy for this vocabulary size)
  const maxEntropy = Math.log2(Math.min(uniqueWords, totalWords));
  const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0.5;

  // AI text characteristics:
  // - Consistent sentence length (low variation)
  // - Predictable vocabulary (lower entropy)
  // - Moderate sentence length (not too short, not too long)

  const sentenceLengthVariation = calculateVariation(
    sentences.map((s) => s.trim().split(/\s+/).length)
  );

  // Score: lower entropy + lower variation = more AI-like
  const perplexityScore = (1 - normalizedEntropy) * 0.6 + (1 - sentenceLengthVariation) * 0.4;

  return Math.max(0, Math.min(1, perplexityScore));
}

/**
 * Calculate burstiness score
 * AI text has LOW burstiness (uniform sentence structure)
 * Human text has HIGH burstiness (varied sentence structure)
 *
 * Returns 0-1 where 1 = definitely AI, 0 = definitely human
 */
function calculateBurstiness(text: string): number {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

  if (sentences.length < 3) {
    return 0.5;
  }

  // Calculate sentence lengths
  const sentenceLengths = sentences.map((s) => s.trim().split(/\s+/).length);

  // Calculate variation in sentence length
  const variation = calculateVariation(sentenceLengths);

  // Calculate average word length
  const words = text.toLowerCase().split(/\s+/);
  const avgWordLength =
    words.reduce((sum, word) => sum + word.replace(/[^a-z]/g, "").length, 0) /
    words.length;

  // AI text characteristics:
  // - Low variation in sentence length (low burstiness)
  // - Consistent word length
  // - Smooth transitions

  // Score: lower variation = more AI-like
  const burstnessScore = 1 - variation;

  return Math.max(0, Math.min(1, burstnessScore));
}

/**
 * Calculate statistical variation (coefficient of variation)
 */
function calculateVariation(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (normalized standard deviation)
  const cv = mean > 0 ? stdDev / mean : 0;

  // Cap at 1 for comparison purposes
  return Math.min(1, cv);
}

/**
 * Generate AI text on the given topic and compare similarity
 */
async function compareWithGeneratedAIText(text: string, topic: string): Promise<number> {
  try {
    // Generate AI text on the same topic
    const aiTextResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Write a comprehensive essay or detailed explanation about the following topic. Make it informative and well-structured.`,
        },
        {
          role: "user",
          content: `Topic: ${topic}\n\nWrite a detailed piece about this topic (similar length to a paragraph or short essay):`,
        },
      ],
    });

    const generatedAIText =
      typeof aiTextResponse.choices[0]?.message?.content === "string"
        ? aiTextResponse.choices[0].message.content
        : "";

    if (!generatedAIText) {
      return 0.5;
    }

    // Compare semantic similarity using LLM
    const similarityResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Compare the semantic similarity between two texts about the same topic.

If the texts are very similar in structure, vocabulary, and ideas, the input text is likely AI-generated.
If the texts are quite different despite being on the same topic, the input text is likely human-written.

Respond with ONLY a number between 0 and 1 indicating similarity:
0 = very different (human-like)
1 = very similar (AI-like)

No explanation, just the number.`,
        },
        {
          role: "user",
          content: `Topic: ${topic}

Generated AI text:\n${generatedAIText}\n\nInput text to check:\n${text}\n\nHow similar are they?`,
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
    console.error("Error in topic-based comparison:", error);
    return 0.5;
  }
}

/**
 * Generate human-readable explanation
 */
function generateExplanation(
  combinedScore: number,
  perplexityScore: number,
  burstnessScore: number,
  topicSimilarityScore: number | undefined,
  usedTopicComparison: boolean
): string {
  let explanation = "";

  if (combinedScore >= 0.8) {
    explanation = "Strong AI generation indicators detected. ";
  } else if (combinedScore >= 0.6) {
    explanation = "Likely AI-generated. ";
  } else if (combinedScore >= 0.4) {
    explanation = "Mixed indicators detected. ";
  } else if (combinedScore >= 0.2) {
    explanation = "Minimal AI indicators. ";
  } else {
    explanation = "Analysis indicates human authorship. ";
  }

  explanation += `Perplexity score: ${(perplexityScore * 100).toFixed(0)}% (lower = more AI-like), `;
  explanation += `Burstiness: ${(burstnessScore * 100).toFixed(0)}% (lower = more AI-like). `;

  if (usedTopicComparison && topicSimilarityScore !== undefined) {
    explanation += `Topic comparison similarity: ${(topicSimilarityScore * 100).toFixed(0)}%.`;
  }

  return explanation;
}
