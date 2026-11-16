import express  from "express";
import cors from "cors";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import clinicRoutes from "./routes/clinic.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import notificationRoutes from "./routes/notifications.routes.js";
import cookieParser from "cookie-parser";
const app = express();
const allowedOrigins = new Set(
    (
        process.env.FRONTEND_ORIGINS
        || "https://mern-stack-hackathon-7xqr.vercel.app"
    )
        .split(",")
        .map((origin) => origin.trim().replace(/\/+$/, ""))
        .filter(Boolean)
);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api", clinicRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/notifications", notificationRoutes);

const frontendBuildPath = fileURLToPath(new URL("../../../frontend/dist/", import.meta.url));
app.use(express.static(frontendBuildPath));
app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith("/api/") || !req.accepts("html")) {
        return next();
    }
    return res.sendFile(fileURLToPath(new URL("../../../frontend/dist/index.html", import.meta.url)));
});

export default app;