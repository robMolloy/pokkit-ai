import { AiChatScreen } from "@/modules/aiChat/AiChatScreen";
import { useRouter } from "next/router";

const AiChatPage = () => {
  const router = useRouter();
  const threadId = router.query.threadId as string;

  return <AiChatScreen threadId={threadId} />;
};

export default AiChatPage;
