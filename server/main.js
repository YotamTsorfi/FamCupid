const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
require("dotenv").config();
const passport = require("passport");
require("./config/passport-setup");
const morgan = require("morgan");
const winston = require("winston");
const cookieParser = require("cookie-parser");
const socketController = require("./controllers/socketController");

//Routers
const userRouter = require("./routers/userRouter");
const authRouter = require("./routers/authRouter");
const userImageRouter = require("./routers/userImageRouter");

const app = express();

app.use(cookieParser());
//app.use(morgan("combined"));
const port = process.env.PORT || 3001;
connectDB();
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.GOOGLE_CLIENT_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, "../client/dist")));
app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/user-images", userImageRouter);
const http = require("http").createServer(app);
socketController(http);

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: "/logs/error.log",
      level: "error",
    }),
    new winston.transports.File({ filename: "/logs/combined.log" }),
  ],
});

// None production - log to the console
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

http.listen(port, () => {
  console.log(`App is listening at http://localhost:${port}`);
});
