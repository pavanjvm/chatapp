const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded.id) {
        console.error("JWT Verification Error: No user ID in token!");
        throw new Error("Not Authorized, Invalid Token!");
      }

      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        console.error("JWT Verification Error: User not found in database!");
        throw new Error("Not Authorized, User Not Found!");
      }

      next();
    } catch (error) {
      console.error(`JWT Verification Error: ${error.message}`);
      res.status(401);
      throw new Error("Not Authorized, Invalid Token!");
    }
  }

  if (!token) {
    console.error("JWT Error: No token provided!");
    res.status(401);
    throw new Error("Not Authorized, No Token!");
  }
});

module.exports = { protect };
