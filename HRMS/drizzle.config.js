require('dotenv').config();

module.exports = {
  schema: './shared/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL
  }
};
