import express, { Request, Response, NextFunction } from "express";
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

// ── CORS manual — must be first, before any route ──────────────────────────
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin ?? "";
  if (
    origin.endsWith(".vercel.app") ||
    origin.startsWith("http://localhost")
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization"
    );
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

app.use(express.json());

// ── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/users",       usersRoutes);
app.use("/api/customers",   customersRoutes);
app.use("/api/visits",      visitsRoutes);
app.use("/api/quotations",  quotationsRoutes);
app.use("/api/products",    productsRoutes);
app.use("/api/alerts",      alertsRoutes);
app.use("/api/dashboard",   dashboardRoutes);
app.use("/api/presea",      preseaRoutes);

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() })
);

app.use(errorHandler);

// ── Local dev server ─────────────────────────────────────────────────────────
// Vercel uses the exported `app` directly — do NOT call listen() there.
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () =>
    console.log(`🎨 Merino CRM Server → http://localhost:${PORT}`)
  );
}

export default app;
