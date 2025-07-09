import express from "express"
import cors from "cors"
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import {readdir} from "fs/promises"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express()
const port = 3000

app.use(cors())
app.get("/",  async (req,res) =>{ 
   const folderPath = path.join(__dirname, "Storage");

    const fileList = await readdir(folderPath);
    res.json(fileList);
})
 app.listen(port, () => {
    console.log("server is runing on this port", port)
 }) 