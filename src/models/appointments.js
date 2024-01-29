const mongoose = require("mongoose");
 
const Schema = mongoose.Schema;

const appointments = new Schema({
  requestedby: {
    type: String,
 //   required:true
  },
  doctor:{
    type:String,
  },
   status:{
    type:String,
  },
  timeslot:{
    type:Number
  }
});

 

module.exports = mongoose.model("Appointments", appointments);
