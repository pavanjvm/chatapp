const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please enter all required details.");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists.");
  }

  const user = await User.create({ name, email, password, pic });

  if (user) {
    console.log(`✅ New user registered: ${user._id}`);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: generateToken(user._id), // Ensure this gets a valid _id
    });
  } else {
    res.status(400);
    throw new Error("Failed to create user!");
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    const token = generateToken(user._id);
    console.log("✅ Generated Token:", token); // Debugging

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password.");
  }
});

// @desc    Get all users (excluding logged-in user)
// @route   GET /api/users?search=<query>
// @access  Private
const allUser = asyncHandler(async (req, res) => {
  const searchRegex = new RegExp(req.query.search, "i");

  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
        ],
      }
    : {};

  try {
    // Exclude the logged-in user from the results
    const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
    res.json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500);
    throw new Error("Failed to fetch users.");
  }
});

module.exports = { registerUser, authUser, allUser };
