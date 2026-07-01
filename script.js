const form = document.getElementById("expenseForm");
const expenseList = document.getElementById("expenseList");

let editId = null;

displayExpenses();

form.addEventListener("submit", addExpense);

function addExpense(e) {

    e.preventDefault();

    const amount = document.getElementById("amount").value;
    const description = document.getElementById("description").value;
    const category = document.getElementById("category").value;

    let expenses =
        JSON.parse(localStorage.getItem("expenses")) || [];

    if (editId) {

        expenses = expenses.map(expense => {

            if (expense.id === editId) {

                return {
                    id: editId,
                    amount,
                    description,
                    category
                };
            }

            return expense;

        });

        editId = null;

    }

    else {

        expenses.push({
            id: Date.now().toString(),
            amount,
            description,
            category
        });

    }
   

    localStorage.setItem(
    "expenses",
    JSON.stringify(expenses)
);

console.log("Saved:", localStorage.getItem("expenses"));

    form.reset();

    displayExpenses();

}

function displayExpenses() {

    expenseList.innerHTML = "";

    const expenses =
        JSON.parse(localStorage.getItem("expenses")) || [];

    expenses.forEach(expense => {

        const li = document.createElement("li");

        li.className =
            "list-group-item d-flex justify-content-between align-items-center";

        li.innerHTML = `

            <span>

                <strong>${expense.amount}</strong>
                -
                ${expense.category}
                -
                ${expense.description}

            </span>

            <div>

                <button
                    class="btn btn-warning btn-sm me-2"
                    onclick="editExpense('${expense.id}')"
                >
                    Edit
                </button>

                <button
                    class="btn btn-danger btn-sm"
                    onclick="deleteExpense('${expense.id}')"
                >
                    Delete
                </button>

            </div>

        `;

        expenseList.appendChild(li);

    });

}

function deleteExpense(id) {

    let expenses =
        JSON.parse(localStorage.getItem("expenses")) || [];

    expenses =
        expenses.filter(expense => expense.id !== id);

    localStorage.setItem(
        "expenses",
        JSON.stringify(expenses)
    );

    displayExpenses();

}

function editExpense(id) {

    const expenses =
        JSON.parse(localStorage.getItem("expenses")) || [];

    const expense =
        expenses.find(expense => expense.id === id);

    document.getElementById("amount").value =
        expense.amount;

    document.getElementById("description").value =
        expense.description;

    document.getElementById("category").value =
        expense.category;

    editId = id;

}