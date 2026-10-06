require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const db = require("./utils/db-connection");

const expenseRoutes =
    require("./routes/expenseRoutes");

const authRoutes =
    require("./routes/authRoutes");

const paymentRoutes =
    require("./routes/paymentRoutes");

const leaderboardRoutes =
    require("./routes/leaderboardRoutes");

const aiRoutes =
    require("./routes/aiRoutes");

const User = require("./models/user");
const Expense = require("./models/expenses");
const PaymentOrder = require("./models/orders");

const app = express();

app.use(cors());
app.use(express.json());

app.use(
    express.static(__dirname, {
        dotfiles: "deny"
    })
);

// =================================
// TEST ROUTE
// =================================
app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "login.html")
    );
});

// =================================
// API ROUTES
// =================================
app.use("/api", expenseRoutes);
app.use("/api/auth", authRoutes);
app.use("/password", require("./routes/forgotPasswordRoutes"));
app.use("/api/payment", paymentRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/ai", aiRoutes);

// =================================
// DATABASE
// =================================
db.authenticate()
    .then(() => {
        console.log(
            "Database connected successfully"
        );

        return db.sync({
            alter: true
        });
    })
    .then(() => {
        console.log(
            "Database tables created successfully"
        );

        app.listen(3000, () => {
            console.log(
                "Server is running on http://localhost:3000"
            );
        });
    })
    .catch((error) => {
        console.log(
            "Database connection error:",
            error
        );
    });
