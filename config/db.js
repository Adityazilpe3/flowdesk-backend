const mongoose = require('mongoose');

/**
 * Encode special characters in the MongoDB URI password.
 * Handles passwords set from Render env vars that contain !, @, etc.
 */
const prepareMongUri = (uri) => {
  if (!uri) return uri;
  // Match: mongodb+srv://user:PASS@host (or mongodb://user:PASS@host)
  return uri.replace(
    /^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/,
    (_, scheme, user, pass) => {
      const encodedPass = encodeURIComponent(pass);
      return `${scheme}${user}:${encodedPass}@`;
    }
  );
};

const connectDB = async () => {
  try {
    const rawUri = process.env.MONGO_URI;
    const uri = prepareMongUri(rawUri);
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
