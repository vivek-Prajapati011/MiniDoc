import { model, Schema } from "mongoose";

const fileSchema = new Schema({
  name: { type: String, required: true },
  extension: { type: String },
  storedName: { type: String },
  size: { type: Number },
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  parentDirId: { type: Schema.Types.ObjectId, ref: "Directory", default: null },
});

const File = model("File", fileSchema);
export default File;
