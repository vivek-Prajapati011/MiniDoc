import express from "express"
import cors from "cors"
import {readdir} from "fs/promises"

const app = express()
const port = 3000

app.use(cors())


app.get("/", async (req,res) => {
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

 app.listen(port, () => {
    console.log("server is runing on this port", port)
 }) 