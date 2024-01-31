const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const express = require("express");
const passport = require("passport");
const User = require("./src/models/users");
const GoogleStrategy = require("passport-google-oauth20");
const GitHubStrategy = require("passport-github");
const UserDetails = require("./src/models/userDetails");
const Appointments = require("./src/models/appointments");

const session = require("express-session");

const path = require("path");
const {
  registerUserFunc,
  loginUserFunc,
  makePayment,
  listofSchools,
} = require("./src/handlers");
require("dotenv").config({ path: path.resolve(__dirname, "./.env") });

const app = express();
app.use(
  cors({
    origin: [`${process.env.BASE_URL}`],
    credentials: true,
  })
);
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.set('trust proxy', 1);


app.use(
  session({
    secret: "something",
    resave: true,
    saveUninitialized: false,
    rolling: true,
    proxy:true,
    // cookie: {
    //    sameSite: "none",
    //   // httpOnly: true,

    //   // secure: true,
    //   maxAge: 1000 * 60 * 60 * 24, // One Week
    // },
  })
);

app.use(passport.initialize());

app.use(passport.session());
app.use(express.json());

app.set("view engine", "hbs");

const PORT = process.env.PORT || 80;

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", `${process.env.BASE_URL}`);
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Credentials", "include");

  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, X-AUTHENTICATION, X-IP, Content-Type, Accept"
  );

  next();
});





 passport.serializeUser((user, done) => {
  return done(null, user._id);
});

passport.deserializeUser((userId, done) => {
  User.findById(userId).then((data) => {
    if (data) {
      return done(null, data);
    }
  });
});

const checkIfAuthenticated = (req, res, next) => {
  console.log({requ:req.user})
  if (req.user && req.isAuthenticated()) {
    next();
  } else {
   return res.status(401).send({body:"unauthorized"})
  }
};

 

const checkAndRegisterUser = async (keys, profile, cb) => {
  const userById = await User.findOne({ ssoID: profile[keys.idKey] });
  if (userById) {
    cb(null, userById);
  } else {
    const newUser = new User({
      name: profile[keys.nameKey],
      ssoID: profile[keys.idKey],
    });
    await newUser.save();

    cb(null, newUser);
  }
};

passport.use(
  new GoogleStrategy(
    {
      clientID: `548976840554-ahkl0ab0ca5ejn94r30dtvrh08elodta.apps.googleusercontent.com`,
      clientSecret: `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`,
      callbackURL: "/auth/google/callback",
      proxy: true,
    },
    function (__accessToken, __refreshToken, profile, cb) {
      checkAndRegisterUser(
        { idKey: "id", nameKey: "displayName" },
        profile,
        cb
      );
    }
  )
);
passport.use(
  new GitHubStrategy(
    {
      clientID: "a52acde061c84310e06a",
      clientSecret: "fc273c9201adbb83f6642b8e4d2ebf61f6e39a5e",
      callbackURL:  `/auth/github/callback`,
    },

    function (__accessToken, __refreshToken, profile, cb) {
      checkAndRegisterUser({ idKey: "id", nameKey: "username" }, profile, cb);
      // cb(null, profile);
    }
  )
);

app.post("/make-payment", makePayment);

const uri = process.env.MONGODB_URL;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.get("/listItems", checkIfAuthenticated,listofSchools);

app.get("/unauthorized", (req,res)=>{
  console.log("sdd")
  window.location.href = "http://localhost:3000/"
 });

app.get("/getuserinfo",checkIfAuthenticated, async (req, res) => {
  if (req.user) {
    const loggeduser = req.user;
    const idKey = loggeduser.ssoID ? "ssoID" : "id";

    const user = await UserDetails.findOne({ id: loggeduser[idKey] });

    if (user) {
      return res.status(200).send({ body: user });
    }
    return res.status(200).send(null);
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"], keepSessionInfo: true })
);

app.get("/auth/github", passport.authenticate("github"));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: `${process.env.BASE_URL}/onboarding`,
    failureRedirect: "/admin/login/?error",
    keepSessionInfo: true,
  })
);

app.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    successRedirect: `${process.env.BASE_URL}/onboarding`,
    failureRedirect: "http://localhost:3000/error",
    keepSessionInfo: true,
  })
);
app.get("/verify", checkIfAuthenticated,checkIfAuthenticated, (req, res) => {
  res.send(` HI ${req.session.count}`);
});

app.get("/", checkIfAuthenticated, (req, res) => {
  if (req.session.count) {
    req.session.count++;
  } else {
    req.session.count = 1;
  }
  res.send(` HI ${req.session.count}`);
});

app.post("/login",checkIfAuthenticated, loginUserFunc);

app.get("/logout", (req, res, next) => {
  if (req.user) {
    req.logout(function (err) {
      if (!err) {
        res.status(200).send({ body: "done" });
        return;
      }

      res.send(400);
    });
  }
});

app.post("/register",checkIfAuthenticated, registerUserFunc);

app.post("/onboarduser", checkIfAuthenticated, async (req, res) => {
  const payload = req.body;
  const IS_DOCTOR = payload.accounttype === "doctor";
  // const doc = new Doctor(docObj);
  const userInfo = new UserDetails({
    accounttype: payload.accounttype,
    specialization: !IS_DOCTOR ? null : payload.specialization,
    pincode: payload.pincode,
    fees: IS_DOCTOR ? payload.fees || 1000 : null,
    id: req.user.ssoID ?? req.user.id,
    name: req.user.name,
  });
  await userInfo.save();
  res.status(200).send({ body: "done" });
});

app.get("/fetchUserDetails", checkIfAuthenticated, (req, res) => {
  if (req.user) {
    res.send(req.user);
    return;
  }
  res.status(401).send("Unauthorized");
});

app.get("/listdoctors", checkIfAuthenticated, async (req, res) => {
  const specializationCategory = req.query.specialization;

  const users = await UserDetails.find({
    accounttype: "doctor",
    specialization: specializationCategory,
  });

  if (users) {
    res.status(200).send({ body: users });
    return;
  }

  res.status(401).send("Unauthorized");
});

app.post("/bookappointment", checkIfAuthenticated, async (req, res) => {
  const payload = req.body;

  const appointDetails = {
    requestedby: req.user.ssoID,
    doctor: payload.docId,
    status: "Pending",
  };

  const appointment = new Appointments(appointDetails);
  await appointment.save();
  res.send("done");
});

app.get("/appointmentrequests", checkIfAuthenticated, async (req, res) => {
  if (req.user) {
    const appointments = await Appointments.find({
      doctor: req.user.ssoID,
    });

    const result = [];

    if (appointments) {
      // const patients = await UserDetails.find({accounttype:"patient"});

      const user = await UserDetails.find({
        accounttype: "patient",
        id: appointments?.[0]?.requestedby,
      });

      for (let i = 0; i < appointments.length; i++) {
        const obj = appointments[i];
        const user = await UserDetails.find({
          accounttype: "patient",
          id: appointments[i].requestedby,
        });

        obj.requestedby = user[0].name;
        result.push(obj);
      }
    }

    res.status(200).send({ body: result });
    return;
  }
  // const users = await Appointments.find({
  //   doctor: req.user._id,
  // });
  // console.log({ users });
  // if (users) {
  //   res.status(200).send({ body: users });
  //   return;
  // }

  res.status(401).send("Unauthorized");
});

app.patch("/modifystatus", checkIfAuthenticated, async (req, res) => {
  const newStatus = req.body.status;
  const id = req.body.id;
  const y = await Appointments.findOneAndUpdate(
    { _id: id },
    { status: newStatus }
  );
  res.send("Done");
});

app.get("/myappointments", checkIfAuthenticated, async (req, res) => {
  if (req.user) {
    const appointments = await Appointments.find({
      requestedby: req.user.ssoID,
    });
    const result = [];

    if (appointments) {
      // const patients = await UserDetails.find({accounttype:"patient"});

      for (let i = 0; i < appointments.length; i++) {
        const obj = JSON.parse(JSON.stringify(appointments[i]));
        const user = await UserDetails.find({
          accounttype: "doctor",
          id: appointments[i].doctor,
        });

        obj.doctor = user[0].name;
        obj.specialization = user[0].specialization.toUpperCase();
        result.push(obj);
      }
    }

    res.status(200).send({ body: result });
    return;
  }

  res.status(401).send("Unauthorized");
});

app.listen(PORT, () => console.log(`Example app listening on ${PORT}!`));
