// Tải các thư viện
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

// --- CÁC THƯ VIỆN AI MỚI ---
require('dotenv').config(); // Tải file .env để đọc API Key
const { GoogleGenerativeAI } = require('@google/generative-ai');
// ----------------------------

const app = express();
const port = process.env.PORT || 3000;

// --- CÁC MIDDLEWARE MỚI ---
app.use(cors()); // Cho phép Frontend gọi
app.use(express.json()); // **RẤT QUAN TRỌNG**: Cho phép Express đọc JSON từ body
// ----------------------------

// Cấu hình kết nối MySQL
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'flashcard_db'
});

// --- CẤU HÌNH GOOGLE AI ---
// Lấy API key từ file .env
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
// Chọn mô hình AI chúng ta muốn dùng
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
// ----------------------------

console.log('Đang cố gắng kết nối đến MySQL...');

// API: Lấy các thẻ
app.get('/api/cards', (req, res) => {
  const sql = 'SELECT * FROM cards';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Lỗi truy vấn MySQL:', err);
      return res.status(500).send('Lỗi khi truy vấn cơ sở dữ liệu');
    }
    res.json(results);
  });
});

// --- API MỚI: DÀNH CHO AI ---
app.post('/api/ask-ai', async (req, res) => {
  try {
    // 1. Lấy câu hỏi (prompt) từ Frontend gửi lên
    const question = req.body.prompt;
    const userPrompt = `Bạn là một trợ lý AI giúp người dùng học từ vựng tiếng Anh, hãy trả lời ngắn gọn:
    từ vựng, phát âm, nghĩa, cho câu ví dụ.
    Người dùng nhập: ${question}
    `;
    console.log('AI: Đã nhận được câu hỏi:', userPrompt);

    if (!userPrompt) {
      return res.status(400).json({ error: 'Không có câu hỏi nào được cung cấp' });
    }

    // 2. Gửi câu hỏi đến Google Gemini
    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    const aiAnswer = response.text();
    console.log('AI: Đã có câu trả lời:', aiAnswer);

    // 3. Gửi câu trả lời của AI về cho Frontend
    res.json({ answer: aiAnswer });

  } catch (error) {
    console.error('Lỗi khi gọi API AI:', error);
    res.status(500).json({ error: 'Có lỗi xảy ra khi xử lý yêu cầu AI' });
  }
});
// ----------------------------

// Khởi động server
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});