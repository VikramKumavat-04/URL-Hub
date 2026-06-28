import { verifyToken } from "./helper.js";
import { findUserById } from "../dao/user.dao.js";

export const attchUser = async (req, res, next) => {
  let token = req.cookies?.accessToken || null;

  // Also accept Bearer token from Authorization header
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.slice(7);
  }

  if (!token) return next();

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId || decoded.id || decoded._id;
    if (userId) {
      req.user = await findUserById(userId);
    }
    next();
  } catch {
    // Invalid or expired token — just proceed without user
    // Don't error out here; protected routes will reject if needed
    next();
  }
};
