# Expense Tracker - Cashfree Premium Membership

This version implements the assignment requirements:

- Buy Premium Membership button
- Cashfree Sandbox Checkout
- Local order table with `PENDING`, `SUCCESS`, `FAILED`
- Payment verification using Cashfree's "Get Payments for an Order"
- Successful payment changes the logged-in user to `premium = true`
- Successful and failed transaction messages
- Failed payments update the local order from `PENDING` to `FAILED`
- Payment result page after Cashfree redirects back

## 1. Create the MySQL database

```sql
CREATE DATABASE expense_db;
```

The existing project uses:

- database: `expense_db`
- user: `root`
- password: `root123`
- host: `localhost`

Change `.env` if your MySQL credentials are different.

## 2. Configure Cashfree Sandbox

Copy:

```text
.env.example
```

to:

```text
.env
```

Then put your Cashfree Sandbox App ID and Secret Key in `.env`.

Do NOT commit `.env` to GitHub.

## 3. Install dependencies

Open a terminal in the `expensetracker` folder:

```bash
npm install
```

This installs `cashfree-pg` and the existing dependencies.

## 4. Start the backend

```bash
npm start
```

The app will run at:

```text
http://localhost:3000
```

Open:

```text
http://localhost:3000
```

## 5. Test the flow

1. Create an account.
2. Log in.
3. Open the Expense Tracker.
4. Click **Buy Premium**.
5. Cashfree Sandbox Checkout opens.
6. Complete/test the payment.
7. Cashfree redirects to `payment-status.html`.
8. The backend fetches the order's payments.
9. `SUCCESS` changes the user's `premium` field to `true`.
10. `PENDING` remains pending.
11. A failed transaction changes the local order to `FAILED`.

## 6. Database tables

Sequelize `sync({ alter: true })` creates/updates:

- `users`
- `expenses`
- `orders`

The `users` table now contains:

```text
premium BOOLEAN DEFAULT false
```

The `orders` table stores:

```text
orderId
cfOrderId
userId
amount
status
```

## 7. Git submission

After testing:

```bash
git init
git add .
git commit -m "Add Cashfree premium membership payment"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Then get the commit ID:

```bash
git rev-parse HEAD
```

Paste that commit ID into the assignment.

## Important

The included `.env.example` contains placeholders only. Never upload your real Cashfree Secret Key to GitHub.

## Final Leaderboard Optimization

The leaderboard uses a cached `users.totalExpense` value instead of calculating `SUM(expenses.amount)` on every leaderboard request.

- Creating an expense increments `users.totalExpense`.
- Updating an expense applies only the amount difference.
- Deleting an expense decrements `users.totalExpense`.
- All three changes use a database transaction so the expense row and cached total stay in sync.
- The leaderboard reads only the `users` table and sorts by `totalExpense`.

### Existing database

If the `users` table already contains users/expenses from before this optimization, run once after installing dependencies:

```bash
npm run backfill:totals
```

Do not commit `.env`; keep Cashfree credentials in the local environment.
## 8. AI Expense Categorization

The Expense Tracker now uses Gemini AI to suggest a category automatically from the expense description.

Example:

- `Lunch at Domino's` → `Food`
- `Petrol for bike` → `Fuel`
- `Movie at PVR` → `Movie`
- `Bought a new shirt` → `Shopping`

### How it works

1. The user types an expense description.
2. The frontend waits briefly and calls `POST /api/ai/categorize`.
3. The backend sends the description to Gemini through `ai.js`.
4. Gemini is instructed to return only one of the application's four categories.
5. The returned category is automatically selected in the expense form.

The Gemini API key is read only on the backend from `GEMINI_API_KEY`; it is never sent to the browser.

### Configure Gemini

Copy `.env.example` to `.env` and add your Gemini API key:

```text
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite
```

Then run:

```bash
npm install
npm start
```

If Gemini is temporarily unavailable, the expense form continues to work and the user can choose a category manually.



### AI categorization
The app sends an authenticated request to `/api/ai/categorize`. The backend keeps the Gemini API key private, retries temporary Gemini 5xx/429 errors with exponential backoff, and falls back from the primary model to a Flash-Lite model if the primary model is temporarily unavailable.

## 9. AI Monthly Budget Planner

The app now includes an AI-powered Monthly Budget Planner.

### What it does

The user enters:

- Monthly income
- Optional savings goal

The backend reads the user's recorded expense history, groups spending by category, and sends only the summarized spending data to Gemini. The AI returns a balanced monthly plan containing:

- Suggested savings amount
- Planned expense amount
- Category-wise spending limits
- A short explanation
- Practical saving tips

The generated budget is validated on the backend so the suggested category allocations plus savings equal the user's monthly income.

### API

```text
POST /api/ai/budget-plan
```

The endpoint is protected by JWT authentication, so a user can only generate a plan from their own expense history.

### Example

```text
Monthly income: ₹30,000
Savings goal: ₹8,000

AI Suggested Savings: ₹8,000
Planned Expenses: ₹22,000

Food       ₹6,000
Fuel       ₹3,000
Shopping   ₹5,000
Movie      ₹2,000
Other      ₹6,000
```

The budget planner is an additional AI feature beyond automatic expense categorization and is designed to be demonstrated directly from the Expense Tracker dashboard.
