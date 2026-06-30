const mongoose = require('mongoose');
const dns = require('dns');

// Force DNS resolution to use Google DNS to bypass querySrv ECONNREFUSED issues on local machines/networks
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  console.log('[DATABASE] Custom DNS servers set to Google DNS (8.8.8.8, 8.8.4.4) for reliable SRV resolution.');
} catch (err) {
  console.warn('[DATABASE] Failed to set custom DNS servers:', err.message);
}

const maskUri = (uri) => {
  if (!uri) return 'undefined';
  try {
    // Mask password between the protocol name/username and host
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/, '$1******$3');
  } catch (err) {
    return 'masked_uri';
  }
};

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  console.log(`[DATABASE] Loaded Mongo URI: ${maskUri(mongoUri)}`);
  console.log(`[DATABASE] Database connection attempt initiated...`);
  console.log(`[DATABASE] Current mongoose connection state: ${mongoose.connection.readyState} (0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting)`);

  // Disable command buffering globally so errors appear immediately if DB is offline
  mongoose.set('bufferCommands', false);

  try {
    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not defined in .env');
    }

    // Connect to MongoDB using the 'deadlineos' database name to meet requirements without modifying .env
    const conn = await mongoose.connect(mongoUri, {
      dbName: 'deadlineos',
      serverSelectionTimeoutMS: 5000, // Fail fast if Atlas or local DB is unreachable
    });

    console.log(`[DATABASE] Successful connection established! host: ${conn.connection.host}, database: ${conn.connection.db.databaseName}`);
    console.log(`[DATABASE] Current mongoose connection state: ${mongoose.connection.readyState} (connected)`);
  } catch (error) {
    console.error(`\n======================================================`);
    console.error(`[DATABASE ERROR] Connection failed: ${error.message}`);
    console.error(`[DATABASE ERROR] Mongoose connection state: ${mongoose.connection.readyState}`);
    console.error(`[DATABASE ERROR] Terminating server startup due to database failure.`);
    console.error(`======================================================\n`);
    // Exit server process immediately with failure code
    process.exit(1);
  }
};

module.exports = connectDB;
