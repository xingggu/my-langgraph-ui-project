import { useEffect, useState } from "react";

type Message = {
  id: string;
  content: string;
};

type UI = {
  id: string;
  name: string;
  props: any;
  metadata: {
    message_id: string;
    merge?: boolean;
  };
};

type AgentResponse = {
  messages: Message[];
  ui: UI[];
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [ui, setUI] = useState<UI[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReply = async () => {
    setLoading(true);
    const res = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ type: "human", content: "What's the weather in Berlin?" }],
      }),
    });

    const data: AgentResponse = await res.json();
    setMessages(data.messages);
    setUI(data.ui);
    setLoading(false);
  };

  useEffect(() => {
    fetchReply();
  }, []);

  if (loading) return <div>⏳ Loading...</div>;

  return (
    <div className="p-6">
      {messages.map((msg) => (
        <div key={msg.id} className="my-4">
          <div className="text-lg font-semibold">{msg.content}</div>

          {ui
            .filter((u) => u.metadata?.message_id === msg.id)
            .map((u) => (
              <div key={u.id}>
                🌤️ Weather UI: {u.props.city}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
