import cookieParser from "cookie-parser";
import cors from "cors";  // ✅ Corrected
import express from "express";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true   // ✅ Fixed property name
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes import
import userRouter from "./routes/user.router.js";
console.log("router is initilaized")
// Initialize userRouter
app.use("/api/v1/users", userRouter);  // ✅ Added leading slash
console.log("request is send to userRouter");

export { app };
