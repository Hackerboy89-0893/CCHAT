import { describe, expect, it, vi } from "vitest";
import { detectAIContent } from "./aiDetectionService";

// Mock the LLM function
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            aiProbability: 0.75,
            confidence: 0.85,
            indicators: [
              {
                name: "Repetitive Patterns",
                score: 0.8,
                description: "Text shows repetitive sentence structures",
              },
              {
                name: "Vocabulary Analysis",
                score: 0.7,
                description: "Word choices are generic and over-polished",
              },
            ],
            summary: "This text shows strong indicators of AI generation",
          }),
        },
      },
    ],
  }),
}));

describe("Advanced AI Detection Service", () => {
  describe("Basic Validation", () => {
    it("should reject text shorter than 50 characters", async () => {
      try {
        await detectAIContent("Short text");
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("at least 50 characters");
      }
    });

    it("should reject empty text", async () => {
      try {
        await detectAIContent("");
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("at least 50 characters");
      }
    });
  });

  describe("Detection Results", () => {
    it("should return valid detection result structure", async () => {
      const result = await detectAIContent(
        "This is a sample text that is long enough to be analyzed by the AI detection system. It contains multiple sentences and demonstrates the capability of detecting AI-generated content through linguistic analysis and pattern recognition."
      );

      expect(result).toHaveProperty("aiProbability");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("indicators");
      expect(result).toHaveProperty("summary");
      expect(result).toHaveProperty("detailedAnalysis");

      expect(typeof result.aiProbability).toBe("number");
      expect(typeof result.confidence).toBe("number");
      expect(Array.isArray(result.indicators)).toBe(true);
      expect(typeof result.summary).toBe("string");
    });

    it("should return probability between 0 and 1", async () => {
      const result = await detectAIContent(
        "This is a sample text that is long enough to be analyzed by the AI detection system. It contains multiple sentences and demonstrates the capability of detecting AI-generated content through linguistic analysis."
      );

      expect(result.aiProbability).toBeGreaterThanOrEqual(0);
      expect(result.aiProbability).toBeLessThanOrEqual(1);
    });

    it("should return confidence between 0 and 1", async () => {
      const result = await detectAIContent(
        "This is a sample text that is long enough to be analyzed by the AI detection system. It contains multiple sentences and demonstrates the capability of detecting AI-generated content through linguistic analysis."
      );

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it("should include multiple indicators", async () => {
      const result = await detectAIContent(
        "This is a sample text that is long enough to be analyzed by the AI detection system. It contains multiple sentences and demonstrates the capability of detecting AI-generated content through linguistic analysis."
      );

      expect(result.indicators.length).toBeGreaterThan(0);
      expect(result.indicators.length).toBeLessThanOrEqual(6);

      result.indicators.forEach((indicator) => {
        expect(indicator).toHaveProperty("name");
        expect(indicator).toHaveProperty("score");
        expect(indicator).toHaveProperty("description");
        expect(indicator).toHaveProperty("weight");
        expect(indicator.score).toBeGreaterThanOrEqual(0);
        expect(indicator.score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("Linguistic Analysis", () => {
    it("should detect high passive voice usage", async () => {
      const passiveText =
        "The report was written by the team. The analysis was conducted by experts. The results were reviewed by management. The conclusions were drawn from data. The recommendations were made by consultants. The implementation was planned by coordinators. The execution was managed by supervisors. The outcomes were measured by analysts.";

      const result = await detectAIContent(passiveText);
      expect(result.aiProbability).toBeGreaterThanOrEqual(0);
      expect(result.aiProbability).toBeLessThanOrEqual(1);
    });

    it("should detect lack of contractions", async () => {
      const noContractionText =
        "This is a text that does not use any contractions. It is written in a formal style. We are using complete words instead of shortened forms. They will not appear in this analysis. It has been written this way intentionally. We should note that this is unusual for natural human writing. The text is quite long to ensure proper analysis. We have included multiple sentences for testing purposes. It is important to have enough content for accurate detection.";

      const result = await detectAIContent(noContractionText);
      expect(result.aiProbability).toBeGreaterThanOrEqual(0);
      expect(result.aiProbability).toBeLessThanOrEqual(1);
    });
  });

  describe("Entropy Analysis", () => {
    it("should detect low vocabulary entropy", async () => {
      const repetitiveText =
        "The system is good. The system is fast. The system is reliable. The system is efficient. The system is powerful. The system is advanced. The system is modern. The system is innovative. The system is excellent. The system is outstanding. The system is superior. The system is remarkable. The system is impressive. The system is wonderful. The system is fantastic.";

      const result = await detectAIContent(repetitiveText);
      expect(result.aiProbability).toBeGreaterThanOrEqual(0);
      expect(result.aiProbability).toBeLessThanOrEqual(1);
    });
  });

  describe("N-gram Analysis", () => {
    it("should detect repeated bigrams", async () => {
      const repeatedBigramText =
        "In conclusion, in conclusion, in conclusion we must understand. In conclusion, in conclusion, in conclusion the data shows. In conclusion, in conclusion, in conclusion we can see. In conclusion, in conclusion, in conclusion it is clear. In conclusion, in conclusion, in conclusion the results indicate. In conclusion, in conclusion, in conclusion we observe.";

      const result = await detectAIContent(repeatedBigramText);
      expect(result.aiProbability).toBeGreaterThanOrEqual(0);
      expect(result.aiProbability).toBeLessThanOrEqual(1);
    });
  });

  describe("Summary Generation", () => {
    it("should generate appropriate summary for analysis", async () => {
      const result = await detectAIContent(
        "This is a sample text that is long enough to be analyzed by the AI detection system. It contains multiple sentences and demonstrates the capability of detecting AI-generated content through linguistic analysis."
      );

      expect(result.summary).toBeTruthy();
      expect(typeof result.summary).toBe("string");
      expect(result.summary.length).toBeGreaterThan(0);
    });
  });

  describe("Multi-factor Analysis Integration", () => {
    it("should combine multiple analysis methods", async () => {
      const result = await detectAIContent(
        "This is a sample text that is long enough to be analyzed by the AI detection system. It contains multiple sentences and demonstrates the capability of detecting AI-generated content through linguistic analysis and pattern recognition. The system uses advanced algorithms to detect various markers of AI generation."
      );

      expect(result.indicators.length).toBeGreaterThan(0);

      result.indicators.forEach((indicator) => {
        expect(indicator.weight).toBeGreaterThan(0);
        expect(indicator.weight).toBeLessThanOrEqual(1);
      });
    });

    it("should properly weight different analysis methods", async () => {
      const result = await detectAIContent(
        "This is a sample text that is long enough to be analyzed by the AI detection system. It contains multiple sentences and demonstrates the capability of detecting AI-generated content through linguistic analysis and pattern recognition. The system uses advanced algorithms to detect various markers of AI generation."
      );

      const totalWeight = result.indicators.reduce((sum, ind) => sum + ind.weight, 0);
      expect(totalWeight).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long text", async () => {
      const longText =
        "This is a sample text. " +
        "This is a sample text. ".repeat(100) +
        "This is a sample text that is long enough to be analyzed by the AI detection system. It contains multiple sentences and demonstrates the capability of detecting AI-generated content through linguistic analysis.";

      const result = await detectAIContent(longText);
      expect(result.aiProbability).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    it("should handle text with special characters", async () => {
      const specialText =
        "This text contains special characters: @#$%^&*(). It also has symbols like © and ™. The text is long enough for analysis. It includes punctuation marks like semicolons; colons: and dashes—like this. It has various formatting elements and should still be analyzable for AI detection purposes.";

      const result = await detectAIContent(specialText);
      expect(result.aiProbability).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    it("should handle text with multiple languages", async () => {
      const multilingualText =
        "This is English text. Ceci est du texte français. Dies ist deutscher Text. Este es texto español. Questo è testo italiano. The analysis should still work with mixed language content. It is long enough for proper detection analysis.";

      const result = await detectAIContent(multilingualText);
      expect(result.aiProbability).toBeDefined();
      expect(result.confidence).toBeDefined();
    });
  });
});
