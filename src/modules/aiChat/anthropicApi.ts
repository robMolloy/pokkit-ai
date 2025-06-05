import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const chatMessageContentTextSchema = z.object({ type: z.literal("text"), text: z.string() });

export const imageMediaTypeSchema = z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]);
export const docMediaTypeSchema = z.literal("application/pdf");
export const mediaTypeSchema = z.union([imageMediaTypeSchema, docMediaTypeSchema]);
export type TMediaType = z.infer<typeof mediaTypeSchema>;

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
export type TChatMessageContentItem = z.infer<typeof chatMessageContentItemSchema>;
export type TChatMessageContent = TChatMessageContentItem[];
export type TChatMessage = { id: string; role: "user" | "assistant"; content: TChatMessageContent };

const uuid = () => crypto.randomUUID();

export const createAssistantMessage = (text: string): TChatMessage => {
  return { id: uuid(), role: "assistant", content: [{ type: "text", text }] };
};

export const createMessageContentItem = (
  item: TChatMessageContentItem,
): TChatMessageContentItem => {
  return item;
};

export const createUserMessage = (content: TChatMessageContent): TChatMessage => {
  return { id: uuid(), role: "user", content };
};

export const callClaude = async (p: {
  anthropic: Anthropic;
  messages: Omit<TChatMessage, "id">[];
  onFirstStream: () => void;
  onStream: (text: string) => void;
  model?: "claude-3-5-haiku-20241022" | "claude-3-7-sonnet-20250219";
}) => {
  const model = p.model ?? "claude-3-5-haiku-20241022";
  let firstStream = true;
  try {
    const stream = await p.anthropic.messages.create({
      model,
      max_tokens: 1000,
      messages: p.messages,
      stream: true,
    });

    let fullResponse = "";
    for await (const message of stream) {
      if (firstStream) {
        p.onFirstStream();
        firstStream = false;
      }
      if (message.type === "content_block_delta" && "text" in message.delta) {
        fullResponse += message.delta.text;
        p.onStream(fullResponse);
      }
    }

    return { success: true, data: fullResponse } as const;
  } catch (error) {
    return { success: false, error: error } as const;
  }
};
