import express from "express"
import cors from "cors"
import {readdir,rename, rm } from "fs/promises"
import { createWriteStream } from "fs"

const app = express()
const port = 3000

app.use(cors())

app.post("/:filename", (req, res) => {
  const writeStream = createWriteStream(`./storage/${req.params.filename}`);
  req.pipe(writeStream);
  req.on("end", () => {
    res.json({ message: "File Uploaded" });
  });
});



app.get("/directory", async (req,res) => {
   const fileList = await readdir("./Storage") 
   res.json(fileList)
   
} )

app.get("/:filename", (req, res) => {
  const { filename } = req.params;
  if (req.query.action === "download") {
    res.set("Content-Disposition", "attachment");
  }
  res.sendFile(`${import.meta.dirname}/Storage/${filename}`);
}); 

app.patch("/:filename", async (req, res) => {
  const { filename } = req.params;
  await rename(`./Storage/${filename}`, `./Storage/${req.body.newFilename}`);
  res.json({ message: "Renamed" });
});

app.delete("/:filename", async (req, res) => {
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