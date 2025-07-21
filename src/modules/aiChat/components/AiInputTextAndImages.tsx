import { CustomIcon } from "@/components/CustomIcon";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { DisplayFilePreview } from "./FilePreviews";

export const AiInputTextAndMedia = (p: {
  disabled: boolean;
  onSubmit: (p: { text: string; files: File[] }) => Promise<void>;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
      "application/pdf": [".pdf"],
    },
    onDrop: (newFiles) => setFiles([...files, ...newFiles]),
    noClick: true,
  });

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (!textareaRef.current) return;

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;

    if (!e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      if (p.disabled) return;
      return e.currentTarget.form?.requestSubmit();
    }

    const cursorPosition = e.currentTarget.selectionStart;
    const textBefore = text.substring(0, cursorPosition);
    const textAfter = text.substring(cursorPosition);
    setText(textBefore + "\n" + textAfter);
    setTimeout(() => {
      if (!textareaRef.current) return;

      textareaRef.current.selectionStart = cursorPosition + 1;
      textareaRef.current.selectionEnd = cursorPosition + 1;
    }, 0);
  };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (p.disabled) return;

        const promise = p.onSubmit({ text, files });

        setFiles([]);
        setText("");

        await promise;
      }}
    >
      <div>
        {files.length > 0 && (
          <div className="flex gap-4 overflow-x-auto overflow-y-visible pt-2">
            {files.map((file, index) => (
              <div key={index} className="relative h-20 w-20 flex-shrink-0">
                <DisplayFilePreview file={file} />

                <button
                  type="button"
                  onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                >
                  <CustomIcon iconName="X" size="xs" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-2 flex items-start">
          <div className="relative flex-1" {...getRootProps()}>
            <input {...getInputProps()} />
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={isDragActive ? "Drop images here..." : "Type your message..."}
              className={`w-full resize-none rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${isDragActive ? "border-primary" : ""}`}
              rows={1}
              style={{ minHeight: "80px", maxHeight: "160px" }}
            />
            <Button
              type="submit"
              disabled={p.disabled}
              className="absolute bottom-2 right-2 h-8 w-8 p-0"
            >
              <CustomIcon iconName="Upload" size="sm" />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};
