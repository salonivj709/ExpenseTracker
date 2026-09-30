const express = require("express");
const cors = require("cors");

const db =
    require("./utils/db-connection");

const expenseRoutes =
    require("./routes/expenseRoutes");

const authRoutes =
    require("./routes/authRoutes");


const app = express();


app.use(cors());

app.use(express.json());


// =================================
// TEST ROUTE
// =================================

app.get("/", (req, res) => {

    res.send("Expense API is running");

});


// =================================
// EXPENSE ROUTES
// =================================

app.use(
    "/api",
    expenseRoutes
);


// =================================
// AUTH ROUTES
// =================================

app.use(
    "/api/auth",
    authRoutes
);


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


        app.listen(
            3000,
            () => {

                console.log(
                    "Server is running on port 3000"
                );

            }
        );

    })

    .catch((error) => {

        console.log(
            "Database connection error:",
            error
        );

    });