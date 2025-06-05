import { useEffect, useState } from "react";
import {
  callClaude,
  createAssistantMessage,
  createUserMessage,
  TChatMessage,
} from "../anthropicApi";
import { convertFilesToFileDetails } from "../utils";
import { AiInputTextAndMedia } from "./AiInputTextAndImages";
import Anthropic from "@anthropic-ai/sdk";

export const AiChatForm = (p: {
  anthropic: Anthropic;
  messages: TChatMessage[];
  onUpdatedMessages: (messages: TChatMessage[]) => void;
  onModeChange: (mode: "ready" | "thinking" | "streaming" | "error") => void;
  onStream: (text: string) => void;
  onComplete: (messages: TChatMessage[]) => void;
}) => {
  const [currentInput, setCurrentInput] = useState("");
  const [currentImages, setCurrentImages] = useState<File[]>([]);

  const [mode, setMode] = useState<"ready" | "thinking" | "streaming" | "error">("ready");
  useEffect(() => p.onModeChange(mode), [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "thinking" || mode === "streaming") return;
    setMode("thinking");

    const newUserMessage = createUserMessage([
      { type: "text", text: currentInput },
      ...(await convertFilesToFileDetails(currentImages)),
    ]);

    const updatedMessages = [...p.messages, newUserMessage];

    p.onUpdatedMessages(updatedMessages);
    setCurrentInput("");
    setCurrentImages([]);

    const resp = await callClaude({
      anthropic: p.anthropic,
      messages: updatedMessages.map((x) => ({ role: x.role, content: x.content })),
      onFirstStream: () => setMode("streaming"),
      onStream: (text) => p.onStream(text),
    });

    if (!resp.success) {
      console.error(resp);
      return setMode("error");
    }

    setMode("ready");
    p.onComplete([...updatedMessages, createAssistantMessage(resp.data)]);
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
