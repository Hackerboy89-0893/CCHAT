import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the LLM and database functions
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

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  saveDemoSubmission: vi.fn().mockResolvedValue({ insertId: 1 }),
  saveContactInquiry: vi.fn().mockResolvedValue({ insertId: 1 }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("AI Detection Feature", () => {
  it("should detect AI-generated text and return analysis", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.demo.detectAI({
      text: "This is a sample text that is long enough to be analyzed by the AI detection system. It contains multiple sentences and demonstrates the capability of detecting AI-generated content through linguistic analysis.",
    });

    expect(result).toHaveProperty("aiProbability");
    expect(result).toHaveProperty("confidence");
    expect(result).toHaveProperty("indicators");
    expect(result).toHaveProperty("summary");
    expect(result.aiProbability).toBeGreaterThanOrEqual(0);
    expect(result.aiProbability).toBeLessThanOrEqual(1);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.indicators.length).toBeGreaterThan(0);
  });

  it("should reject text shorter than 50 characters", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.demo.detectAI({
        text: "Short text",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("at least 50 characters");
    }
  });

  it("should reject empty text", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.demo.detectAI({
        text: "",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("at least 50 characters");
    }
  });
});

describe("Contact Form Feature", () => {
  it("should submit contact inquiry successfully", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.contact.submit({
      name: "John Doe",
      email: "john@example.com",
      organization: "Example University",
      organizationType: "school",
      message: "I am interested in learning more about your AI detection service for our institution.",
    });

    expect(result).toHaveProperty("success");
    expect(result.success).toBe(true);
    expect(result).toHaveProperty("message");
  });

  it("should reject invalid email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.contact.submit({
        name: "John Doe",
        email: "invalid-email",
        organization: "Example University",
        organizationType: "school",
        message: "I am interested in learning more about your AI detection service.",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("invalid_format");
    }
  });


  it("should reject short message", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.contact.submit({
        name: "John Doe",
        email: "john@example.com",
        organization: "Example University",
        organizationType: "school",
        message: "Short",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("too_small");
    }
  });

  it("should reject missing required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.contact.submit({
        name: "",
        email: "john@example.com",
        organization: "Example University",
        organizationType: "school",
        message: "This is a valid message with enough characters.",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("too_small");
    }
  });

  it("should accept all valid organization types", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const types: Array<"school" | "firm" | "organization" | "other"> = [
      "school",
      "firm",
      "organization",
      "other",
    ];

    for (const type of types) {
      const result = await caller.contact.submit({
        name: "John Doe",
        email: "john@example.com",
        organization: "Example Organization",
        organizationType: type,
        message: "I am interested in learning more about your AI detection service.",
      });

      expect(result.success).toBe(true);
    }
  });
});
