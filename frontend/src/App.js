import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ChatPage from "./components/ChatPage";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import "./App.css";

const apiBase = "http://localhost:5000";

export default function App() {
  const [chats, setChats] = useState([]);
  const [username, setUsername] = useState(
    localStorage.getItem("username")
  );

  const refreshChats = async () => {
    if (!username) return;
    const res = await fetch(`${apiBase}/chat/all?username=${username}`);
    const data = await res.json();
    setChats(data);
  };

  useEffect(() => {
    const u = localStorage.getItem("username");
    if (u !== username) {
      setUsername(u);
    }
  }, []);


  useEffect(() => {
    refreshChats();
  }, [username]);

  if (!username) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login apiBase={apiBase} />} />
          <Route path="/register" element={<Register apiBase={apiBase} />} />
          <Route path="/forgot-password" element={<ForgotPassword apiBase={apiBase} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar chats={chats} refreshChats={refreshChats} apiBase={apiBase} />
        <Routes>
          <Route path="/" element={<div style={{ padding: 20 }}>Chọn cuộc trò chuyện</div>} />
          <Route path="/chat/:id" element={<ChatPage apiBase={apiBase} refreshChats={refreshChats} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
