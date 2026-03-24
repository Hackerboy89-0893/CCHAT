import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { saveDemoSubmission, saveContactInquiry } from "./db";
import { notifyOwner } from "./_core/notification";
import { detectAIWithPerplexity } from "./aiDetectionPerplexity";
import { generateTextReport } from "./pdfReportGenerator";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  demo: router({
    detectAI: publicProcedure
      .input(z.object({ text: z.string().min(50), topic: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Use perplexity + burstiness + optional topic comparison
          const result = await detectAIWithPerplexity(input.text, input.topic);

          // Save to database
          await saveDemoSubmission({
            text: input.text,
            aiProbability: Math.round(result.aiProbability * 100),
            confidence: Math.round(result.confidence * 100),
            indicators: JSON.stringify(result.indicators),
            summary: result.explanation,
          });

          return {
            aiProbability: result.aiProbability,
            confidence: result.confidence,
            indicators: result.indicators,
            explanation: result.explanation,
          };
        } catch (error) {
          console.error("AI detection error:", error);
          throw new Error("Failed to analyze text. Please try again.");
        }
      }),
    generateReport: publicProcedure
      .input(z.object({
        text: z.string(),
        aiProbability: z.number(),
        confidence: z.number(),
        indicators: z.array(z.object({
          name: z.string(),
          score: z.number(),
          description: z.string(),
        })),
        summary: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          const report = await generateTextReport({
            text: input.text,
            aiProbability: input.aiProbability,
            confidence: input.confidence,
            indicators: input.indicators,
            summary: input.summary,
          });

          return {
            report,
          };
        } catch (error) {
          console.error("Report generation error:", error);
          throw new Error("Failed to generate report. Please try again.");
        }
      }),
  }),

  contact: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        organization: z.string().min(2),
        organizationType: z.enum(["school", "firm", "organization", "other"]),
        message: z.string().min(10),
      }))
      .mutation(async ({ input }) => {
        try {
          // Save to database
          const result = await saveContactInquiry({
            name: input.name,
            email: input.email,
            organization: input.organization,
            organizationType: input.organizationType,
            message: input.message,
            status: "new",
          });

          // Send notification to owner
          await notifyOwner({
            title: `New Contact Inquiry from ${input.organization}`,
            content: `${input.name} (${input.email}) from ${input.organization} has submitted an inquiry.\n\nOrganization Type: ${input.organizationType}\n\nMessage:\n${input.message}`,
          });

          return {
            success: true,
            message: "Thank you for your inquiry. We'll be in touch soon!",
          };
        } catch (error) {
          console.error("Contact submission error:", error);
          throw new Error("Failed to submit contact form. Please try again.");
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
