import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";

import User from "../models/userModel.js";

// * user registration

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const exisitingUser = await User.findOne({ email: email });

  if (exisitingUser)
    return res.status(400).json({ message: "user already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  res.status(201).json({
    message: "user created successfully",
    createdUser: {
      _id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    },
  });
});

// * user login

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const exisitingUser = await User.findOne({ email: email });

  if (!exisitingUser)
    return res.status(401).json({ message: "User doesn't exist." });

  const isPasswordMatched = await bcrypt.compare(
    password,
    exisitingUser.password,
  );
  if (!isPasswordMatched)
    return res.status(401).json({ message: "Invalid email or password" });

  const token = await jwt.sign(
    { id: exisitingUser._id },
    process.env.JWT_TOKEN,
    { expiresIn: "5h" },
  );

  res.cookie("token", token, {
    httpOnly: true,
    maxAge: 5 * 60 * 60 * 1000,
    sameSite: "none",
    secure: true,
  });

  res.status(200).json({
    message: "Logged in successfully",

    user: {
      id: exisitingUser.id,
      name: exisitingUser.name,
      email: exisitingUser.email,
    },
  });
});

// * get user profile

export const getProfile = asyncHandler(async (req, res) => {
  const getUserProfile = await User.findById(req.user.id).select("-password");

  if (!getUserProfile) {
    return res.status(400).json({ message: "User not found" });
  }
  res.status(200).json(getUserProfile);
});

// * user logout
export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });

  res.status(200).json({ message: "Successfully logged out." });
});
