import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("exam.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    config TEXT NOT NULL,
    solution_key TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    data TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const app = express();
app.use(express.json());

const PORT = 3000;

// API Routes
app.post("/api/exam/setup", (req, res) => {
  const { id, config, solutionKey } = req.body;
  try {
    const stmt = db.prepare("INSERT OR REPLACE INTO exams (id, config, solution_key) VALUES (?, ?, ?)");
    stmt.run(id, JSON.stringify(config), JSON.stringify(solutionKey));
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to setup exam" });
  }
});

app.get("/api/exam/:id", (req, res) => {
  const { id } = req.params;
  const exam = db.prepare("SELECT config FROM exams WHERE id = ?").get(id) as any;
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  res.json(JSON.parse(exam.config));
});

app.post("/api/exam/:id/submit", async (req, res) => {
  const { id } = req.params;
  const { studentName, responses, timeTakenSeconds, terminated, terminationReason } = req.body;

  const exam = db.prepare("SELECT config, solution_key FROM exams WHERE id = ?").get(id) as any;
  if (!exam) return res.status(404).json({ error: "Exam not found" });

  const config = JSON.parse(exam.config);
  const solutionKey = JSON.parse(exam.solution_key);

  let totalCorrect = 0;
  config.questions.forEach((q: any) => {
    if (responses[q.id] === solutionKey[q.id]) {
      totalCorrect++;
    }
  });

  const score = (totalCorrect / config.questions.length) * config.totalMarks;
  const percentage = (totalCorrect / config.questions.length) * 100;

  const resultData = {
    studentName,
    responses,
    score,
    totalCorrect,
    percentage,
    timeTakenSeconds,
    terminated,
    terminationReason,
    timestamp: new Date().toISOString()
  };

  db.prepare("INSERT INTO results (exam_id, student_name, data) VALUES (?, ?, ?)")
    .run(id, studentName, JSON.stringify(resultData));

  // Send Email (Simulated)
  // In a real production environment, you would configure nodemailer with your SMTP credentials:
  // const transporter = nodemailer.createTransport({ host: 'smtp.example.com', port: 587, auth: { user: '...', pass: '...' } });
  // await transporter.sendMail({ from: 'system@secureexam.com', to: 'examiner@example.com', subject: `Result: ${studentName}`, text: `Score: ${score}/${config.totalMarks}` });
  console.log(`[EMAIL SIMULATION] Sent result for ${studentName} to examiner's email.`);

  res.json(resultData);
});

app.get("/api/exam/:id/results", (req, res) => {
  const { id } = req.params;
  const results = db.prepare("SELECT * FROM results WHERE exam_id = ? ORDER BY timestamp DESC").all(id);
  res.json(results.map((r: any) => JSON.parse(r.data)));
});

// Vite Middleware
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
