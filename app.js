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

app.get("/:fileName", (req, res) => {
  const {fileName} = req.params
  res.sendFile(`${import.meta.dirname}/Storage/${fileName}`)
  console.log(req.params)
} )
 app.listen(port, () => {
    console.log("server is runing on this port", port)
 }) 