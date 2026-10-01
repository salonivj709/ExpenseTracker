const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authenticate = async (req, res, next) => {

    try {

        const token = req.header("Authorization");

        if (!token) {

            return res.status(401).json({
                success: false,
                message: "Authorization token is missing"
            });
        }

        const decoded = jwt.verify(
            token,
            "mysecretkey"
        );

        const user = await User.findByPk(
            decoded.userId
        );

        if (!user) {

            return res.status(401).json({
                success: false,
                message: "User does not exist"
            });
        }

        req.user = user;

        next();

    } catch (error) {

        console.log(error);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

module.exports = authenticate;