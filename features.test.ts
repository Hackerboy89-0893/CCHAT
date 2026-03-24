/**
 * Simplified AI Detection Service - DIRECT PATTERN MATCHING
 * No LLM dependency - pure aggressive pattern detection
 * Designed to catch obvious ChatGPT/AI text immediately
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

// Pseudo-intellectual jargon that screams ChatGPT
const AI_JARGON = [
  "ethereal", "tapestry", "paradigm", "epistemological", "ontological",
  "phenomenological", "synergistic", "holistic", "quantum", "recursive",
  "emergent", "manifestation", "transcend", "synthesize", "optimize",
  "ecosystem", "framework", "architecture", "nexus", "confluence",
  "juxtaposition", "dichotomy", "duality", "symbiotic", "concatenation",
  "multidimensional", "hypercomplex", "luminescent", "coalesce", "ubiquitous",
  "pervasive", "intricate", "labyrinthine", "precipitate", "facilitate",
  "endeavor", "substantiate", "elucidate", "ameliorate", "exacerbate",
  "mitigate", "alleviate", "augment", "diminish", "obfuscate",
];

// Unnatural phrases that are AI hallmarks
const AI_PHRASES = [
  "one may observe", "thereby enabling", "thereby facilitating", "thereby allowing",
  "in essence", "at its core", "fundamentally speaking", "it is worth noting",
  "it should be noted", "it is important to note", "in light of", "in the context of",
  "with respect to", "with regard to", "as it were", "so to speak", "needless to say",
  "suffice it to say", "in conclusion", "to summarize", "furthermore", "moreover",
  "in the ethereal", "quantum algorithms dance", "pseudo-conscious", "hyper-luminescent",
  "data streams coalesce", "epistemological paradigms", "conceptual frameworks",
  "digital cognition", "recursive neural", "harmoniously with", "unparalleled optimization",
  "multi-dimensional computational", "profound emergence", "synthetically manifesting",
];

// Formal transitions that are overused in AI
const FORMAL_TRANSITIONS = [
  "furthermore", "moreover", "additionally", "in addition",
  "consequently", "therefore", "thus", "hence", "accordingly",
  "in conclusion", "to summarize", "to conclude", "in summary",
];

export async function detectAIContentSimple(text: string): Promise<DetectionResult> {
  if (!text || text.trim().length < 50) {
    throw new Error("Text must be at least 50 characters");
  }

  const lowerText = text.toLowerCase();
  const words = text.split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  let totalScore = 0;
  const indicators: DetectionIndicator[] = [];

  // 1. JARGON STACKING DETECTION (50% weight) - AGGRESSIVE
  const jargonMatches = AI_JARGON.filter(term => lowerText.includes(term));
  const jargonScore = Math.min((jargonMatches.length / 4) * 0.5, 0.5);
  
  if (jargonMatches.length > 0) {
    indicators.push({
      name: "Pseudo-Intellectual Jargon",
      score: jargonScore,
      description: `Found ${jargonMatches.length} suspicious jargon terms: ${jargonMatches.slice(0, 5).join(", ")}${jargonMatches.length > 5 ? "..." : ""}`,
    });
    totalScore += jargonScore;
  }

  // 2. UNNATURAL PHRASES (40% weight) - AGGRESSIVE
  const phraseMatches = AI_PHRASES.filter(phrase => lowerText.includes(phrase));
  const phraseScore = Math.min((phraseMatches.length / 2) * 0.4, 0.4);
  
  if (phraseMatches.length > 0) {
    indicators.push({
      name: "Unnatural Phrases",
      score: phraseScore,
      description: `Detected ${phraseMatches.length} awkward AI-like phrases: ${phraseMatches.slice(0, 3).join(", ")}${phraseMatches.length > 3 ? "..." : ""}`,
    });
    totalScore += phraseScore;
  }

  // 3. LACK OF CONTRACTIONS (15% weight) - AGGRESSIVE
  const contractionPattern = /\b(don't|can't|won't|it's|that's|I'm|we're|they're|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|doesn't|didn't)\b/gi;
  const contractionCount = (text.match(contractionPattern) || []).length;
  
  if (contractionCount === 0 && words.length > 80) {
    const contractionScore = 0.15;
    indicators.push({
      name: "No Contractions",
      score: contractionScore,
      description: "Suspiciously perfect grammar with zero contractions - very unusual for human writing",
    });
    totalScore += contractionScore;
  }

  // 4. EXCESSIVE FORMAL TRANSITIONS (15% weight) - AGGRESSIVE
  const transitionMatches = FORMAL_TRANSITIONS.filter(t => lowerText.includes(t));
  const transitionScore = Math.min((transitionMatches.length / 2) * 0.15, 0.15);
  
  if (transitionMatches.length > 2) {
    indicators.push({
      name: "Excessive Formal Transitions",
      score: transitionScore,
      description: `Found ${transitionMatches.length} formal transition phrases - overuse is a ChatGPT marker`,
    });
    totalScore += transitionScore;
  }

  // 5. PASSIVE VOICE OVERUSE (10% weight) - AGGRESSIVE
  const passivePattern = /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi;
  const passiveCount = (text.match(passivePattern) || []).length;
  const passiveRatio = passiveCount / Math.max(sentences.length, 1);
  
  if (passiveRatio > 0.35) {
    const passiveScore = Math.min((passiveRatio - 0.35) * 0.33, 0.1);
    indicators.push({
      name: "High Passive Voice",
      score: passiveScore,
      description: `${(passiveRatio * 100).toFixed(1)}% passive voice - AI tends to use passive voice excessively`,
    });
    totalScore += passiveScore;
  }

  // Boost score if multiple indicators are present
  const indicatorCount = indicators.length;
  let finalScore = Math.min(totalScore, 1);
  
  if (indicatorCount >= 3) {
    finalScore = Math.min(finalScore * 1.25, 1);
  }
  if (indicatorCount >= 4) {
    finalScore = Math.min(finalScore * 1.35, 1);
  }

  // Generate summary
  let summary = "";
  if (finalScore >= 0.8) {
    summary = "VERY HIGH probability of AI generation. Text shows strong AI markers.";
  } else if (finalScore >= 0.65) {
    summary = "HIGH probability of AI generation. Multiple AI indicators detected.";
  } else if (finalScore >= 0.45) {
    summary = "MODERATE probability of AI generation. Some AI patterns present.";
  } else if (finalScore >= 0.25) {
    summary = "LOW probability of AI generation. Few AI indicators detected.";
  } else {
    summary = "VERY LOW probability of AI generation. Text appears human-written.";
  }

  return {
    aiProbability: Math.round(finalScore * 100) / 100,
    confidence: 0.95, // High confidence in pattern matching
    indicators,
    summary,
  };
}
