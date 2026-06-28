import User from "../model/user.model.js";
export  const findUserByEmail = async (email) => {
  
    return await User.findOne({ email });
  };

export const createUser = async (name, email, password) => {
    const user = new User({ name, email, password });
    await user.save();
    return user;  
  };

 export const findUserById = async (id) => {
    return await User.findById(id); 
 }