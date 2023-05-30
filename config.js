require('dotenv').config();

const config = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  JWT_COOKIE_EXPIRES_IN: process.env.JWT_COOKIE_EXPIRES_IN,
  FRONTEND_URL: process.env.FRONTEND_URL,
};

module.exports = config;
