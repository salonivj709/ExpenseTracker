const express = require("express");
const cors = require("cors");
const db = require("./utils/db-connection");

const expenseRoutes =
    require("./routes/expenseRoutes");

const authRoutes =
    require("./routes/authRoutes");

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Expense API is running");
});

app.use("/api", expenseRoutes);

app.use("/api/auth", authRoutes);


db.authenticate()

    .then(() => {

        console.log(
            "Database connected successfully"
        );

        return db.sync();

    })

    .then(() => {

        console.log(
            "Database tables created successfully"
        );

        app.listen(3000, () => {

            console.log(
                "Server is running on port 3000"
            );

        });

    })

    .catch((err) => {

        console.log(
            "Database connection error:",
            err
        );

    });