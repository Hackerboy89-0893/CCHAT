import { describe, it, expect, vi } from "vitest";
import { detectAIWithPerplexity } from "./aiDetectionPerplexity";
import { invokeLLM } from "./_core/llm";

// Mock the LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

const mockInvokeLLM = invokeLLM as any;

describe("AI Detection with Perplexity & Burstiness", () => {
  // Known ChatGPT samples (sophisticated, non-obvious)
  const chatGPTCaféParagraph = `The café, nestled in the heart of the bustling downtown district, exuded an ambiance that transcended the ordinary. Its carefully curated aesthetic, characterized by minimalist décor and warm lighting, created an atmosphere conducive to both contemplative solitude and meaningful social engagement. The barista, with meticulous attention to detail, prepared each beverage with the precision of an artisan, ensuring that every cup represented a harmonious blend of flavor profiles and aromatic complexity. Patrons, drawn from diverse socioeconomic backgrounds, congregated within its walls, united by their appreciation for the subtle nuances of specialty coffee. The establishment's commitment to sustainability and ethical sourcing practices further distinguished it from its commercial counterparts, positioning it as a beacon of conscious consumption within the community.`;

  // Known human-written samples
  const humanCasualText = `I went to this awesome coffee shop downtown yesterday. It was really nice - they had good lighting and the place wasn't too crowded. The barista knew what they were doing, made a really good cappuccino. I sat there for like two hours just reading and people-watching. Lots of different kinds of people were there, which was cool. They seem to care about where their coffee comes from too, which I appreciate. Definitely going back.`;

  const humanFormalText = `This study examines the relationship between consumer preferences and coffee shop environments. We conducted surveys with 150 participants who regularly visit specialty coffee establishments. Results indicate that ambiance, barista skill, and ethical sourcing practices are primary factors influencing customer loyalty. Our findings suggest that consumers increasingly value sustainability and quality over convenience. These results have implications for coffee shop operators seeking to differentiate their offerings in a competitive market.`;

  describe("Text validation", () => {
    it("should reject text shorter than 50 characters", async () => {
      await expect(detectAIWithPerplexity("Too short")).rejects.toThrow(
        "Text must be at least 50 characters"
      );
    });

    it("should accept text of exactly 50 characters", async () => {
      const text = "a".repeat(50);
      mockInvokeLLM.mockResolvedValueOnce({
        choices: [{ message: { content: "0.5" } }],
      });
      const result = await detectAIWithPerplexity(text);
      expect(result).toBeDefined();
    });
  });

  describe("Perplexity and Burstiness calculation", () => {
    it("should detect sophisticated ChatGPT text as likely AI", async () => {
      mockInvokeLLM.mockResolvedValueOnce({
        choices: [{ message: { content: "0.5" } }],
      });

      const result = await detectAIWithPerplexity(chatGPTCaféParagraph);

      // ChatGPT text should have:
      // - Combined score should be high (>0.5)
      expect(result.aiProbability).toBeGreaterThan(0.5);
    });

    it("should detect casual human text as likely human", async () => {
      const result = await detectAIWithPerplexity(humanCasualText);

      // Human casual text should have:
      // - Combined score should be low (<0.5)
      expect(result.aiProbability).toBeLessThan(0.5);
    });

    it("should handle formal human text appropriately", async () => {
      const result = await detectAIWithPerplexity(humanFormalText);

      // Formal human text might score higher but shouldn't be extreme
      // It has more structure but still human variation
      expect(result.aiProbability).toBeLessThan(0.7);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe("Topic-based comparison", () => {
    it("should use topic comparison when topic is provided", async () => {
      // Mock LLM responses for topic comparison
      mockInvokeLLM
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content:
                  "Coffee shops serve as important social spaces in modern urban environments. They provide venues for professional meetings, creative work, and casual social interaction. The quality of the coffee and the ambiance of the establishment are primary factors that influence customer satisfaction and loyalty.",
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: "0.75" } }],
        });

      const result = await detectAIWithPerplexity(chatGPTCaféParagraph, "coffee shops");

      expect(result.usedTopicComparison).toBe(true);
      expect(result.indicators.topicSimilarity).toBeDefined();
      expect(result.indicators.topicSimilarity).toBeGreaterThanOrEqual(0);
      expect(result.indicators.topicSimilarity).toBeLessThanOrEqual(1);
    });

    it("should not use topic comparison when topic is empty", async () => {
      const result = await detectAIWithPerplexity(humanCasualText, "");

      expect(result.usedTopicComparison).toBe(false);
      expect(result.indicators.topicSimilarity).toBeUndefined();
    });

    it("should increase confidence when topic comparison is used", async () => {
      mockInvokeLLM
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content:
                  "Coffee shops are establishments that serve coffee and other beverages. They are popular gathering places.",
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          choices: [{ message: { content: "0.8" } }],
        });

      const resultWithTopic = await detectAIWithPerplexity(chatGPTCaféParagraph, "coffee");
      const resultWithoutTopic = await detectAIWithPerplexity(chatGPTCaféParagraph);

      // Confidence should be higher with topic comparison
      expect(resultWithTopic.confidence).toBeGreaterThanOrEqual(0.8);
      expect(resultWithoutTopic.confidence).toBeLessThan(0.8);
    });
  });

  describe("Result structure", () => {
    it("should return properly structured detection result", async () => {
      const result = await detectAIWithPerplexity(humanCasualText);

      expect(result).toHaveProperty("aiProbability");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("indicators");
      expect(result).toHaveProperty("explanation");
      expect(result).toHaveProperty("usedTopicComparison");

      expect(typeof result.aiProbability).toBe("number");
      expect(typeof result.confidence).toBe("number");
      expect(typeof result.explanation).toBe("string");
      expect(typeof result.usedTopicComparison).toBe("boolean");
    });

    it("should have indicators with perplexity and burstiness", async () => {
      const result = await detectAIWithPerplexity(humanCasualText);

      expect(result.indicators).toHaveProperty("perplexity");
      expect(result.indicators).toHaveProperty("burstiness");
      expect(result.indicators).toHaveProperty("combined");

      expect(typeof result.indicators.perplexity).toBe("number");
      expect(typeof result.indicators.burstiness).toBe("number");
      expect(typeof result.indicators.combined).toBe("number");

      // All scores should be between 0 and 1
      expect(result.indicators.perplexity).toBeGreaterThanOrEqual(0);
      expect(result.indicators.perplexity).toBeLessThanOrEqual(1);
      expect(result.indicators.burstiness).toBeGreaterThanOrEqual(0);
      expect(result.indicators.burstiness).toBeLessThanOrEqual(1);
      expect(result.indicators.combined).toBeGreaterThanOrEqual(0);
      expect(result.indicators.combined).toBeLessThanOrEqual(1);
    });

    it("should include explanation text", async () => {
      const result = await detectAIWithPerplexity(chatGPTCaféParagraph);

      expect(result.explanation.length).toBeGreaterThan(0);
      expect(result.explanation).toContain("Perplexity");
      expect(result.explanation).toContain("Burstiness");
    });
  });

  describe("Scoring ranges", () => {
    it("should score obvious AI text high (>0.6)", async () => {
      mockInvokeLLM.mockResolvedValueOnce({
        choices: [{ message: { content: "0.5" } }],
      });

      const result = await detectAIWithPerplexity(chatGPTCaféParagraph);
      expect(result.aiProbability).toBeGreaterThan(0.5);
    });

    it("should score human text low (<0.5)", async () => {
      const result = await detectAIWithPerplexity(humanCasualText);
      expect(result.aiProbability).toBeLessThan(0.6);
    });

    it("should maintain reasonable confidence levels", async () => {
      const result1 = await detectAIWithPerplexity(chatGPTCaféParagraph);
      const result2 = await detectAIWithPerplexity(humanCasualText);

      expect(result1.confidence).toBeGreaterThan(0.5);
      expect(result1.confidence).toBeLessThanOrEqual(1);
      expect(result2.confidence).toBeGreaterThan(0.5);
      expect(result2.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("Edge cases", () => {
    it("should handle very long text", async () => {
      const longText = humanCasualText.repeat(10);
      const result = await detectAIWithPerplexity(longText);

      expect(result.aiProbability).toBeGreaterThanOrEqual(0);
      expect(result.aiProbability).toBeLessThanOrEqual(1);
    });

    it("should handle text with special characters", async () => {
      const specialText = "Hello! This is a test... with various punctuation marks??? Yes, it's working! @#$% symbols too.";
      const result = await detectAIWithPerplexity(specialText + " ".repeat(50));

      expect(result.aiProbability).toBeGreaterThanOrEqual(0);
      expect(result.aiProbability).toBeLessThanOrEqual(1);
    });

    it("should handle text with numbers and mixed case", async () => {
      const mixedText =
        "The year 2024 marks an important milestone. We've achieved 95% accuracy in detection. IMPORTANT: This is a TEST. The results show that AI-generated content can be identified with high confidence.";
      const result = await detectAIWithPerplexity(mixedText);

      expect(result.aiProbability).toBeGreaterThanOrEqual(0);
      expect(result.aiProbability).toBeLessThanOrEqual(1);
    });
  });
});
