import { TAiTextMessageRecord } from "@/modules/aiTextMessages/dbAiTextMessageUtils";
import { callAnthropic, createAnthropicMessage } from "@/modules/providers/anthropicApi";
import Anthropic from "@anthropic-ai/sdk";
import { useEffect, useState } from "react";
import { convertFilesToFileDetails } from "../utils";
import { AiInputTextAndMedia } from "./AiInputTextAndImages";

export const convertAiTextMessageRecordToAnthropicMessage = (
  messageRecord: TAiTextMessageRecord,
) => {
  if (!messageRecord.contentText) return;
  return createAnthropicMessage({
    role: messageRecord.role,
    content: [{ type: "text", text: messageRecord.contentText }],
  });
};

export const AiChatForm = (p: {
  anthropic: Anthropic;
  messages: TAiTextMessageRecord[];
  onSubmitMessage: (message: string) => void;
  onModeChange: (mode: "ready" | "thinking" | "streaming" | "error") => void;
  onStream: (text: string) => void;
  onComplete: (p: { newMessageText: string }) => void;
}) => {
  const [currentInput, setCurrentInput] = useState("");
  const [currentImages, setCurrentImages] = useState<File[]>([]);

  const [mode, setMode] = useState<"ready" | "thinking" | "streaming" | "error">("ready");
  useEffect(() => p.onModeChange(mode), [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "thinking" || mode === "streaming") return;
    setMode("thinking");

    p.onSubmitMessage(currentInput);

    const newUserMessage = createAnthropicMessage({
      role: "user",
      content: [
        { type: "text", text: currentInput },
        ...(await convertFilesToFileDetails(currentImages)),
      ],
    });

    const anthropicMessages = [
      ...p.messages.map((x) => convertAiTextMessageRecordToAnthropicMessage(x)).filter((x) => !!x),
      newUserMessage,
    ];

    setCurrentInput("");
    setCurrentImages([]);

    const resp = await callAnthropic({
      anthropic: p.anthropic,
      messages: anthropicMessages,
      onStreamStatusChange: (x) => setMode(x === "finished" ? "ready" : x),
      onStreamChange: (text) => p.onStream(text),
    });

    if (!resp.success) {
      console.error(resp);
      return setMode("error");
    }

    p.onComplete({ newMessageText: resp.data });
  };

  return (
    <form onSubmit={handleSubmit}>
      <AiInputTextAndMedia
        disabled={currentInput === "" || mode === "thinking" || mode === "streaming"}
        text={currentInput}
        onInputText={setCurrentInput}
        images={currentImages}
        onInputImages={setCurrentImages}
      />
    </form>
  );
};
