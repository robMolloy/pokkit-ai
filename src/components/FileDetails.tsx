import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { pb } from "@/config/pocketbaseConfig";
import { formatDate } from "@/lib/dateUtils";
import {
  callClaude,
  createUserMessage,
  mediaTypeSchema,
  TMediaType,
} from "@/modules/aiChat/anthropicApi";
import { convertFileToBase64 } from "@/modules/aiChat/utils";
import { DisplayFileThumbnailOrIcon } from "@/modules/files/components/DisplayFilesTableView";
import {
  TFileDataRecord,
  TFileRecord,
  deleteFile,
  downloadFile,
  getFile,
  getFileDataRecordFromFileRecord,
  updateFile,
} from "@/modules/files/dbFilesUtils";
import { TDirectoryWithFullPath } from "@/modules/files/directoriesStore";
import { formatFileSize } from "@/modules/files/fileUtils";
import { useAiStore } from "@/stores/aiStore";
import { Anthropic } from "@anthropic-ai/sdk";
import React, { useState } from "react";
import { z } from "zod";
import { CustomIcon } from "./CustomIcon";
import { getMediaType } from "./FileIcon";
import { ToggleableStar } from "./ToggleableStar";
import { Button } from "./ui/button";

const DetailsLine = (p: {
  iconName: React.ComponentProps<typeof CustomIcon>["iconName"];
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <div className="flex gap-2 text-sm">
      <span>
        <CustomIcon iconName={p.iconName} size="sm" />
      </span>
      <span className="whitespace-nowrap text-muted-foreground">{p.label}:</span>
      <span className="flex flex-1 justify-end truncate font-mono">
        <div>{p.value}</div>
      </span>
    </div>
  );
};

export function FileDetails(p: {
  file: TFileRecord;
  parentDirectory: TDirectoryWithFullPath;
  onDelete: () => void;
}) {
  const aiStore = useAiStore();
  return (
    <>
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex flex-col items-center gap-4 text-xl">
            <DisplayFileThumbnailOrIcon file={p.file} size="3xl" />
            <div className="flex items-center gap-2 text-center text-xl">
              {p.file.name}
              <ToggleableStar file={p.file} />
            </div>
            <div className="mt-2 flex gap-2">
              <Button
                className="flex-1"
                onClick={async () => {
                  const resp = await getFile({ pb, id: p.file.id, isThumb: false });
                  if (resp.success) downloadFile({ data: resp.data });
                }}
              >
                <CustomIcon iconName="download" size="md" />
                Download
              </Button>
              <Button
                variant="destructive"
                className="flex flex-1 gap-2"
                onClick={async () => {
                  const result = await deleteFile({ pb, id: p.file.id });
                  if (result.success) p.onDelete();
                }}
              >
                <CustomIcon iconName="trash2" size="md" />
                Delete
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <br />
      <div className="mb-2 flex items-center gap-2 text-xl">Information</div>

      <div className="flex flex-col gap-2">
        <DetailsLine iconName={"hash"} label="ID" value={p.file.id} />
        <DetailsLine
          iconName={"folder"}
          label="Directory Path"
          value={p.parentDirectory.fullPath}
        />
        <DetailsLine iconName={"calendar"} label="Created" value={formatDate(p.file.created)} />
        <DetailsLine iconName={"calendar"} label="Updated" value={formatDate(p.file.updated)} />
        <DetailsLine iconName={"hash"} label="Collection ID" value={p.file.collectionId} />
        <DetailsLine iconName={"folder"} label="Collection Name" value={p.file.collectionName} />
        <DetailsLine iconName={"fileText"} label="File" value={p.file.file} />
        <DetailsLine iconName={"fileText"} label="File Size" value={formatFileSize(p.file.size)} />
        <DetailsLine
          iconName={"fileText"}
          label="Keywords"
          value={(() => {
            if (p.file.keywords) return <DisplayKeywords keywordsString={p.file.keywords} />;

            if (!aiStore.data) return <div>No AI key found</div>;
            return (
              <IndexFileWithKeywordsForm
                file={p.file}
                anthropic={aiStore.data}
                onSuccess={(x) =>
                  updateFile({ pb, data: { id: p.file.id, keywords: x.join(",") } })
                }
              />
            );
          })()}
        />
      </div>
    </>
  );
}

const IndexFileWithKeywordsForm = (p: {
  anthropic: Anthropic;
  file: TFileRecord;
  onSuccess: (keywords: string[]) => void;
}) => {
  const [keywords, setKeywords] = useState<string[]>();
  const [mode, setMode] = useState<"ready" | "loading" | "error" | "success">("ready");

  if (mode === "ready")
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          setMode("loading");
          const resp = await (async () => {
            const fileDataRecord = await getFileDataRecordFromFileRecord({
              pb,
              data: p.file,
              isThumb: false,
            });
            if (!fileDataRecord.success)
              return {
                success: false,
                error: "Failed to get file from file data record",
              } as const;

            const file = createFileFromFileDataRecord({ fileDataRecord: fileDataRecord.data });

            const indexImageFileDataRecordWithAnthropicResponse =
              await getKeywordsFromFileWithAnthropic({
                anthropic: p.anthropic,
                file,
                onStream: () => {},
              });

            if (!indexImageFileDataRecordWithAnthropicResponse.success)
              return {
                success: false,
                error: "Failed to index image file data record with Anthropic",
              } as const;

            return {
              success: true,
              data: indexImageFileDataRecordWithAnthropicResponse.data,
            } as const;
          })();

          if (!resp.success) return setMode("error");

          setKeywords(resp.data);
          setMode("success");
          p.onSuccess(resp.data);
        }}
      >
        Index
      </Button>
    );
  if (mode === "loading")
    return <CustomIcon iconName="loader" className="animate-spin" size={"xs"} />;

  if (mode === "success" && keywords) return <DisplayKeywords keywords={keywords} />;
  return <div>Error</div>;
};

const getKeywordsFromFileWithAnthropic = async (p: {
  anthropic: Anthropic;
  file: File;
  onStream: (message: string) => void;
}) => {
  const base64FileResponse = await convertFileToBase64(p.file);
  if (!base64FileResponse.success) return base64FileResponse;

  const mediaTypeResponse = mediaTypeSchema.safeParse(p.file.type);
  if (!mediaTypeResponse.success) return mediaTypeResponse;

  const userMessage = createUserMessage([
    {
      type: "text",
      text: "return at least 30 keywords in the JSON format {keywords:[]}, no additional keys should be added and no other text should be returned. Describe the content of the image, also include keywords that describe metadata and other available data.",
    },
    createUserMessageContentItemFromMedia({
      mediaType: mediaTypeResponse.data,
      base64: base64FileResponse.data,
    }),
  ]);

  const aiResponse = await callClaude({
    anthropic: p.anthropic,
    messages: [{ role: userMessage.role, content: userMessage.content }],
    onFirstStream: () => {},
    onStream: () => {},
  });

  if (!aiResponse.success) return aiResponse;

  const jsonResponse = safeJsonParse(aiResponse.data);
  if (!jsonResponse.success) return jsonResponse;

  const schema = z.object({ keywords: z.array(z.string()) });
  const parsed = schema.safeParse(jsonResponse.data);
  if (!parsed.success) return parsed;

  return { success: true, data: parsed.data.keywords } as const;
};

const safeJsonParse = (json: string) => {
  try {
    return { success: true, data: JSON.parse(json) } as const;
  } catch (error) {
    return { success: false, error } as const;
  }
};

const createUserMessageContentItemFromMedia = (p: { mediaType: TMediaType; base64: string }) => {
  return p.mediaType === "application/pdf"
    ? ({
        type: "document",
        source: {
          type: "base64",
          media_type: p.mediaType,
          data: p.base64,
        },
      } as const)
    : ({
        type: "image",
        source: {
          type: "base64",
          media_type: p.mediaType,
          data: p.base64,
        },
      } as const);
};

const createFileFromFileDataRecord = (p: { fileDataRecord: TFileDataRecord }) => {
  return new File([p.fileDataRecord.file], p.fileDataRecord.name, {
    type: getMediaType(p.fileDataRecord),
  });
};

const DisplayKeywords = (p: { keywords: string[] } | { keywordsString: string }) => {
  const keywords = "keywords" in p ? p.keywords : p.keywordsString.split(",");

  return (
    <div className="max-h-[200px] overflow-y-auto">
      <pre>{JSON.stringify(keywords, undefined, 2)}</pre>
    </div>
  );
};

export const getKeywordsFromFileRecordWithAnthropic = async (p: {
  file: TFileRecord;
  anthropic: Anthropic;
}) => {
  const fileDataRecord = await getFileDataRecordFromFileRecord({
    pb,
    data: p.file,
    isThumb: false,
  });
  if (!fileDataRecord.success)
    return {
      success: false,
      error: "Failed to get file from file data record",
    } as const;

  const file = createFileFromFileDataRecord({ fileDataRecord: fileDataRecord.data });

  const indexImageFileDataRecordWithAnthropicResponse = await getKeywordsFromFileWithAnthropic({
    anthropic: p.anthropic,
    file,
    onStream: () => {},
  });

  if (!indexImageFileDataRecordWithAnthropicResponse.success)
    return {
      success: false,
      error: "Failed to index image file data record with Anthropic",
    } as const;

  return {
    success: true,
    data: indexImageFileDataRecordWithAnthropicResponse.data,
  } as const;
};
