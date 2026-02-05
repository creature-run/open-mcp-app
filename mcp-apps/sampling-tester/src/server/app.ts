import { createApp, exp } from "open-mcp-app/server";
import { z } from "zod";
import { ICON_ALT, ICON_SVG } from "./icon.js";

const extractText = (content: unknown): string | null => {
  const blocks = Array.isArray(content) ? content : [content];
  const texts = blocks
    .filter((block) => block && typeof block === "object" && "type" in block && (block as { type?: string }).type === "text")
    .map((block) => (block as { text?: string }).text)
    .filter((text): text is string => typeof text === "string" && text.length > 0);
  return texts.length ? texts.join("\n") : null;
};

export const createSamplingApp = () => {
  const app = createApp({
    name: "sampling-tester",
    version: "0.1.0",
    instructions: "Use sampling_test to request model output via the host.",
  });

  app.resource({
    name: "Sampling Tester",
    uri: "ui://sampling-tester/main",
    description: "Trigger sampling requests from the host",
    displayModes: ["pip"],
    html: "../../dist/ui/main.html",
    icon: { svg: ICON_SVG, alt: ICON_ALT },
  });

  app.tool(
    "sampling_test",
    {
      description: "Ask the host to sample a response",
      input: z.object({
        prompt: z.string().default("Write a short status update about MCP sampling."),
        systemPrompt: z.string().optional(),
        maxTokens: z.number().min(16).max(1024).default(256),
        includeContext: z.enum(["none", "thisServer", "allServers"]).optional(),
        temperature: z.number().min(0).max(1).optional(),
      }),
      ui: "ui://sampling-tester/main",
      displayModes: ["pip"],
      experimental: {
        defaultDisplayMode: "pip",
      },
    },
    async (input) => {
      try {
        const response = await exp.sampleMessage({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: input.prompt,
                },
              ],
            },
          ],
          systemPrompt: input.systemPrompt,
          maxTokens: input.maxTokens,
          includeContext: input.includeContext,
          temperature: input.temperature,
        });

        const text = extractText(response.content) ?? "(No text content)";

        return {
          data: {
            prompt: input.prompt,
            model: response.model,
            stopReason: response.stopReason,
            text,
          },
          text,
          title: "Sampling Result",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          data: {
            prompt: input.prompt,
          },
          text: message,
          title: "Sampling Error",
          isError: true,
        };
      }
    }
  );

  return app;
};
