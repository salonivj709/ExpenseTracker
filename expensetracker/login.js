const form =
    document.getElementById("loginForm");

const message =
    document.getElementById("message");


form.addEventListener(
    "submit",
    async (e) => {

        e.preventDefault();


        const email =
            document
                .getElementById("email")
                .value
                .trim();


        const password =
            document
                .getElementById("password")
                .value;


        try {

            const response =
                await fetch(
                    "http://localhost:3000/api/auth/login",
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body: JSON.stringify({

                            email: email,

                            password: password

                        })

                    }
                );


            const result =
                await response.json();


            console.log(result);


            if (result.success) {

                message.textContent =
                    "Login successful!";

                message.style.color =
                    "green";


                // =========================
                // SAVE JWT
                // =========================

                localStorage.setItem(
                    "token",
                    result.token
                );


                // Save user information

                localStorage.setItem(
                    "user",
                    JSON.stringify(
                        result.user
                    )
                );


                setTimeout(() => {

                    window.location.href =
                        "Expense.html";

                }, 1000);

            } else {

                message.textContent =
                    result.message;

                message.style.color =
                    "red";

            }


        } catch (error) {

            console.log(
                "Login error:",
                error
            );


            message.textContent =
                "Unable to connect to server";

            message.style.color =
                "red";

        }

    }
);