const request = require("supertest");
const app = require("../server");

describe("UPI Payment Tests", () => {
  let userToken;

  beforeAll(async () => {
    const res = await request(app).post("/api/login").send({
      username: "testuser",
      password: "testpass",
    });
    userToken = res.body.token;
  });

  test("Deposit Coins", async () => {
    const res = await request(app)
      .post("/api/deposit")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ userId: 1, amount: 500 });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Deposit successful!");
  });

  test("Withdraw Coins", async () => {
    const res = await request(app)
      .post("/api/withdraw")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ userId: 1, amount: 200 });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Withdrawal request processed!");
  });

  test("Withdraw with Insufficient Balance", async () => {
    const res = await request(app)
      .post("/api/withdraw")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ userId: 1, amount: 100000 });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Insufficient balance");
  });
});
