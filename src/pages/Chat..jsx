import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import { Send } from "lucide-react";
const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const handleSendMessage = async (e) => {
    try {
      e.preventDefault();
      if (!newMessage.trim()) return;

      const { error } = await supabase.from("messages").insert([
        {
          content: newMessage,
          user_id: user.id,
          user_email: user.email,
        },
      ]);
      if (error) throw error;
      else {
        setNewMessage("");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาด ในการส่งข้อความ:", error.message);
    }
  };
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .order("created_at", { ascending: true });
        if (error) throw error;
        else {
          setMessages(data || []);
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาด ในการดึงข้อมูลข้อความ:", error.message);
      }
    };
    fetchMessages();
    const subscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          setMessages((m) => [...m, payload.new]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="h-[500px] p-4 overflow-y-auto overflow-x-clip ">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-4 ${
                message.user_id === user.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-xs lg:max-w-md ${
                  message.user_id === user.id
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <div className="text-sm font-semibold mb-1">
                  {message.user_email}
                </div>
                <div className="text-sm break-words">{message.content}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
