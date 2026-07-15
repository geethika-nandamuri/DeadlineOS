const express = require("express");
const net = require("net");

const router = express.Router();

router.get("/", (req, res) => {
    const socket = net.createConnection({
        host: "smtp-relay.brevo.com",
        port: 587
    });

    socket.setTimeout(10000);

    socket.on("connect", () => {
        socket.destroy();

        res.json({
            success: true,
            message: "Connected to Brevo SMTP"
        });
    });

    socket.on("timeout", () => {
        socket.destroy();

        res.status(500).json({
            success: false,
            message: "Timeout"
        });
    });

    socket.on("error", err => {

        res.status(500).json({
            success: false,
            code: err.code,
            error: err.message
        });

    });

});

module.exports = router;