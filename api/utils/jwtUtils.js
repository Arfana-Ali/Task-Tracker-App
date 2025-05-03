import jwt from "jsonwebtoken";


export const generateToken = (payload, secret, expiry) => {
  return jwt.sign(payload, secret, { expiresIn: expiry });
};


export const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret); 
  } catch (err) {
    throw new Error("Invalid or expired token"); 
  
  }
};
