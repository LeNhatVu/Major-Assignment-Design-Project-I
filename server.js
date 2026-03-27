const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
// [NEW] Thêm thư viện băm mật khẩu và gửi email
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, "data.json");
const USER_FILE = path.join(__dirname, "users.json");

// [NEW] Cấu hình gửi mail (Bạn cần thay đổi email/pass thật của mình)
// Lưu ý: Nếu dùng Gmail, bạn cần bật "App Password" (Mật khẩu ứng dụng)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "lamdeblaireau@gmail.com", // THAY_BẰNG_EMAIL_CỦA_BẠN
    pass: "gfzy cmvy drhl maof",    // THAY_BẰNG_MẬT_KHẨU_ỨNG_DỤNG
  },
});

// [NEW] Bộ nhớ tạm để lưu OTP (Trong thực tế nên lưu vào Redis hoặc Database có thời hạn)
const otpStore = {}; 

// Helper: read data (Giữ nguyên)
function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading data file:", err);
    return [];
  }
}

// Helper: write data (Giữ nguyên)
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing data file:", err);
    return false;
  }
}

// Helper: read users (Tách hàm này ra để tái sử dụng)
function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(USER_FILE, "utf-8"));
  } catch (err) {
    return [];
  }
}

// LOGIN (Đã sửa đổi để so sánh mật khẩu băm)
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();

  // Tìm user
  const user = users.find((u) => u.username === username);

  if (!user) {
    return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
  }

  // [MODIFIED] So sánh mật khẩu nhập vào với mật khẩu đã băm trong DB
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
  }

  res.json({
    message: "Đăng nhập thành công",
    username: user.username,
  });
});

// REGISTER (Đã sửa đổi thêm email và băm mật khẩu)
app.post("/register", async (req, res) => {
  const { username, password, email } = req.body; // [NEW] Nhận thêm email

  if (!username || !password || !email) {
    return res.status(400).json({ message: "Vui lòng nhập đủ thông tin" });
  }

  const users = readUsers();

  // [NEW] Kiểm tra trùng username hoặc email
  if (users.find((u) => u.username === username || u.email === email)) {
    return res.status(400).json({ message: "Username hoặc Email đã tồn tại" });
  }

  // [NEW] Băm mật khẩu trước khi lưu
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  users.push({ 
    username, 
    password: hashedPassword, // Lưu mật khẩu đã băm
    email 
  });
  
  fs.writeFileSync(USER_FILE, JSON.stringify(users, null, 2));

  res.json({ message: "Đăng ký thành công" });
});

// [NEW] FORGOT PASSWORD: Gửi OTP
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const users = readUsers();
  
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(404).json({ message: "Email không tồn tại trong hệ thống" });
  }

  // Tạo mã OTP ngẫu nhiên 6 số
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Lưu OTP vào bộ nhớ tạm (kèm thời gian hết hạn 5 phút)
  otpStore[email] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000 // 5 phút
  };

  // Gửi email
  const mailOptions = {
    from: '"App Chat" <no-reply@appchat.com>',
    to: email,
    subject: "Mã OTP đặt lại mật khẩu",
    text: `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: "Mã OTP đã được gửi đến email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gửi email thất bại" });
  }
});

// [NEW] RESET PASSWORD: Xác thực OTP và đổi mật khẩu
app.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Kiểm tra OTP
  const storedOtpData = otpStore[email];
  
  if (!storedOtpData) {
    return res.status(400).json({ message: "Yêu cầu không hợp lệ hoặc đã hết hạn" });
  }

  if (storedOtpData.otp !== otp) {
    return res.status(400).json({ message: "Mã OTP không chính xác" });
  }

  if (Date.now() > storedOtpData.expires) {
    delete otpStore[email]; // Xóa OTP hết hạn
    return res.status(400).json({ message: "Mã OTP đã hết hạn" });
  }

  // Thực hiện đổi mật khẩu
  const users = readUsers();
  const userIndex = users.findIndex(u => u.email === email);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: "User không tìm thấy" });
  }

  // Băm mật khẩu mới
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Cập nhật và lưu file
  users[userIndex].password = hashedPassword;
  fs.writeFileSync(USER_FILE, JSON.stringify(users, null, 2));

  // Xóa OTP sau khi dùng xong
  delete otpStore[email];

  res.json({ message: "Đổi mật khẩu thành công" });
});

// LOGOUT (Giữ nguyên)
app.post("/logout", (req, res) => {
  res.json({ message: "Đã đăng xuất" });
});

// ... CÁC API CHAT KHÁC GIỮ NGUYÊN NHƯ CŨ ...
// (Phần code dưới đây không thay đổi so với file gốc của bạn)

// GET /chat/all
app.get("/chat/all", (req, res) => {
  const chats = readData();
  const { username } = req.query;
  if (!username) return res.json(chats);
  const userChats = chats.filter(c => c.user === username);
  res.json(userChats);
});

// GET /chat/:id
app.get("/chat/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const chats = readData();
  const chat = chats.find((c) => c.id === id);
  if (!chat) return res.status(404).json({ error: "Chat not found" });
  res.json(chat);
});

// POST /chat
app.post("/chat", (req, res) => {
  const chats = readData();
  const newId = Date.now();
  const title = req.body.title && req.body.title.trim() ? req.body.title.trim() : "Cuộc trò chuyện mới";
  const username = req.body.username;
  const newChat = { id: newId, user: username, title, messages: [] };
  chats.push(newChat);
  if (!writeData(chats)) return res.status(500).json({ error: "Cannot save data" });
  res.status(201).json(newChat);
});

// PUT /chat/:id
app.put("/chat/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { title } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: "Title required" });

  const chats = readData();
  const idx = chats.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ error: "Chat not found" });

  chats[idx].title = title.trim();
  if (!writeData(chats)) return res.status(500).json({ error: "Cannot save data" });
  res.json(chats[idx]);
});

// DELETE /chat/:id
app.delete("/chat/:id", (req, res) => {
  const id = parseInt(req.params.id);
  let chats = readData();
  const newChats = chats.filter((c) => c.id !== id);
  if (newChats.length === chats.length) return res.status(404).json({ error: "Chat not found" });

  if (!writeData(newChats)) return res.status(500).json({ error: "Cannot save data" });
  res.json({ success: true });
});

// POST /chat/:id/message
app.post("/chat/:id/message", (req, res) => {
  const id = parseInt(req.params.id);
  const { from, text } = req.body;
  if (!from || !text) return res.status(400).json({ error: "from and text required" });

  const chats = readData();
  const idx = chats.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ error: "Chat not found" });

  chats[idx].messages.push({ from, text });
  if (!writeData(chats)) return res.status(500).json({ error: "Cannot save data" });

  res.json(chats[idx]);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));