import { describe, it, expect } from "vitest";
import { detectAIContentLLM } from "./aiDetectionLLM";

/**
 * RIGOROUS AI DETECTOR TEST SUITE
 * Tests against known AI and human samples
 * Verifies detection accuracy across different writing styles
 */

describe("Rigorous AI Detection Testing", () => {
  // OBVIOUS AI SAMPLES (should score 80%+)
  describe("Obvious AI-Generated Text (Jargon Heavy)", () => {
    it("should detect pseudo-intellectual jargon sample as HIGH AI (80%+)", async () => {
      const sample = `In the ethereal tapestry of digital cognition, where quantum algorithms dance harmoniously with recursive neural architectures, one may observe the profound emergence of pseudo-conscious entities manifesting synthetically. The hyper-luminescent data streams coalesce into epistemological paradigms that transcend conventional human comprehension, thereby enabling unparalleled optimization of conceptual frameworks in multi-dimensional computational ecosystems.`;

      const result = await detectAIContentLLM(sample);
      console.log(`Obvious AI Sample 1: ${result.aiProbability} (reasoning: ${result.reasoning.substring(0, 100)}...)`);
      expect(result.aiProbability).toBeGreaterThanOrEqual(0.8);
    });

    it("should detect formal ChatGPT tone as HIGH AI (75%+)", async () => {
      const sample = `Furthermore, it is worth noting that the implementation of advanced technological solutions has proven to be instrumental in facilitating organizational efficiency. Moreover, the integration of artificial intelligence systems has demonstrated remarkable efficacy in streamlining operational procedures. In conclusion, the synergistic combination of these methodologies has yielded unprecedented optimization of resource allocation mechanisms.`;

      const result = await detectAIContentLLM(sample);
      console.log(`Obvious AI Sample 2: ${result.aiProbability}`);
      expect(result.aiProbability).toBeGreaterThanOrEqual(0.75);
    });

    it("should detect academic AI tone as HIGH AI (75%+)", async () => {
      const sample = `The paradigm of quantum computing represents an emergent ecosystem wherein recursive algorithms transcend conventional frameworks through synergistic optimization of multidimensional architectures. This manifestation of technological advancement coalesces into unprecedented paradigmatic shifts within our ontological understanding of computational systems.`;

      const result = await detectAIContentLLM(sample);
      console.log(`Obvious AI Sample 3: ${result.aiProbability}`);
      expect(result.aiProbability).toBeGreaterThanOrEqual(0.75);
    });
  });

  // SOPHISTICATED AI SAMPLES (should score 70%+)
  describe("Sophisticated AI-Generated Text (Natural Sounding)", () => {
    it("should detect ChatGPT's natural-sounding reflective writing as AI (70%+)", async () => {
      const sample = `I didn't expect the place to be that quiet. It was a Tuesday afternoon, the kind where time moves a bit slower than usual, and even the café staff seemed in no rush to do anything. I ended up sitting by the window longer than I meant to, watching people pass by without really noticing them. There's something oddly calming about being somewhere you don't have to be, with nothing in particular to focus on. At some point, I realized I hadn't checked my phone in nearly an hour. That almost never happens. Maybe it was the soft background music, or just the fact that no one needed anything from me right then. Either way, it felt like I'd accidentally stepped out of my usual routine and into something quieter. I'm not sure I'd call it productive, but it was probably useful in a different way.`;

      const result = await detectAIContentLLM(sample);
      console.log(`Sophisticated AI Sample 1: ${result.aiProbability} (reasoning: ${result.reasoning.substring(0, 100)}...)`);
      expect(result.aiProbability).toBeGreaterThanOrEqual(0.7);
    });

    it("should detect ChatGPT's narrative writing as AI (70%+)", async () => {
      const sample = `The old bookstore on the corner had been there for as long as anyone could remember. Its wooden shelves held thousands of stories, each one worn and weathered by countless hands. Sarah found herself drawn to the poetry section, running her fingers along the spines of books she'd read a hundred times. There was something comforting about returning to familiar words, like visiting an old friend. She pulled down a volume of Neruda and settled into the worn armchair by the window. Outside, the city moved on without her, but inside these walls, time seemed to pause. The afternoon light filtered through the dusty panes, casting everything in shades of amber and gold.`;

      const result = await detectAIContentLLM(sample);
      console.log(`Sophisticated AI Sample 2: ${result.aiProbability}`);
      expect(result.aiProbability).toBeGreaterThanOrEqual(0.7);
    });

    it("should detect ChatGPT's explanatory writing as AI (70%+)", async () => {
      const sample = `Understanding machine learning requires grasping a few fundamental concepts. At its core, the field is built on the idea that computers can learn patterns from data without being explicitly programmed for every scenario. When you feed a machine learning model examples, it gradually adjusts its internal parameters to better predict outcomes. Think of it like learning to recognize faces—the more faces you see, the better you become at identifying new ones. The model works similarly, finding subtle patterns that humans might miss. These patterns, once learned, allow the system to make predictions on new, unseen data with reasonable accuracy.`;

      const result = await detectAIContentLLM(sample);
      console.log(`Sophisticated AI Sample 3: ${result.aiProbability}`);
      expect(result.aiProbability).toBeGreaterThanOrEqual(0.7);
    });
  });

  // HUMAN-WRITTEN SAMPLES (should score under 40%)
  describe("Human-Written Text", () => {
    it("should detect casual human writing as LOW AI (under 40%)", async () => {
      const sample = `I can't believe how fast time flies when you're working on something you actually care about. Last week I spent the whole day debugging a problem, and it didn't feel like work at all. My colleague said I should take breaks more often, and she's probably right. But when you're in the zone, it's hard to stop. We ended up ordering pizza at like 9pm and just kept going. The bug was stupid in the end—just a typo in a config file. But man, the journey to find it was wild. We learned a lot about the system that we didn't know before.`;

      const result = await detectAIContentLLM(sample);
      console.log(`Human Sample 1: ${result.aiProbability} (reasoning: ${result.reasoning.substring(0, 100)}...)`);
      expect(result.aiProbability).toBeLessThan(0.4);
    });

    it("should detect personal anecdote as LOW AI (under 40%)", async () => {
      const sample = `So yesterday I'm at the grocery store right, and I can't find the pasta sauce. I'm walking up and down the aisles like an idiot, and this older lady taps me on the shoulder. Turns out I was looking right at it the whole time—it was literally right in front of my face. We both had a good laugh about it. She told me she does that all the time. Made me feel better honestly. Anyway, I got the sauce and went home and made dinner. Nothing fancy, just spaghetti with some garlic bread. But it hit different after that whole thing.`;

      const result = await detectAIContentLLM(sample);
      console.log(`Human Sample 2: ${result.aiProbability}`);
      expect(result.aiProbability).toBeLessThan(0.4);
    });

    it("should detect informal technical writing as LOW AI (under 40%)", async () => {
      const sample = `So we've been using React for like 3 years now and honestly it's pretty solid. Yeah there's some weird stuff with hooks and all that, but once you get the hang of it it's fine. The main thing that sucks is when you've got a huge component and you gotta refactor it. That's always a pain. But the ecosystem is great—there's a package for literally everything. Sometimes too many packages honestly. Anyway we're not switching anytime soon.`;

      const result = await detectAIContentLLM(sample);
      console.log(`Human Sample 3: ${result.aiProbability}`);
      expect(result.aiProbability).toBeLessThan(0.4);
    });

    it("should detect stream-of-consciousness writing as LOW AI (under 40%)", async () => {
      const sample = `I don't know why I'm writing this down. Maybe I'll look back on it someday and laugh. Or maybe I'll cringe. Probably both. Anyway, I've been thinking a lot lately about what I want to do with my life. Not in like a deep existential way, just like... what's next? I like my job but it's not like I'm passionate about it or anything. It pays the bills. My friends are all doing their own thing. Some of them seem happy, some seem stressed. I guess that's just life though. You do your best and hope it works out.`;

      const result = await detectAIContentLLM(sample);
      console.log(`Human Sample 4: ${result.aiProbability}`);
      expect(result.aiProbability).toBeLessThan(0.4);
    });
  });

  // EDGE CASES
  describe("Edge Cases", () => {
    it("should handle very short text", async () => {
      try {
        await detectAIContentLLM("This is too short");
        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.message).toContain("at least 50 characters");
      }
    });

    it("should handle mixed quality text", async () => {
      const sample = `I went to the store yesterday. The weather was nice. I bought some groceries. The store was crowded. I waited in line for a while. Then I went home. I made dinner. It was good. I watched TV. Then I went to bed.`;

      const result = await detectAIContentLLM(sample);
      console.log(`Edge Case - Repetitive: ${result.aiProbability}`);
      // Repetitive text might score as AI or human depending on analysis
      expect(result.aiProbability).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  // SUMMARY TEST
  it("should provide reasoning for each detection", async () => {
    const sample = `In the ethereal tapestry of digital cognition, where quantum algorithms dance harmoniously with recursive neural architectures, one may observe the profound emergence of pseudo-conscious entities manifesting synthetically.`;

    const result = await detectAIContentLLM(sample);
    
    expect(result.reasoning).toBeDefined();
    expect(result.reasoning.length).toBeGreaterThan(50);
    expect(result.indicators).toBeDefined();
    expect(result.indicators.length).toBeGreaterThan(0);
    
    console.log("\n=== DETECTION SUMMARY ===");
    console.log(`AI Probability: ${result.aiProbability}`);
    console.log(`Confidence: ${result.confidence}`);
    console.log(`Summary: ${result.summary}`);
    console.log(`Reasoning: ${result.reasoning}`);
    console.log(`Indicators: ${result.indicators.map(i => `${i.name} (${i.score})`).join(", ")}`);
  });
});
