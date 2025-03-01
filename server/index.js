const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors"); 

// Load environment variables FIRST
dotenv.config({ path: ".env" });

if (!process.env.MONGO_URI) {
  console.error("Error: MONGO_URI is not defined. Check your .env file!");
  process.exit(1); // Stop the server if .env is not loaded properly
}

connectDB(); 

const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*", // Allow requests from any origin
    methods: "GET, POST, PUT, DELETE, OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
    credentials: true, // Enable if you use cookies
  })
);

app.get("/", (req, res) => {
  res.send("API is Called!!");
});

// Routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use(notFound);
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on PORT ${PORT}!!`);
});

// WebSocket (Socket.io)
