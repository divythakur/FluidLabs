const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const bodyParser = require("body-parser");
const express = require("express");
 const path = require("path");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
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


 
app.listen(8000, () => console.log(`Example app listening on port.PORT}!`));

 
 

 
const authenticateToken = async (token, queryParams) => {
  try {
    if (!token) {
      return { statusCode: 401, body: "unauthorized" };
    }
    const verifyToken = await jwt.verify(token, process.env.SECRET_KEY_TOKEN);

    console.log({ verifyToken });
    if (!verifyToken) {
      return { statusCode: 403, body: "Forbidden" };
    }
    const params = {
      limit: queryParams.limit ?? 10,
      offset: queryParams.offset ?? 0,
    };

    const result = await fetch(
      `http://universities.hipolabs.com/search?limit=${Number(
        params.limit
      )}&offset=${Number(params.offset)}`,
      {
        method: "GET",
      }
    );
    const y = await result.json();

    return { statusCode: 201, body: y };
  } catch (error) {
    console.log(error);
    return { statusCode: 403, body: "Forbidden" };
  }
};




