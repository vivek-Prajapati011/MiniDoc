import express from "express";
import cors from "cors";
import directoryRoutes from "./routes/directoryRoute.js";
import fileRoutes from "./routes/fileRoute.js";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Mount Routers
app.use("/directory", directoryRoutes);
app.use("/files", fileRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server started on http://localhost:${PORT}`);
});
