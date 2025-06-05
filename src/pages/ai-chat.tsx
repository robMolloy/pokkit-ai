import { CustomIcon } from "@/components/CustomIcon";
import { MainLayout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TChatMessage } from "@/modules/aiChat/anthropicApi";
import { AiChatForm } from "@/modules/aiChat/components/AiChatForm";
import {
  AssistantMessage,
  DisplayChatMessages,
  ErrorMessage,
} from "@/modules/aiChat/components/Messages";
import { useAiStore } from "@/stores/aiStore";
import { useEffect, useRef, useState } from "react";

const ScrollContainer = (p: { children: React.ReactNode; className?: string }) => {
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isScrollingUpwards, setIsScrollingUpwards] = useState(false);
  const scrollContainer = useRef<HTMLDivElement>(null);
  const prevScrollTop = useRef(0);

  const checkIfAtBottom = () => {
    if (!scrollContainer.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer.current;
    const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 40;
    setIsAtBottom(isBottom);

    // Update scroll direction
    setIsScrollingUpwards(scrollTop < prevScrollTop.current);
    prevScrollTop.current = scrollTop;
  };

  const scrollToBottom = () => {
    if (!scrollContainer.current) return;
    scrollContainer.current.scrollTop = scrollContainer.current.scrollHeight;
  };

  useEffect(() => {
    if (isAtBottom && !isScrollingUpwards) scrollToBottom();
  }, [p.children]);

  useEffect(() => {
    const container = scrollContainer.current;
    if (!container) return;

    container.addEventListener("scroll", checkIfAtBottom);
    return () => container.removeEventListener("scroll", checkIfAtBottom);
  }, []);

  useEffect(() => checkIfAtBottom(), []);

  return (
    <div className="relative flex-1">
      <div className={cn("absolute inset-0 overflow-y-auto", p.className)} ref={scrollContainer}>
        {p.children}
      </div>
      {!isAtBottom && (
        <Button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-8 h-10 w-10 rounded-full shadow-lg transition-colors hover:bg-gray-100"
          aria-label="Scroll to bottom"
        >
          <CustomIcon iconName="chevronDown" size="lg" />
        </Button>
      )}
    </div>
  );
};

const AiChat = () => {
  const aiStore = useAiStore();
  const aiInstance = aiStore.data;
  const [mode, setMode] = useState<"ready" | "thinking" | "streaming" | "error">("ready");
  const [messages, setMessages] = useState<TChatMessage[]>([]);
  const [streamedResponse, setStreamedResponse] = useState("");

  return (
    <MainLayout fillPageExactly padding={false}>
      <div className="flex h-full flex-col">
        <ScrollContainer>
          <div className="p-4 pb-0">
            <AssistantMessage>Hello! How can I help you today?</AssistantMessage>

            <DisplayChatMessages messages={messages} />

            {mode === "thinking" && <p>Thinking...</p>}
            {mode === "streaming" && <AssistantMessage>{streamedResponse}</AssistantMessage>}
            {mode === "error" && <ErrorMessage />}
          </div>
        </ScrollContainer>

        <div className="p-4 pt-1">
          {aiInstance ? (
            <AiChatForm
              anthropic={aiInstance}
              messages={messages}
              onModeChange={setMode}
              onUpdatedMessages={setMessages}
              onStream={(text) => setStreamedResponse(text)}
              onComplete={(messages) => {
                setMessages(messages);
                setStreamedResponse("");
              }}
            />
          ) : (
            <div>No AI instance</div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default AiChat;
