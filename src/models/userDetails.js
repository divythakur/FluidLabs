const mongoose = require("mongoose");
 
const Schema = mongoose.Schema;

const userDetails = new Schema({
  accounttype: {
    type: String,
 //   required:true
  },
  specialization:{
    type:String,
  },
  
  pincode:{
    type:Number,
  },
  docrating:{
    type:Number,
      
  },
  id:{
    type:String,
    required:true
  },
  fees:{
    type:Number

  },
  name:{
    type:String
  }
});

 

module.exports = mongoose.model("UserDetails", userDetails);
