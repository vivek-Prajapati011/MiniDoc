import express from "express"
import cors from "cors"
import {readdir,rename, rm } from "fs/promises"
import { createWriteStream } from "fs"
import { stat } from "fs/promises"

const app = express()
const port = 3000

app.use(cors())

app.post("/files/:filename", (req, res) => {
  const writeStream = createWriteStream(`./Storage/${req.params.filename}`);
  req.pipe(writeStream);
  req.on("end", () => {
    res.json({ message: "File Uploaded" });
  });
});



app.get("/directory/{:dirname}", async (req, res) => {
    const { dirname } = req.params;
    console.log(req.params)
    const fullDirPath = `./Storage/${dirname? dirname:""}`;//optional 
    const filesList = await readdir(fullDirPath);
    const resData = [];
    for (const item of filesList) {
      const stats = await stat(`${fullDirPath}/${item}`);
     
      resData.push({ name: item, isDirectory: stats.isDirectory() });
    }
    res.json(resData);
   
  })

app.get("/files/:filename", (req, res) => {
  const { filename } = req.params;
  if (req.query.action === "download") {
    res.set("Content-Disposition", "attachment");
  }
  res.sendFile(`${import.meta.dirname}/Storage/${filename}`);
}); 

app.patch("/files/:filename", async (req, res) => {
  const { filename } = req.params;
  await rename(`./Storage/${filename}`, `./Storage/${req.body.newFilename}`);
  res.json({ message: "Renamed" });
});

app.delete("/files/:filename", async (req, res) => {
  const { filename } = req.params;
  const filePath = `./Storage/${filename}`;
  try {
    await rm(filePath);
    res.json({ message: "File Deleted Successfully" });
  } catch (err) {
    res.status(404).json({ message: "File Not Found!" });
  }
});

 app.listen(port, () => {
    console.log("server is runing on this port", port)
 }) 