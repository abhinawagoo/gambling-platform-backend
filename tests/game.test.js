const { selectWinningColor } = require("../controllers/gameController");

describe("Game Logic Tests", () => {
  test("Random Color Selection", async () => {
    const winningColor = await selectWinningColor();
    expect(["Red", "Green", "Blue"]).toContain(winningColor);
  });
});
