import postgres from "postgres";

const adminUrl = process.env.DATABASE_URL!;
const url = new URL(adminUrl);
const dbName = url.pathname.slice(1); // "chat_assistant"
const dbUser = url.username; // "chat_user"
url.pathname = "/postgres";
const baseUrl = url.toString();

async function reset() {
  // Connect to 'postgres' DB to drop/create the target DB
  const admin = postgres(baseUrl, { max: 1 });

  console.log(`Dropping database "${dbName}"...`);
  await admin.unsafe(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
  console.log(`Creating database "${dbName}"...`);
  await admin.unsafe(`CREATE DATABASE "${dbName}" OWNER "${dbUser}"`);
  await admin.end();

  console.log("✓ Database recreated\n");
}

reset().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
