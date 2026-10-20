# Cards 4 Life - Family Card Game Scorekeeper

A mobile-first family card game scorekeeper web app optimized for iPhone and Android. Features include American Joker 5-round scoring, standard total points mode, rapid hold-to-accelerate point steppers (+ and -), round winner 0-score preservation, lifetime stats, and family leaderboard with persistent `localStorage`.

---

## 🚀 Publishing to GitHub Pages (Why was the page blank?)

If you open the site on GitHub Pages and see a blank white page, it is caused by one of two common reasons:

1. **Missing Build Step (Source is set to "Deploy from a branch")**:
   Raw React source files use `.tsx` (TypeScript/JSX), which web browsers cannot execute directly without Vite compiling them into standard JavaScript. If GitHub Pages is pointing at the raw root repository instead of building first, the browser tries to load `/src/main.tsx` and fails.
2. **Subpath Asset Routing**:
   GitHub Pages serves your project under `https://<username>.github.io/<repository-name>/`. We configured `base: './'` in `vite.config.ts` so all bundled scripts, styles, and assets resolve relatively.

---

### 🛠️ How to Fix in 1 Minute (Recommended Method: GitHub Actions)

We have created an automated deployment workflow at `.github/workflows/deploy.yml`. Follow these quick steps:

1. **Commit and push** these repository changes to your GitHub `main` branch.
2. Go to your GitHub repository in your browser.
3. Click on **Settings** (gear icon at the top right of your repo).
4. In the left sidebar, click **Pages** (under the "Code and automation" section).
5. Under **Build and deployment** $\rightarrow$ **Source**, click the dropdown and select **GitHub Actions**.
6. That's it! GitHub will automatically trigger the workflow under the **Actions** tab, run `npm run build`, and deploy your live app at:
   ```
   https://<your-username>.github.io/<your-repo-name>/
   ```

---

### Alternative: Deploy via `gh-pages` branch

If you prefer building locally and pushing the `dist` folder:

1. Run:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder to your `gh-pages` branch:
   ```bash
   npx gh-pages -d dist
   ```
3. In **Settings** $\rightarrow$ **Pages**, select **Deploy from a branch** $\rightarrow$ `gh-pages` branch $\rightarrow$ `/ (root)`.

---

## 🎮 Key Features

- **American Joker 5-Round Mode**:
  - Round 1 (3 Cards): 1 Set of 3
  - Round 2 (4 Cards): 1 Set & 1 Pair
  - Round 3 (5 Cards): 1 Run
  - Round 4 (6 Cards): 2 Sets
  - Round 5 (7 Cards): 2 Sets & 1 Run (Finale)
  - Rotating Dealer chip (**D**) and contract helper.
- **Round Winner 0-Score Preservation**:
  - Tap **"Went Out First"** to automatically lock and preserve **0 points** for the round victor with gold laurels and victory chimes.
- **Hold-to-Accelerate Rapid Steppers**:
  - Touch and hold $+$ or $-$ buttons: accelerates smoothly through speed tiers ($+1 \rightarrow +5 \rightarrow +10 \rightarrow +25$).
  - Quick-add penalty chips: **+50** (Joker), **+20** (Ace), **+10** (Face cards), **+5** (Number cards), and **0** reset.
- **Score Sheet Matrix & Undo**:
  - Live matrix table of all rounds with one-touch cell editing for score corrections and round undo.
- **Family Leaderboard & Lifetime Records**:
  - Persistent `localStorage` tracking games played, victories, win rate %, 0-point rounds, and active win streaks.
  - Full JSON backup and restore support to sync between family phones.
