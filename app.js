require("dotenv").config();

//** DEPENDENCIES */
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { EmployeeDetails, EmployeeSalary, sequelize } = require("./db");

//** APP INITIALIZATION */
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.disable("etag");
app.disable("x-powered-by");
app.use(
  session({
    secret: "sessionsecret_uhui8n87nu88iunu",
    resave: false,
    saveUninitialized: false,
  })
);

//** AUTHENTICATION STRATEGY */
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  "local-signup",
  new LocalStrategy(
    {
      usernameField: "employee_id",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (req, employee_id, _password, done) => {
      const employee = await EmployeeDetails.findOne({
        where: { employee_id },
      });

      if (employee) {
        return done(null, false, {
          message: "That Employee ID is already taken",
        });
      }

      const {
        // employee_id,
        first_name,
        last_name,
        password,
        date_of_birth,
        contact_number,
      } = req.body;

      const newEmployeeDetails = await EmployeeDetails.create({
        employee_id,
        first_name,
        last_name,
        password,
        date_of_birth: new Date(date_of_birth),
        contact_number,
      });

      return done(null, {
        ...newEmployeeDetails.get(),
      });
    }
  )
);

passport.use(
  "local-signin",
  new LocalStrategy(
    {
      usernameField: "employee_id",
      passwordField: "password",
      passReqToCallback: true,
    },
    async (_req, employee_id, password, done) => {
      try {
        const employee = await EmployeeDetails.findOne({
          where: { employee_id },
        });

        if (!employee) {
          return done(null, false, { message: "Employee does not exist" });
        }

        if (employee.password !== password) {
          return done(null, false, { message: "Incorrect password" });
        }

        const salary = await EmployeeSalary.findOne({ where: { employee_id } });

        return done(null, { ...employee.get(), ...salary?.get() });
      } catch (err) {
        console.error(err);
        return done(null, false, { message: "Something went wrong!" });
      }
    }
  )
);

passport.serializeUser((employee, done) => {
  console.log(employee);
  done(null, employee.employee_id);
});

passport.deserializeUser(async (employee_id, done) => {
  try {
    const employee = await EmployeeDetails.findOne({
      where: { employee_id },
    });
    const salary = await EmployeeSalary.findOne({ where: { employee_id } });

    return done(null, { ...employee.get(), ...salary?.get() });
  } catch (err) {
    console.error(err);
    return done(err, null);
  }
});

//** API ROUTES */

// HOME PAGE
app.get("/", (_req, res) => {
  res.render("home");
});

// LOGIN PAGE
app.get("/login", (_req, res) => {
  res.render("login");
});

// SIGNUP PAGE
app.get("/signup", (_req, res) => {
  res.render("signup");
});

// REPORT PAGE
app.get("/report", (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect("/login");
  }

  res.render("report", { employee: req.user });
});

// SALARY DETAILS
app.get("/salary/:employee_id", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.redirect("/login");
  }

  const { employee_id } = req.params;
  const employee = await EmployeeDetails.findOne({
    where: { employee_id },
  });
  const salary = await EmployeeSalary.findOne({ where: { employee_id } });

  const data = { ...employee.get(), ...salary.get() };
  data.total_annual_salary =
    Number(data.monthly_salary) * 12 + Number(data.yearly_bonus);

  delete data.password;
  delete data.createdAt;
  delete data.updatedAt;

  data.date_of_birth = new Date(data.date_of_birth).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return res.status(200).json(data);
});

app.post("/salary", async (req, res) => {
  await EmployeeSalary.create({
    ...req.body,
    employee_id: req.user.employee_id,
  });

  res.redirect("/report");
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

// SIGNUP HANDLER
app.post(
  "/signup",
  passport.authenticate("local-signup", {
    successRedirect: "/report",
    failureRedirect: "/signup",
  })
);

// LOGIN HANDLER
app.post(
  "/login",
  passport.authenticate("local-signin", {
    successRedirect: "/report",
    failureRedirect: "/login",
  })
);

// MAIN
async function main() {
  await sequelize.sync();

  app.listen(3000, function () {
    console.log("Server started on port 3000");
  });
}

module.exports = main;
