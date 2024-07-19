const {MongoClient} = require('mongodb');

require('dotenv').config();

const mongoUrl = process.env.DB_URL

const client = new MongoClient(mongoUrl)
client.connect()
  .then(() => console.log('Connected to MongoDB'))
  .catch(e => console.error(e))

const Database = client.db('story-podcast-app')

module.exports = {
  Database
}



