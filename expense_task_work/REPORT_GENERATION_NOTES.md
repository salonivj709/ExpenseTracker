# Financial Reports frontend notes

- Daily, weekly, and monthly report filters use a transaction date when the API returns one.
- The current `expenses` table schema does not include a transaction-date column. For newly added expenses, this frontend stores the creation date in browser localStorage, scoped by the signed-in user, so the report can filter those new rows.
- Existing older expenses without a stored date are intentionally included only in **All time**. Their historical transaction dates cannot be recovered accurately from the current database schema.
- Income rows are read from `localStorage` key `incomes` if another frontend flow stores them; no income backend has been added because this is a frontend-only assignment.
- `.env` and `node_modules` are excluded from the ZIP. Keep your own `.env` locally and run `npm install` after extracting.
