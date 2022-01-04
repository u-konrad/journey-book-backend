const express = require("express");
const mongoose = require("mongoose");
const ExpressError = require("./utils/ExpressError");
const path = require("path");
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet')

const userRoutes = require("./routes/user-routes");
const itemRoutes = require("./routes/item-routes");
const favRoutes = require("./routes/fav-routes");

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.hxn4x.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .catch((err) => {
    console.log(err);
  });

const db = mongoose.connection;
// db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected");
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(mongoSanitize());
app.use(helmet())


app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PATCH, POST, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

app.use("/users", userRoutes);
app.use("/items", itemRoutes);
app.use("/favorites", favRoutes);

app.all("*", (req, res, next) => {
  console.log('error')
  next(new ExpressError("Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Unknown error";
  res.status(statusCode).json({ error: err.message });
});

app.listen(process.env.PORT ||3001, () => {
  console.log("Serving on heroku");
});


process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION!');
  process.exit(1);
});
