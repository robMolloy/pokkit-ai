import { MainLayout } from "@/components/layout/Layout";
import { pb } from "@/config/pocketbaseConfig";
import {
  AssistantMessage,
  ErrorMessage,
  UserMessageText,
} from "@/modules/aiChat/components/Messages";
import { ScrollContainer } from "@/modules/aiChat/components/ScrollContainer";
import { useAiThreadRecordsStore } from "@/modules/aiThreads/aiThreadRecordsStore";
import { useAnthropicStore } from "@/modules/providers/anthropicStore";
import { ErrorScreen } from "@/screens/ErrorScreen";
import { LoadingScreen } from "@/screens/LoadingScreen";
import React, { useState } from "react";
import { useAiMediaMessageRecordsStore } from "../aiMediaMessages/aiMediaMessageRecordsStore";
import { createAiMediaMessageRecord } from "../aiMediaMessages/dbAiMediaMessageUtils";
import { useAiTextMessageRecordsStore } from "../aiTextMessages/aiTextMessageRecordsStore";
import {
  createAiTextMessageRecord,
  TAiTextMessageRecord,
} from "../aiTextMessages/dbAiTextMessageUtils";
import {
  createAiThreadRecord,
  updateAiThreadRecordTitle,
} from "../aiThreads/dbAiThreadRecordUtils";
import {
  callAnthropic,
  createAnthropicMessage,
  createTitleForMessageThreadWithAnthropic,
} from "../providers/anthropicApi";
import { AiInputTextAndMedia } from "./components/AiInputTextAndImages";
import { DisplayFilePreviewNew } from "./components/FilePreviews";
import { convertFilesToFileDetails } from "./utils";

const convertAiTextMessageRecordToAnthropicMessage = (messageRecord: TAiTextMessageRecord) => {
  return createAnthropicMessage({
    role: messageRecord.role,
    content: [{ type: "text", text: messageRecord.contentText }],
  });
};

export const AiChatScreen = (p: { threadFriendlyId: string }) => {
  const threadFriendlyId = p.threadFriendlyId;

  const aiThreadRecordsStore = useAiThreadRecordsStore();
  const currentThread = aiThreadRecordsStore.data?.find((x) => x.friendlyId === threadFriendlyId);

  const aiTextMessagesRecordsStore = useAiTextMessageRecordsStore();
  const aiTextMessageRecords = currentThread?.id
    ? aiTextMessagesRecordsStore.getMessagesByThreadId(currentThread.id)
    : undefined;

  const aiMediaMessagesRecordsStore = useAiMediaMessageRecordsStore();
  const aiMediaMessageRecords = currentThread?.id
    ? aiMediaMessagesRecordsStore.getMessagesByThreadId(currentThread.id)
    : undefined;

  const aiTextWithMedia = (aiTextMessageRecords ?? [])
    .map((x) => ({
      textMessages: x,
      mediaMessages: aiMediaMessageRecords?.filter((y) => y.aiTextMessageId === x.id),
    }))
    .sort((a, b) => (a.textMessages.created < b.textMessages.created ? -1 : 1));

  const anthropicStore = useAnthropicStore();
  const anthropicInstance = anthropicStore.data;
  const [mode, setMode] = useState<"ready" | "thinking" | "streaming" | "error">("ready");
  const [streamedText, setStreamedText] = useState("");

  if (aiThreadRecordsStore.data === undefined) return <LoadingScreen />;
  if (aiThreadRecordsStore.data === null) return <ErrorScreen />;

  return (
    <MainLayout fillPageExactly padding={false}>
      <div className="flex h-full flex-col">
        <ScrollContainer scrollToBottomDeps={[threadFriendlyId]}>
          <div className="p-4 pb-0">
            {aiTextWithMedia.length === 0 && (
              <AssistantMessage>Hello! How can I help you today?</AssistantMessage>
            )}
            {aiTextWithMedia.map((x) => {
              if (x.textMessages.role === "assistant")
                return (
                  <AssistantMessage key={x.textMessages.id}>
                    {x.textMessages.contentText}
                  </AssistantMessage>
                );

              return (
                <React.Fragment key={x.textMessages.id}>
                  <UserMessageText key={x.textMessages.id}>
                    {x.textMessages.contentText}
                  </UserMessageText>
                  {x.mediaMessages && (
                    <div className="flex gap-2 overflow-x-auto pt-2">
                      {x.mediaMessages.map((media) => (
                        <div key={media.id} className="h-20 w-20">
                          <DisplayFilePreviewNew url={media.file} id={media.id} />
                        </div>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              );
            })}

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
                    data: { friendlyId: threadFriendlyId, title: "" },
                  });
                  if (resp.success) return resp.data;
                })();

                if (!thread) return;

                const createAiTextMessageRecordResp = await createAiTextMessageRecord({
                  pb,
                  data: { threadId: thread.id, role: "user", contentText: x.text },
                });

                if (!createAiTextMessageRecordResp.success) return;

                const aiTextMessageId = createAiTextMessageRecordResp.data.id;

                const promises = x.files.map((file) =>
                  createAiMediaMessageRecord({
                    pb,
                    data: { threadId: thread.id, file, aiTextMessageId },
                  }),
                );
                await Promise.all(promises);

                const newUserMessage = createAnthropicMessage({
                  role: "user",
                  content: [
                    { type: "text", text: x.text },
                    ...(await convertFilesToFileDetails(x.files)),
                  ],
                });
                const anthropicMessages = [
                  ...(aiTextMessageRecords ?? []).map((x) =>
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
