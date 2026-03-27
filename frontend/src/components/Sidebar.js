import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({ chats, refreshChats, apiBase }) {
  const navigate = useNavigate();
  const location = useLocation();

  // ===== SEARCH STATE =====
  const [keyword, setKeyword] = useState("");

  // ===== LOGOUT =====
  const handleLogout = async () => {
    try {
      await fetch(`${apiBase}/logout`, {
        method: "POST"
      });
    } catch (e) {
      // backend có lỗi cũng không sao
    }

    localStorage.removeItem("username");
    window.location.href = "/login";
  };

  // ===== CREATE CHAT =====
  const createNew = async () => {
    try {
      const res = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Cuộc trò chuyện mới",
          username: localStorage.getItem("username")
        })
      });

      const newChat = await res.json();
      await refreshChats();
      navigate(`/chat/${newChat.id}`);
    } catch (err) {
      console.error("Create chat error", err);
    }
  };

  // ===== DELETE CHAT =====
  const deleteChat = async (id) => {
    if (!window.confirm("Xóa cuộc trò chuyện?")) return;

    try {
      await fetch(`${apiBase}/chat/${id}`, { method: "DELETE" });
      await refreshChats();

      if (location.pathname === `/chat/${id}`) {
        navigate("/");
      }
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  // ===== FILTER CHAT (SEARCH LOGIC) =====
  const filteredChats = chats.filter((chat) => {
    if (!keyword.trim()) return true;

    const k = keyword.toLowerCase();

    // search by title
    if (chat.title.toLowerCase().includes(k)) return true;

    // search by message content
    return chat.messages?.some((m) =>
      m.text.toLowerCase().includes(k)
    );
  });

  return (
    <div className="sidebar">
      {/* LOGOUT */}
      <div style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="sidebar-title">Danh mục cuộc trò chuyện</div>

      {/* SEARCH INPUT */}
      <input
        type="text"
        placeholder="Tìm cuộc trò chuyện..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{
          width: "100%",
          padding: "8px",
          marginBottom: "12px"
        }}
      />

      {/* CREATE CHAT */}
      <button className="new-chat-btn" onClick={createNew}>
        + Cuộc trò chuyện mới
      </button>

      {/* CHAT LIST */}
      <ul className="chat-list">
        {filteredChats.map((chat) => (
          <li
            key={chat.id}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center"
            }}
          >
            <Link to={`/chat/${chat.id}`} className="chat-item">
              {chat.title}
            </Link>

            {/* RENAME */}
            <button
              onClick={() => {
                const newTitle = prompt(
                  "Đổi tên cuộc trò chuyện:",
                  chat.title
                );

                if (newTitle && newTitle.trim()) {
                  fetch(`${apiBase}/chat/${chat.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title: newTitle.trim() })
                  }).then(() => refreshChats());
                }
              }}
            >
              ✏️
            </button>

            {/* DELETE */}
            <button onClick={() => deleteChat(chat.id)}>🗑️</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
