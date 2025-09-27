// app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import directoryRoutes from "./routes/directoryRoute.js";
import fileRoutes from "./routes/fileRoute.js";
import userRoutes from "./routes/userRoute.js";

const app = express();
const PORT = 3000;

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173', // Your React dev server
  credentials: true // Important for cookies
}));

app.use(express.json());
app.use(cookieParser());

// Mount Routers
app.use("/directory", directoryRoutes);
app.use("/files", fileRoutes);
app.use("/users", userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`✅ Server started on http://localhost:${PORT}`);
});