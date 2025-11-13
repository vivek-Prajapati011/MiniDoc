import { model, Schema } from "mongoose";

const userSchema = new Schema({
  name: { type: String, required: true, minlength: 3 },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/,
  },
  password: { type: String, required: true, minlength: 4 },
  rootDirId: { type: Schema.Types.ObjectId, ref: "Directory" },
});

const User = model("User", userSchema);
export default User;
