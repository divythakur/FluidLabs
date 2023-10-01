const mongoose = require("mongoose");
const cors = require("cors");
 const bodyParser = require("body-parser");
const express = require("express");
 const path = require("path");
 const {registerUserFunc,loginUserFunc, listofSchools} =require('./handlers')
 require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = express();
app.set("view engine", "hbs");
app.use(cors());

const uri =process.env.MONGODB_URL;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get("/listItems", listofSchools);

app.post("/login", bodyParser.json(), loginUserFunc);


app.post("/register", bodyParser.json(),registerUserFunc);


 
app.listen(process.env.PORT, () => console.log(`Example app listening on port}!`));

 
 

 
 




