/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import { supabase, uploadImage } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import { Send, PlusCircle, Loader } from "lucide-react";

const Chat = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // สถานะการโหลด
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
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() && !selectedFile) return; // ต้องมีข้อความหรือไฟล์
    setIsLoading(true);

    let imageUrl = null;
    if (selectedFile) {
      try {
        imageUrl = await uploadImage(selectedFile);
        setSelectedFile(null); // ล้างไฟล์หลังการอัปโหลด
        e.target.reset();
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ:", error);
        return;
      }
    }
    try {
      const { error } = await supabase.from("messages").insert([
        {
          content: newMessage || "",
          user_id: user.id,
          user_email: user.email,
          room_id: selectedRoom,
          image_url: imageUrl, // เพิ่ม image_url ถ้ามี
        },
      ]);

      if (error) throw error;
      setNewMessage(""); // ล้างข้อความ
      setSelectedFile(null);
      setIsLoading(false); // ปิดสถานะการโหลดเมื่อเสร็จสิ้น
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการส่งข้อความ:", error);
      setIsLoading(false); // ปิดสถานะการโหลดเมื่อเสร็จสิ้น
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
              placeholder="สร้างห้องแชท..."
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
        {rooms.map((room, index) => (
          <div
            key={room.id}
            onClick={() => setSelectedRoom(room.id)}
            className={`p-2 rounded-lg mb-2 cursor-pointer ${
              selectedRoom === room.id
                ? "bg-indigo-600 text-white"
                : "hover:bg-gray-200"
            }`}
          >
            {index + 1}. {room.name}
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
                      {message.content && (
                        <div className="text-sm break-words">
                          {message.content}
                        </div>
                      )}
                      {message.image_url && (
                        <img
                          src={message.image_url}
                          alt="รูปภาพที่ส่ง"
                          className="mt-2 max-w-full rounded-lg"
                        />
                      )}
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
                    placeholder={
                      isLoading ? "กําลังส่งข้อความ..." : "พิมพ์ข้อความ..."
                    }
                    className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="file-input file-input-bordered file-input-primary w-full max-w-xs"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
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
