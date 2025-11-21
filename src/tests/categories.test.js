const request = require("supertest");
const { app } = require("../server");
const { models } = require("../models");

describe("Categories API", () => {

    test("GET /categories – retorna lista", async () => {
        models.Category.findAll.mockResolvedValue([
            { id: 1, nome: "Animais" },
            { id: 2, nome: "Objetos" }
        ]);

        const res = await request(app).get("/categories");

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(2);
        expect(models.Category.findAll).toHaveBeenCalled();
    });

});
