import { uuid } from "@/lib/utils";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const chatMessageContentTextSchema = z.object({ type: z.literal("text"), text: z.string() });

export const imageMediaTypeSchema = z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]);
export const docMediaTypeSchema = z.literal("application/pdf");
export const mediaTypeSchema = z.union([imageMediaTypeSchema, docMediaTypeSchema]);
export type TMediaType = z.infer<typeof mediaTypeSchema>;

type TStreamStatus = "streaming" | "finished" | "error";

export const chatMessageContentImageSchema = z.object({
  type: z.literal("image"),
  source: z.object({
    type: z.literal("base64"),
    media_type: imageMediaTypeSchema,
    data: z.string(),
  }),
});
export const chatMessageContentDocSchema = z.object({
  type: z.literal("document"),
  source: z.object({
    type: z.literal("base64"),
    media_type: docMediaTypeSchema,
    data: z.string(),
  }),
});

export const chatMessageContentItemSchema = z.union([
  chatMessageContentTextSchema,
  chatMessageContentImageSchema,
  chatMessageContentDocSchema,
]);
export type TAnthropicMessageContentItem = z.infer<typeof chatMessageContentItemSchema>;
export type TAnthropicMessageContent = TAnthropicMessageContentItem[];
export type TAnthropicMessageRole = "user" | "assistant";
export type TAnthropicMessage = {
  id: string;
  role: TAnthropicMessageRole;
  content: TAnthropicMessageContent;
};

export const createAnthropicMessage = (p: {
  role: TAnthropicMessageRole;
  content: TAnthropicMessageContent;
}): TAnthropicMessage => {
  return { id: uuid(), role: p.role, content: p.content };
};

export const callAnthropic = async (p: {
  anthropic: Anthropic;
  messages: TAnthropicMessage[];
  onStreamStatusChange: (status: "streaming" | "finished" | "error") => void;
  onStreamChange: (text: string) => void;
  model?: "claude-3-5-haiku-20241022" | "claude-3-7-sonnet-20250219";
}) => {
  const model = p.model ?? "claude-3-5-haiku-20241022";
  let streamStatus: TStreamStatus = "streaming";
  let fullResponse = "";

  try {
    const stream = await p.anthropic.messages.create({
      model,
      max_tokens: 1000,
      messages: p.messages.map((x) => ({ role: x.role, content: x.content })),
      stream: true,
    });

    for await (const message of stream) {
      if (streamStatus !== "streaming") {
        streamStatus = "streaming";
        p.onStreamStatusChange("streaming");
      }

      if (message.type === "content_block_delta" && "text" in message.delta) {
        fullResponse += message.delta.text;
        p.onStreamChange(fullResponse);
      }
    }

    p.onStreamStatusChange("finished");

    return { success: true, data: fullResponse } as const;
  } catch (error) {
    p.onStreamStatusChange("error");

    return { success: false, error: error } as const;
  }
};

export const testAnthropicInstance = async (p: { anthropic: Anthropic }) => {
  return callAnthropic({
    anthropic: p.anthropic,
    messages: [
      createAnthropicMessage({ role: "user", content: [{ type: "text", text: "Hello, world!" }] }),
    ],
    onStreamStatusChange: () => {},
    onStreamChange: () => {},
  });
};
