import { verifyToken } from "../utils/helper.js";
import { findUserById } from "../dao/user.dao.js";

export const authMiddleware = async (req, res, next) => {
  let token = req.cookies.accessToken || null;
  
  // Also check Authorization header (Bearer token)
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }
  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token provided" });
  }
  try{
   const decoded = verifyToken(token);
   console.log('[authMiddleware] Decoded token:', decoded);
   const userId = decoded.userId || decoded.id;
   const user = await findUserById(userId);
   if (!user) {
    return res.status(401).json({ message: "Unauthorized - User not found" });
  }
    req.user = user;
    console.log('[authMiddleware] User authenticated:', user._id);
    next();

  }
  catch(err){
    console.error('[authMiddleware] Error:', err.message);
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
};
   