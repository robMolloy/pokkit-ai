import { useEffect, useState } from "react";
import {
  callAnthropic,
  createAnthropicMessage,
  TAnthropicMessage,
} from "@/modules/providers/anthropicApi";
import { convertFilesToFileDetails } from "../utils";
import { AiInputTextAndMedia } from "./AiInputTextAndImages";
import Anthropic from "@anthropic-ai/sdk";

export const AiChatForm = (p: {
  anthropic: Anthropic;
  messages: TAnthropicMessage[];
  onSubmitMessage: (message: string) => void;
  onUpdatedMessages: (messages: TAnthropicMessage[]) => void;
  onModeChange: (mode: "ready" | "thinking" | "streaming" | "error") => void;
  onStream: (text: string) => void;
  onComplete: (messages: TAnthropicMessage[]) => void;
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

    const updatedMessages = [...p.messages, newUserMessage];

    p.onUpdatedMessages(updatedMessages);
    setCurrentInput("");
    setCurrentImages([]);

    const resp = await callAnthropic({
      anthropic: p.anthropic,
      messages: updatedMessages,
      onStreamStatusChange: (x) => setMode(x === "finished" ? "ready" : x),
      onStreamChange: (text) => p.onStream(text),
    });

    if (!resp.success) {
      console.error(resp);
      return setMode("error");
    }

    p.onComplete([
      ...updatedMessages,
      createAnthropicMessage({
        role: "assistant",
        content: [{ type: "text", text: resp.data }],
      }),
    ]);
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
