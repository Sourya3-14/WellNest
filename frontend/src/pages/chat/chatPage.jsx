import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Assuming 'api' is your configured axios instance
import api from "../../utils/api";
import socket from "../../config/socket";

export default function ChatPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // FIX: Retrieve current user ID directly as a flat string from localStorage
  const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    socket.emit("joinChat", appointmentId);
  }, []);

  useEffect(() => {
    socket.on("newMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("newMessage");
    };
  }, []);

  // Fetch messages from the backend
  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/appointment/${appointmentId}`);
      // Backend returns oldest -> newest, keeping array as-is
      if (res.data?.data?.messages) {
        setMessages(res.data.data.messages);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Send a new message
  const sendMessage = async (e) => {
    if (e) e.preventDefault(); // Prevent form submission reload
    if (!text.trim()) return;

    try {
      await api.post("/chat/send-message", {
        appointmentId,
        message: text.trim(),
      });
      setText("");
      // Refresh the chat to pull the latest message list
      await fetchMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

//   Load messages once on mount
  useEffect(() => {
    fetchMessages();
  }, [appointmentId]);

  // Automatically scroll to the bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto bg-white shadow-sm rounded-xl overflow-hidden my-4 border border-gray-100">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
            ← Back
          </button>
          <div>
            <h2 className="font-semibold text-gray-800">Appointment Chat</h2>
            <p className="text-xs text-gray-500">ID: #{appointmentId}</p>
          </div>
        </div>
        {/* <button onClick={fetchMessages} className="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition">
          Refresh Chat
        </button> */}
      </div>

      {/* Messages Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading conversation...</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm space-y-1">
            <p className="font-medium">No messages yet</p>
            <p className="text-xs text-gray-300">Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            // Safe conversion to check exact matching characters
            const isMe = String(msg.senderId) === String(currentUserId);

            return (
              <div key={`${msg.senderId}-${msg.timestamp}`} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm
                                    ${isMe ? "bg-emerald-600 text-white rounded-tr-none" : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"}`}>
                  {/* Sender's Name */}
                  <div className={`text-xs font-semibold mb-1 ${isMe ? "text-emerald-100" : "text-gray-500"}`}>{isMe ? "You" : msg.senderName}</div>

                  {/* Message Content */}
                  <p className="break-words leading-relaxed">{msg.message}</p>

                  {/* Timestamp Check & Render */}
                  {msg.timestamp && (
                    <span
                      className={`block text-[10px] mt-1 text-right 
                                            ${isMe ? "text-emerald-200" : "text-gray-400"}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Footer */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100 flex items-center space-x-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message here..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder-gray-400 transition"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl shadow-sm transition shrink-0">
          Send
        </button>
      </form>
    </div>
  );
}
