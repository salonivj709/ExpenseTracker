
const loggedInUser = localStorage.getItem("loggedInUser");

if (!loggedInUser) {
    window.location.href = "login.html";
}
const form = document.getElementById("expenseForm");
const expenseList = document.getElementById("expenseList");

const API_URL = "http://localhost:3000/api/expenses";
let editId = null;

// LOAD EXPENSES WHEN PAGE OPENS
displayExpenses();

// FORM SUBMIT
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount =
        document.getElementById("amount").value;
    const description =
        document.getElementById("description").value;
    const category =
        document.getElementById("category").value;
    const expenseData = {
        amount,
        description,
        category
    };

    //Update
    try {
        if (editId) {
            const response = await fetch(
                `${API_URL}/${editId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(expenseData)
                }
            );
            const result = await response.json();
            console.log(result);
            editId = null;
        }
        // ADD
        else {
            const response = await fetch(
                API_URL,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(expenseData)
                }
            );
            const result = await response.json();
            console.log(result);
        }
        form.reset();
        displayExpenses();
    } catch (error) {
        console.error(
            "Error:",
            error
        );
        alert("Something went wrong");
    }
});

// GET ALL EXPENSES
async function displayExpenses() {
    try {
        const response =await fetch(API_URL);
        const result =await response.json();
        console.log(result);
        expenseList.innerHTML = "";
        result.data.forEach(expense => {
            const li =document.createElement("li");
            li.className ="list-group-item d-flex justify-content-between align-items-center"
            li.innerHTML = `<span><strong>₹${expense.amount}</strong>- ${expense.category}-${expense.description}</span> <div>

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

        });


    } catch (error) {

        console.error(
            "Error fetching expenses:",
            error
        );

    }

}


// DELETE EXPENSE

async function deleteExpense(id) {

    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();

        console.log(result);


        displayExpenses();


    } catch (error) {

        console.error(
            "Error deleting expense:",
            error
        );

    }

}

// EDIT EXPENSE

async function editExpense(id) {

    try {

        const response =
            await fetch(API_URL);

        const result =
            await response.json();


        const expense =
            result.data.find(
                expense => expense.id === id
            );


        if (!expense) {

            alert("Expense not found");

            return;

        }


        document.getElementById("amount").value =
            expense.amount;


        document.getElementById("description").value =
            expense.description;


        document.getElementById("category").value =
            expense.category;


        editId = id;


        // Change button text

        const button =
            form.querySelector("button[type='submit']");

        button.innerText =
            "Update Expense";


    } catch (error) {

        console.error(
            "Error editing expense:",
            error
        );

    }

}
const logoutBtn =
    document.getElementById("logoutBtn");


logoutBtn.addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            "loggedInUser"
        );


        window.location.href =
            "login.html";

    }
);