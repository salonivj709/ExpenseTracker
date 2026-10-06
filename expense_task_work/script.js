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
let currentExpenses = [];
let currentExpensePage = 1;
const EXPENSES_PER_PAGE = 10;
let aiCategoryTimer = null;

// The current database schema does not store transaction dates. Keep dates for
// expenses created in this browser so the frontend-only report can filter new
// records without inventing dates for older transactions.
function getExpenseReportDatesKey() {
    let userId = "unknown-user";
    try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        if (storedUser?.id !== undefined && storedUser?.id !== null) {
            userId = String(storedUser.id);
        }
    } catch (_) {
        // Use the fallback key if the cached user data is invalid.
    }
    return `expenseReportDates:${userId}`;
}

function readExpenseReportDates() {
    try {
        const value = JSON.parse(localStorage.getItem(getExpenseReportDatesKey()) || "{}");
        return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch (_) {
        return {};
    }
}

function saveExpenseReportDate(expenseId, date = new Date()) {
    if (expenseId === undefined || expenseId === null) return;
    const dates = readExpenseReportDates();
    dates[String(expenseId)] = date.toISOString();
    localStorage.setItem(getExpenseReportDatesKey(), JSON.stringify(dates));
}

function attachExpenseReportDates(expenses) {
    const dates = readExpenseReportDates();
    return expenses.map(expense => ({
        ...expense,
        reportDate: expense.date || expense.createdAt || expense.created_at || expense.createdOn || dates[String(expense.id)] || null
    }));
}
let lastAiDescription = "";

// ========================================
// AI CATEGORY SUGGESTION
// ========================================

const descriptionInput = document.getElementById("description");
const categoryInput = document.getElementById("category");
const aiSuggestion = document.getElementById("aiSuggestion");

if (descriptionInput) {
    descriptionInput.addEventListener("input", () => {
        clearTimeout(aiCategoryTimer);

        const description = descriptionInput.value.trim();

        if (description.length < 3) {
            if (aiSuggestion) aiSuggestion.textContent = "";
            return;
        }

        aiCategoryTimer = setTimeout(() => {
            suggestCategoryWithAI(description);
        }, 700);
    });
}

async function suggestCategoryWithAI(description) {
    if (description === lastAiDescription) return;

    lastAiDescription = description;

    if (aiSuggestion) {
        aiSuggestion.textContent = "AI is suggesting a category...";
        aiSuggestion.className = "small text-primary mt-1";
    }

    try {
        const response = await fetch(
            "http://localhost:3000/api/ai/categorize",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                },
                body: JSON.stringify({ description })
            }
        );

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "login.html";
            return;
        }

        const result = await response.json();

        if (response.ok && result.success && result.category) {
            categoryInput.value = result.category;

            if (aiSuggestion) {
                aiSuggestion.textContent = `AI suggestion: ${result.category}`;
                aiSuggestion.className = "small text-success mt-1";
            }
        } else if (aiSuggestion) {
            aiSuggestion.textContent = "AI suggestion unavailable. Choose a category manually.";
            aiSuggestion.className = "small text-muted mt-1";
        }
    } catch (error) {
        console.error("AI category error:", error);

        if (aiSuggestion) {
            aiSuggestion.textContent = "AI suggestion unavailable. Choose a category manually.";
            aiSuggestion.className = "small text-muted mt-1";
        }
    }
}


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


        // Keep every record available to reports, but render only 10 per page.
        currentExpenses = attachExpenseReportDates(Array.isArray(result.expenses) ? result.expenses : []);
        currentExpensePage = 1;
        renderFinancialReport();
        renderExpensePage();


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

            if (result.expense) {
                // Save today's date for this newly created expense in this
                // browser; older rows without dates remain available in All time.
                saveExpenseReportDate(result.expense.id);
                const expenseWithReportDate = {
                    ...result.expense,
                    reportDate: result.expense.date || result.expense.createdAt || result.expense.created_at || new Date().toISOString()
                };
                // New expenses appear at the top, just like the API's newest-first order.
                currentExpenses.unshift(expenseWithReportDate);
                currentExpensePage = 1;
                renderExpensePage();
            }
            renderFinancialReport();


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
// EXPENSE PAGINATION (10 ITEMS PER PAGE)
// ========================================

function renderExpensePage() {
    if (!expenseList) return;

    const totalExpenses = currentExpenses.length;
    const totalPages = Math.max(1, Math.ceil(totalExpenses / EXPENSES_PER_PAGE));
    currentExpensePage = Math.min(Math.max(1, currentExpensePage), totalPages);

    const startIndex = (currentExpensePage - 1) * EXPENSES_PER_PAGE;
    const pageExpenses = currentExpenses.slice(startIndex, startIndex + EXPENSES_PER_PAGE);
    expenseList.innerHTML = "";

    pageExpenses.forEach(expense => addNewExpenseUI(expense));

    const pagination = document.getElementById("expensePagination");
    if (!pagination) return;

    if (totalExpenses === 0) {
        pagination.innerHTML = '<div class="text-muted small">No expenses yet.</div>';
        return;
    }

    const firstShown = startIndex + 1;
    const lastShown = Math.min(startIndex + pageExpenses.length, totalExpenses);
    const button = (label, page, disabled = false, active = false, aria = label) => `
        <button type="button" class="btn btn-sm ${active ? 'btn-primary' : 'btn-outline-primary'}"
            data-page="${page}" ${disabled ? 'disabled' : ''} aria-label="${aria}">${label}</button>`;

    pagination.innerHTML = `
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3 mb-4">
            <span class="small text-muted" aria-live="polite">
                Showing ${firstShown}–${lastShown} of ${totalExpenses} expenses · Page ${currentExpensePage} of ${totalPages}
            </span>
            <nav aria-label="Expense pages" class="d-flex flex-wrap gap-1">
                ${button('First', 1, currentExpensePage === 1, false, 'First page')}
                ${button('Previous', currentExpensePage - 1, currentExpensePage === 1, false, 'Previous page')}
                ${Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === totalPages || Math.abs(page - currentExpensePage) <= 1)
                    .map(page => button(String(page), page, false, page === currentExpensePage, `Page ${page}`))
                    .join('')}
                ${button('Next', currentExpensePage + 1, currentExpensePage === totalPages, false, 'Next page')}
                ${button('Last', totalPages, currentExpensePage === totalPages, false, 'Last page')}
            </nav>
        </div>`;

    pagination.querySelectorAll('button[data-page]').forEach(buttonElement => {
        buttonElement.addEventListener('click', () => {
            currentExpensePage = Number(buttonElement.dataset.page);
            renderExpensePage();
            // Keep the expense list in view when moving between pages.
            expenseList.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
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
        updateReportPremiumState(true);
        leaderboardSection.classList.remove("d-none");
        loadLeaderboard();
    } else {
        premiumText.textContent = "Unlock Premium for ₹499";
        premiumText.className = "mb-0 text-muted";
        premiumBtn.textContent = "Buy Premium";
        premiumBtn.disabled = false;
        updateReportPremiumState(false);
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

// ========================================
// FRONTEND FINANCIAL REPORTS
// ========================================
const reportPeriod = document.getElementById("reportPeriod");
const reportDate = document.getElementById("reportDate");
const downloadReportBtn = document.getElementById("downloadReportBtn");
const reportNotice = document.getElementById("reportNotice");
const reportTableBody = document.getElementById("reportTableBody");
const reportIncomeTotal = document.getElementById("reportIncomeTotal");
const reportExpenseTotal = document.getElementById("reportExpenseTotal");
const reportBalance = document.getElementById("reportBalance");
const reportPremiumBadge = document.getElementById("reportPremiumBadge");

if (reportDate) reportDate.value = new Date().toISOString().slice(0, 10);
if (reportPeriod) reportPeriod.addEventListener("change", renderFinancialReport);
if (reportDate) reportDate.addEventListener("change", renderFinancialReport);
if (downloadReportBtn) downloadReportBtn.addEventListener("click", downloadFinancialReport);

function updateReportPremiumState(isPremium) {
    if (!downloadReportBtn) return;
    downloadReportBtn.disabled = !isPremium;
    downloadReportBtn.title = isPremium ? "Download the current report as CSV" : "Premium membership is required";
    if (reportPremiumBadge) {
        reportPremiumBadge.textContent = isPremium ? "PREMIUM ACTIVE" : "PREMIUM FEATURE";
        reportPremiumBadge.className = isPremium ? "badge bg-success" : "badge bg-warning text-dark";
    }
    if (reportNotice) {
        reportNotice.className = isPremium ? "alert alert-success py-2" : "alert alert-info py-2";
        reportNotice.textContent = isPremium
            ? "Premium is active. You can download the currently filtered report as a CSV file."
            : "Upgrade to Premium to enable report downloads. You can preview the available frontend report below.";
    }
}

function getIncomeRecordsForReport() {
    // Frontend-only task: support an income array if the app or a later task stores one.
    // No income API is invented here because backend work is explicitly out of scope.
    try {
        const records = JSON.parse(localStorage.getItem("incomes") || "[]");
        if (!Array.isArray(records)) return [];
        return records.map(item => ({
            ...item,
            type: "Income",
            amount: Number(item.amount || item.income || 0),
            description: item.description || item.source || item.title || "Income",
            category: item.category || item.source || "Income",
            reportDate: item.date || item.createdAt || item.created_at || item.createdDate || null
        }));
    } catch (error) {
        console.warn("Could not read frontend income records:", error);
        return [];
    }
}

function normalizedReportDate(record) {
    const raw = record.reportDate || record.date || record.createdAt || record.created_at || record.createdOn || null;
    if (!raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isDateInSelectedPeriod(recordDate, period, selectedDate) {
    if (period === "all") return true;
    if (!recordDate) return false;
    const date = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
    const selected = new Date(`${selectedDate}T00:00:00`);
    if (Number.isNaN(selected.getTime())) return false;
    if (period === "daily") return date.getTime() === selected.getTime();
    if (period === "weekly") {
        const start = new Date(selected);
        const day = (start.getDay() + 6) % 7; // Monday-start week
        start.setDate(start.getDate() - day);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        return date >= start && date < end;
    }
    if (period === "monthly") return date.getFullYear() === selected.getFullYear() && date.getMonth() === selected.getMonth();
    return true;
}

function getFilteredReportRecords() {
    const expenses = attachExpenseReportDates(currentExpenses).map(item => ({
        ...item,
        type: "Expense",
        amount: Number(item.amount || 0),
        description: item.description || "Expense",
        category: item.category || "Uncategorized",
        reportDate: item.reportDate || item.date || item.createdAt || item.created_at || item.createdOn || null
    }));
    const records = [...expenses, ...getIncomeRecordsForReport()];
    const period = reportPeriod?.value || "all";
    const selectedDate = reportDate?.value || new Date().toISOString().slice(0, 10);
    return records.filter(record => isDateInSelectedPeriod(normalizedReportDate(record), period, selectedDate))
        .sort((a, b) => (normalizedReportDate(b)?.getTime() || 0) - (normalizedReportDate(a)?.getTime() || 0));
}

function formatReportDate(value) {
    const date = normalizedReportDate(value);
    return date ? date.toLocaleDateString("en-IN") : "Date unavailable";
}

function renderFinancialReport() {
    if (!reportTableBody) return;
    const period = reportPeriod?.value || "monthly";
    const records = getFilteredReportRecords();
    const income = records.filter(row => row.type === "Income").reduce((sum, row) => sum + row.amount, 0);
    const expenses = records.filter(row => row.type === "Expense").reduce((sum, row) => sum + row.amount, 0);
    reportIncomeTotal.textContent = formatINR(income);
    reportExpenseTotal.textContent = formatINR(expenses);
    reportBalance.textContent = formatINR(income - expenses);
    reportBalance.className = `fs-3 fw-bold ${income - expenses >= 0 ? "text-success" : "text-danger"}`;

    if (!records.length) {
        const missingDates = period !== "all" && currentExpenses.some(row => !normalizedReportDate(row));
        reportTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">${missingDates ? "No dated records match this period. Older expense records without a date appear under All time." : "No records found for this period."}</td></tr>`;
        return;
    }
    reportTableBody.innerHTML = records.map(row => `
        <tr>
            <td>${escapeHtml(formatReportDate(row))}</td>
            <td><span class="badge ${row.type === "Income" ? "bg-success" : "bg-danger"}">${row.type}</span></td>
            <td>${escapeHtml(row.description)}</td>
            <td>${escapeHtml(row.category)}</td>
            <td class="text-end fw-semibold">${formatINR(row.amount)}</td>
        </tr>`).join("");
}

function downloadFinancialReport() {
    if (!currentUser?.premium) {
        alert("Report downloads are available to Premium users only.");
        return;
    }
    const records = getFilteredReportRecords();
    const headers = ["Date", "Type", "Description", "Category", "Amount"];
    const escapeCsv = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const lines = [headers, ...records.map(row => [formatReportDate(row), row.type, row.description, row.category, Number(row.amount || 0).toFixed(2)])];
    const csv = "\uFEFF" + lines.map(line => line.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `expense-tracker-${reportPeriod?.value || "all"}-report-${reportDate?.value || new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

updateReportPremiumState(Boolean(currentUser?.premium));
renderFinancialReport();

// Always fetch the premium flag from the database on page load.
// This makes premium status survive refresh and re-login.
loadCurrentUser();


// ========================================
// AI MONTHLY BUDGET PLANNER
// ========================================

const budgetForm = document.getElementById("budgetForm");
const monthlyIncomeInput = document.getElementById("monthlyIncome");
const savingsGoalInput = document.getElementById("savingsGoal");
const generateBudgetBtn = document.getElementById("generateBudgetBtn");
const budgetStatus = document.getElementById("budgetStatus");
const budgetResult = document.getElementById("budgetResult");
const budgetSavings = document.getElementById("budgetSavings");
const budgetExpenses = document.getElementById("budgetExpenses");
const budgetIncome = document.getElementById("budgetIncome");
const budgetSummary = document.getElementById("budgetSummary");
const budgetAllocations = document.getElementById("budgetAllocations");
const budgetTips = document.getElementById("budgetTips");

if (budgetForm) {
    budgetForm.addEventListener("submit", generateAIBudget);
}

function formatINR(value) {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 0
    })}`;
}

async function generateAIBudget(event) {
    event.preventDefault();

    const monthlyIncome = Number(monthlyIncomeInput.value);
    const savingsGoal = savingsGoalInput.value === ""
        ? null
        : Number(savingsGoalInput.value);

    if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0) {
        budgetStatus.textContent = "Please enter a valid monthly income.";
        budgetStatus.className = "small mt-3 text-danger";
        return;
    }

    if (savingsGoal !== null && (savingsGoal < 0 || savingsGoal >= monthlyIncome)) {
        budgetStatus.textContent = "Savings goal must be less than your monthly income.";
        budgetStatus.className = "small mt-3 text-danger";
        return;
    }

    generateBudgetBtn.disabled = true;
    generateBudgetBtn.textContent = "🤖 AI is creating your budget...";
    budgetStatus.textContent = "AI is analyzing your recorded spending and creating a personalized plan...";
    budgetStatus.className = "small mt-3 text-primary";
    budgetResult.classList.add("d-none");

    try {
        const response = await fetch(
            "http://localhost:3000/api/ai/budget-plan",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                },
                body: JSON.stringify({
                    monthlyIncome,
                    savingsGoal
                })
            }
        );

        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("loggedInUser");
            window.location.href = "login.html";
            return;
        }

        const result = await response.json();

        if (!response.ok || !result.success || !result.budget) {
            throw new Error(result.message || "Unable to generate AI budget.");
        }

        renderBudgetPlan(result.budget, monthlyIncome);
        budgetStatus.textContent = "Your personalized AI budget is ready.";
        budgetStatus.className = "small mt-3 text-success fw-semibold";
    } catch (error) {
        console.error("AI budget planner error:", error);
        budgetStatus.textContent = error.message || "AI budget is temporarily unavailable. Please try again.";
        budgetStatus.className = "small mt-3 text-danger";
    } finally {
        generateBudgetBtn.disabled = false;
        generateBudgetBtn.textContent = "✨ Generate AI Budget";
    }
}

function renderBudgetPlan(budget, income) {
    budgetResult.classList.remove("d-none");

    budgetSavings.textContent = formatINR(budget.savings);
    budgetExpenses.textContent = formatINR(budget.totalPlannedExpenses);
    budgetIncome.textContent = formatINR(income);
    budgetSummary.textContent = ` ${budget.summary || "AI created this plan from your income and spending history."}`;

    budgetAllocations.innerHTML = "";

    (budget.allocations || []).forEach((allocation) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="fw-semibold">${escapeHtml(allocation.category)}</td>
            <td class="fw-bold">${formatINR(allocation.amount)}</td>
            <td>${escapeHtml(allocation.reason)}</td>
        `;
        budgetAllocations.appendChild(row);
    });

    budgetTips.innerHTML = "";

    (budget.tips || []).forEach((tip) => {
        const li = document.createElement("li");
        li.textContent = tip;
        budgetTips.appendChild(li);
    });
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
