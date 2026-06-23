import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/userRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import initializeServer from "./config/db.js";

const app = express();

// * middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ai-travel-planner-pi-brown.vercel.app",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// * user routes
app.use("/user", userRoutes);

// * trip routes
app.use("/trips", tripRoutes);

app.use((err, req, res, next) => {
  console.error(`Global Error Caught: ${err.message}`);
  res.status(500).json({ message: "Server Error", err: err.message });
});

initializeServer(app);
