const request = require("supertest");
const { app } = require("../server");
const { models } = require("../models");

describe("Words API", () => {

    test("GET /words/:categoryId", async () => {
        models.Word.findAll.mockResolvedValue([
            { id: 1, palavra: "Cachorro" }
        ]);

        const res = await request(app).get("/words/1");

        expect(res.status).toBe(200);
        expect(res.body[0].palavra).toBe("Cachorro");
    });

});
