import "dotenv/config";
import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import projectRoutes from "./routes/projects.js";
import taskRoutes from "./routes/tasks.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 4000;

const clientOrigins = process.env.CLIENT_ORIGIN?.split(",").map((s) => s.trim()) ?? [
  "http://localhost:5173",
];

app.use(
  cors({
    origin: clientOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "team-task-manager-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", taskRoutes);

const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(publicDir, "index.html"), (err) => {
    if (err) next();
  });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
