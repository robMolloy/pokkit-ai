import { uuid } from "@/lib/utils";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const anthropicMessageContentTextSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

const imageMediaTypeSchema = z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const docMediaTypeSchema = z.literal("application/pdf");

export const anthropicMessageContentImageSchema = z.object({
  type: z.literal("image"),
  source: z.object({
    type: z.literal("base64"),
    media_type: imageMediaTypeSchema,
    data: z.string(),
  }),
});
export const anthropicMessageContentDocSchema = z.object({
  type: z.literal("document"),
  source: z.object({
    type: z.literal("base64"),
    media_type: docMediaTypeSchema,
    data: z.string(),
  }),
});

export const anthropicMessageContentItemSchema = z.union([
  anthropicMessageContentTextSchema,
  anthropicMessageContentImageSchema,
  anthropicMessageContentDocSchema,
]);
export type TAnthropicMessageContentItem = z.infer<typeof anthropicMessageContentItemSchema>;
export type TAnthropicMessageRole = "user" | "assistant";
export type TAnthropicMessage = {
  id: string;
  role: TAnthropicMessageRole;
  content: TAnthropicMessageContentItem[];
};

export const createAnthropicMessage = (p: {
  role: TAnthropicMessageRole;
  content: TAnthropicMessageContentItem[];
}): TAnthropicMessage => {
  return { id: uuid(), role: p.role, content: p.content };
};

type TStreamStatus = "streaming" | "finished" | "error";
export const callAnthropic = async (p: {
  anthropic: Anthropic;
  messages: TAnthropicMessage[];
  onStreamStatusChange: (status: TStreamStatus) => void;
  onStreamChange: (text: string) => void;
  model?: "claude-3-5-haiku-20241022" | "claude-3-7-sonnet-20250219";
}) => {
  const model = p.model ?? "claude-3-5-haiku-20241022";

  let streamStatus: undefined | TStreamStatus = undefined;
  let fullResponse = "";

  try {
    const stream = await p.anthropic.messages.create({
      model,
      max_tokens: 5000,
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
  const rtn = await callAnthropic({
    anthropic: p.anthropic,
    messages: [
      createAnthropicMessage({ role: "user", content: [{ type: "text", text: "Hello, world!" }] }),
    ],
    onStreamStatusChange: () => {},
    onStreamChange: () => {},
  });

  return rtn;
};

export const createTitleForMessageThreadWithAnthropic = async (p: {
  anthropic: Anthropic;
  messages: TAnthropicMessage[];
}) => {
  const text =
    "create a succinct title in plain text for the previous messages in this conversation";

  const rtn = await callAnthropic({
    anthropic: p.anthropic,
    messages: [
      ...p.messages,
      createAnthropicMessage({ role: "user", content: [{ type: "text", text }] }),
    ],
    onStreamStatusChange: () => {},
    onStreamChange: () => {},
  });

  return rtn;
};
