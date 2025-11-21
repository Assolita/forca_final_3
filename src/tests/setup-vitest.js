// src/tests/setup-vitest.js
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

// garante que timers funcionem corretamente
process.env.NODE_ENV = "test";
