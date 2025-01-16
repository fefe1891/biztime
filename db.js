/** Database setup for BizTime. */

const { Client } = require("pg");

const client = new Client({
    user: 'sarah22',
    host: 'localhost',
    database: 'biztime',
    password: process.env.DATABASE_PASSWORD || 'RoseEllen24',
    port: '5432'
});

client.connect();

module.exports = client;