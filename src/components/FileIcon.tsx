import { TFileDataRecord, TFileRecord } from "@/modules/files/dbFilesUtils";
import { CustomIcon } from "./CustomIcon";

export const getFileExtension = (file: TFileRecord | TFileDataRecord) => {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
};

const mediaTypeMap: { [key: string]: string } = {
  png: "image/png",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  gif: "image/gif",
  pdf: "application/pdf",
};
export const getMediaType = (file: TFileRecord | TFileDataRecord) => {
  const extension = getFileExtension(file);
  return mediaTypeMap[extension];
};

export const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff", "ico"];
export const textExtensions = [
  "txt",
  "md",
  "json",
  "csv",
  "rtf",
  "log",
  "doc",
  "docx",
  "pdf",
  "odt",
  "pages",
];
const codeExtensions = [
  "js",
  "jsx",
  "ts",
  "tsx",
  "html",
  "css",
  "py",
  "java",
  "cpp",
  "c",
  "h",
  "hpp",
  "php",
  "rb",
  "swift",
  "kt",
  "go",
  "rs",
  "sql",
  "sh",
  "bash",
  "yml",
  "yaml",
  "xml",
];
const fileExtensions = ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "iso", "dmg"];
const audioExtensions = ["mp3", "wav", "ogg", "m4a", "flac", "aac", "wma", "mid", "midi"];
const videoExtensions = [
  "mp4",
  "mov",
  "avi",
  "webm",
  "mkv",
  "flv",
  "wmv",
  "m4v",
  "mpeg",
  "mpg",
  "3gp",
];
const spreadsheetExtensions = ["xls", "xlsx", "ods", "numbers"];
const presentationExtensions = ["ppt", "pptx", "odp", "key"];

export function FileIcon(p: {
  extension: string;
  size: React.ComponentProps<typeof CustomIcon>["size"];
}) {
  const iconName: React.ComponentProps<typeof CustomIcon>["iconName"] = p.extension
    ? "file"
    : (() => {
        if (imageExtensions.includes(p.extension)) return "image";
        if (textExtensions.includes(p.extension)) return "fileText";
        if (codeExtensions.includes(p.extension)) return "fileCode";
        if (fileExtensions.includes(p.extension)) return "fileArchive";
        if (audioExtensions.includes(p.extension)) return "fileAudio";
        if (videoExtensions.includes(p.extension)) return "fileVideo";
        if (spreadsheetExtensions.includes(p.extension)) return "fileSpreadsheet";
        if (presentationExtensions.includes(p.extension)) return "presentation";
        return "file";
      })();

  return <CustomIcon iconName={iconName} size={p.size} />;
}
