import { Database } from "./client.js";
import { compareSync } from "bcrypt";

function generateSessionId() {
  const count = 64;
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < count; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

export async function addSessionToUser(username, password) {
  const user = await Database.collection('users').findOne({ username: username });

  if (!user) {
    return {
      error: "Invalid username or password"
    }
  }

  const match = compareSync(password, user.password)

  if (!match) {
    return {
      error: "Invalid username or password"
    }
  }

  const sessionId = generateSessionId();

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await Database.collection('users').updateOne(
    { username: username },
    {
      $push: {
        sessions: {
          sessionId: sessionId,
          expiresAt: expiresAt
        }
      }
    }
  );

  return {
    sessionId: sessionId,
    expiresAt: expiresAt
  };
}

export async function getUserBySessionId(sessionId) {
  return await Database.collection('users').findOne({
    sessions: {
      $elemMatch: {
        sessionId: sessionId,
        expiresAt: {
          $gt: new Date()
        }
      }
    }
  });
}

