import express from "express"
import cors from "cors"
import {readdir} from "fs/promises"

const app = express()
const port = 3000

app.use(cors())
app.use((req, res, next) => {
  if (req.query.action === "download") {
    res.set("Content-Disposition", "attachment");
  }
  express.static("Storage")(req, res, next);
}); 

app.get("/", async (req,res) => {
   const fileList = await readdir("./Storage") 
   res.json(fileList)
   
} )
 app.listen(port, () => {
    console.log("server is runing on this port", port)
 }) 