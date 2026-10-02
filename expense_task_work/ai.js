const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";

const ALLOWED_CATEGORIES = ["Food", "Movie", "Fuel", "Shopping"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildPrompt(description) {
    return `You are an expense categorization assistant.

Classify this expense description into exactly ONE of these categories:
Food, Movie, Fuel, Shopping.

Expense description: "${description}"

Return ONLY the category name. Do not add punctuation, explanation, or markdown.`;
}

async function requestGemini(model, description) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    return axios.post(
        url,
        {
            contents: [
                {
                    parts: [{ text: buildPrompt(description) }]
                }
            ],
            generationConfig: {
                temperature: 0,
                maxOutputTokens: 10
            }
        },
        {
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY
            },
            timeout: 15000
        }
    );
}

async function suggestCategory(description) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
        throw new Error("GEMINI_API_KEY is not configured in .env");
    }

    const cleanDescription = String(description || "").trim();

    if (!cleanDescription) {
        throw new Error("Expense description is required");
    }

    let response;
    let lastError;

    // Retry temporary 5xx/429 failures, then try the fallback model.
    const models = [PRIMARY_MODEL, FALLBACK_MODEL].filter(
        (model, index, list) => model && list.indexOf(model) === index
    );

    for (const model of models) {
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                response = await requestGemini(model, cleanDescription);
                break;
            } catch (error) {
                lastError = error;
                const status = error.response?.status;

                if (![408, 429, 500, 502, 503, 504].includes(status)) {
                    throw error;
                }

                if (attempt < 2) {
                    await sleep(1000 * Math.pow(2, attempt));
                }
            }
        }

        if (response) break;
    }

    if (!response) {
        throw lastError || new Error("Gemini request failed");
    }

    const text = response.data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

    if (!text) {
        throw new Error("Gemini returned an empty response");
    }

    const normalized = text
        .replace(/[`"'.]/g, "")
        .trim()
        .toLowerCase();

    const category = ALLOWED_CATEGORIES.find(
        (item) => item.toLowerCase() === normalized
    );

    if (!category) {
        throw new Error(`Gemini returned an unsupported category: ${text}`);
    }

    return category;
}


function buildBudgetPrompt({ monthlyIncome, savingsGoal, totalRecorded, categoryTotals }) {
    const categoryLines = Object.entries(categoryTotals)
        .map(([category, amount]) => `${category}: ₹${Number(amount).toFixed(2)}`)
        .join("\n") || "No previous expenses recorded.";

    const savingsInstruction = savingsGoal === null
        ? "Choose a sensible savings amount based on the income and spending history."
        : `The user wants to save at least ₹${Number(savingsGoal).toFixed(2)} this month.`;

    return `You are an AI monthly budget planner inside an expense tracker.

Create a realistic monthly budget from the user's income and recorded spending history.
Do not invent expenses. Use the spending categories provided below as evidence.
${savingsInstruction}

Monthly income: ₹${Number(monthlyIncome).toFixed(2)}
Total recorded spending history: ₹${Number(totalRecorded).toFixed(2)}
Category spending history:
${categoryLines}

Return ONLY valid JSON with this exact shape:
{
  "savings": 0,
  "totalPlannedExpenses": 0,
  "allocations": [
    { "category": "Food", "amount": 0, "reason": "short reason" }
  ],
  "summary": "one short explanation",
  "tips": ["tip 1", "tip 2", "tip 3"]
}

Rules:
- savings + totalPlannedExpenses must equal monthly income.
- allocations must add up exactly to totalPlannedExpenses.
- Use whole rupee amounts where possible.
- Include the user's existing categories and add "Other" only if useful.
- Keep tips practical and specific to the spending history.
- Never make the total exceed the monthly income.
- Return numbers as numbers, not strings.`;
}

async function requestBudgetGemini(model, payload) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    return axios.post(
        url,
        {
            contents: [
                {
                    parts: [{ text: buildBudgetPrompt(payload) }]
                }
            ],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1000,
                responseMimeType: "application/json"
            }
        },
        {
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY
            },
            timeout: 20000
        }
    );
}

function cleanJsonText(text) {
    return String(text || "")
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
}

function validateBudget(budget, monthlyIncome, savingsGoal) {
    if (!budget || !Array.isArray(budget.allocations)) {
        throw new Error("Invalid budget response");
    }

    const savings = Number(budget.savings);
    const totalPlannedExpenses = Number(budget.totalPlannedExpenses);
    const allocations = budget.allocations.map((item) => ({
        category: String(item.category || "Other").trim(),
        amount: Math.max(0, Math.round(Number(item.amount) || 0)),
        reason: String(item.reason || "Based on your spending history.").trim()
    }));

    if (!Number.isFinite(savings) || !Number.isFinite(totalPlannedExpenses) || allocations.length === 0) {
        throw new Error("Invalid budget numbers");
    }

    const allocationTotal = allocations.reduce((sum, item) => sum + item.amount, 0);
    const income = Math.round(monthlyIncome);
    const roundedSavings = Math.max(0, Math.round(savings));

    if (allocationTotal + roundedSavings !== income) {
        throw new Error("AI budget totals do not balance");
    }

    if (savingsGoal !== null && roundedSavings < Math.round(savingsGoal)) {
        throw new Error("AI budget did not meet the requested savings goal");
    }

    return {
        savings: roundedSavings,
        totalPlannedExpenses: allocationTotal,
        allocations,
        summary: String(budget.summary || "Your budget is based on your income and recorded spending history.").trim(),
        tips: Array.isArray(budget.tips)
            ? budget.tips.map((tip) => String(tip).trim()).filter(Boolean).slice(0, 4)
            : []
    };
}

async function createBudgetPlan(payload) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
        throw new Error("GEMINI_API_KEY is not configured in .env");
    }

    const models = [PRIMARY_MODEL, FALLBACK_MODEL].filter(
        (model, index, list) => model && list.indexOf(model) === index
    );

    let lastError;

    for (const model of models) {
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const response = await requestBudgetGemini(model, payload);
                const text = response.data?.candidates?.[0]?.content?.parts
                    ?.map((part) => part.text || "")
                    .join("")
                    .trim();

                if (!text) throw new Error("Gemini returned an empty budget response");

                const parsed = JSON.parse(cleanJsonText(text));
                return validateBudget(parsed, payload.monthlyIncome, payload.savingsGoal);
            } catch (error) {
                lastError = error;
                const status = error.response?.status;

                if (![408, 429, 500, 502, 503, 504].includes(status)) {
                    throw error;
                }

                if (attempt < 2) {
                    await sleep(1000 * Math.pow(2, attempt));
                }
            }
        }
    }

    throw lastError || new Error("Gemini budget request failed");
}


module.exports = {
    suggestCategory,
    createBudgetPlan
};
