const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { clientUrl, nodeEnv } = require("./config/env");
const { UPLOAD_DIR } = require("./middleware/upload");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); // allow the React app to load photos
app.use(cors({ origin: clientUrl }));
app.use(express.json());
if (nodeEnv !== "test") app.use(morgan("dev")); // request logging (replaces CloudWatch)

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/ngos", require("./routes/ngoRoutes"));
app.use("/api/donations", require("./routes/donationRoutes"));
app.use("/api/food-requests", require("./routes/foodRequestRoutes"));
app.use("/uploads", express.static(UPLOAD_DIR));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
