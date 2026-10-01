// ========================================
// CHECK LOGIN
// ========================================

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}


// ========================================
// ELEMENTS
// ========================================

const form = document.getElementById("expenseForm");
const expenseList = document.getElementById("expenseList");

const API_URL = "http://localhost:3000/api/expenses";

let editId = null;


// ========================================
// LOAD EXPENSES WHEN PAGE OPENS
// ========================================

getExpenses();


// ========================================
// FORM SUBMIT
// ========================================

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const amount =
        document.getElementById("amount").value;

    const description =
        document.getElementById("description").value;

    const category =
        document.getElementById("category").value;


    // ========================================
    // IF EDIT MODE
    // ========================================

    if (editId !== null) {

        await updateExpense(
            editId,
            amount,
            description,
            category
        );

        return;
    }


    // ========================================
    // ADD MODE
    // ========================================

    await addExpense(
        amount,
        description,
        category
    );

});


// ========================================
// GET EXPENSES
// ========================================

async function getExpenses() {

    try {

        const response = await fetch(
            API_URL,
            {
                method: "GET",

                headers: {
                    "Authorization": token
                }
            }
        );


        // Token expired / invalid

        if (response.status === 401) {

            localStorage.removeItem("token");

            localStorage.removeItem("loggedInUser");

            localStorage.removeItem("user");

            window.location.href = "login.html";

            return;
        }


        const result = await response.json();

        console.log("GET EXPENSES:", result);


        if (!response.ok) {

            alert(
                result.message ||
                "Unable to fetch expenses"
            );

            return;
        }


        // Clear old expenses

        expenseList.innerHTML = "";


        // Backend returns:
        // result.expenses

        result.expenses.forEach(
            expense => {

                addNewExpenseUI(expense);

            }
        );


    } catch (error) {

        console.error(
            "Error fetching expenses:",
            error
        );

    }
}


// ========================================
// ADD EXPENSE
// ========================================

async function addExpense(
    amount,
    description,
    category
) {

    try {

        const response = await fetch(
            API_URL,
            {
                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        token

                },

                body: JSON.stringify({

                    amount: amount,

                    description: description,

                    category: category

                })
            }
        );


        if (response.status === 401) {

            localStorage.removeItem("token");

            window.location.href =
                "login.html";

            return;
        }


        const result = await response.json();

        console.log(
            "ADD EXPENSE:",
            result
        );


        if (response.ok) {

            alert(
                "Expense added successfully"
            );


            // Clear form

            form.reset();


            // Add newly created expense

            addNewExpenseUI(
                result.expense
            );


        } else {

            alert(
                result.message ||
                "Unable to add expense"
            );
        }


    } catch (error) {

        console.error(
            "Error adding expense:",
            error
        );

    }
}


// ========================================
// UPDATE EXPENSE
// ========================================

async function updateExpense(
    id,
    amount,
    description,
    category
) {

    try {

        const response = await fetch(
            `${API_URL}/${id}`,
            {
                method: "PUT",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        token

                },

                body: JSON.stringify({

                    amount: amount,

                    description:
                        description,

                    category:
                        category

                })
            }
        );


        if (response.status === 401) {

            localStorage.removeItem("token");

            window.location.href =
                "login.html";

            return;
        }


        const result =
            await response.json();


        console.log(
            "UPDATE EXPENSE:",
            result
        );


        if (response.ok) {

            alert(
                "Expense updated successfully"
            );


            // Reset edit mode

            editId = null;


            // Reset form

            form.reset();


            // Change button back

            const button =
                form.querySelector(
                    "button[type='submit']"
                );

            if (button) {

                button.innerText =
                    "Add Expense";

            }


            // Reload expenses

            getExpenses();


        } else {

            alert(
                result.message ||
                "Unable to update expense"
            );

        }


    } catch (error) {

        console.error(
            "Error updating expense:",
            error
        );

    }
}


// ========================================
// DELETE EXPENSE
// ========================================

async function deleteExpense(id) {

    try {

        const response = await fetch(
            `${API_URL}/${id}`,
            {
                method: "DELETE",

                headers: {

                    "Authorization":
                        token

                }
            }
        );


        if (response.status === 401) {

            localStorage.removeItem("token");

            window.location.href =
                "login.html";

            return;
        }


        const result =
            await response.json();


        console.log(
            "DELETE EXPENSE:",
            result
        );


        if (response.ok) {

            alert(
                "Expense deleted successfully"
            );


            // Reload expenses

            getExpenses();


        } else {

            alert(
                result.message ||
                "Unable to delete expense"
            );

        }


    } catch (error) {

        console.error(
            "Error deleting expense:",
            error
        );

    }
}


// ========================================
// EDIT EXPENSE
// ========================================

async function editExpense(id) {

    try {

        const response = await fetch(
            API_URL,
            {
                method: "GET",

                headers: {

                    "Authorization":
                        token

                }
            }
        );


        if (response.status === 401) {

            localStorage.removeItem("token");

            window.location.href =
                "login.html";

            return;
        }


        const result =
            await response.json();


        console.log(
            "EDIT EXPENSE:",
            result
        );


        if (!response.ok) {

            alert(
                result.message ||
                "Unable to get expense"
            );

            return;
        }


        const expense =
            result.expenses.find(
                expense =>
                    expense.id === id
            );


        if (!expense) {

            alert(
                "Expense not found"
            );

            return;
        }


        // Put values inside form

        document.getElementById(
            "amount"
        ).value = expense.amount;


        document.getElementById(
            "description"
        ).value = expense.description;


        document.getElementById(
            "category"
        ).value = expense.category;


        // Store ID

        editId = id;


        // Change button text

        const button =
            form.querySelector(
                "button[type='submit']"
            );


        if (button) {

            button.innerText =
                "Update Expense";

        }


    } catch (error) {

        console.error(
            "Error editing expense:",
            error
        );

    }
}


// ========================================
// DISPLAY EXPENSE IN UI
// ========================================

function addNewExpenseUI(expense) {

    const li =
        document.createElement("li");


    li.className =
        "list-group-item d-flex justify-content-between align-items-center";


    li.innerHTML = `

        <span>
            <strong>₹${expense.amount}</strong>
            - ${expense.category}
            - ${expense.description}
        </span>

        <div>

            <button
                class="btn btn-warning btn-sm me-2"
                onclick="editExpense(${expense.id})"
            >
                Edit
            </button>


            <button
                class="btn btn-danger btn-sm"
                onclick="deleteExpense(${expense.id})"
            >
                Delete
            </button>

        </div>

    `;


    expenseList.appendChild(li);
}


// ========================================
// LOGOUT
// ========================================

function logout() {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    localStorage.removeItem(
        "loggedInUser"
    );


    window.location.href =
        "login.html";
}

// ========================================
// CURRENT USER + PREMIUM MEMBERSHIP
// ========================================

const premiumBtn = document.getElementById("premiumBtn");
const premiumText = document.getElementById("premiumText");
const leaderboardSection = document.getElementById("leaderboardSection");
const leaderboardBody = document.getElementById("leaderboardBody");
const refreshLeaderboardBtn = document.getElementById("refreshLeaderboardBtn");

let currentUser = JSON.parse(localStorage.getItem("user") || "null");

function updatePremiumUI(user) {
    currentUser = user;
    localStorage.setItem("user", JSON.stringify(user));

    if (user?.premium) {
        premiumText.textContent = "You are a premium user now. Premium membership is active.";
        premiumText.className = "mb-0 text-success fw-semibold";
        premiumBtn.textContent = "Premium Active";
        premiumBtn.disabled = true;
        leaderboardSection.classList.remove("d-none");
        loadLeaderboard();
    } else {
        premiumText.textContent = "Unlock Premium for ₹499";
        premiumText.className = "mb-0 text-muted";
        premiumBtn.textContent = "Buy Premium";
        premiumBtn.disabled = false;
        leaderboardSection.classList.add("d-none");
    }
}

async function loadCurrentUser() {
    try {
        const response = await fetch(
            "http://localhost:3000/api/auth/me",
            { headers: { Authorization: token } }
        );

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "login.html";
            return;
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error("Unable to load current user:", result);
            return;
        }

        updatePremiumUI(result.user);
    } catch (error) {
        console.error("Current user error:", error);
        if (currentUser) updatePremiumUI(currentUser);
    }
}

async function loadLeaderboard() {
    if (!currentUser?.premium) return;

    leaderboardBody.innerHTML = `
        <tr>
            <td colspan="3" class="text-center">Loading leaderboard...</td>
        </tr>
    `;

    try {
        const response = await fetch(
            "http://localhost:3000/api/leaderboard",
            { headers: { Authorization: token } }
        );

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "login.html";
            return;
        }

        const result = await response.json();

        if (!response.ok) {
            leaderboardBody.innerHTML = `
                <tr><td colspan="3" class="text-center text-danger">
                    ${result.message || "Unable to load leaderboard"}
                </td></tr>
            `;
            return;
        }

        if (!result.leaderboard.length) {
            leaderboardBody.innerHTML = `
                <tr><td colspan="3" class="text-center">No users found.</td></tr>
            `;
            return;
        }

        leaderboardBody.innerHTML = result.leaderboard.map(user => `
            <tr ${user.id === currentUser.id ? 'class="table-primary fw-semibold"' : ""}>
                <td>${user.rank}</td>
                <td>${escapeHtml(user.name)}${user.id === currentUser.id ? " (You)" : ""}</td>
                <td>₹${Number(user.totalExpense).toFixed(2)}</td>
            </tr>
        `).join("");
    } catch (error) {
        console.error("Leaderboard error:", error);
        leaderboardBody.innerHTML = `
            <tr><td colspan="3" class="text-center text-danger">
                Unable to load leaderboard
            </td></tr>
        `;
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

if (premiumBtn) {
    premiumBtn.addEventListener("click", startPremiumPayment);
}

if (refreshLeaderboardBtn) {
    refreshLeaderboardBtn.addEventListener("click", loadLeaderboard);
}

async function startPremiumPayment() {
    premiumBtn.disabled = true;
    premiumBtn.textContent = "Creating Order...";

    try {
        const response = await fetch(
            "http://localhost:3000/api/payment/create-order",
            {
                method: "POST",
                headers: { Authorization: token }
            }
        );

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "login.html";
            return;
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to create order");
        }

        const cashfree = Cashfree({ mode: "sandbox" });

        await cashfree.checkout({
            paymentSessionId: result.paymentSessionId,
            redirectTarget: "_self"
        });
    } catch (error) {
        console.error("Premium payment error:", error);
        alert(error.message || "Unable to start payment");
        premiumBtn.disabled = false;
        premiumBtn.textContent = "Buy Premium";
    }
}

// Always fetch the premium flag from the database on page load.
// This makes premium status survive refresh and re-login.
loadCurrentUser();

