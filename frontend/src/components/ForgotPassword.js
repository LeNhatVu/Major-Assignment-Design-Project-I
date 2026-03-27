import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function ForgotPassword({ apiBase }) {
  const [step, setStep] = useState(1); // 1: Nhập Email, 2: Nhập OTP & Pass mới
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  // BƯỚC 1: Gửi yêu cầu lấy OTP
  const sendOtp = async () => {
    if (!email) {
      alert("Vui lòng nhập email");
      return;
    }

    const res = await fetch(`${apiBase}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Có lỗi xảy ra");
      return;
    }

    alert("Mã OTP đã được gửi đến email của bạn!");
    setStep(2); // Chuyển sang màn hình nhập OTP
  };

  // BƯỚC 2: Gửi OTP và Mật khẩu mới để đổi
  const resetPassword = async () => {
    if (!otp || !newPassword) {
      alert("Vui lòng nhập mã OTP và mật khẩu mới");
      return;
    }

    const res = await fetch(`${apiBase}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, newPassword }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Đổi mật khẩu thất bại");
      return;
    }

    alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
    navigate("/login");
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{step === 1 ? "Quên mật khẩu" : "Đặt lại mật khẩu"}</h2>

        {step === 1 && (
          <>
            <p style={{marginBottom: "15px", fontSize: "14px"}}>
              Nhập email của bạn để nhận mã xác thực.
            </p>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button onClick={sendOtp}>Lấy mã OTP</button>
          </>
        )}

        {step === 2 && (
          <>
            <p style={{marginBottom: "15px", fontSize: "14px"}}>
              Đã gửi OTP tới <strong>{email}</strong>
            </p>
            <input
              placeholder="Nhập mã OTP (6 số)"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            
            <input
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            
            <button onClick={resetPassword}>Đổi mật khẩu</button>
          </>
        )}

        <p className="auth-switch">
          Quay lại?{" "}
          <span onClick={() => navigate("/login")}>Đăng nhập</span>
        </p>
      </div>
    </div>
  );
}