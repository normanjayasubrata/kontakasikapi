require('dotenv').config()
module.exports = {
  "development": {
    "username": process.env.DATABASE_USERNAME,
    "password":process.env.DATABASE_PASSWORD,
    "database": process.env.DATABASE_DB,
    "host": process.env.DATABASE_HOST,
    "dialect": "postgres",
  },
  "test": {
    "username": process.env.ELEPHANT_SQL_DB,
    "password": process.env.ELEPHANT_SQL_PASSWORD,
    "database": process.env.ELEPHANT_SQL_DB,
    "host": process.env.ELEPHANT_SQL_HOST,
    "dialect": "postgres",
  },
  "production": {
    socketPath: process.env.DATABASE_SOCKET_PATH,
    "dialect": "postgres"
  }
}
