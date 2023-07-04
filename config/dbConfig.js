require('dotenv').config()
module.exports = {
  "development": {
    "username": process.env.DATABASE_USERNAME,
    "password":process.env.DATABASE_PASSWORD,
    "database": process.env.DATABASE_DB,
    "host": process.env.DATABASE_HOST,
    "dialect": "postgres",
  },
  // "test": {
  //   "username": "root",
  //   "password": null,
  //   "database": "database_test",
  //   "host": "127.0.0.1",
  //   "dialect": "mysql"
  // },
  "production": {
    socketPath: process.env.DATABASE_SOCKET_PATH,
    "dialect": "postgres"
  }
}
