const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

async function connectToDatabase() {
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } catch (error) {
    console.error(error);
  }
}

connectToDatabase();

module.exports = client;