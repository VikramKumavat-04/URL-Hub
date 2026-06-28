import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";

export const generateNanoId = (len)=>{
  return nanoid(len);
} 

export const signToken = (payload)=>{
  return jwt.sign(payload,process.env.JWT_SECRET,{ expiresIn: "7d" });
} 

export const verifyToken = (token)=>{
  return token = jwt.verify(token,process.env.JWT_SECRET);
} 