require('dotenv').config();
const connectDB = require('./config/db');
const app = require('./app');

// Stop immediately with a clear message if a required secret is missing.
for (const key of ['MONGO_URI', 'JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in the .env file`);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
