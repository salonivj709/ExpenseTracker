const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/user");
const ForgotPasswordRequest = require("../models/forgotPasswordRequest");

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


// FORGOT PASSWORD: create a single-use reset request and email its link.
const forgotPassword = async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email address." });
        }

        // Do not reveal whether an account exists.
        const user = await User.findOne({ where: { email } });
        if (user) {
            const apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
            const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SENDINBLUE_SENDER_EMAIL;
            const senderName = process.env.BREVO_SENDER_NAME || "Expense Tracker";

            if (!apiKey || !senderEmail) {
                console.error("Forgot-password email is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.");
                return res.status(503).json({ success: false, message: "Email service is not configured yet. Please contact support." });
            }

            // A UUID is the reset identifier. It expires after 30 minutes.
            const requestId = crypto.randomUUID();
            await ForgotPasswordRequest.create({
                id: requestId,
                userId: user.id,
                isActive: true,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000)
            });

            const baseUrl = (process.env.RESET_PASSWORD_BASE_URL || "http://localhost:3000/password/resetpassword").replace(/\/$/, "");
            const resetUrl = `${baseUrl}/${requestId}`;

            try {
                const response = await fetch("https://api.brevo.com/v3/smtp/email", {
                    method: "POST",
                    headers: {
                        accept: "application/json",
                        "api-key": apiKey.trim(),
                        "content-type": "application/json"
                    },
                    body: JSON.stringify({
                        sender: { name: senderName, email: senderEmail },
                        to: [{ email: user.email, name: user.name || user.email }],
                        subject: "Reset your Expense Tracker password",
                        textContent: `Hello ${user.name || "there"},\n\nUse this link to reset your Expense Tracker password (valid for 30 minutes):\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
                        htmlContent: `<p>Hello ${escapeHtml(user.name || "there")},</p><p>We received a request to reset your Expense Tracker password.</p><p><a href="${resetUrl}">Reset my password</a></p><p>This link expires in 30 minutes and can only be used once. If you did not request this, you can ignore this email.</p>`
                    })
                });

                if (!response.ok) {
                    const details = await response.text();
                    console.error("Brevo email error:", response.status, details);
                    await ForgotPasswordRequest.update({ isActive: false }, { where: { id: requestId } });
                    return res.status(502).json({ success: false, message: "Unable to send the email right now. Please try again later." });
                }
            } catch (emailError) {
                await ForgotPasswordRequest.update({ isActive: false }, { where: { id: requestId } });
                throw emailError;
            }
        }

        return res.status(200).json({
            success: true,
            message: "If an account exists for that email, a password-reset link has been sent."
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ success: false, message: "Server error. Please try again later." });
    }
};

// Validate the reset identifier before showing the form.
const validatePasswordReset = async (req, res) => {
    try {
        const request = await ForgotPasswordRequest.findByPk(req.params.id);
        if (!request || !request.isActive || new Date(request.expiresAt) <= new Date()) {
            return res.status(400).sendFile(require("path").join(__dirname, "../reset-password-invalid.html"));
        }
        return res.sendFile(require("path").join(__dirname, "../reset-password.html"));
    } catch (error) {
        console.error("Validate password reset error:", error);
        return res.status(500).send("Unable to open the reset-password page. Please try again.");
    }
};

// Change the password only for an active, unexpired, single-use reset request.
const resetPassword = async (req, res) => {
    try {
        const requestId = String(req.params.id || "");
        const password = String(req.body.password || "");
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
        }

        const request = await ForgotPasswordRequest.findByPk(requestId);
        if (!request || !request.isActive || new Date(request.expiresAt) <= new Date()) {
            if (request && request.isActive) await request.update({ isActive: false });
            return res.status(400).json({ success: false, message: "This reset link is invalid, expired, or already used. Please request a new one." });
        }

        const user = await User.findByPk(request.userId);
        if (!user) {
            await request.update({ isActive: false });
            return res.status(400).json({ success: false, message: "This reset link is no longer valid. Please request a new one." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await user.update({ password: hashedPassword });
        // Deactivate every outstanding reset link for this user.
        await ForgotPasswordRequest.update({ isActive: false }, { where: { userId: user.id, isActive: true } });

        return res.status(200).json({ success: true, message: "Password updated successfully. You can now log in with your new password." });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ success: false, message: "Unable to reset password right now. Please try again." });
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
    forgotPassword,
    validatePasswordReset,
    resetPassword
};