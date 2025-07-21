import { MainLayout } from "@/components/layout/Layout";
import {
  AssistantMessage,
  DisplayChatMessageRecords,
  ErrorMessage,
} from "@/modules/aiChat/components/Messages";
import { ScrollContainer } from "@/modules/aiChat/components/ScrollContainer";
import { useAiThreadRecordsStore } from "@/modules/aiThreads/aiThreadRecordsStore";
import { useAnthropicStore } from "@/modules/providers/anthropicStore";
import { ErrorScreen } from "@/screens/ErrorScreen";
import { LoadingScreen } from "@/screens/LoadingScreen";
import { useState } from "react";
import { useAiTextMessageRecordsStore } from "../aiTextMessages/aiTextMessageRecordsStore";
import { AiInputTextAndMedia } from "./components/AiInputTextAndImages";
import {
  callAnthropic,
  createAnthropicMessage,
  createTitleForMessageThreadWithAnthropic,
} from "../providers/anthropicApi";
import { convertFilesToFileDetails } from "./utils";
import {
  createAiTextMessageRecord,
  TAiTextMessageRecord,
} from "../aiTextMessages/dbAiTextMessageUtils";
import { pb } from "@/config/pocketbaseConfig";
import {
  createAiThreadRecord,
  updateAiThreadRecordTitle,
} from "../aiThreads/dbAiThreadRecordUtils";

const convertAiTextMessageRecordToAnthropicMessage = (messageRecord: TAiTextMessageRecord) => {
  return createAnthropicMessage({
    role: messageRecord.role,
    content: [{ type: "text", text: messageRecord.contentText }],
  });
};

export const AiChatScreen = (p: { threadId: string }) => {
  const threadId = p.threadId;

  const aiThreadRecordsStore = useAiThreadRecordsStore();
  const currentThread = aiThreadRecordsStore.data?.find((x) => x.friendlyId === threadId);

  const aiTextMessagesStore = useAiTextMessageRecordsStore();
  const storeMessages = currentThread?.id
    ? aiTextMessagesStore.getMessagesByThreadId(currentThread.id)
    : undefined;

  const anthropicStore = useAnthropicStore();
  const anthropicInstance = anthropicStore.data;
  const [mode, setMode] = useState<"ready" | "thinking" | "streaming" | "error">("ready");
  const [streamedText, setStreamedText] = useState("");

  if (aiThreadRecordsStore.data === undefined) return <LoadingScreen />;
  if (aiThreadRecordsStore.data === null) return <ErrorScreen />;

  return (
    <MainLayout fillPageExactly padding={false}>
      <div className="flex h-full flex-col">
        <ScrollContainer scrollToBottomDeps={[threadId]}>
          <div className="p-4 pb-0">
            {!storeMessages && (
              <AssistantMessage>Hello! How can I help you today?</AssistantMessage>
            )}
            {storeMessages && (
              <DisplayChatMessageRecords
                messages={storeMessages.sort((a, b) => (a.created < b.created ? -1 : 1))}
              />
            )}

            {mode === "thinking" && <p>Thinking...</p>}
            {mode === "streaming" && <AssistantMessage>{streamedText}</AssistantMessage>}
            {mode === "error" && <ErrorMessage />}
          </div>
        </ScrollContainer>

        <div className="p-4 pt-1">
          {anthropicInstance ? (
            <AiInputTextAndMedia
              disabled={mode === "thinking" || mode === "streaming"}
              onSubmit={async (x) => {
                setMode("thinking");

                const thread = await (async () => {
                  if (currentThread) return currentThread;

                  const resp = await createAiThreadRecord({
                    pb,
                    data: { friendlyId: threadId, title: "" },
                  });
                  if (resp.success) return resp.data;
                })();

                if (!thread) return;

                await createAiTextMessageRecord({
                  pb,
                  data: { threadId: thread.id, role: "user", contentText: x.text },
                });

                const newUserMessage = createAnthropicMessage({
                  role: "user",
                  content: [
                    { type: "text", text: x.text },
                    ...(await convertFilesToFileDetails(x.files)),
                  ],
                });
                const anthropicMessages = [
                  ...(storeMessages ?? []).map((x) =>
                    convertAiTextMessageRecordToAnthropicMessage(x),
                  ),
                  newUserMessage,
                ];

                if (anthropicMessages.length > 2 && !thread.title) {
                  const resp = await createTitleForMessageThreadWithAnthropic({
                    anthropic: anthropicInstance,
                    messages: anthropicMessages,
                  });
                  if (resp.success)
                    updateAiThreadRecordTitle({ pb, id: thread.id, title: resp.data });
                }

                const anthropicResp = await callAnthropic({
                  anthropic: anthropicInstance,
                  messages: anthropicMessages,
                  onStreamStatusChange: (x) => setMode(x === "finished" ? "ready" : x),
                  onStreamChange: (text) => setStreamedText(text),
                });

                if (!anthropicResp.success) {
                  console.error(anthropicResp);
                  return setMode("error");
                }

                await createAiTextMessageRecord({
                  pb,
                  data: { threadId: thread.id, role: "assistant", contentText: anthropicResp.data },
                });

                setMode("ready");
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
