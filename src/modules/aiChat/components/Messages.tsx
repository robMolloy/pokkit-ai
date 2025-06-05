import { CustomIcon } from "@/components/CustomIcon";
import { Card, CardContent } from "@/components/ui/card";
import { TChatMessage } from "@/modules/aiChat/anthropicApi";
import React from "react";
import Markdown from "react-markdown";

export const AssistantMessage = (p: { children: string }) => {
  return (
    <div className="react-markdown">
      <Markdown>{p.children}</Markdown>
    </div>
  );
};

export const UserMessageText = (p: { children: string }) => {
  return (
    <div className="flex items-start">
      <Card>
        <CardContent className="p-2">
          <p className="text-foreground">{p.children}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export const UserMessageImage = (p: { children: string }) => {
  return (
    <div className="w-20 flex-shrink-0 items-start">
      <img
        src={`data:image/jpeg;base64,${p.children}`}
        alt="User uploaded image"
        className="max-h-64 rounded-md object-contain"
      />
    </div>
  );
};

export const ErrorMessage = () => {
  return (
    <div className="flex items-center justify-center p-4">
      <Card className="/10 w-full max-w-md border-destructive">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
            <CustomIcon iconName="x" size="sm" />
          </div>
          <p className="font-medium">There has been an error processing your request.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export const DisplayChatMessages = React.memo((p: { messages: TChatMessage[] }) => {
  return (
    <>
      {p.messages.map((x) => {
        if (x.role === "assistant")
          return x.content.map((content, j) => {
            return (
              <AssistantMessage key={`${x.id}-${j}`}>
                {content.type === "text" ? content.text : ""}
              </AssistantMessage>
            );
          });

        const textContent = x.content.filter((x) => x.type === "text");
        const imageContent = x.content.filter((x) => x.type === "image");

        return (
          <React.Fragment key={x.id}>
            {textContent.map((content, j) => {
              return <UserMessageText key={`${x.id}-${j}`}>{content.text}</UserMessageText>;
            })}
            <div className="flex items-center gap-2 overflow-x-auto pt-2">
              {imageContent.map((content, j) => {
                return (
                  <UserMessageImage key={`${x.id}-${j}`}>{content.source.data}</UserMessageImage>
                );
              })}
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
});
