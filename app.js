// app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDb } from "./Storage/Db.js";
import directoryRoutes from "./routes/directoryRoute.js";
import fileRoutes from "./routes/fileRoute.js";
import userRoutes from "./routes/userRoute.js";
import "./config/mongoose.js"

const app = express();
const PORT = 3000;

async function startServer() {
  try {
    // ✅ Connect to MongoDB once at startup
    const db = await connectDb();
    

    // ✅ Middleware
    app.use(express.json());
    app.use(cookieParser());

  app.use(
  cors({
    origin: true,
    credentials: true,
  })
);



    // ✅ Attach DB instance to all requests
    app.use((req, res, next) => {
      req.db = db;
      next();
    });

    // ✅ Mount routes
    app.use("/directory", directoryRoutes);
    app.use("/files", fileRoutes);
    app.use("/users", userRoutes);

    // ✅ Default route
    app.get("/", (req, res) => {
      res.json({ message: "Welcome to MiniDoc API" });
    });

    // ✅ 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: "Route not found" });
    });

    // ✅ Global error handler
    app.use((err, req, res, next) => {
      console.error("❌ Server Error:", err.stack);
      res.status(500).json({ error: "Something went wrong!" });
    });

    // ✅ Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
  }
}

// ✅ Start the server
startServer();
