const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  if (!id) {
    console.error("❌ generateToken Error: User ID is undefined!");
    return null;
  }
  console.log(`✅ Generating Token for User ID: ${id}`);

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = generateToken;
