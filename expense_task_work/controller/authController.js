const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

// SIGNUP
const signup = async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body;


        // Check empty fields

        if (
            !name ||
            !email ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message: "All fields are required"

            });
        }


        // Check if user already exists

        const existingUser =
            await User.findOne({
                where: {
                    email: email
                }
            });


        if (existingUser) {

            return res.status(409).json({

                success: false,

                message: "User already exists"

            });
        }


        // Hash password

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        // Create user

        const user = await User.create({

            name: name,

            email: email,

            password: hashedPassword

        });


        return res.status(201).json({

            success: true,

            message: "Signup successful",

            user: {

                id: user.id,

                name: user.name,

                email: user.email,
                premium: user.premium

            }

        });


    } catch (error) {

        console.log(
            "Signup error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Server error"

        });
    }
};



// =============================
// LOGIN
// =============================

const login = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        // Find user

        const user =
            await User.findOne({

                where: {
                    email: email
                }

            });


        if (!user) {

            return res.status(404).json({

                success: false,

                message: "User does not exist"

            });
        }


        // Compare password

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message: "Invalid password"

            });
        }


        // ==========================
        // CREATE JWT
        // ==========================

        const token = jwt.sign(

            {
                userId: user.id
            },

            "mysecretkey",

            {
                expiresIn: "1h"
            }

        );


        return res.status(200).json({

            success: true,

            message: "Login successful",

            token: token,

            user: {

                id: user.id,

                name: user.name,

                email: user.email,
                premium: user.premium

            }

        });


    } catch (error) {

        console.log(
            "Login error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Server error"

        });
    }
};


// =============================
// CURRENT USER
// =============================
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ["id", "name", "email", "premium"]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User does not exist"
            });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.log("Get current user error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// FORGOT PASSWORD: send an account-recovery email through Brevo (formerly Sendinblue).
const forgotPassword = async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email address." });
        }

        // Return the same response whether or not the address is registered.
        const user = await User.findOne({ where: { email } });
        if (user) {
            const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
            const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SENDINBLUE_SENDER_EMAIL;
            const senderName = process.env.BREVO_SENDER_NAME || "Expense Tracker";

            if (!apiKey || !senderEmail) {
                console.error("Forgot-password email is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.");
                return res.status(503).json({ success: false, message: "Email service is not configured yet. Please contact support." });
            }

            const response = await fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: {
                    "accept": "application/json",
                    "api-key": apiKey,
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    sender: { name: senderName, email: senderEmail },
                    to: [{ email: user.email, name: user.name || user.email }],
                    subject: "Password assistance - Expense Tracker",
                    textContent: `Hello ${user.name || "there"},\n\nWe received a request for password assistance for your Expense Tracker account. If you made this request, please reply to this email or contact the application administrator to securely reset your password. If you did not request this, you can ignore this message.\n\nFor your security, this email does not contain your current password.`,
                    htmlContent: `<p>Hello ${escapeHtml(user.name || "there")},</p><p>We received a request for password assistance for your Expense Tracker account.</p><p>If you made this request, please contact the application administrator to securely reset your password. If you did not request this, you can ignore this message.</p><p>For your security, this email does not contain your current password.</p>`
                })
            });

            if (!response.ok) {
                const details = await response.text();
                console.error("Brevo email error:", response.status, details);
                return res.status(502).json({ success: false, message: "Unable to send the email right now. Please try again later." });
            }
        }

        return res.status(200).json({
            success: true,
            message: "If an account exists for that email, password assistance has been sent."
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};

function escapeHtml(value) {
    return String(value).replace(/[&<>\"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#39;"
    })[character]);
}


module.exports = {
    signup,
    login,
    getCurrentUser,
    forgotPassword
};