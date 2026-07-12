
import api from "../api"; // your api.js

/**
 * Sends signup data to backend and returns result
 * @param {Object} formData - { name, email, password, confirmPassword, country }
 * @returns {Object} { success: boolean, data?: any, message?: string }
 */

export const handleSignup = async (data) => {
  try {
    const res = await api.post("/auth/signup", data);

    return {
      success: true,
      accessToken: res.data.accessToken, 
      //token: res.data.token,
      data: res.data,   // ← keep full response
    };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Signup failed",
    };
  }
};

export const handleSignin = async (data) => {
  try {
    const res = await api.post("/auth/signin", data);

    return {
      success: true,
       
      accessToken: res.data.accessToken, 
      data: res.data,
      //token: res.data.token,
        // ← future-proof
    };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Signin failed",
    };
  }
};


