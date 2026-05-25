import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signToken(payload) {
  try {
    return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  } catch (err) {
    const e = new Error("Could not issue token");
    e.status = 500;
    e.cause = err;
    throw e;
  }
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
