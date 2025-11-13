import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./config/mongoose.js";
import directoryRoutes from "./routes/directoryRoute.js";
import fileRoutes from "./routes/fileRoute.js";
import userRoutes from "./routes/userRoute.js";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/directory", directoryRoutes);
app.use("/files", fileRoutes);
app.use("/users", userRoutes);

app.get("/", (req, res) => res.json({ message: "MiniDoc API with Mongoose ✅" }));

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
