process.env.NODE_ENV = "test";
require("dotenv").config({ path: ".env.test" });


jest.mock("../models", () => ({
  sequelize: {
    authenticate: jest.fn(), // impede o sequelize de conectar no banco REAL
  },

  models: {
    Player: {
      create: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
    },

    Category: {
      findAll: jest.fn(),
    },

    Word: {
      findAll: jest.fn(),
    },

    GameM: {
      create: jest.fn(),
      findOne: jest.fn(),
    },

    Result: {
      create: jest.fn(),
      findAll: jest.fn(),
    },

    Sala: {
      create: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    }
  }
}));
