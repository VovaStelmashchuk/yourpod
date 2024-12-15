import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const mongoUrl = process.env.DB_URL;

const client = new MongoClient(mongoUrl, {
  socketTimeoutMS: 10000,
  connectTimeoutMS: 10000,
});

let isConnected = false;

export const initDatabase = async () => {
  try {
    if (!isConnected) {
      await client.connect();
      isConnected = true;
      console.log("Connected to MongoDB");
    }
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
};

export const Database = client.db("story-podcast-app");
