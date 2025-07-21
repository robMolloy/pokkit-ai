import { AiChatScreen } from "@/modules/aiChat/AiChatScreen";
import { useRouter } from "next/router";

const AiChatPage = () => {
  const router = useRouter();
  const threadFriendlyId = router.query.threadFriendlyId as string;

  return <AiChatScreen threadId={threadFriendlyId} />;
};

export default AiChatPage;
