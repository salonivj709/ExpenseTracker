const form = document.getElementById("loginForm");

const message =
    document.getElementById("message");


form.addEventListener(
    "submit",
    async (e) => {

        e.preventDefault();


        const email =
            document.getElementById("email").value.trim();


        const password =
            document.getElementById("password").value;


        message.textContent =
            "Logging in...";

        message.style.color =
            "black";


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
                            email,
                            password
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


                // Save user information
                localStorage.setItem(
                    "loggedInUser",
                    JSON.stringify(result.user)
                );


                // Go to Expense Tracker
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

            console.error(
                "Login error:",
                error
            );


            message.textContent =
                "Unable to connect to server.";

            message.style.color =
                "red";

        }

    }
);