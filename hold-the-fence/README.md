# Hold the Fence

A 2D portrait mobile zombie-defense game. A boy defends his home from waves of zombies with an axe. Between waves the player picks one upgrade.

It's built with plain HTML5 canvas and JavaScript, so there's no build step and no dependencies.

## Run locally
The browser has to load the sprite files, so serve the folder rather than double-clicking `index.html`:

```
python -m http.server 8000
```

Then open http://localhost:8000. `npx serve .` works too.

## Controls
- **Mobile:** drag anywhere to move.
- **Desktop:** WASD or the arrow keys.
- **Attacking is automatic** when a zombie is in reach.
- **Pause:** Esc or P.

## Build the Android APK

### On GitHub (no setup needed)
1. Every push to `main` runs **Build Android APK** in the **Actions** tab. You can also start it by hand with **Run workflow**.
2. When the run finishes, open it and download the APK from **Artifacts**. The download is `hold-the-fence-vX.Y.Z`, which contains the APK.
3. **Make a release:** push a version tag. The APK is then also attached to a GitHub Release.
   ```
   git tag v0.5.0
   git push origin v0.5.0
   ```
4. **Signed release APK (optional):** add these four repository secrets under **Settings > Secrets and variables > Actions**: `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS` and `KEY_PASSWORD`. Without them, the workflow builds only the debug APK. That's fine for installing on test phones, but it can't go to the Play Store.
   - To make a keystore once and store it safely:
     ```
     keytool -genkey -v -keystore release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias holdthefence
     ```
   - Then put the output of `base64 -w0 release.jks` in the `KEYSTORE_BASE64` secret.

### In Android Studio
Open the `android/` folder, not the repo root. Then choose **Build > Build APK(s)**. The APK is written to `android/app/build/outputs/apk/debug/`.

### How the APK works
- The APK wraps the game in a full-screen, portrait-locked Android WebView.
- Before each build, Gradle copies `index.html`, `css/`, `js/` and `assets/` from the repo root into the APK. You only ever edit the web files.
- When you ship a new version, raise `versionCode` and `versionName` in `android/app/build.gradle`.

## Project structure
```
index.html                    Page shell and UI overlays
css/style.css                 HUD and menu styling
js/game.js                    All game logic: input, AI, combat, waves, upgrades, rendering, audio
assets/sprites/
  boy_idle_axe.png            8x4 sheet, 112px frames
  boy_walk_axe.png            8x4 sheet, 112px frames
  boy_attack_axe.png          8x4 sheet, 112px frames
  zombie_walk.png             8x4 sheet, 88x118 frames
  zombie_attack.png           8x4 sheet, 112px frames
  house.png                   House on its stone pad (scaled from 1362x1651 source)
  boy_portrait.png            Title-screen portrait
docs/GAME_NOTES.md            Full design notes, current values, dated change log
docs/upgrades.csv             Upgrade values awaiting approval
android/                      Android WebView shell (Gradle project)
.github/workflows/android.yml Builds the APK on every push and on version tags
.github/workflows/pages.yml   Auto-deploy to GitHub Pages
```

Every sheet uses the same row order: up, right, down, left.

## Tuning values (in `js/game.js`)
- `reset()`: starting stats for the player and the house.
- `waveCfg(n)`: zombie count, HP, speed, damage and spawn gap for each wave.
- `UPS`: the upgrade list.
- `HRS`: the house collider boxes, in source-image pixels.

## Publish to GitHub
```
git init
git add .
git commit -m "Hold the Fence – Build 5"
git branch -M main
git remote add origin https://github.com/<your-account>/hold-the-fence.git
git push -u origin main
```

To get a playable link, go to **Settings > Pages** on GitHub and set **Source** to **GitHub Actions**. The included workflow then publishes the game on every push to `main`, at `https://<your-account>.github.io/hold-the-fence/`.
