import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function Login({ apiBase }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const submit = async () => {
    if (!username || !password) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    const res = await fetch(`${apiBase}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      alert("Sai tài khoản hoặc mật khẩu");
      return;
    }

    const data = await res.json();
    localStorage.setItem("username", data.username);
    // Điều hướng về trang chủ hoặc load lại trang
    window.location.href = "/"; 
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Đăng nhập</h2>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={submit}>Login</button>

        <div className="auth-footer">
            <p className="auth-switch">
            Chưa có tài khoản?{" "}
            <span onClick={() => navigate("/register")}>Đăng ký</span>
            </p>
            
            {/* [NEW] Nút quên mật khẩu */}
            <p className="auth-switch" style={{marginTop: '10px'}}>
            <span onClick={() => navigate("/forgot-password")} style={{color: '#e74c3c'}}>
                Quên mật khẩu?
            </span>
            </p>
        </div>
      </div>
    </div>
  );
}