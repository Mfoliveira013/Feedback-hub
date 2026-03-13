import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { getCargoScope, toLegacyCargo } from "./cargo.js";

export function createAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      cargo: toLegacyCargo(user.cargo),
      cargo_scope: getCargoScope(user),
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

