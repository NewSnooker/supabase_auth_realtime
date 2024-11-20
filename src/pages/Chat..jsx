import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import { Send, PlusCircle } from "lucide-react";

const Chat = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const messagesEndRef = useRef(null);

  // Fetch rooms when component mounts
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const { data, error } = await supabase
          .from("chat_rooms")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) throw error;
        setRooms(data || []);

        // Auto-select first room if exists
        if (data && data.length > 0) {
          setSelectedRoom(data[0].id);
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงห้องแชท:", error);
      }
    };
    fetchRooms();
  }, []);

  // Fetch messages for selected room
  useEffect(() => {
    if (!selectedRoom) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("room_id", selectedRoom)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อความ:", error);
      }
    };
    fetchMessages();

    // Real-time subscription for the selected room
    const subscription = supabase
      .channel(`room:${selectedRoom}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${selectedRoom}`,
        },
        (payload) => {
          setMessages((m) => [...m, payload.new]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedRoom]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Create new room
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      const { data, error } = await supabase
        .from("chat_rooms")
        .insert([
          {
            name: newRoomName,
            created_by: user.id,
          },
        ])
        .select();

      if (error) throw error;

      if (data) {
        setRooms((prev) => [...prev, data[0]]);
        setSelectedRoom(data[0].id);
        setNewRoomName("");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการสร้างห้อง:", error);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      const { error } = await supabase.from("messages").insert([
        {
          content: newMessage,
          user_id: user.id,
          user_email: user.email,
          room_id: selectedRoom,
        },
      ]);

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการส่งข้อความ:", error);
    }
  };

  return (
    <div className="flex max-w-6xl mx-auto">
      {/* Rooms Sidebar */}
      <div className="w-64 bg-gray-100 p-4 border-r">
        <div className="mb-4">
          <form onSubmit={handleCreateRoom} className="flex space-x-2">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="สร้างห้องใหม่"
              className="flex-1 border rounded-lg px-2 py-1 text-sm"
            />
            <button
              type="submit"
              className="text-indigo-600 hover:text-indigo-800"
            >
              <PlusCircle className="h-6 w-6" />
            </button>
          </form>
        </div>
        {rooms.map((room) => (
          <div
            key={room.id}
            onClick={() => setSelectedRoom(room.id)}
            className={`p-2 rounded-lg mb-2 cursor-pointer ${
              selectedRoom === room.id
                ? "bg-indigo-600 text-white"
                : "hover:bg-gray-200"
            }`}
          >
            {room.name}
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1">
        <div className="bg-white rounded-lg shadow">
          {selectedRoom ? (
            <>
              <div className="h-[500px] p-4 overflow-y-auto overflow-x-clip">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex mb-4 ${
                      message.user_id === user.id
                        ? "justify-end"
                        : "justify-start"
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
                      <div className="text-sm break-words">
                        {message.content}
                      </div>
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
                    placeholder="พิมพ์ข้อความ..."
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
            </>
          ) : (
            <div className="p-4 text-center text-gray-500">
              เลือกห้องแชทหรือสร้างห้องใหม่
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
