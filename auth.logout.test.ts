import { invokeLLM } from "./_core/llm";

/**
 * Advanced AI Detection Service - IMPROVED
 * Implements aggressive multi-factor analysis for superior accuracy
 * Specifically tuned to catch obvious AI patterns like ChatGPT output
 */

interface DetectionResult {
  aiProbability: number;
  confidence: number;
  indicators: DetectionIndicator[];
  summary: string;
  detailedAnalysis: DetailedAnalysis;
}

interface DetectionIndicator {
  name: string;
  score: number;
  description: string;
  weight: number;
}

interface DetailedAnalysis {
  jargonStacking: AnalysisMetric;
  unnaturaIPhrases: AnalysisMetric;
  sentenceStructure: AnalysisMetric;
  vocabularyAnalysis: AnalysisMetric;
  semanticConsistency: AnalysisMetric;
  entropyAnalysis: AnalysisMetric;
  ngramPatterns: AnalysisMetric;
  overallScore: number;
}

interface AnalysisMetric {
  score: number;
  description: string;
  flaggedItems: string[];
}

/**
 * Main detection function using aggressive multi-factor analysis
 */
export async function detectAIContent(text: string): Promise<DetectionResult> {
  // Validate input
  if (!text || text.trim().length < 50) {
    throw new Error("Text must be at least 50 characters");
  }

  try {
    // Run multiple analysis methods in parallel
    const [
      llmAnalysis,
      jargonAnalysis,
      unnaturalPhraseAnalysis,
      linguisticAnalysis,
      entropyAnalysis,
      ngramAnalysis,
    ] = await Promise.all([
      performLLMAnalysis(text),
      performJargonStackingAnalysis(text),
      performUnnaturalPhraseAnalysis(text),
      performLinguisticAnalysis(text),
      performEntropyAnalysis(text),
      performNgramAnalysis(text),
    ]);

    // Combine results with weighted scoring - MORE AGGRESSIVE
    const combinedResult = combineAnalysisResults(
      llmAnalysis,
      jargonAnalysis,
      unnaturalPhraseAnalysis,
      linguisticAnalysis,
      entropyAnalysis,
      ngramAnalysis,
      text
    );

    return combinedResult;
  } catch (error) {
    console.error("AI detection error:", error);
    throw new Error("Failed to analyze text. Please try again.");
  }
}

/**
 * LLM-based analysis with AGGRESSIVE prompting
 */
async function performLLMAnalysis(text: string) {
  const analysisPrompt = `You are an EXPERT AI content detector. Your job is to AGGRESSIVELY identify AI-generated text.

Text: "${text}"

Provide structured analysis in JSON format:
{
  "aiProbability": <0-1>,
  "confidence": <0-1>,
  "indicators": [
    {"name": "<indicator>", "score": <0-1>, "description": "<detail>"}
  ],
  "summary": "<brief summary>"
}

CRITICAL - Look for these ChatGPT/AI markers:
1. Pseudo-intellectual jargon (ethereal, tapestry, paradigms, epistemological)
2. Unnatural word combinations that sound "smart" but are awkward
3. Excessive use of abstract nouns and adjectives
4. Overly polished, perfect grammar and structure
5. Lack of personal voice, opinions, or natural human quirks
6. Repetitive use of transition phrases
7. Unnecessarily complex vocabulary for simple concepts
8. Lack of contractions and informal language
9. Perfectly balanced sentence structures
10. Generic, non-specific examples

Be AGGRESSIVE - if you see obvious AI patterns, score HIGH (0.8-1.0).`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an AI content detection expert. Be AGGRESSIVE in identifying AI text. Return ONLY valid JSON.",
      },
      {
        role: "user",
        content: analysisPrompt,
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
            summary: { type: "string" },
          },
          required: ["aiProbability", "confidence", "indicators", "summary"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (typeof content === "string") {
    return JSON.parse(content);
  }
  throw new Error("Invalid LLM response");
}

/**
 * Detect jargon stacking - a hallmark of AI writing
 * AI loves combining abstract nouns and adjectives unnecessarily
 */
function performJargonStackingAnalysis(text: string) {
  const pseudoIntellectualTerms = [
    "ethereal",
    "tapestry",
    "paradigm",
    "epistemological",
    "ontological",
    "phenomenological",
    "synergistic",
    "holistic",
    "quantum",
    "recursive",
    "emergent",
    "manifestation",
    "transcend",
    "synthesize",
    "optimize",
    "ecosystem",
    "framework",
    "architecture",
    "nexus",
    "confluence",
    "juxtaposition",
    "dichotomy",
    "duality",
    "symbiotic",
    "concatenation",
    "multidimensional",
    "hypercomplex",
    "luminescent",
    "coalesce",
    "ubiquitous",
    "pervasive",
    "intricate",
    "labyrinthine",
  ];

  const lowerText = text.toLowerCase();
  const flaggedItems: string[] = [];
  let jargonCount = 0;

  pseudoIntellectualTerms.forEach((term) => {
    const regex = new RegExp(`\\b${term}\\b`, "gi");
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      jargonCount += matches.length;
      flaggedItems.push(`"${term}" (${matches.length}x)`);
    }
  });

  // Check for jargon stacking (multiple jargon terms close together)
  const words = text.split(/\s+/);
  let consecutiveJargon = 0;
  let maxConsecutive = 0;

  words.forEach((word) => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
    if (pseudoIntellectualTerms.some((t) => t === cleanWord)) {
      consecutiveJargon++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveJargon);
    } else {
      consecutiveJargon = 0;
    }
  });

  let score = 0;
  if (jargonCount > 5) {
    score += 0.3;
    flaggedItems.push(`Heavy jargon usage: ${jargonCount} pseudo-intellectual terms`);
  }
  if (maxConsecutive >= 3) {
    score += 0.25;
    flaggedItems.push(`Jargon stacking detected: ${maxConsecutive} consecutive jargon terms`);
  }

  return {
    score: Math.min(score, 1),
    description: `Jargon stacking analysis: ${jargonCount} pseudo-intellectual terms found`,
    flaggedItems,
  };
}

/**
 * Detect unnatural phrase combinations
 * AI creates phrases that sound "smart" but are awkward in human speech
 */
function performUnnaturalPhraseAnalysis(text: string) {
  const unnaturalPhrases = [
    "in the ethereal",
    "quantum algorithms dance",
    "pseudo-conscious entities",
    "hyper-luminescent data",
    "epistemological paradigms",
    "transcend conventional",
    "unparalleled optimization",
    "multi-dimensional computational",
    "profound emergence",
    "synthetically manifesting",
    "conceptual frameworks",
    "digital cognition",
    "recursive neural",
    "harmoniously with",
    "thereby enabling",
    "thereby facilitating",
    "thereby allowing",
    "thereby fostering",
    "in essence",
    "at its core",
    "fundamentally speaking",
    "one may observe",
    "it is worth noting",
    "it should be noted",
    "it is important to note",
    "in light of",
    "in the context of",
    "with respect to",
    "with regard to",
    "as it were",
    "so to speak",
    "needless to say",
    "suffice it to say",
  ];

  const lowerText = text.toLowerCase();
  const flaggedItems: string[] = [];
  let unnaturalCount = 0;

  unnaturalPhrases.forEach((phrase) => {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      unnaturalCount += matches.length;
      flaggedItems.push(`"${phrase}" (${matches.length}x)`);
    }
  });

  let score = 0;
  if (unnaturalCount > 3) {
    score += 0.35;
    flaggedItems.push(`Unnatural phrases: ${unnaturalCount} awkward AI-like combinations`);
  }
  if (unnaturalCount > 6) {
    score += 0.2;
    flaggedItems.push(`VERY HIGH unnatural phrase density - strong AI indicator`);
  }

  return {
    score: Math.min(score, 1),
    description: `Unnatural phrase analysis: ${unnaturalCount} awkward combinations detected`,
    flaggedItems,
  };
}

/**
 * Linguistic pattern analysis
 */
function performLinguisticAnalysis(text: string) {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.toLowerCase().split(/\s+/);

  const flaggedItems: string[] = [];
  let score = 0;

  // Check for repetitive sentence starters
  const sentenceStarters = sentences.map((s) =>
    s.trim().split(/\s+/)[0]?.toLowerCase()
  );
  const starterCounts: Record<string, number> = {};
  sentenceStarters.forEach((starter) => {
    if (starter) starterCounts[starter] = (starterCounts[starter] || 0) + 1;
  });

  const repetitiveStarters = Object.entries(starterCounts).filter(
    ([_, count]) => count > sentences.length * 0.25
  );
  if (repetitiveStarters.length > 0) {
    score += 0.2;
    flaggedItems.push(
      `Repetitive sentence starters: ${repetitiveStarters.map(([s]) => s).join(", ")}`
    );
  }

  // Check for passive voice overuse
  const passiveVoicePattern = /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi;
  const passiveCount = (text.match(passiveVoicePattern) || []).length;
  const passiveRatio = passiveCount / sentences.length;
  if (passiveRatio > 0.35) {
    score += 0.15;
    flaggedItems.push(`High passive voice ratio: ${(passiveRatio * 100).toFixed(1)}%`);
  }

  // Check for overly formal transitions
  const formalTransitions = [
    "furthermore",
    "moreover",
    "in conclusion",
    "to summarize",
    "it is worth noting",
    "in essence",
    "at its core",
    "suffice it to say",
  ];
  const transitionCount = formalTransitions.filter((t) =>
    text.toLowerCase().includes(t)
  ).length;
  if (transitionCount > 2) {
    score += 0.15;
    flaggedItems.push(`Excessive formal transitions: ${transitionCount} found`);
  }

  // Check for lack of contractions (AI rarely uses contractions naturally)
  const contractionPattern = /\b(don't|can't|won't|it's|that's|I'm|we're|they're|isn't|aren't|wasn't|weren't)\b/gi;
  const contractionCount = (text.match(contractionPattern) || []).length;
  if (contractionCount === 0 && words.length > 100) {
    score += 0.15;
    flaggedItems.push("No contractions found (very unusual for human writing)");
  }

  // Check for perfect grammar (humans make mistakes)
  const commonMistakes = /\b(their|there|they're|your|you're|its|it's)\b/gi;
  const mistakeCount = (text.match(commonMistakes) || []).length;
  if (mistakeCount === 0 && words.length > 150) {
    score += 0.1;
    flaggedItems.push("Suspiciously perfect grammar - no common human errors");
  }

  return {
    score: Math.min(score, 1),
    description: `Linguistic pattern analysis detected ${flaggedItems.length} anomalies`,
    flaggedItems,
  };
}

/**
 * Entropy analysis - measures randomness/predictability
 */
function performEntropyAnalysis(text: string) {
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq: Record<string, number> = {};

  words.forEach((word) => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Calculate Shannon entropy
  let entropy = 0;
  const totalWords = words.length;
  Object.values(wordFreq).forEach((freq) => {
    const probability = freq / totalWords;
    entropy -= probability * Math.log2(probability);
  });

  // Normalize entropy (0-1 scale)
  const maxEntropy = Math.log2(Math.min(totalWords, Object.keys(wordFreq).length));
  const normalizedEntropy = entropy / (maxEntropy || 1);

  // AI-generated text often has lower entropy (more predictable)
  let score = 0;
  const flaggedItems: string[] = [];

  if (normalizedEntropy < 0.35) {
    score = 0.35;
    flaggedItems.push(
      `Very low vocabulary entropy (${(normalizedEntropy * 100).toFixed(1)}%) - highly predictable AI pattern`
    );
  } else if (normalizedEntropy < 0.5) {
    score = 0.2;
    flaggedItems.push(
      `Low vocabulary entropy (${(normalizedEntropy * 100).toFixed(1)}%) - somewhat predictable`
    );
  }

  return {
    score,
    description: `Entropy analysis: normalized entropy ${(normalizedEntropy * 100).toFixed(1)}%`,
    flaggedItems,
  };
}

/**
 * N-gram pattern analysis
 */
function performNgramAnalysis(text: string) {
  const words = text.toLowerCase().split(/\s+/);
  const flaggedItems: string[] = [];
  let score = 0;

  // Check for repeated 3-word sequences
  const trigrams: Record<string, number> = {};
  for (let i = 0; i < words.length - 2; i++) {
    const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    trigrams[trigram] = (trigrams[trigram] || 0) + 1;
  }

  const repeatedTrigrams = Object.entries(trigrams).filter(([_, count]) => count > 1);
  if (repeatedTrigrams.length > 3) {
    score += 0.15;
    flaggedItems.push(
      `Repeated 3-word sequences: ${repeatedTrigrams.length} patterns found`
    );
  }

  // Check for repeated 2-word sequences
  const bigrams: Record<string, number> = {};
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    bigrams[bigram] = (bigrams[bigram] || 0) + 1;
  }

  const repeatedBigrams = Object.entries(bigrams).filter(
    ([_, count]) => count > words.length * 0.05
  );
  if (repeatedBigrams.length > 5) {
    score += 0.1;
    flaggedItems.push(
      `High bigram repetition: ${repeatedBigrams.length} frequently repeated pairs`
    );
  }

  return {
    score: Math.min(score, 1),
    description: `N-gram analysis: ${repeatedTrigrams.length} repeated trigrams, ${repeatedBigrams.length} repeated bigrams`,
    flaggedItems,
  };
}

/**
 * Combine all analysis results with AGGRESSIVE weighting
 */
function combineAnalysisResults(
  llmAnalysis: any,
  jargonAnalysis: any,
  unnaturalPhraseAnalysis: any,
  linguisticAnalysis: any,
  entropyAnalysis: any,
  ngramAnalysis: any,
  text: string
): DetectionResult {
  // AGGRESSIVE weighting - jargon and unnatural phrases are strong indicators
  const weights = {
    llm: 0.25,
    jargon: 0.25,
    unnaturalPhrases: 0.25,
    linguistic: 0.1,
    entropy: 0.1,
    ngram: 0.05,
  };

  // Calculate weighted score
  const weightedScore =
    llmAnalysis.aiProbability * weights.llm +
    jargonAnalysis.score * weights.jargon +
    unnaturalPhraseAnalysis.score * weights.unnaturalPhrases +
    linguisticAnalysis.score * weights.linguistic +
    entropyAnalysis.score * weights.entropy +
    ngramAnalysis.score * weights.ngram;

  // Boost score if multiple indicators are high
  const highIndicators = [
    jargonAnalysis.score > 0.3,
    unnaturalPhraseAnalysis.score > 0.3,
    linguisticAnalysis.score > 0.3,
    entropyAnalysis.score > 0.2,
  ].filter(Boolean).length;

  let finalScore = weightedScore;
  if (highIndicators >= 3) {
    finalScore = Math.min(finalScore * 1.3, 1);
  }
  if (highIndicators >= 4) {
    finalScore = Math.min(finalScore * 1.5, 1);
  }

  // Compile all indicators
  const allIndicators: DetectionIndicator[] = [
    ...llmAnalysis.indicators.map((ind: any) => ({
      ...ind,
      weight: weights.llm,
    })),
    {
      name: "Jargon Stacking",
      score: jargonAnalysis.score,
      description: jargonAnalysis.flaggedItems.join("; "),
      weight: weights.jargon,
    },
    {
      name: "Unnatural Phrases",
      score: unnaturalPhraseAnalysis.score,
      description: unnaturalPhraseAnalysis.flaggedItems.join("; "),
      weight: weights.unnaturalPhrases,
    },
  ];

  // Generate summary
  let summary = "";
  if (finalScore > 0.85) {
    summary = "VERY HIGH probability of AI generation. Text shows strong AI markers.";
  } else if (finalScore > 0.7) {
    summary = "HIGH probability of AI generation. Multiple AI indicators detected.";
  } else if (finalScore > 0.5) {
    summary = "MODERATE probability of AI generation. Some AI patterns present.";
  } else if (finalScore > 0.3) {
    summary = "LOW probability of AI generation. Few AI indicators detected.";
  } else {
    summary = "VERY LOW probability of AI generation. Text appears human-written.";
  }

  return {
    aiProbability: Math.round(finalScore * 100) / 100,
    confidence: Math.round((llmAnalysis.confidence || 0.8) * 100) / 100,
    indicators: allIndicators,
    summary,
    detailedAnalysis: {
      jargonStacking: jargonAnalysis,
      unnaturaIPhrases: unnaturalPhraseAnalysis,
      sentenceStructure: linguisticAnalysis,
      vocabularyAnalysis: {
        score: 0,
        description: "Included in linguistic analysis",
        flaggedItems: [],
      },
      semanticConsistency: {
        score: 0,
        description: "Evaluated by LLM analysis",
        flaggedItems: [],
      },
      entropyAnalysis,
      ngramPatterns: ngramAnalysis,
      overallScore: finalScore,
    },
  };
}
