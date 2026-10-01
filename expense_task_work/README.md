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
