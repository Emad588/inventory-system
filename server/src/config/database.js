require('dotenv').config();
const path = require('path');

const dbDialect = process.env.DB_DIALECT || 'sqlite';

module.exports = {
  development: dbDialect === 'postgres' ? {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'moci_inventory',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  } : {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../data/moci_inventory.sqlite'),
    logging: false,
  },
  production: {
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../data/moci_inventory.sqlite'),
  logging: false,
},
};
