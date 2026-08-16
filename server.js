import app from './src/app.js';
import connectDB from './src/config/db.js';
import env from './src/config/env.js';

/**
 * Bootstraps the application, connects database, and listens for requests
 */
const startServer = async () => {
  try {
    // Establish connection to MongoDB
    await connectDB();

    const PORT = env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Mode: ${env.NODE_ENV}`);
      console.log(`🔗 Local link: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error(`💥 Critical Server Boot Error: ${error.message}`);
    process.exit(1);
  }
};

startServer();
