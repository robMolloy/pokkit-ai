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
import {
  createAiMediaMessageRecord,
  TAiMediaMessageRecord,
} from "../aiMediaMessages/dbAiMediaMessageUtils";
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
import { convertFilesToFileDetails, createFileFromMediaUrl } from "./utils";

const convertAiTextAndMediaMessageRecordsToAnthropicMessage = async (p: {
  textMessage: TAiTextMessageRecord;
  mediaMessages?: TAiMediaMessageRecord[];
}) => {
  const urlPrefix = `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/aiMediaMessages/`;

  const mediaFilePromises = p.mediaMessages?.map((x) =>
    createFileFromMediaUrl({ url: `${urlPrefix}${x.id}/${x.file}` }),
  );
  const mediaFiles = (await Promise.all(mediaFilePromises ?? []))
    .filter((x) => x.success)
    .map((x) => x.data);

  return createAnthropicMessage({
    role: p.textMessage.role,
    content: [
      { type: "text", text: p.textMessage.contentText },
      ...(await convertFilesToFileDetails(mediaFiles)),
    ],
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

  const aiTextWithMediaRecords = (aiTextMessageRecords ?? [])
    .map((x) => ({
      textMessage: x,
      mediaMessages: aiMediaMessageRecords?.filter((y) => y.aiTextMessageId === x.id),
    }))
    .sort((a, b) => (a.textMessage.created < b.textMessage.created ? -1 : 1));

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
            {aiTextWithMediaRecords.length === 0 && (
              <AssistantMessage>Hello! How can I help you today?</AssistantMessage>
            )}
            {aiTextWithMediaRecords.map((x) => {
              if (x.textMessage.role === "assistant")
                return (
                  <AssistantMessage key={x.textMessage.id}>
                    {x.textMessage.contentText}
                  </AssistantMessage>
                );

              return (
                <React.Fragment key={x.textMessage.id}>
                  <UserMessageText key={x.textMessage.id}>
                    {x.textMessage.contentText}
                  </UserMessageText>
                  {x.mediaMessages && (
                    <div className="flex gap-2 overflow-x-auto pt-2">
                      {x.mediaMessages.map((mediaMessage) => (
                        <div key={`${mediaMessage.id}-${x.textMessage.id}`} className="h-20 w-20">
                          <DisplayFilePreviewNew url={mediaMessage.file} id={mediaMessage.id} />
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

                const anthropicMessagesFromRecords = await Promise.all(
                  aiTextWithMediaRecords.map((x) =>
                    convertAiTextAndMediaMessageRecordsToAnthropicMessage(x),
                  ),
                );

                const anthropicMessages = [...anthropicMessagesFromRecords, newUserMessage];

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
