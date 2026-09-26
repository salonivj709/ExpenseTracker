const express = require("express");
const cors = require("cors");

const db = require("./utils/db-connection");

const expenseRoutes =
    require("./routes/expenseRoutes");

const app = express();


// Middleware
app.use(cors());
app.use(express.json());


// Test route
app.get("/", (req, res) => {

    res.send("Expense API is running");

});


// Expense routes
app.use("/api", expenseRoutes);


// Database connection
db.authenticate()
    .then(() => {

        console.log("Database connected successfully");

        return db.sync();

    })
    .then(() => {

        console.log("Expense table created successfully");

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