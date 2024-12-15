import { Pulse } from "@pulsecron/pulse";
import dotenv from "dotenv";

dotenv.config();

const mongoUrl = process.env.DB_URL;

const pulse = new Pulse({
  db: { address: mongoUrl, collection: "pulse_jobs" },
  resumeOnRestart: true,
});

export const initPulse = async () => {
  try {
    await pulse.start();
    console.log("Pulse connected and ready!");
  } catch (error) {
    console.error("Failed to initialize Pulse:", error);
    throw error;
  }
};

export default pulse;
