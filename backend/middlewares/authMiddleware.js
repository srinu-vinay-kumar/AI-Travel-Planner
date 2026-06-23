import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";

import User from "../models/userModel.js";

export const protectedRoute = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res
      .status(400)
      .json({ message: "Not authorized and token not found." });
  }

  const decode = await jwt.verify(token, process.env.JWT_TOKEN);
  console.log("decode: ", decode);
  req.user = decode;
  console.log("req.user: ", req.user.id);

  next();
});
