# Expense Tracker password reset setup

## What was added
- `ForgotPasswordRequests` Sequelize model with UUID `id`, `userId`, `isActive`, expiry, and timestamps.
- Reset links sent through the existing Brevo API integration.
- `GET /password/resetpassword/:id` to validate a link and show the reset form.
- `POST /password/resetpassword/:id` to hash and save a new password, then deactivate all active reset links for that user.
- A reset-password page with password confirmation and an 8-character minimum.

## Configuration
Keep your existing local `.env` file private. Confirm it has:

```env
BREVO_API_KEY=your_real_brevo_api_key
BREVO_SENDER_EMAIL=your_verified_sender_email
BREVO_SENDER_NAME=Expense Tracker
RESET_PASSWORD_BASE_URL=http://localhost:3000/password/resetpassword
```

Do not put your real `.env` file or API key into GitHub. The server already calls `db.sync({ alter: true })`; restarting the server should create the new table. Verify in your database that `ForgotPasswordRequests` exists.

## Test
1. Start MySQL and make sure the existing `expense_db` connection works.
2. Start the backend with `npm start`.
3. Open `http://localhost:3000/login.html` and choose **Forgot Password?**.
4. Submit the email of an existing account and open the email.
5. Click the reset link, enter and confirm a new password, and submit.
6. Log in with the new password. Try reusing the same reset link; it should be rejected.

Reset links expire after 30 minutes. This link uses `localhost`, so it is intended for local assignment testing. For a deployed app, set `RESET_PASSWORD_BASE_URL` to the public HTTPS URL where this backend is reachable.
