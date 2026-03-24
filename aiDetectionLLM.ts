import { invokeLLM } from "./_core/llm";

interface DetectionResult {
  aiProbability: number;
  confidence: number;
  indicators: {
    llmSemantic: number;
    statistical: number;
    pattern: number;
    stylometric: number;
    watermark: number;
  };
  verificationScore?: number;
  explanation: string;
}

/**
 * Method 1: LLM Semantic Analysis
 * Uses an LLM to analyze for AI fingerprints in semantic patterns
 */
async function detectLLMSemantic(text: string): Promise<number> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert AI detection specialist. Analyze the given text for AI-generated characteristics. 
          
Look for:
- Semantic patterns typical of LLM outputs (over-explanation, perfect structure, lack of personal voice)
- Logical flow that's too smooth or predictable
- Word choice that's statistically unusual for humans
- Absence of natural hesitation, self-correction, or uncertainty
- Patterns of thinking that match LLM training (balanced perspectives, hedging language)

Respond with ONLY a number between 0 and 1 representing AI probability, nothing else.`,
        },
        {
          role: "user",
          content: `Analyze this text for AI generation:\n\n${text}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const scoreStr = typeof content === 'string' ? content.trim() : "0.5";
    const score = Math.min(1, Math.max(0, parseFloat(scoreStr)));
    return isNaN(score) ? 0.5 : score;
  } catch (error) {
    console.error("LLM semantic analysis error:", error);
    return 0.5;
  }
}

/**
 * Method 2: Statistical Analysis
 * Analyzes entropy, word frequency distributions, and statistical anomalies
 */
function detectStatistical(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  let score = 0;
  let factors = 0;

  // Factor 1: Sentence length consistency (AI tends to be more uniform)
  if (sentences.length > 2) {
    const avgLength = words.length / sentences.length;
    const lengths = sentences.map((s) => s.split(/\s+/).length);
    const variance =
      lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) /
      lengths.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgLength; // Coefficient of variation
    if (cv < 0.3) score += 0.3; // Low variation = more AI-like
    factors++;
  }

  // Factor 2: Word frequency entropy (AI uses more predictable words)
  const wordFreq = new Map<string, number>();
  words.forEach((w) => wordFreq.set(w, (wordFreq.get(w) || 0) + 1));

  const totalWords = words.length;
  let entropy = 0;
  wordFreq.forEach((freq) => {
    const p = freq / totalWords;
    entropy -= p * Math.log2(p);
  });

  const maxEntropy = Math.log2(Math.min(totalWords, wordFreq.size));
  const normalizedEntropy = entropy / (maxEntropy || 1);
  if (normalizedEntropy < 0.6) score += 0.25; // Low entropy = more AI-like
  factors++;

  // Factor 3: Passive voice ratio (AI uses more passive voice)
  const passiveIndicators = text.match(/\b(is|are|was|were|been|be)\s+\w+ed\b/gi) || [];
  const passiveRatio = passiveIndicators.length / Math.max(sentences.length, 1);
  if (passiveRatio > 0.3) score += 0.2;
  factors++;

  // Factor 4: Transition word frequency (AI overuses transitions)
  const transitions = text.match(
    /\b(however|therefore|furthermore|moreover|consequently|thus|hence|additionally|in conclusion|to summarize)\b/gi
  ) || [];
  const transitionRatio = transitions.length / Math.max(sentences.length, 1);
  if (transitionRatio > 0.15) score += 0.15;
  factors++;

  // Factor 5: Contraction absence (AI rarely uses contractions)
  const contractions = text.match(/\b(don't|doesn't|won't|can't|shouldn't|wouldn't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't)\b/gi) || [];
  if (contractions.length === 0 && words.length > 50) score += 0.1;
  factors++;

  return Math.min(1, score / factors);
}

/**
 * Method 3: Pattern Matching
 * Detects jargon stacking, unnatural phrases, and pseudo-intellectual language
 */
function detectPattern(text: string): number {
  let score = 0;
  let factors = 0;

  // Pseudo-intellectual jargon
  const jargonTerms = [
    "ethereal",
    "paradigm",
    "epistemological",
    "quantum",
    "recursive",
    "pseudo-conscious",
    "hyper-luminescent",
    "synergistic",
    "holistic",
    "leveraging",
    "optimize",
    "streamline",
    "robust",
    "scalable",
    "innovative",
    "disruptive",
    "transformative",
    "seamless",
    "cutting-edge",
    "next-generation",
  ];

  const jargonMatches = jargonTerms.filter((term) =>
    new RegExp(`\\b${term}\\b`, "gi").test(text)
  ).length;

  if (jargonMatches >= 3) score += 0.25;
  if (jargonMatches >= 5) score += 0.15;
  factors++;

  // Unnatural phrases
  const unnaturalPhrases = [
    "one may observe",
    "thereby enabling",
    "in essence",
    "suffice it to say",
    "it is worth noting",
    "it should be noted",
    "furthermore",
    "in conclusion",
    "to summarize",
    "the aforementioned",
    "as previously stated",
  ];

  const phraseMatches = unnaturalPhrases.filter((phrase) =>
    new RegExp(phrase, "gi").test(text)
  ).length;

  if (phraseMatches >= 2) score += 0.2;
  if (phraseMatches >= 4) score += 0.15;
  factors++;

  // Excessive formality (all sentences start with capital, perfect punctuation)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const properlyFormatted = sentences.filter((s) => /^[A-Z]/.test(s.trim())).length;
  const formalityRatio = properlyFormatted / Math.max(sentences.length, 1);
  if (formalityRatio > 0.95) score += 0.15;
  factors++;

  // Balanced perspective (AI tries to be balanced)
  const balanceIndicators = text.match(/\b(on one hand|on the other hand|both|however|conversely)\b/gi) || [];
  if (balanceIndicators.length >= 2) score += 0.1;
  factors++;

  return Math.min(1, score / factors);
}

/**
 * Method 4: Stylometric Fingerprinting
 * Analyzes writing style patterns unique to LLMs
 */
function detectStylometric(text: string): number {
  let score = 0;
  let factors = 0;

  // ChatGPT tends to use specific patterns
  // Pattern 1: Excessive use of "which" clauses
  const whichClauses = text.match(/which\s+/gi) || [];
  if (whichClauses.length > text.split(/\s+/).length * 0.02) score += 0.15;
  factors++;

  // Pattern 2: Numbered/bulleted lists (AI loves structure)
  const listPatterns = text.match(/^\s*\d+\.|^\s*[-•]/gm) || [];
  if (listPatterns.length > 3) score += 0.15;
  factors++;

  // Pattern 3: Repetitive sentence starters
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const starters = new Map<string, number>();
  sentences.forEach((s) => {
    const starter = s.trim().split(/\s+/)[0];
    starters.set(starter, (starters.get(starter) || 0) + 1);
  });

  const maxStarter = Math.max(...Array.from(starters.values()));
  const starterRepetition = maxStarter / Math.max(sentences.length, 1);
  if (starterRepetition > 0.25) score += 0.15;
  factors++;

  // Pattern 4: Hedging language (AI is cautious)
  const hedges = text.match(/\b(may|might|could|perhaps|possibly|arguably|somewhat|relatively|fairly|quite)\b/gi) || [];
  const hedgeRatio = hedges.length / Math.max(sentences.length, 1);
  if (hedgeRatio > 0.3) score += 0.15;
  factors++;

  // Pattern 5: Perfect grammar and spelling (no typos)
  const commonMisspellings = text.match(/\b(teh|recieve|occured|seperate|definately)\b/gi) || [];
  if (commonMisspellings.length === 0 && text.length > 200) score += 0.1;
  factors++;

  return Math.min(1, score / factors);
}

/**
 * Method 5: Watermark Detection
 * Detects OpenAI's watermark if present
 */
function detectWatermark(text: string): number {
  // Simplified watermark detection - checks for statistical patterns
  // Real implementation would use OpenAI's watermark detection API
  // For now, we return a base score that can be combined with other methods

  // Check for green list token patterns (OpenAI watermark uses specific token distributions)
  // This is a placeholder - real watermark detection requires OpenAI API access
  const words = text.split(/\s+/);

  // Watermarked text tends to have specific statistical properties
  // We'll use a heuristic based on token distribution
  const tokenScores = new Map<string, number>();
  words.forEach((word) => {
    const hash = word
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    tokenScores.set(word, hash % 100);
  });

  // Count "green list" tokens (arbitrary threshold)
  const greenListTokens = Array.from(tokenScores.values()).filter((s) => s > 50).length;
  const greenListRatio = greenListTokens / Math.max(words.length, 1);

  // Watermarked text typically has 50-60% green list tokens
  if (greenListRatio > 0.45 && greenListRatio < 0.65) {
    return 0.3; // Moderate indicator of watermark
  }

  return 0.1; // Low watermark probability
}

/**
 * Confidence-weighted voting system
 */
function calculateWeightedScore(indicators: {
  llmSemantic: number;
  statistical: number;
  pattern: number;
  stylometric: number;
  watermark: number;
}): { score: number; confidence: number } {
  // Weights based on method reliability
  const weights = {
    llmSemantic: 0.35, // Most reliable
    statistical: 0.25,
    pattern: 0.2,
    stylometric: 0.15,
    watermark: 0.05, // Least reliable (requires API)
  };

  const weightedScore =
    indicators.llmSemantic * weights.llmSemantic +
    indicators.statistical * weights.statistical +
    indicators.pattern * weights.pattern +
    indicators.stylometric * weights.stylometric +
    indicators.watermark * weights.watermark;

  // Calculate confidence based on agreement between methods
  const scores = Object.values(indicators);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // High agreement = high confidence
  const confidence = Math.max(0.5, 1 - stdDev);

  return { score: Math.min(1, weightedScore), confidence };
}

/**
 * Verification mode for borderline cases
 */
async function verifyBorderlineCase(text: string, initialScore: number): Promise<number> {
  if (initialScore < 0.45 || initialScore > 0.55) {
    return initialScore; // Not borderline, return as-is
  }

  // For borderline cases, use a second LLM verification
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a strict AI detection expert. The initial analysis suggests this text is ${(initialScore * 100).toFixed(0)}% likely AI-generated. 
          
Re-analyze with extreme scrutiny. Look for ANY signs of AI generation. Respond with a confidence-adjusted score between 0 and 1.`,
        },
        {
          role: "user",
          content: `Verify: ${text.substring(0, 500)}...`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const verificationStr = typeof content === 'string' ? content.trim() : String(initialScore);
    const verificationScore = Math.min(1, Math.max(0, parseFloat(verificationStr)));
    return isNaN(verificationScore) ? initialScore : verificationScore;
  } catch (error) {
    console.error("Verification error:", error);
    return initialScore;
  }
}

/**
 * Main ensemble detection function
 */
export async function detectAIEnsemble(text: string): Promise<DetectionResult> {
  if (!text || text.length < 50) {
    return {
      aiProbability: 0,
      confidence: 0.5,
      indicators: {
        llmSemantic: 0,
        statistical: 0,
        pattern: 0,
        stylometric: 0,
        watermark: 0,
      },
      explanation: "Text too short for reliable analysis (minimum 50 characters)",
    };
  }

  // Run all 5 methods in parallel
  const [llmScore, statScore, patternScore, styleScore, watermarkScore] = await Promise.all([
    detectLLMSemantic(text),
    Promise.resolve(detectStatistical(text)),
    Promise.resolve(detectPattern(text)),
    Promise.resolve(detectStylometric(text)),
    Promise.resolve(detectWatermark(text)),
  ]);

  const indicators = {
    llmSemantic: llmScore,
    statistical: statScore,
    pattern: patternScore,
    stylometric: styleScore,
    watermark: watermarkScore,
  };

  // Calculate weighted score
  const { score: weightedScore, confidence } = calculateWeightedScore(indicators);

  // Verification mode for borderline cases
  let finalScore = weightedScore;
  let verificationScore: number | undefined;

  if (weightedScore >= 0.4 && weightedScore <= 0.6) {
    verificationScore = await verifyBorderlineCase(text, weightedScore);
    // Weight verification score 60%, initial 40% for borderline cases
    finalScore = verificationScore * 0.6 + weightedScore * 0.4;
  }

  // Generate explanation
  const explanation = generateExplanation(indicators, finalScore);

  return {
    aiProbability: Math.min(1, finalScore),
    confidence: Math.min(1, confidence * (verificationScore ? 0.95 : 1)),
    indicators,
    verificationScore,
    explanation,
  };
}

function generateExplanation(
  indicators: {
    llmSemantic: number;
    statistical: number;
    pattern: number;
    stylometric: number;
    watermark: number;
  },
  score: number
): string {
  const topIndicators = Object.entries(indicators)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([name, value]) => `${name}: ${(value * 100).toFixed(0)}%`)
    .join(", ");

  if (score > 0.75) {
    return `Strong indicators of AI generation detected. Top factors: ${topIndicators}`;
  } else if (score > 0.5) {
    return `Moderate AI indicators detected. Top factors: ${topIndicators}`;
  } else if (score > 0.25) {
    return `Weak AI indicators detected. Top factors: ${topIndicators}`;
  } else {
    return `Likely human-written. Minimal AI indicators detected.`;
  }
}
