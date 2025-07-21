import { CustomIcon } from "@/components/CustomIcon";
import { useFileUrl } from "@/lib/fileUtils";

export const DisplayFileImagePreview = (p: { file: File }) => {
  const url = useFileUrl(p.file);

  if (!url) return null;

  return (
    <img
      src={url}
      alt={`Preview ${p.file.name}`}
      className="h-full w-full rounded-md object-cover"
    />
  );
};

export const DisplayFilePreviewNew = (p: { url: string; id: string }) => {
  const url = `${process.env.NEXT_PUBLIC_POCKETBASE_URL}/api/files/aiMediaMessages/${p.id}/${p.url}`;

  return <object data={url} className="h-full w-full rounded-md" />;
};

export const DisplayFilePdfPreview = (p: { file: File }) => {
  const url = useFileUrl(p.file);

  if (!url) return null;

  return <object data={url} type="application/pdf" className="h-full w-full rounded-md"></object>;
};

export const DisplayFileOtherPreview = (p: { fileName: string }) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-md border border-input bg-muted p-2">
      <CustomIcon iconName="File" size="lg" />
      <span className="mt-1 truncate text-xs">{p.fileName}</span>
    </div>
  );
};

export const DisplayFilePreview = (p: { file: File }) => {
  if (p.file.type.startsWith("image/")) {
    return <DisplayFileImagePreview file={p.file} />;
  }
  if (p.file.type === "application/pdf") {
    return <DisplayFilePdfPreview file={p.file} />;
  }
  return <DisplayFileOtherPreview fileName={p.file.name} />;
};
