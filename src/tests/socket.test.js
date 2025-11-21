import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createServer } from "http";
import { io as Client } from "socket.io-client";

// Carrega .env.test
import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });
process.env.NODE_ENV = "test";

// IMPORTA O socket real (gameSocket.js)
import gameSocket from "../socket/gameSocket.js";

// Mock dos models
vi.mock("../models", () => ({
  sequelize: { authenticate: vi.fn() },
  models: {
    Player: {
      findByPk: vi.fn().mockResolvedValue({
        id: 1,
        vitorias: 0,
        increment: vi.fn()
      })
    },
    Word: { findAll: vi.fn() }
  }
}));

// Mock do wordService
vi.mock("../services/wordService", () => ({
  getRandomWord: vi.fn().mockResolvedValue({
    id: 99,
    palavra: "TESTE",
    dica: "Dica",
    categoriaId: 1
  })
}));

// Espera um evento específico
function waitForEvent(client, eventName, predicate = () => true, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      client.off(eventName, handler);
      reject(new Error(`timeout esperando evento ${eventName}`));
    }, timeout);

    function handler(payload) {
      try {
        if (predicate(payload)) {
          clearTimeout(timer);
          client.off(eventName, handler);
          resolve(payload);
        }
      } catch (err) {
        clearTimeout(timer);
        client.off(eventName, handler);
        reject(err);
      }
    }

    client.on(eventName, handler);
  });
}

// ----------------------
// CONFIGURAÇÃO DO SERVER
// ----------------------
let httpServer;
let io;
let port;

beforeAll(async () => {
  httpServer = createServer();
  const { Server } = await import("socket.io");
  io = new Server(httpServer, { cors: { origin: "*" } });

  // Inicia seu socket
  gameSocket(io);

  await new Promise((resolve) => {
    httpServer.listen(() => {
      port = httpServer.address().port;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise((r) => setTimeout(r, 50));
  io.close();
  httpServer.close();
});

// Helper para criar dois clientes limpos por teste
async function withTwoClients(fn) {
  const url = `http://localhost:${port}`;
  const client1 = Client(url);
  const client2 = Client(url);

  await Promise.all([
    new Promise((res) => client1.on("connect", res)),
    new Promise((res) => client2.on("connect", res))
  ]);

  try {
    return await fn(client1, client2);
  } finally {
    client1.disconnect();
    client2.disconnect();
    await new Promise((r) => setTimeout(r, 20));
  }
}

function newRoomId() {
  return `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

// ----------------------
//      TESTES
// ----------------------

describe("WebSocket - Integração completa", () => {

  it("dois jogadores recebem 'preparacao'", async () => {
    const roomId = newRoomId();

    await withTwoClients(async (c1, c2) => {
      const p1 = waitForEvent(c1, "preparacao", (p) => p?.tipo === "preparacao");
      const p2 = waitForEvent(c2, "preparacao", (p) => p?.tipo === "preparacao");

      c1.emit("joinRoom", { roomId, playerName: "A", playerId: "1", categoria: 1 });
      c2.emit("joinRoom", { roomId, playerName: "B", playerId: "2", categoria: 1 });

      const [r1, r2] = await Promise.all([p1, p2]);

      expect(r1.tipo).toBe("preparacao");
      expect(r2.tipo).toBe("preparacao");
    });
  });

  it("jogadores enviam 'pronto' e recebem 'inicio'", async () => {
    const roomId = newRoomId();

    await withTwoClients(async (c1, c2) => {
      // aguarda preparação
      await Promise.all([
        waitForEvent(c1, "preparacao", (p) => p?.tipo === "preparacao"),
        waitForEvent(c2, "preparacao", (p) => p?.tipo === "preparacao")
      ]);

      // listeners para inicio
      const p1 = waitForEvent(c1, "inicio", (p) => p?.tipo === "inicio");
      const p2 = waitForEvent(c2, "inicio", (p) => p?.tipo === "inicio");

      c1.emit("eventoJogo", { tipo: "pronto" });
      c2.emit("eventoJogo", { tipo: "pronto" });

      const [i1, i2] = await Promise.all([p1, p2]);

      expect(i1.tipo).toBe("inicio");
      expect(i2.tipo).toBe("inicio");
      expect(i1.turno).toBeDefined();
      expect(i1.palavraSecreta).toBeDefined();
    });
  });

  it("jogada válida envia 'jogada' para ambos", async () => {
    const roomId = newRoomId();

    await withTwoClients(async (c1, c2) => {

      // preparação
      await Promise.all([
        waitForEvent(c1, "preparacao", (p) => p?.tipo === "preparacao"),
        waitForEvent(c2, "preparacao", (p) => p?.tipo === "preparacao")
      ]);

      // início
      c1.emit("eventoJogo", { tipo: "pronto" });
      c2.emit("eventoJogo", { tipo: "pronto" });

      await Promise.all([
        waitForEvent(c1, "inicio", (p) => p?.tipo === "inicio"),
        waitForEvent(c2, "inicio", (p) => p?.tipo === "inicio")
      ]);

      // jogada
      const p1 = waitForEvent(c1, "jogada", (p) => p?.tipo === "jogada");
      const p2 = waitForEvent(c2, "jogada", (p) => p?.tipo === "jogada");

      c1.emit("eventoJogo", { tipo: "jogada", letra: "A" });

      const [j1, j2] = await Promise.all([p1, p2]);

      expect(j1.tipo).toBe("jogada");
      expect(j2.tipo).toBe("jogada");
    });
  });

  it("usar poder gera 'poderUsado'", async () => {
    const roomId = newRoomId();

    await withTwoClients(async (c1, c2) => {

      await Promise.all([
        waitForEvent(c1, "preparacao", (p) => p?.tipo === "preparacao"),
        waitForEvent(c2, "preparacao", (p) => p?.tipo === "preparacao")
      ]);

      c1.emit("eventoJogo", { tipo: "pronto" });
      c2.emit("eventoJogo", { tipo: "pronto" });

      await Promise.all([
        waitForEvent(c1, "inicio", (p) => p?.tipo === "inicio"),
        waitForEvent(c2, "inicio", (p) => p?.tipo === "inicio")
      ]);

      const p = waitForEvent(c1, "poderUsado", (p) => p?.tipo === "poderUsado");

      c1.emit("eventoJogo", { tipo: "usarPoder", poder: "vida_extra" });

      const result = await p;

      expect(result.tipo).toBe("poderUsado");
    });
  });

  it("tempoEsgotado gera 'turnoTrocado'", async () => {
    const roomId = newRoomId();

    await withTwoClients(async (c1, c2) => {

      await Promise.all([
        waitForEvent(c1, "preparacao", (p) => p?.tipo === "preparacao"),
        waitForEvent(c2, "preparacao", (p) => p?.tipo === "preparacao")
      ]);

      c1.emit("eventoJogo", { tipo: "pronto" });
      c2.emit("eventoJogo", { tipo: "pronto" });

      await Promise.all([
        waitForEvent(c1, "inicio", (p) => p?.tipo === "inicio"),
        waitForEvent(c2, "inicio", (p) => p?.tipo === "inicio")
      ]);

      const p = waitForEvent(c1, "turnoTrocado", (p) => p?.tipo === "turnoTrocado");

      c1.emit("eventoJogo", { tipo: "tempoEsgotado" });

      const result = await p;

      expect(result.tipo).toBe("turnoTrocado");
    });
  });

});
