const request = require("supertest");
const app = require("../server");

describe("Betting Tests", () => {
  let userToken;

  beforeAll(async () => {
    const res = await request(app).post("/api/login").send({
      username: "testuser",
      password: "testpass",
    });
    userToken = res.body.token;
  });

  test("Place a Bet", async () => {
    const res = await request(app)
      .post("/api/bet")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ userId: 1, amount: 100, color: "Red" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Bet placed successfully!");
  });

  test("Bet with Insufficient Balance", async () => {
    const res = await request(app)
      .post("/api/bet")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ userId: 1, amount: 100000, color: "Blue" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Insufficient balance");
  });
});
