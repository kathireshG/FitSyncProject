const http = require("http");
const mongoose = require("mongoose");
const app = require("./app");
const env = require("./config/env");
const connectDatabase = require("./config/database");

async function start() {
  try {
    await connectDatabase();
    const server = http.createServer(app);
    server.listen(env.port, env.host, () => {
      console.log(`FitSync API listening on ${env.host}:${env.port}`);
    });

    async function shutdown(signal) {
      console.log(`${signal} received. Shutting down.`);
      server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
      });
    }

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Unable to start FitSync API:", error.message);
    process.exit(1);
  }
}

start();
