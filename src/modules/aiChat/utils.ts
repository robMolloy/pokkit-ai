import { z } from "zod";
import { anthropicMessageContentItemSchema } from "@/modules/providers/anthropicApi";

export const convertFileToBase64 = async (file: File) => {
  const resp = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result ?? "") as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return z.string().safeParse(resp.split(";base64,")[1]);
};

const convertFileToFileDetails = async (file: File) => {
  const base64Resp = await convertFileToBase64(file);

  if (!base64Resp.success) return base64Resp;

  const media_type = file.type;
  const type = media_type === "application/pdf" ? "document" : media_type.split("/")[0];
  const payload = { type, source: { type: "base64", media_type, data: base64Resp.data } };

  return anthropicMessageContentItemSchema.safeParse(payload);
};

export const convertFilesToFileDetails = async (files: File[]) => {
  return (await Promise.all(files.map(convertFileToFileDetails)))
    .filter((x) => x.success)
    .map((x) => x.data);
};

const FILE_TYPE_MAP: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  pdf: "application/pdf",
};

export const createFileFromMediaUrl = async (p: { url: string }) => {
  try {
    const fileName = p.url.split("/").pop() ?? "";
    const fileExtension = fileName.split(".").pop() ?? "";
    const fileType = FILE_TYPE_MAP[fileExtension] ?? "image/png";

    const response = await fetch(p.url);
    const blob = await response.blob();

    const file = new File([blob], fileName, { type: fileType });

    return { success: true, data: file } as const;
  } catch (error) {
    console.error(error);
    return { success: false, error } as const;
  }
};
