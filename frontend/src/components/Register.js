import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function Register({ apiBase }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  // [NEW] Thêm state email
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const submit = async () => {
    if (!username || !password || !rePassword || !email) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (password !== rePassword) {
      alert("Mật khẩu nhập lại không khớp");
      return;
    }

    // [NEW] Gửi thêm email lên server
    const res = await fetch(`${apiBase}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, email }),
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.message || "Đăng ký thất bại");
      return;
    }

    alert("Đăng ký thành công");
    navigate("/login");
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Đăng ký</h2>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        
        {/* [NEW] Ô nhập Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Nhập lại password"
          value={rePassword}
          onChange={(e) => setRePassword(e.target.value)}
        />

        <button onClick={submit}>Register</button>

        <p className="auth-switch">
          Đã có tài khoản?{" "}
          <span onClick={() => navigate("/login")}>Đăng nhập</span>
        </p>
      </div>
    </div>
  );
}