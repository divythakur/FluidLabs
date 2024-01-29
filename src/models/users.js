const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
  },
  lastname: {
    type: String,
  },
  email: {
    type: String,
    // unique: true,
  },
  ssoID:{
    type:String,
    
  },
  password: {
    type: String,
  },
});

userSchema.pre("save", async function (next) {
  if(this.password)
  {
   const hashedPassword = await bcrypt.hash(this.password, 10);
   this.password = hashedPassword;
  }
   next();
});

module.exports = mongoose.model("User", userSchema);
