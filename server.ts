import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { smsRouter } from "./server/smsRoutes.js";
import { startSmsScheduler } from "./server/smsScheduler.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "FABIS MediCare EMR", smsGateway: "TextBee REST API" });
  });

  app.use("/api/sms", smsRouter);

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FABIS MediCare] Express Server running on http://0.0.0.0:${PORT}`);
    startSmsScheduler(60000); // Background scheduler every 60s
  });
}

startServer();
