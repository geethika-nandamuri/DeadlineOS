const express = require("express");
const net = require("net");

const router = express.Router();

router.get("/", (req, res) => {
  const socket = net.createConnection({
    host: "google.com",
    port: 443
  });

  socket.setTimeout(10000);

  socket.on("connect", () => {
    socket.destroy();
    res.json({
      success: true,
      message: "Connected to google.com:443"
    });
  });

  socket.on("timeout", () => {
    socket.destroy();
    res.status(500).json({
      success: false,
      message: "Timeout"
    });
  });

  socket.on("error", (err) => {
    res.status(500).json({
      success: false,
      error: err.message,
      code: err.code
    });
  });
});

module.exports = router;