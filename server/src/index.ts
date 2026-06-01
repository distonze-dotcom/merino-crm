import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import customersRoutes from "./modules/customers/customers.routes";
import visitsRoutes from "./modules/visits/visits.routes";
import quotationsRoutes from "./modules/quotations/quotations.routes";
import productsRoutes from "./modules/products/products.routes";
import alertsRoutes from "./modules/alerts/alerts.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import preseaRoutes from "./modules/presea/presea.routes";

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : ["http://localhost:5173", "http://localhost:5174"];

// Always allow the known production client
const productionOrigins = [
  "https://merino-crm-client.vercel.app",
  "https://merino-comerciales.vercel.app",
];
const allOrigins = [...new Set([...allowedOrigins, ...productionOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/visits", visitsRoutes);
app.use("/api/quotations", quotationsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/presea", preseaRoutes);

app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🎨 Merino CRM Server running on http://localhost:${PORT}`);
});
