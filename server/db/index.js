// const { Pool } = require('pg');

// const pool = new Pool({
//   user: 'linkwareprototype_user',
//   host: 'dpg-d1ql3c8dl3ps7391tujg-a',
//   database: 'linkwareprototype',
//   password: 'NgURSiNOZ9zg8IqigTuzk5eVw5geDywA',
//   port: 5432,
//   ssl: {
//     rejectUnauthorized: false,
//   },
// });


const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;
