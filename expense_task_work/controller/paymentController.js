const { Cashfree } = require("cashfree-pg");
const axios = require("axios");
const PaymentOrder = require("../models/orders");
const User = require("../models/user");

const CASHFREE_ENV =
    process.env.CASHFREE_ENV === "production"
        ? Cashfree.PRODUCTION
        : Cashfree.SANDBOX;

const cashfree = new Cashfree(
    CASHFREE_ENV,
    process.env.CASHFREE_APP_ID,
    process.env.CASHFREE_SECRET_KEY
);

const API_VERSION =
    process.env.CASHFREE_API_VERSION || "2025-01-01";

const PREMIUM_PRICE =
    Number(process.env.PREMIUM_PRICE || 499);

const DEFAULT_PHONE =
    process.env.CASHFREE_DEFAULT_PHONE || "9999999999";

const RETURN_URL =
    process.env.CASHFREE_RETURN_URL ||
    "http://localhost:3000/payment-status.html";

// =====================================
// CREATE PREMIUM ORDER
// =====================================
const createPremiumOrder = async (req, res) => {
    let localOrder = null;

    try {
        const user = req.user;

        if (user.premium) {
            return res.status(400).json({
                success: false,
                message: "You are already a premium user"
            });
        }

        const orderId =
            `premium_${user.id}_${Date.now()}`;

        localOrder = await PaymentOrder.create({
            orderId: orderId,
            userId: user.id,
            amount: PREMIUM_PRICE,
            status: "PENDING"
        });

        const request = {
            order_amount: PREMIUM_PRICE,
            order_currency: "INR",
            order_id: orderId,

            customer_details: {
                customer_id: String(user.id),
                customer_name: user.name,
                customer_email: user.email,
                customer_phone: DEFAULT_PHONE
            },

            order_meta: {
                return_url:
                    `${RETURN_URL}?order_id={order_id}`
            }
        };

        const response =
            await cashfree.PGCreateOrder(
                request
            );

        const data = response.data;
        return res.status(201).json({
            success: true,
            message: "Premium order created",
            orderId: orderId,
            paymentSessionId:
                data.payment_session_id
        });

    } catch (error) {

        console.error(
            "Create Cashfree order error:",
            error.response?.data || error.message
        );

        if (localOrder) {
            await localOrder.update({
                status: "FAILED"
            }).catch(() => {});
        }

        return res.status(500).json({
            success: false,
            message:
                error.response?.data?.message ||
                "Unable to create payment order"
        });
    }
};



// =====================================
// VERIFY PAYMENT
// =====================================
const verifyPayment = async (req, res) => {
    try {
        const { orderId } = req.params;

        console.log("=================================");
        console.log("VERIFY PAYMENT");
        console.log("Order ID from URL:", orderId);
        console.log("User ID:", req.user.id);
        console.log(
            "Cashfree Environment:",
            process.env.CASHFREE_ENV || "sandbox"
        );
        console.log("=================================");

        // Find local order
        const order = await PaymentOrder.findOne({
            where: {
                orderId: orderId,
                userId: req.user.id
            }
        });

        if (!order) {
            console.log("LOCAL ORDER NOT FOUND:", orderId);

            return res.status(404).json({
                success: false,
                message: "Order not found in local database"
            });
        }

        console.log("Local order found:");
        console.log("Local Order ID:", order.orderId);
        console.log("Cashfree Order ID:", order.cfOrderId);
        console.log("Amount:", order.amount);
        console.log("Current Status:", order.status);

        // Cashfree Sandbox API
        const cashfreeBaseUrl =
            process.env.CASHFREE_ENV === "production"
                ? "https://api.cashfree.com/pg"
                : "https://sandbox.cashfree.com/pg";

        console.log("Cashfree API URL:", cashfreeBaseUrl);

        // Get payments directly from Cashfree
        const response = await axios.get(
            `${cashfreeBaseUrl}/orders/${encodeURIComponent(order.orderId)}/payments`,
            {
                headers: {
                    "x-client-id": process.env.CASHFREE_APP_ID,
                    "x-client-secret": process.env.CASHFREE_SECRET_KEY,
                    "x-api-version": API_VERSION,
                    "Accept": "application/json"
                }
            }
        );

        console.log("=================================");
        console.log("CASHFREE PAYMENT RESPONSE");
        console.log(response.data);
        console.log("=================================");

        const payments = Array.isArray(response.data)
            ? response.data
            : [];

        let status = "PENDING";

        if (
            payments.some(
                payment =>
                    payment.payment_status === "SUCCESS"
            )
        ) {
            status = "SUCCESS";
        } else if (
            payments.some(
                payment =>
                    payment.payment_status === "PENDING"
            )
        ) {
            status = "PENDING";
        } else if (payments.length > 0) {
            status = "FAILED";
        }

        // Update local payment order
        await order.update({
            status: status
        });

        // Make user premium only after SUCCESS
        if (status === "SUCCESS") {
            await User.update(
                { premium: true },
                {
                    where: {
                        id: req.user.id
                    }
                }
            );

            console.log("USER MARKED AS PREMIUM");
        }

        console.log("FINAL PAYMENT STATUS:", status);

        return res.status(200).json({
            success: true,
            status: status,
            message:
                status === "SUCCESS"
                    ? "Transaction successful"
                    : status === "PENDING"
                        ? "Payment is still pending"
                        : "TRANSACTION FAILED"
        });

    } catch (error) {

        console.error("=================================");
        console.error("CASHFREE VERIFICATION ERROR");
        console.error("Message:", error.message);
        console.error(
            "Response:",
            error.response?.data
        );
        console.error(
            "Status:",
            error.response?.status
        );
        console.error("=================================");

        return res.status(500).json({
            success: false,
            message:
                error.response?.data?.message ||
                "Unable to verify payment status"
        });
    }
};

module.exports = {
    createPremiumOrder,
    verifyPayment
};
