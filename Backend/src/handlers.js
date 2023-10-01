const User = require("./models/users");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const registerUserFunc = async (req, res) => {
  const result = await registerUser(req);

  return res.status(result.statusCode).send({ body: result.body });
};
const registerUser = async (req) => {
  try {
    const parsedBody = req.body;
    console.log({ parsedBody, req });
    if (!parsedBody) {
      return { statusCode: 400, body: "Bad Request" };
    }
    const userObj = {
      name: parsedBody.name,
      password: parsedBody.password,
      lastname: parsedBody.lastname,
      email: parsedBody.email,
    };
    var user1 = new User(userObj);
    await user1.save();
    // Send the email
    sendEmail(parsedBody.name);

    return { statusCode: 200, body: "success" };
  } catch (err) {
    console.log(err);
    if (err.code == 11000) {
      return { statusCode: 400, body: "alreadyExist" };
    }
    return { statusCode: 400, body: "Bad Request" };
  }
};

const sendEmail = async (username) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "cad2ab8c94da63",
        pass: "cdf0d1b26bcd3b",
      },
    });
    const templateSource = fs.readFileSync("../views/index.hbs", "utf8");

    const template = handlebars.compile(templateSource);

    const mailOptions = {
      from: "divyanshu@fluidlabs",
      to: "test@fluidlabs",
      subject: "Thanks for registering",
      html: template({ name: username }),
    };

    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email: ", error);
      } else {
        console.log("Email sent: ", info.response);
      }
    });
  } catch (err) {
    console.log(err);
  }
};

/******************************************************************* */

const loginUserFunc = async (req, res) => {
  const result = await checkValidLogin(req.body);
  console.log({ result });

  return res.status(result.statusCode).send({ body: result.body });
};
const checkValidLogin = async (userObj) => {
  const person = await User.findOne({ email: userObj.email });
  console.log(person);

  if (!person) {
    return { statusCode: 400, body: "norecord" };
  }
  const isMatchPasssword = await bcrypt.compare(
    userObj.password,
    person.password
  );

  if (isMatchPasssword) {
    const token = process.env.SECRET_KEY_TOKEN;
    const jwtToken = jwt.sign(
      { id: person._id, name: person.name, email: person.email },
      process.env.SECRET_KEY_TOKEN
    );
     return { statusCode: 200, body: { jwtToken } };
  }
  return { statusCode: 400, body: "incorrectpassword" };
};

/******************************************************************* */

const listofSchools = async (req, res) => {
  console.log(req.headers);
  const aunthenticationToken = req.headers.authorization;
  const token = aunthenticationToken?.split(" ")[1];

  const authenticateCall = await authenticateToken(token, req.query);

  res.status(authenticateCall.statusCode).send(authenticateCall.body);
};

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

/******************************************************************* */

module.exports = { registerUserFunc, loginUserFunc, listofSchools };
