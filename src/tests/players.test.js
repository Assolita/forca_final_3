const request = require("supertest");
const { app } = require("../server");
const { models } = require("../models");
const bcrypt = require("bcrypt");

jest.mock("bcrypt");

describe("Players API", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("POST /players - cadastra usuário", async () => {
        bcrypt.hash.mockResolvedValue("senha_fake");

        models.Player.create.mockResolvedValue({
            id: 10,
            nome: "matheus",
            email: "m@m.com",
            senha_hash: "senha_fake"
        });

        const res = await request(app)
            .post("/players")
            .send({
                username: "matheus",
                email: "m@m.com",
                password: "123"
            });

        expect(res.status).toBe(201);
        expect(res.body).toEqual({
            id: 10,
            username: "matheus",
            email: "m@m.com"
        });

        expect(models.Player.create).toHaveBeenCalledTimes(1);
    });

    test("POST /players – erro se faltar dados", async () => {
        const res = await request(app)
            .post("/players")
            .send({
                username: "matheus"
            });

        expect(res.status).toBe(400);
    });

    test("POST /players/login – login válido", async () => {
        models.Player.findOne.mockResolvedValue({
            id: 10,
            nome: "matheus",
            email: "m@m.com",
            senha_hash: "hashed"
        });

        bcrypt.compare = jest.fn().mockResolvedValue(true);

        const res = await request(app)
            .post("/players/login")
            .send({
                email: "m@m.com",
                password: "123"
            });

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(10);
    });

});
