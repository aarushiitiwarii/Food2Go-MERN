const app = require("./app");
const { port } = require("./config/env");
const { connectDB } = require("./config/db");
const { seedNgos } = require("./seed/ngos");

async function start() {
  await connectDB();
  await seedNgos();
  app.listen(port, () => console.log(`Food2Go API running on http://localhost:${port}`));
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
