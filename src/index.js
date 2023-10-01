const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const express = require("express");
const path = require("path");
const {
  registerUserFunc,
  loginUserFunc,
  listofSchools,
} = require("./handlers");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = express();
app.set("view engine", "hbs");

app.use(cors());
const PORT =process.env.PORT || 80

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json"
  );
  next();
});

const uri = process.env.MONGODB_URL;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get("/listItems", listofSchools);

app.post("/login", bodyParser.json(), loginUserFunc);

app.post("/register", bodyParser.json(), registerUserFunc);

app.listen(PORT, () =>
  console.log(`Example app listening on ${PORT}!`)
);
