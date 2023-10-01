const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    index:true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },
});

userSchema.pre("save", async function (next) {
   const hashedPassword = await bcrypt.hash(this.password, 10);
   this.password = hashedPassword;
   next();
});

module.exports = mongoose.model("User", userSchema);
