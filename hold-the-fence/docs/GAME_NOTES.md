# Hold the Fence — Game Notes & Change Log

**Last updated:** 2026-11-13 (Build 5)
**Platform:** 2D mobile game, portrait mode (prototype runs in the browser)
**Play link:** the "Hold the Fence" artifact (same link for every build)

---

## 1. Concept

A boy defends his home from zombies in a zombie-apocalypse world. Zombies come from every edge of the screen and swarm the house and the boy. The boy fights them off with an axe. The game is wave-based, with an upgrade pick between waves.

The electric fence that gave the game its name was removed in Build 4. The designer has later plans for it.

---

## 2. Art assets in use (all supplied by the designer)

| Asset | Layout | Used for |
|---|---|---|
| Boy – idle poses (no axe) | 2×2: back, right, front, left | Portrait on the title screen only |
| Boy – idle with axe | 8 frames × 4 directions | Standing still |
| Boy – walk with axe | 8 frames × 4 directions | Moving |
| Boy – axe attack | 8 frames × 4 directions (slash FX baked in) | Auto-attack swing |
| Zombie – walk | 8 frames × 4 directions | Moving |
| Zombie – attack | 8 frames × 4 directions | Attacking the boy or house |
| House | Single image: building on a stone tile pad | The house to defend |

**Sheet row order (all sheets):** row 1 = up/back, row 2 = right, row 3 = down/front, row 4 = left.

**Asset notes**
- The axe sheets and the zombie attack sheet had faint near-transparent noise across the background, which showed up as a red fringe. This is cleaned when the sheets are imported (alpha below 24 is removed). Worth fixing in the export.
- The first boy walk sheet (no axe) was retired when the axe arrived in Build 2.
- The first house image (no stone pad) was replaced in Build 3.

---

## 3. Controls

- **Mobile:** drag anywhere on screen to move (floating joystick).
- **Desktop:** WASD or the arrow keys.
- **Attacking is automatic:** the boy swings at the nearest zombie in reach.
- **Pause:** the pause button, or Esc / P. The game also pauses when the tab is hidden.
- **Sound:** the mute button. Sound effects are synthesized, with no audio files.

---

## 4. Core mechanics (current)

### Boy
- **HP:** 100. He is fully healed after each wave.
- **Move speed:** 150 px/s. This drops to 55% while he's mid-swing.
- **Where he can go:** anywhere on screen below the top bar. The house blocks him.
- **Animation states:** idle (looping), walk, and attack. The attack plays to the end of the swing.

### Axe (auto-attack)
- **When it fires:** a swing starts when a zombie is within reach and the cooldown is ready. The boy turns to face the target.
- **Reach:** 50 px, plus the zombie's body radius of 14 px.
- **Swing cone:** 120°. It hits every zombie in the cone.
- **Damage:** 3 per hit. It lands halfway through the swing, on the slash frames.
- **Cooldown:** 0.6 s between swings. The swing animation lasts up to 0.42 s.
- **Knockback:** 10 px.
- **Feedback:** a small screen shake, plus whoosh and chop sounds.

### Zombies
- **One type, one size.** Speed varies by ±15% per zombie so crowds don't move in lockstep.
- **Spawning:**
  - Zombies appear just off-screen: 38% from the top, 24% from the bottom, 19% from each side.
  - They arrive in groups, more often and in bigger groups in later waves.
- **Targeting:**
  - A zombie goes for the boy if he is within 190 px and not much farther away than the house (within the house distance + 60 px).
  - Otherwise it heads for the nearest point of the house.
- **Attack state:**
  - It starts attacking when it reaches its target: 28 px from the boy, or 18 px from the house wall.
  - It stops as soon as the target is 8 px beyond that range, then chases again.
  - It plays the attack sheet in a 0.9 s loop. Damage lands once per loop, on the claw frame.
- **Damage per swipe:**
  - To the boy: zombie DPS × 1.6 × 0.9.
  - To the house: zombie DPS × 0.7 × 0.9.
- **Death:** the zombie topples, fades out, and leaves a green splat on the ground.

### House
- **HP:** 500. The game is lost at 0.
- **Collider:** three boxes in the house image's source pixels (image is 1362×1651):
  - Roof block: x 108–1272, y 165–1085. It starts at y 165 so the boy can walk behind the top of the roof.
  - Lower walls / porch: x 228–1138, y 1085–1350.
  - Front steps: x 548–838, y 1350–1500.
- **The stone pad around the house is walkable.**
- **Draw order:** characters above the roof line are drawn behind the building. The building silhouette is redrawn over them, so the roof hides their feet.
- **Lantern:** it casts a flickering warm glow.

### Lose conditions
- The house reaches 0 HP: "The dead got inside the house."
- The boy reaches 0 HP: "They caught you in the yard."

### Waves (n = wave number)

| Value | Formula | Wave 1 | Wave 5 | Wave 10 |
|---|---|---|---|---|
| Zombie count | 5 + 3n | 8 | 20 | 35 |
| Zombie HP | 3 + floor(0.9n) | 3 | 7 | 12 |
| Zombie speed (px/s) | 24 + 1.2n (±15%) | 25.2 | 30 | 36 |
| Zombie DPS | 5 + 0.6n | 5.6 | 8 | 11 |
| Spawn gap (s) | max(0.3, 1.5 − 0.09n) | 1.41 | 1.05 | 0.6 |

A wave is cleared when every zombie has spawned and none are left alive. The best wave reached is saved on the player's device.

---

## 5. Upgrades (offered 3 at random after each wave, pick 1)

These values are placeholder first-pass values chosen by Claude. They have not been balance-tested. The CSV `hold_the_fence_upgrades.csv` was sent to the designer for approval and is pending.

| ID | Name | Effect | Base | Per level | Max levels | At max |
|---|---|---|---|---|---|---|
| rate | Quick Swing | Swing cooldown ×0.82 | 0.60 s | 18% faster | 4 | 0.27 s |
| dmg | Sharpened Edge | Axe damage +1 | 3 | +1 | No cap | — |
| arc | Wide Arc | Swing cone wider | 120° | +~52° | 3 | ~275° |
| kb | Heavy Head | Knockback | 10 px | +8 px | 3 | 34 px |
| reach | Long Handle | Axe reach ×1.15 | 50 px | ×1.15 | 3 | ~76 px |
| boards | Board Up | Heal the house 40% of max | — | +200 HP | Repeatable | Capped at max |
| shoes | Sneakers | Move speed ×1.15 | 150 px/s | ×1.15 | 3 | ~228 px/s |

---

## 6. Screen & UI

- **Logical canvas:** 540×960 (9:16), scaled to fit the device.
- **HUD:** the wave number, Home HP bar, You HP bar, and the mute and pause buttons. A bar pulses red while it's taking damage.
- **Screens:** title (with the boy's portrait and a how-to-play list), "Wave X" banner, Scavenge upgrade picker, Pause, and Game Over (waves survived, kills, best).
- **Ground:** dark grass and rocks, a brown dirt patch where the fenced yard was, and stepping stones from the door. There's a night vignette over everything.

---

## 7. Open items / pending from the designer

- Approve or edit the upgrade values (CSV).
- Plans for the electric fence. The old fence code is kept in the file, unused.
- Bigger and unique zombie types (designer will supply assets).
- Untested: zombies breaking off their attack when the boy walks away.
- Known look: zombies attacking the upper sides of the house are partly hidden behind the roof eave.
- Decide whether to keep the dirt patch where the yard was.
- The game is still named "Hold the Fence".
- Not yet confirmed: the first build in Android Studio and play on a real phone.

---

## 8. Change log

### 2026-11-12 — Build 1 (first build)
- **Designer provided:** the boy's 4-direction walk sheet, the house image, and the zombie 4-direction walk sheet. Brief: a 2D portrait mobile game where the boy defends his home inside an electric-fence perimeter against zombie hordes.
- **Built:**
  - Top-down yard with the house in the center and an electric fence of 34 sections. Fence sections took damage, shocked zombies touching them, broke open, and could be repaired by standing next to them.
  - Slingshot auto-fire, waves, upgrade picks, and brute and runner zombie variants (scaled and tinted versions of the zombie sheet).
  - HUD, sound, and pause.

### 2026-11-12 — Build 2
- **Designer's changes:**
  1. The boy's animation should rest on an idle pose for whichever way he's facing (idle sheet provided).
  2. No projectiles. The boy attacks with an axe when zombies come close (axe idle, walk, and attack sheets provided).
- **Done:**
  - Added the axe idle, walk, and attack animation states.
  - Replaced the slingshot with an automatic melee axe in a cone, with knockback and screen shake.
  - Replaced the slingshot upgrades with the axe upgrades.
  - Used the static idle pose as the title-screen portrait.
  - Cleaned the background noise out of the new sheets.

### 2026-11-12 — Build 3
- **Designer's change:** swap in the new house image (with a stone tile pad) and fix the collider properly.
- **Done:**
  - New house art.
  - The single box collider was replaced with three boxes (roof, lower walls/porch, steps).
  - The pad is walkable.
  - Silhouette-based draw order so characters can stand behind the house.
  - The lantern glow was moved to the new lantern.

### 2026-11-13 — Build 4
- **Designer's changes:**
  1. Remove the electric fence (plans for it later).
  2. Don't spawn zombies at bigger sizes (bigger, unique zombie assets coming later).
  3. Fix the collider at the top of the house so the player can go behind it.
- **Done:**
  - Removed the fence visuals, shocks, repairs, the fence HUD bar, and the fence upgrades.
  - Zombies now head straight for the house or the boy.
  - Removed the brute and runner variants.
  - The roof collider now starts at y 165 instead of y 70.
  - The boy can now move across the whole screen.
  - Rebalanced the house: HP from 300 to 500, and zombie damage to the house roughly halved.

### 2026-11-13 — Upgrade values exported
- The designer asked for all current upgrades as a CSV for review. Sent `hold_the_fence_upgrades.csv`, with approval and comment columns.
- Clarified that the values are fixed placeholders chosen by Claude, not random and not data-driven. Only which 3 upgrades are offered is random.

### 2026-11-13 — Build 5
- **Designer's change:** a zombie attack sheet was provided. Zombies attack once they're close to the house or the player. If the player moves away, they break off and chase until they're close again.
- **Done:**
  - Added a zombie attack state using the new sheet.
  - It enters and exits range with an 8 px buffer.
  - Damage is applied once per 0.9 s swipe, on the claw frame, instead of continuously.
  - The attack frames are scaled to match the walk frames.

### 2026-11-13 — Game notes file
- The designer asked for this document, to be updated after every change.

### 2026-11-13 — Android Studio project
- The designer asked about an APK or GitHub build and has Android Studio installed.
- **Created:** `HoldTheFence_AndroidStudio.zip`, a Java/WebView Android project.
  - Package: `com.xcubelabs.holdthefence`. Version 0.5.0 (code 5).
  - SDK levels: min SDK 24, target/compile SDK 34.
  - Build tools: AGP 8.5.2, with the Gradle 8.9 wrapper included.
  - Display: portrait lock, immersive full-screen, screen kept on.
  - Pause: the game pauses when the app is backgrounded.
  - Launcher icon: made from the boy's portrait.
  - Includes a `.gitignore` and a README with build and GitHub push steps, so the same folder works as a GitHub repo.
- **Not compiled in Claude's workspace**, because Google and Gradle downloads are blocked there. The APK is built in Android Studio on the designer's machine.
- **To update the game:** replace `app/src/main/assets/index.html` and bump `versionCode`/`versionName`.

### 2026-11-13 — GitHub repo
- The designer asked for a GitHub-only package (no Android project).
- **Created:** `hold-the-fence_github.zip`, a static web repo with no build step.
  - The page, styling and game logic are split into separate files: `index.html`, `css/style.css` and `js/game.js`.
  - The sprites are separate PNGs in `assets/sprites/`.
  - Docs: `docs/GAME_NOTES.md` (this file) and `docs/upgrades.csv`.
  - Also includes `README.md`, `CHANGELOG.md` and `.gitignore`.
  - A GitHub Actions workflow auto-deploys the game to GitHub Pages.
- Tested over a local server: the game loads and plays with no errors.
- **Going forward:** each change updates the repo files, and this log is copied to `docs/GAME_NOTES.md`.

### 2026-11-13 — APK built from GitHub
- The designer wants to build the APK from the GitHub repo.
- **Added `android/`:** a WebView shell project.
  - Package `com.xcubelabs.holdthefence`, version 0.5.0 (code 5).
  - Portrait lock and immersive full-screen.
  - Gradle copies the repo's web files into the APK before each build, so the game exists in one place only.
- **Added `.github/workflows/android.yml`:** it builds a debug APK on every push to `main` (and from a manual run) and uploads it as a downloadable artifact.
  - Pushing a `v*` tag also attaches the APK to a GitHub Release.
  - A signed release APK is built only when the four keystore secrets are added.
- The same `android/` folder also opens in Android Studio.
- **Tested:** the game runs when loaded from local files the way the APK loads it.
- **Not tested:** the GitHub Actions run itself and the Gradle build. Claude's workspace can't download the Android SDK, so the first run on GitHub is the real test.
- The separate `HoldTheFence_AndroidStudio.zip` from earlier is replaced by this repo.
