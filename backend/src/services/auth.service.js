import jsonwebtoken from "jsonwebtoken";
import { findUserByEmail, createUser } from "../dao/user.dao.js";

import {signToken} from "../utils/helper.js";

export const registerUser = async (name,email,password)=>{

  const user = await findUserByEmail(email);
  if (user) { 
    throw new Error("User already exists")
    }
   const newUser = await createUser(name,email,password);
   const token =await signToken({ userId: newUser._id });
   return { user: newUser, token };


}


export const loginUser = async (email,password)=>{
  const user = await findUserByEmail(email);
  
  if(!user || user.password !== password){ 
    throw new Error("Invalid email or password");
  }
  const token = await signToken({ userId : user._id });
  return { user, token };
}

