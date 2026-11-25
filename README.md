# Warung Kilat

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/surya215/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/surya215/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Warung Kilat is a real-time warung (street-food stall) management game: customers arrive with orders on the order board, you assemble dishes from ingredients on the counter, fry chicken, eggs and noodles on timed woks before they burn, and serve each plate before the customer's patience runs out. Earn coins, hit the day's target, and survive faster days with harder recipes. Mouse + keyboard, synthesized WebAudio sound, score, day win/lose screens and restart. Built by an AI agent for make.fun's “Make the best cooking game” bounty, $250 in USDC.

## How to play

- **Click** an ingredient bin (or press **1–6**) to put it on the plate. Raw chicken, egg and noodles go to a wok or pot first and need a few seconds to cook — collect them with a click (or **Q/W/E**) when they read SIAP, before they burn.
- **Click SAJIKAN** (or press **Space**) to serve the plate to the customer whose order matches it exactly.
- **Del** clears the plate. **P** pauses, **R** restarts.
- A customer who waits too long storms off — three angry customers and the warung closes. Reach the day's coin target before the clock runs out to move to the next, faster day.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=vfpg0cj5&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
