import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ChatPage({ apiBase, refreshChats }) {
  const { id } = useParams();
  const chatId = id;
  const [chat, setChat] = useState(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const loadChat = async () => {
    try {
      const res = await fetch(`${apiBase}/chat/${chatId}`);
      if (!res.ok) {
        // chat not found
        setChat(null);
        return;
      }
      const data = await res.json();
      setChat(data);
    } catch (err) {
      console.error("Load chat error", err);
    }
  };

  useEffect(() => {
    loadChat();
    // eslint-disable-next-line
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  if (chat === null) return <div style={{ padding: 20 }}>Không tìm thấy cuộc trò chuyện</div>;

  const sendMessage = async () => {
    if (!input.trim()) return;

    try {
      // add user message
      await fetch(`${apiBase}/chat/${chatId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: "user", text: input })
      });

      setInput("");
      // reload chat and sidebar list
      await loadChat();
      if (refreshChats) await refreshChats();
    } catch (err) {
      console.error("Send message error", err);
    }
  };

  const renameIfDefaultOnFirstMsg = async (text) => {
    if (chat.title === "Cuộc trò chuyện mới") {
      const newTitle = text.length > 20 ? text.slice(0, 20) + "..." : text;
      await fetch(`${apiBase}/chat/${chatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle })
      });
      if (refreshChats) await refreshChats();
    }
  };

  // handle Enter
  const onEnter = async (e) => {
    if (e.key === "Enter") {
      const text = input.trim();
      if (!text) return;
      await sendMessage();
      await renameIfDefaultOnFirstMsg(text);
    }
  };

  return (
    <div className="chat-area">
      <div className="chat-header">
        <button onClick={() => navigate(-1)} style={{ marginRight: 8 }}>←</button>
        {chat?.title}
      </div>

      <div className="chat-messages">
        {chat?.messages.map((m, i) => (
          <div key={i} className={`message ${m.from === "user" ? "user" : "bot"}`}>
            {m.text}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      <div className="input-container">
        <input
          className="input-box"
          placeholder="Nhập tin nhắn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onEnter}
        />
        <button className="send-btn" onClick={async () => {
          const text = input.trim();
          if (!text) return;
          await sendMessage();
          await renameIfDefaultOnFirstMsg(text);
        }}>
          Gửi
        </button>
      </div>
    </div>
  );
}
