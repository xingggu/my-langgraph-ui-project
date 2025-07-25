import { useEffect } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { clientComponents } from "./components";

type AgentState = {
  messages: any[];
  ui: any[];
};

export default function App() {
  const { thread, values, submit, isLoading } = useStream<AgentState>({
    apiUrl: "http://localhost:2024/chat",
    assistantId: "agent",
  });

  useEffect(() => {
    if (thread?.messages.length === 0) {
      console.log("📤 Sending default message...");
      submit({
        messages: [{ type: "human", content: "What's the weather in Berlin?" }],
      });
    }
  }, [thread]);

  // 🔍 打印调试日志
  console.log("🔁 Messages:", thread?.messages);
  console.log("📦 UI Values:", values.ui);

  if (!thread || isLoading) {
    return <div>🔄 Loading stream...</div>;
  }

  return (
    <div className="p-6">
      {thread.messages.map((message) => (
        <div key={message.id} className="my-4">
          <div className="text-lg font-semibold">{message.content}</div>

          {/* 渲染匹配的 UI 组件 */}
          {values.ui
            ?.filter((ui) => ui.metadata?.message_id === message.id)
            .map((ui) => (
              <LoadExternalComponent
                key={ui.id}
                stream={thread}
                message={ui}
                components={clientComponents}
              />
            ))}
        </div>
      ))}
    </div>
  );
}
