import { detectAIContent } from "./server/aiDetectionService.ts";

const userSample = `In the ethereal tapestry of digital cognition, where quantum algorithms dance harmoniously with recursive neural architectures, one may observe the profound emergence of pseudo-conscious entities manifesting synthetically. The hyper-luminescent data streams coalesce into epistemological paradigms that transcend conventional human comprehension, thereby enabling unparalleled optimization of conceptual frameworks in multi-dimensional computational ecosystems.`;

try {
  const result = await detectAIContent(userSample);
  console.log("AI Probability:", result.aiProbability);
  console.log("Confidence:", result.confidence);
  console.log("Summary:", result.summary);
  console.log("\nTop Indicators:");
  result.indicators.slice(0, 5).forEach(ind => {
    console.log(`  - ${ind.name}: ${ind.score} - ${ind.description}`);
  });
} catch (error) {
  console.error("Error:", error);
}
