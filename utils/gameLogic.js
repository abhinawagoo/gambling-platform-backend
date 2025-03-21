// utils/gameLogic.js
const { v4: uuidv4 } = require("uuid");

/**
 * Casino game implementations with odds and logic
 */
const games = {
  // Coin Flip game (50% chance)
  coinFlip: {
    process: (betDetails, amount) => {
      const possibleOutcomes = ["heads", "tails"];
      const result =
        possibleOutcomes[Math.floor(Math.random() * possibleOutcomes.length)];
      const userChoice = betDetails.choice;

      const won = result === userChoice;
      const multiplier = 1.95; // 1.95x payout for 50% odds (accounting for house edge)
      const payout = won ? amount * multiplier : 0;

      return {
        outcome: result,
        payout: parseFloat(payout.toFixed(2)),
        won,
      };
    },
    validate: (betDetails) => {
      if (
        !betDetails.choice ||
        !["heads", "tails"].includes(betDetails.choice)
      ) {
        throw new Error(
          'Invalid choice for coin flip. Must be "heads" or "tails"'
        );
      }
      return true;
    },
  },

  // Dice Roll game
  diceRoll: {
    process: (betDetails, amount) => {
      // Roll a dice (1-6)
      const result = Math.floor(Math.random() * 6) + 1;

      let payout = 0;
      let won = false;

      // Different bet types
      switch (betDetails.type) {
        case "exact": // Bet on exact number
          won = result === betDetails.number;
          payout = won ? amount * 5.85 : 0; // 5.85x for exact number (1/6 odds with house edge)
          break;
        case "high": // Bet on high numbers (4,5,6)
          won = result >= 4;
          payout = won ? amount * 1.95 : 0; // 1.95x for high/low (3/6 odds with house edge)
          break;
        case "low": // Bet on low numbers (1,2,3)
          won = result <= 3;
          payout = won ? amount * 1.95 : 0; // 1.95x for high/low (3/6 odds with house edge)
          break;
        default:
          throw new Error("Invalid bet type for dice roll");
      }

      return {
        outcome: `Rolled ${result}`,
        payout: parseFloat(payout.toFixed(2)),
        won,
        resultValue: result,
      };
    },
    validate: (betDetails) => {
      if (
        !betDetails.type ||
        !["exact", "high", "low"].includes(betDetails.type)
      ) {
        throw new Error(
          'Invalid bet type for dice roll. Must be "exact", "high", or "low"'
        );
      }

      if (betDetails.type === "exact") {
        if (
          !betDetails.number ||
          betDetails.number < 1 ||
          betDetails.number > 6 ||
          !Number.isInteger(betDetails.number)
        ) {
          throw new Error(
            "For exact dice bets, provide a valid number from 1 to 6"
          );
        }
      }

      return true;
    },
  },

  // Roulette game
  roulette: {
    process: (betDetails, amount) => {
      // European roulette: Numbers 0-36
      const result = Math.floor(Math.random() * 37);
      const isRed = [
        1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
      ].includes(result);
      const isBlack = result !== 0 && !isRed;
      const isEven = result !== 0 && result % 2 === 0;
      const isOdd = result !== 0 && result % 2 !== 0;
      const isLow = result >= 1 && result <= 18;
      const isHigh = result >= 19 && result <= 36;

      let payout = 0;
      let won = false;

      switch (betDetails.type) {
        case "straight": // Single number
          won = result === betDetails.number;
          payout = won ? amount * 35 : 0;
          break;
        case "red":
          won = isRed;
          payout = won ? amount * 1.95 : 0;
          break;
        case "black":
          won = isBlack;
          payout = won ? amount * 1.95 : 0;
          break;
        case "even":
          won = isEven;
          payout = won ? amount * 1.95 : 0;
          break;
        case "odd":
          won = isOdd;
          payout = won ? amount * 1.95 : 0;
          break;
        case "low":
          won = isLow;
          payout = won ? amount * 1.95 : 0;
          break;
        case "high":
          won = isHigh;
          payout = won ? amount * 1.95 : 0;
          break;
        default:
          throw new Error("Invalid bet type for roulette");
      }

      // Build outcome string
      let outcomeStr = `Landed on ${result}`;
      if (result !== 0) {
        outcomeStr += isRed ? " (Red)" : " (Black)";
      } else {
        outcomeStr += " (Green)";
      }

      return {
        outcome: outcomeStr,
        payout: parseFloat(payout.toFixed(2)),
        won,
        resultValue: result,
        resultColor: result === 0 ? "green" : isRed ? "red" : "black",
      };
    },
    validate: (betDetails) => {
      if (
        !betDetails.type ||
        !["straight", "red", "black", "even", "odd", "low", "high"].includes(
          betDetails.type
        )
      ) {
        throw new Error("Invalid bet type for roulette");
      }

      if (betDetails.type === "straight") {
        if (
          !Number.isInteger(betDetails.number) ||
          betDetails.number < 0 ||
          betDetails.number > 36
        ) {
          throw new Error(
            "For straight bets, provide a valid number from 0 to 36"
          );
        }
      }

      return true;
    },
  },

  // Slot machine game
  slots: {
    process: (betDetails, amount) => {
      const symbols = ["🍒", "🍋", "🍊", "🍇", "💎", "7️⃣"];
      const weights = [45, 35, 25, 15, 5, 3]; // Different probabilities for each symbol

      // Total weight
      const totalWeight = weights.reduce((a, b) => a + b, 0);

      // Function to select weighted random symbol
      const selectSymbol = () => {
        const randNum = Math.random() * totalWeight;
        let weightSum = 0;

        for (let i = 0; i < symbols.length; i++) {
          weightSum += weights[i];
          if (randNum <= weightSum) {
            return symbols[i];
          }
        }
        return symbols[0]; // Fallback
      };

      // Generate three random symbols
      const reels = [selectSymbol(), selectSymbol(), selectSymbol()];

      // Check for wins
      let payout = 0;
      let won = false;

      // All three same (jackpot)
      if (reels[0] === reels[1] && reels[1] === reels[2]) {
        won = true;

        // Different multipliers based on symbol
        switch (reels[0]) {
          case "🍒":
            payout = amount * 5;
            break;
          case "🍋":
            payout = amount * 10;
            break;
          case "🍊":
            payout = amount * 15;
            break;
          case "🍇":
            payout = amount * 25;
            break;
          case "💎":
            payout = amount * 50;
            break;
          case "7️⃣":
            payout = amount * 100;
            break;
        }
      }
      // Two same adjacent symbols
      else if (reels[0] === reels[1] || reels[1] === reels[2]) {
        won = true;
        payout = amount * 1.5;
      }

      return {
        outcome: reels.join(" "),
        payout: parseFloat(payout.toFixed(2)),
        won,
        reels,
      };
    },
    validate: (betDetails) => {
      // No specific validation needed for slots
      return true;
    },
  },
};

// Process a game bet
exports.processBet = (gameType, betDetails, amount) => {
  if (!games[gameType]) {
    throw new Error(`Unknown game type: ${gameType}`);
  }

  // Validate bet details
  games[gameType].validate(betDetails);

  // Process the game
  return {
    id: uuidv4(),
    ...games[gameType].process(betDetails, amount),
  };
};

// Get available games
exports.getAvailableGames = () => {
  return Object.keys(games).map((key) => ({
    id: key,
    name:
      key.charAt(0).toUpperCase() +
      key
        .slice(1)
        .replace(/([A-Z])/g, " $1")
        .trim(),
  }));
};
