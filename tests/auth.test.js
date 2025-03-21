const request = require("supertest");
const app = require("../server");

describe("Authentication Tests", () => {
  let token;

  test("User Registration", async () => {
    const res = await request(app).post("/api/register").send({
      username: "testuser",
      password: "testpass",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User registered successfully!");
  });

  test("User Login", async () => {
    const res = await request(app).post("/api/login").send({
      username: "testuser",
      password: "testpass",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  test("Access Protected Route with Token", async () => {
    const res = await request(app)
      .get("/api/protected-route")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });
});
