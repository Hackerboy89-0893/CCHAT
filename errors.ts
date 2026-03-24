import { invokeLLM } from "./_core/llm";

interface AnalysisData {
  text: string;
  aiProbability: number;
  confidence: number;
  indicators:
    | {
        llmSemantic: number;
        statistical: number;
        pattern: number;
        stylometric: number;
        watermark: number;
      }
    | {
        perplexity: number;
        burstiness: number;
        topicSimilarity?: number;
        combined: number;
      }
    | Array<{ name: string; score: number; description: string }>;
  summary: string;
}

/**
 * Generate a comprehensive text-based report for AI detection analysis
 * This report can be downloaded as a text file or converted to PDF
 */
export async function generateTextReport(analysis: AnalysisData): Promise<string> {
  // Generate detailed analysis using LLM
  const detailedAnalysis = await generateDetailedAnalysis(analysis.text, analysis.aiProbability);

  // Format indicators based on type
  let indicatorsText = "";
  if (Array.isArray(analysis.indicators)) {
    indicatorsText = analysis.indicators
      .map(
        (ind) => `
• ${ind.name}
  Score: ${(ind.score * 100).toFixed(1)}%
  ${ind.description}
`
      )
      .join("");
  } else if ("perplexity" in analysis.indicators) {
    // New perplexity/burstiness format
    const ind = analysis.indicators as any;
    indicatorsText = `
• Perplexity Score
  Score: ${(ind.perplexity * 100).toFixed(1)}%
  Measures text predictability. Lower = more AI-like (predictable word choices)

• Burstiness Score
  Score: ${(ind.burstiness * 100).toFixed(1)}%
  Measures sentence complexity variation. Lower = more AI-like (uniform structure)`;
    if (ind.topicSimilarity !== undefined) {
      indicatorsText += `

• Topic Similarity
  Score: ${(ind.topicSimilarity * 100).toFixed(1)}%
  Semantic similarity to reference AI text on the same topic`;
    }
  } else {
    indicatorsText = Object.entries(analysis.indicators)
      .map(
        ([name, score]) => `
• ${name.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()).trim()}
  Score: ${(score * 100).toFixed(1)}%
`
      )
      .join("");
  }

  const report = `
AI DETECTION ANALYSIS REPORT
Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

═══════════════════════════════════════════════════════════════════════════════

EXECUTIVE SUMMARY
─────────────────────────────────────────────────────────────────────────────
${analysis.summary}

AI Probability Score: ${(analysis.aiProbability * 100).toFixed(1)}%
Confidence Level: ${(analysis.confidence * 100).toFixed(0)}%

═══════════════════════════════════════════════════════════════════════════════

ANALYZED TEXT
─────────────────────────────────────────────────────────────────────────────
${analysis.text}

═══════════════════════════════════════════════════════════════════════════════

DETECTION INDICATORS
─────────────────────────────────────────────────────────────────────────────
${indicatorsText}

═══════════════════════════════════════════════════════════════════════════════

DETAILED ANALYSIS
─────────────────────────────────────────────────────────────────────────────
${detailedAnalysis}

═══════════════════════════════════════════════════════════════════════════════

INTERPRETATION GUIDE
─────────────────────────────────────────────────────────────────────────────

90-100%: VERY HIGH probability of AI generation
  → Text shows strong AI characteristics
  → Recommend treating as AI-generated

75-89%: HIGH probability of AI generation
  → Text contains significant AI markers
  → Likely AI-generated with high confidence

50-74%: MODERATE probability of AI generation
  → Text has some AI characteristics
  → Further review recommended

25-49%: LOW probability of AI generation
  → Minimal AI indicators detected
  → Likely human-written

0-24%: VERY LOW probability of AI generation
  → Text appears human-written
  → No significant AI markers detected

═══════════════════════════════════════════════════════════════════════════════

METHODOLOGY
─────────────────────────────────────────────────────────────────────────────

This AI detection system uses advanced linguistic analysis based on GPTZero's
proven methodology:

1. Perplexity Analysis (50% weight when no topic provided, 35% with topic)
   Measures text predictability through entropy and word frequency distribution.
   AI-generated text has lower perplexity (more predictable word choices).

2. Burstiness Analysis (50% weight when no topic provided, 25% with topic)
   Measures variation in sentence structure and complexity.
   AI-generated text has lower burstiness (more uniform sentence structure).

3. Topic-Based Comparison (40% weight when topic provided)
   Generates reference AI text on the provided topic and compares semantic
   similarity to the input text. Higher similarity suggests AI generation.

These metrics are mathematically grounded in linguistic research and
proven effective at detecting both obvious and sophisticated AI-generated text.

═══════════════════════════════════════════════════════════════════════════════

DISCLAIMER
─────────────────────────────────────────────────────────────────────────────

This report is generated for informational purposes. While our detection system
achieves high accuracy, no AI detection method is 100% accurate. Results should
be considered as one factor in content evaluation, not as definitive proof.

For institutional use, please contact our sales team for enterprise solutions
with higher accuracy, batch processing, and API integration.

═══════════════════════════════════════════════════════════════════════════════
`;

  return report;
}

async function generateDetailedAnalysis(text: string, aiProbability: number): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert AI detection analyst. Provide a detailed analysis of why the given text is ${(aiProbability * 100).toFixed(0)}% likely to be AI-generated. 
          
Be specific about:
- Linguistic patterns observed
- Structural characteristics
- Semantic anomalies
- Writing style indicators

Keep the analysis concise (2-3 paragraphs).`,
        },
        {
          role: "user",
          content: `Analyze this text (first 500 chars): ${text.substring(0, 500)}...`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    return typeof content === "string" ? content : "Unable to generate detailed analysis";
  } catch (error) {
    console.error("Error generating detailed analysis:", error);
    return "Detailed analysis unavailable";
  }
}
