const User = require("./models/users");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const stripeHandler = require("stripe");





require("dotenv").config({ path: path.resolve(__dirname, "../.env") });




const secretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeHandler(secretKey)

const registerUserFunc = async (req, res) => {
  
  const result = await registerUser(req);

  return res.status(result.statusCode).send({ body: result.body });
};
const registerUser = async (req) => {
  try {
    const parsedBody = req.body;
    if (!parsedBody) {
      return { statusCode: 400, body: "Bad Request" };
    }
    const userInDb = await User.findOne({ email: parsedBody.email });
    if (userInDb) {
      return { statusCode: 400, body: "alreadyExist" };
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
        pass: process.env.MAIL_PW,
      },
    });
    const templateSource = fs.readFileSync(
      path.resolve(__dirname, "./views/index.hbs"),
      "utf8"
    );

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
      }
    });
  } catch (err) {
    console.log(err);
  }
};

/******************************************************************* */

const loginUserFunc = async (req, res) => {
  const result = await checkValidLogin(req.body);

  return res.status(result.statusCode).send({ body: result.body });
};
const checkValidLogin = async (userObj) => {
  const person = await User.findOne({ email: userObj.email });

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
   const aunthenticationToken = req.headers.authorization;
  
  const token = aunthenticationToken?.split(" ")[1];

  const authenticateCall = await authenticateToken(token, req.query);

  res.status(authenticateCall.statusCode).send(authenticateCall.body);
};

const authenticateToken = async (token, queryParams) => {
  try {
    // if (!token) {
    //   return { statusCode: 401, body: "unauthorized" };
    // }
    // const verifyToken = await jwt.verify(token, process.env.SECRET_KEY_TOKEN);

    // if (!verifyToken) {
    //   return { statusCode: 403, body: "Forbidden" };
    // }
    const params = {
      limit: queryParams.limit ?? 10,
      offset: queryParams.offset ?? 0,
    };
    let uri = `http://universities.hipolabs.com/search?limit=${Number(
      params.limit
    )}&offset=${Number(params.offset)}`;

    if (queryParams.name) {
      uri += `&name=${queryParams.name}`;
    }
    if (queryParams.country) {
      uri += `&country=${queryParams.country}`;
    }

    const result = await fetch(uri, {
      method: "GET",
    });
    const y = await result.json();

    return { statusCode: 201, body: y };
  } catch (error) {
    console.log(error);
    return { statusCode: 403, body: "Forbidden" };
  }
};
/******************************************************************* */


const makePayment = async (req, res) => {
  const response = await initaite(req);

  res.status(response.statusCode).send({url:response.body});
};

const initaite = async (req) => {
  try {
    const aunthenticationToken = req.headers.authorization;
    const token = aunthenticationToken?.split(" ")[1];

    if (!token) {
      return { statusCode: 401, body: "unauthorized" };
    }
    const verifyToken = await jwt.verify(token, process.env.SECRET_KEY_TOKEN);

    if (!verifyToken) {
      return { statusCode: 403, body: "Forbidden" };
    }
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "INR",
            product_data: {
              name: "Ghar Vaidya",
            },
            unit_amount: 2000,
          },
          quantity: req.body.qty,
        },
      ],
      mode: "payment",
      success_url: process.env.SUCCESS_URL,
      cancel_url: process.env.ERROR_URL,
    });

    return { statusCode: 201, body: session.url };
  } catch (error) {
    console.log(error);
    return { statusCode: 400, body: "PaymentFailure" };
  }
};
/******************************************************************* */

module.exports = { registerUserFunc, loginUserFunc, listofSchools, makePayment};
