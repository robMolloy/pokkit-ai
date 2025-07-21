import { MainLayout } from "@/components/layout/Layout";
import { pb } from "@/config/pocketbaseConfig";
import {
  AiChatForm,
  convertAiTextMessageRecordToAnthropicMessage,
} from "@/modules/aiChat/components/AiChatForm";
import {
  AssistantMessage,
  DisplayChatMessageRecords,
  ErrorMessage,
} from "@/modules/aiChat/components/Messages";
import { ScrollContainer } from "@/modules/aiChat/components/ScrollContainer";
import { createAiTextMessageRecord } from "@/modules/aiTextMessages/dbAiTextMessageUtils";
import { useAiThreadRecordsStore } from "@/modules/aiThreads/aiThreadRecordsStore";
import {
  createAiThreadRecord,
  updateAiThreadRecordTitle,
} from "@/modules/aiThreads/dbAiThreadRecordUtils";
import { createTitleForMessageThreadWithAnthropic } from "@/modules/providers/anthropicApi";
import { useAnthropicStore } from "@/modules/providers/anthropicStore";
import { ErrorScreen } from "@/screens/ErrorScreen";
import { LoadingScreen } from "@/screens/LoadingScreen";
import { useState } from "react";
import { useAiTextMessageRecordsStore } from "../aiTextMessages/aiTextMessageRecordsStore";

export const AiChatScreen = (p: { threadId: string }) => {
  const threadId = p.threadId;

  const aiThreadRecordsStore = useAiThreadRecordsStore();
  const currentThread = aiThreadRecordsStore.data?.find((x) => x.threadId === threadId);

  const aiTextMessagesStore = useAiTextMessageRecordsStore();
  const storeMessages = currentThread?.id
    ? aiTextMessagesStore.getMessagesByThreadId(currentThread.id)
    : undefined;

  const anthropicStore = useAnthropicStore();
  const anthropicInstance = anthropicStore.data;
  const [mode, setMode] = useState<"ready" | "thinking" | "streaming" | "error">("ready");
  const [streamedResponse, setStreamedResponse] = useState("");

  if (aiThreadRecordsStore.data === undefined) return <LoadingScreen />;
  if (aiThreadRecordsStore.data === null) return <ErrorScreen />;

  return (
    <MainLayout fillPageExactly padding={false}>
      <div className="flex h-full flex-col">
        <ScrollContainer>
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
            {mode === "streaming" && <AssistantMessage>{streamedResponse}</AssistantMessage>}
            {mode === "error" && <ErrorMessage />}
          </div>
        </ScrollContainer>

        <div className="p-4 pt-1">
          {anthropicInstance ? (
            <AiChatForm
              anthropic={anthropicInstance}
              messages={storeMessages ?? []}
              onSubmitMessage={async (messageText) => {
                const thread = await (async () => {
                  if (currentThread) return currentThread;

                  const data = { threadId, title: "" };
                  const newThreadResp = await createAiThreadRecord({ pb, data });
                  if (newThreadResp.success) return newThreadResp.data;
                })();
                if (!thread) return;

                await createAiTextMessageRecord({
                  pb,
                  data: { threadId: thread.id, role: "user", contentText: messageText },
                });

                if ((storeMessages ?? []).length > 1 && !thread.title) {
                  const resp = await createTitleForMessageThreadWithAnthropic({
                    anthropic: anthropicInstance,
                    messages: (storeMessages ?? [])
                      .map((x) => convertAiTextMessageRecordToAnthropicMessage(x))
                      .filter((x) => !!x),
                  });

                  if (resp.success)
                    updateAiThreadRecordTitle({ pb, id: thread.id, title: resp.data });
                }
              }}
              onModeChange={setMode}
              onStream={(text) => setStreamedResponse(text)}
              onComplete={async ({ newMessageText }) => {
                const thread = aiThreadRecordsStore.data?.find((x) => x.threadId === threadId);
                if (!thread) return;

                await createAiTextMessageRecord({
                  pb,
                  data: { threadId: thread.id, role: "assistant", contentText: newMessageText },
                });
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
