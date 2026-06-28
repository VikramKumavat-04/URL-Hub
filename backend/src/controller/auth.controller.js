import { registerUser,loginUser} from "../services/auth.service.js";
import {cookieOptions} from "../config/congif.js";
export const register_user = async(req,res)=>{
  try {
    const {name,email,password} = req.body;
    const { user, token } = await registerUser(name,email,password);
    req.user= user;
    res.cookie("accessToken", token, cookieOptions);
    res.status(200).json({ message: "User registered successfully", user, token });
  } catch (error) {
    console.error('[register_user] Error:', error.message);
    res.status(400).json({ message: error.message || "Registration failed" });
  }
} 

export const login_user = async(req,res)=>{
  try {
    const {email,password} = req.body;
    const { user, token } = await loginUser(email,password);
    req.user = user;
    res.cookie("accessToken", token, cookieOptions);
    res.status(200).json({ message: "User logged in successfully", user, token });
  } catch (error) {
    console.error('[login_user] Error:', error.message);
    res.status(400).json({ message: error.message || "Login failed" });
  }
};