import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";
import { prisma } from "./shared/prisma/client.js";

async function main() {
  const env = getEnv();

  await prisma.$connect();

  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`SovereignID API running on port ${env.PORT}`);
    console.log("Database connected ✓");
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
