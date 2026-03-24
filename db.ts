import { describe, it, expect } from "vitest";
import { detectAIContentSimple } from "./aiDetectionSimple";

describe("Simple AI Detection Service", () => {
  it("should detect the user's pseudo-intellectual jargon sample as HIGH AI (85%+)", async () => {
    const userSample = `In the ethereal tapestry of digital cognition, where quantum algorithms dance harmoniously with recursive neural architectures, one may observe the profound emergence of pseudo-conscious entities manifesting synthetically. The hyper-luminescent data streams coalesce into epistemological paradigms that transcend conventional human comprehension, thereby enabling unparalleled optimization of conceptual frameworks in multi-dimensional computational ecosystems.`;

    const result = await detectAIContentSimple(userSample);
    
    console.log(`User sample score: ${result.aiProbability}`);
    console.log(`Indicators: ${result.indicators.map(i => `${i.name} (${i.score})`).join(", ")}`);
    
    expect(result.aiProbability).toBeGreaterThanOrEqual(0.85);
  });

  it("should detect obvious ChatGPT formality as HIGH AI (75%+)", async () => {
    const text = `Furthermore, it is worth noting that the implementation of advanced technological solutions has proven to be instrumental in facilitating organizational efficiency. Moreover, the integration of artificial intelligence systems has demonstrated remarkable efficacy in streamlining operational procedures. In conclusion, the synergistic combination of these methodologies has yielded unprecedented optimization of resource allocation mechanisms.`;

    const result = await detectAIContentSimple(text);
    
    console.log(`Formal text score: ${result.aiProbability}`);
    
    expect(result.aiProbability).toBeGreaterThanOrEqual(0.75);
  });

  it("should detect jargon stacking as HIGH AI", async () => {
    const text = `The epistemological paradigm of recursive neural architectures manifests through quantum algorithmic frameworks. These multidimensional computational ecosystems coalesce into synergistic nexuses of ontological significance.`;

    const result = await detectAIContentSimple(text);
    
    console.log(`Jargon text score: ${result.aiProbability}`);
    
    expect(result.aiProbability).toBeGreaterThanOrEqual(0.7);
  });

  it("should detect human casual writing as LOW AI (under 40%)", async () => {
    const text = `I've been thinking about how technology is changing the way we work. It's not just about having better tools - it's about rethinking how we approach problems. My team and I have noticed that when we take time to really understand what we're trying to solve, the solutions come more naturally. We're not perfect at it, but we're getting better.`;

    const result = await detectAIContentSimple(text);
    
    console.log(`Human text score: ${result.aiProbability}`);
    
    expect(result.aiProbability).toBeLessThan(0.4);
  });

  it("should detect human text with contractions as LOW AI", async () => {
    const text = `I can't believe how fast time flies when you're working on something you actually care about. Last week I spent the whole day debugging a problem, and it didn't feel like work at all. My colleague said I should take breaks more often, and she's probably right. But when you're in the zone, it's hard to stop.`;

    const result = await detectAIContentSimple(text);
    
    console.log(`Human casual score: ${result.aiProbability}`);
    
    expect(result.aiProbability).toBeLessThan(0.35);
  });

  it("should reject text that is too short", async () => {
    try {
      await detectAIContentSimple("This is too short");
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("at least 50 characters");
    }
  });

  it("should identify multiple jargon terms", async () => {
    const result = await detectAIContentSimple(
      `The paradigm of quantum computing represents an emergent ecosystem where recursive algorithms transcend conventional frameworks through synergistic optimization of multidimensional architectures. This manifestation of technological advancement coalesces into unprecedented paradigmatic shifts within our ontological understanding.`
    );

    const jargonIndicator = result.indicators.find(i => i.name === "Pseudo-Intellectual Jargon");
    expect(jargonIndicator).toBeDefined();
    expect(jargonIndicator?.score).toBeGreaterThan(0.2);
  });

  it("should identify unnatural phrases", async () => {
    const result = await detectAIContentSimple(
      `One may observe that the confluence of technological advancement has thereby enabled unparalleled optimization. In essence, the manifestation of these frameworks has fundamentally altered our perception. Suffice it to say, the synergistic nexus of these methodologies has precipitated novel paradigms.`
    );

    const phraseIndicator = result.indicators.find(i => i.name === "Unnatural Phrases");
    expect(phraseIndicator).toBeDefined();
    expect(phraseIndicator?.score).toBeGreaterThan(0.1);
  });

  it("should give high confidence scores", async () => {
    const result = await detectAIContentSimple(
      `In the ethereal tapestry of digital cognition, where quantum algorithms dance harmoniously with recursive neural architectures, one may observe the profound emergence of pseudo-conscious entities manifesting synthetically.`
    );

    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });
});
