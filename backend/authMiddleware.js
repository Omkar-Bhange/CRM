const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

async function authenticateUser(req, res, next) {
try {
const authHeader = req.headers.authorization;


if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return res.status(401).json({
    success: false,
    message: "Authentication required.",
  });
}

const token = authHeader.split(" ")[1];

const decoded = jwt.verify(token, process.env.JWT_SECRET);

// Get the User model only after auth.js has registered it
const User = mongoose.models.User;

if (!User) {
  return res.status(500).json({
    success: false,
    message: "User model not initialized.",
  });
}

const user = await User.findById(decoded.userId);

if (!user) {
  return res.status(401).json({
    success: false,
    message: "User not found.",
  });
}

req.user = user;
next();


} catch (err) {
return res.status(401).json({
success: false,
message: "Invalid or expired token.",
});
}
}

module.exports = authenticateUser;
