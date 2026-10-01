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


module.exports = {
    signup,
    login,
    getCurrentUser
};