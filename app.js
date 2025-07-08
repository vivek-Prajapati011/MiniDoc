import express from "express"
import cors from "cors"
import {readdir} from "fs/promises"
const app = express()
const port = 3000

app.use(cors())
app.get("/",  async (req,res) =>{ 
    const fileList = await readdir("./storage") 
    console.log(fileList)
    res.json(fileList)
})
 app.listen(port, () => {
    console.log("server is runing on this port", port)
 }) 