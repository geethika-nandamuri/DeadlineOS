require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const startServer = async () => {
  console.log('[SERVER] Starting initialization sequence...');

  // 1. MongoDB Connection
  await connectDB();

  // 2. Express initialization
  const app = express();

  // 3. Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json());

  // 4. Routes (required and registered only after successful connection)
  app.use('/api/auth',      require('./routes/auth'));
  app.use('/api/tasks',     require('./routes/tasks'));
  app.use('/api/ai',        require('./routes/ai'));
  app.use('/api/analytics', require('./routes/analytics'));

  if (process.env.NODE_ENV === 'development') {
    app.use('/api/debug',   require('./routes/debug'));
  }
  app.get("/", (req, res) => {
    res.send("Railway Backend Working");
  });
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      service: 'DeadlineOS',
      geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
      emailConfigured: !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS),
      timestamp: new Date().toISOString(),
    });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  });



  app.use("/api/network-test", require("./routes/networkTest"));

  // 5. Server listen
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[SERVER] DeadlineOS backend operational on port ${PORT}`);

    // 6. Start scheduled cron jobs after server starts
    try {
      const { startAllJobs } = require('./services/scheduler');
      startAllJobs();
    } catch (err) {
      console.error('[CRON] Failed to start scheduled jobs:', err.message);
    }
  });
};

startServer().catch(err => {
  console.error('[SERVER CRITICAL ERROR] Initialization failed:', err);
  process.exit(1);
});
