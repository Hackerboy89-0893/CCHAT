import { describe, it, expect } from "vitest";
import { detectAIContent } from "./aiDetectionService";

describe("Improved AI Detection Service", () => {
  // Known ChatGPT/AI-generated samples
  const aiSamples = [
    // Sample 1: The user's example - OBVIOUSLY AI
    {
      text: `In the ethereal tapestry of digital cognition, where quantum algorithms dance harmoniously with recursive neural architectures, one may observe the profound emergence of pseudo-conscious entities manifesting synthetically. The hyper-luminescent data streams coalesce into epistemological paradigms that transcend conventional human comprehension, thereby enabling unparalleled optimization of conceptual frameworks in multi-dimensional computational ecosystems.`,
      name: "Pseudo-intellectual jargon stacking",
      minScore: 0.85,
    },
    // Sample 2: Classic ChatGPT formality
    {
      text: `Furthermore, it is worth noting that the implementation of advanced technological solutions has proven to be instrumental in facilitating organizational efficiency. Moreover, the integration of artificial intelligence systems has demonstrated remarkable efficacy in streamlining operational procedures. In conclusion, the synergistic combination of these methodologies has yielded unprecedented optimization of resource allocation mechanisms.`,
      name: "Excessive formal transitions",
      minScore: 0.75,
    },
    // Sample 3: Unnatural phrase combinations
    {
      text: `The multifaceted dimensions of contemporary discourse necessitate a comprehensive examination of epistemological frameworks. In essence, the confluence of technological advancement and human cognition has engendered novel paradigms of understanding. Suffice it to say, the manifestation of these conceptual architectures has fundamentally altered our perception of reality.`,
      name: "Unnatural phrase combinations",
      minScore: 0.8,
    },
    // Sample 4: Perfect grammar with no contractions
    {
      text: `It is important to understand that the development of artificial intelligence has become increasingly sophisticated. The algorithms that power these systems are designed to optimize performance across multiple dimensions. It should be noted that this technological advancement has implications for society as a whole. One may observe that the integration of these systems into various sectors has been seamless and effective.`,
      name: "Perfect grammar, no contractions",
      minScore: 0.75,
    },
    // Sample 5: Jargon stacking with pseudo-intellectual terms
    {
      text: `The paradigmatic shift towards holistic optimization has engendered a synergistic nexus of interconnected frameworks. This ontological reconfiguration, manifesting through recursive algorithmic architectures, has precipitated an emergent ecosystem of multidimensional computational phenomena. The epistemological implications thereof transcend conventional categorical analysis, thereby facilitating unprecedented conceptual synthesis.`,
      name: "Heavy jargon stacking",
      minScore: 0.9,
    },
  ];

  // Known human-written samples
  const humanSamples = [
    {
      text: `I've been thinking about how technology is changing the way we work. It's not just about having better tools - it's about rethinking how we approach problems. My team and I have noticed that when we take time to really understand what we're trying to solve, the solutions come more naturally. We're not perfect at it, but we're getting better.`,
      name: "Casual human reflection",
      maxScore: 0.4,
    },
    {
      text: `The new office layout didn't work out like we planned. We thought having an open floor plan would help people collaborate more, but honestly it just made it harder to focus. People started wearing headphones all day, which kind of defeats the purpose. We're going to try something different next month - maybe a mix of open and private spaces.`,
      name: "Human experience with mistakes",
      maxScore: 0.35,
    },
    {
      text: `I can't believe how fast time flies when you're working on something you actually care about. Last week I spent the whole day debugging a problem, and it didn't feel like work at all. My colleague said I should take breaks more often, and she's probably right. But when you're in the zone, it's hard to stop.`,
      name: "Human casual writing with contractions",
      maxScore: 0.3,
    },
  ];

  describe("AI Sample Detection", () => {
    aiSamples.forEach((sample) => {
      it(`should detect ${sample.name} as AI (score >= ${sample.minScore})`, { timeout: 20000 }, async () => {
        const result = await detectAIContent(sample.text);
        console.log(
          `${sample.name}: ${result.aiProbability} (confidence: ${result.confidence})`
        );
        console.log(`  Summary: ${result.summary}`);
        console.log(
          `  Top indicators: ${result.indicators
            .slice(0, 3)
            .map((i) => `${i.name} (${i.score})`)
            .join(", ")}`
        );

        expect(result.aiProbability).toBeGreaterThanOrEqual(sample.minScore);
      });
    });
  });

  describe("Human Sample Detection", () => {
    humanSamples.forEach((sample) => {
      it(`should detect ${sample.name} as human (score <= ${sample.maxScore})`, { timeout: 20000 }, async () => {
        const result = await detectAIContent(sample.text);
        console.log(
          `${sample.name}: ${result.aiProbability} (confidence: ${result.confidence})`
        );
        console.log(`  Summary: ${result.summary}`);

        expect(result.aiProbability).toBeLessThanOrEqual(sample.maxScore);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should reject text that is too short", { timeout: 5000 }, async () => {
      try {
        await detectAIContent("This is too short");
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("at least 50 characters");
      }
    });

    it("should handle mixed content", { timeout: 20000 }, async () => {
      const mixedText = `I've been reading about how AI is changing things. In the contemporary landscape of technological advancement, artificial intelligence represents a paradigmatic shift in computational methodologies. But honestly, I'm not sure what that even means. It's just interesting to think about.`;

      const result = await detectAIContent(mixedText);
      console.log(`Mixed content: ${result.aiProbability}`);

      // Should be moderate - has both human and AI elements
      expect(result.aiProbability).toBeGreaterThan(0.3);
      expect(result.aiProbability).toBeLessThan(0.8);
    });
  });

  describe("Specific Pattern Detection", () => {
    it("should detect jargon stacking", { timeout: 20000 }, async () => {
      const text = `The epistemological paradigm of recursive neural architectures manifests through quantum algorithmic frameworks. These multidimensional computational ecosystems coalesce into synergistic nexuses of ontological significance. The emergent phenomena thereby transcend conventional categorical analysis, enabling unprecedented optimization of conceptual architectures within holistic ecosystems.`;

      const result = await detectAIContent(text);
      const jargonIndicator = result.indicators.find(
        (i) => i.name === "Jargon Stacking"
      );

      expect(jargonIndicator).toBeDefined();
      expect(jargonIndicator?.score).toBeGreaterThan(0.3);
      expect(result.aiProbability).toBeGreaterThan(0.8);
    });

    it("should detect unnatural phrases", { timeout: 20000 }, async () => {
      const text = `One may observe that the confluence of technological advancement has thereby enabled unparalleled optimization. In essence, the manifestation of these frameworks has fundamentally altered our perception. Suffice it to say, the synergistic nexus of these methodologies has precipitated novel paradigms.`;

      const result = await detectAIContent(text);
      const phraseIndicator = result.indicators.find(
        (i) => i.name === "Unnatural Phrases"
      );

      expect(phraseIndicator).toBeDefined();
      expect(phraseIndicator?.score).toBeGreaterThan(0.3);
      expect(result.aiProbability).toBeGreaterThan(0.75);
    });

    it("should detect lack of contractions", { timeout: 20000 }, async () => {
      const text = `It is important to understand that the development of systems has become increasingly sophisticated. The algorithms that power these systems are designed to optimize performance. It should be noted that this advancement has implications for society. One may observe that the integration of these systems has been seamless and effective. It is worth noting that the results have been remarkable. The implementation has proven to be instrumental in facilitating efficiency.`;

      const result = await detectAIContent(text);

      expect(result.aiProbability).toBeGreaterThan(0.7);
    });
  });
});
