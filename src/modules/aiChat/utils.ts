import { z } from "zod";
import { chatMessageContentItemSchema } from "./anthropicApi";

export const convertFileToBase64 = async (file: File) => {
  const resp = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result ?? "") as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return z.string().safeParse(resp.split(";base64,")[1]);
};

export const convertFileToChatMessageContentFromFile = async (file: File) => {
  const base64Resp = await convertFileToBase64(file);

  if (!base64Resp.success) return base64Resp;

  const media_type = file.type;
  const type = media_type === "application/pdf" ? "document" : media_type.split("/")[0];
  const payload = { type, source: { type: "base64", media_type, data: base64Resp.data } };

  return chatMessageContentItemSchema.safeParse(payload);
};

export const convertFilesToFileDetails = async (files: File[]) => {
  return (await Promise.all(files.map(convertFileToChatMessageContentFromFile)))
    .filter((x) => x.success)
    .map((x) => x.data);
};
