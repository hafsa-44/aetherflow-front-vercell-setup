
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { handleSignin } from "./signuphandler";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom"; 
import { useAuth } from "../context/authcontext";
import { useSearchParams } from "react-router-dom";
function SignIN() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState(""); // floating tooltip
  const [successMessage, setSuccessMessage] = useState(""); 
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
const [searchParams] = useSearchParams();

  const emailRegex = /^[a-zA-Z0-9.#_-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Validate a single field
  const validateField = (field, value) => {
    switch (field) {
      case "email":
        if (!value) return "Email is required";
        if (!value.includes("@")) return null; // allow typing
        if (!value.includes(".")) return "Email is invalid";
        if (!emailRegex.test(value)) return "Email is invalid";
        return null;
         case "password": {
  if (!value) return "Password is required";
  if (value.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(value)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(value)) return "Password must contain at least one number";
  if (!/[^A-Za-z0-9]/.test(value)) return "Password must contain at least one special character (!@#$%^&*)";
  if (/^[a-zA-Z]+$/.test(value)) return "Plain English words are not allowed — mix letters, numbers, and symbols";
  const common = ["password", "123456", "qwerty", "letmein", "welcome", "iloveyou", "admin", "passw0rd"];
  if (common.includes(value.toLowerCase())) return "This password is too common — please choose a stronger one";
  return null;
}
    {/*}  case "password":
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        if (/\s/.test(value)) return "Password cannot contain spaces";
        return null;*/}
      default:
      return null;
    }
  };

  const handleBlur = (field, value) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = (field, value) => {
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);

    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    // Validate all fields
    const newErrors = {
      email: validateField("email", email),
      password: validateField("password", password),
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      // Show floating tooltip if any field invalid
      setFormError("⚠All fields are required");
      setTimeout(() => setFormError(""), 3000); // disappear after 3 sec
      return;
    }

    // Call backend API
let result;
setFormError("");
try {
  result = await handleSignin({ email, password });

if (result?.success) {
  setSuccessMessage("Sign in successful!");
 // await login(result.token);  
  await login(result.accessToken);
  // ← saves to localStorage + populates currentUser in context
   console.log("SIGNIN RESULT:", result);  
  // Handle invite redirect — if user came from /invite/:token, go back there
  const redirect = searchParams.get("redirect");
   navigate(redirect || "/dashboard", { replace: true });
    // Use a small delay or ensure context is updated before moving
    // This prevents the Dashboard from firing a 401 request prematurely
  
  
} 
else {
  setFormError(result?.message || "Invalid email or password");
}  
}
catch (err) {
  if (err.response?.status === 401) {
    setFormError("Incorrect email or password.");
  }
    else{
  setFormError("Server error. Please try again.");}
  return;
}
/*if (result?.success) {
  setSuccessMessage("Sign in successful!");
  localStorage.setItem("token", result.token);
  //navigate("/dash");
  navigate("/dashboard");
} else {
  setFormError(result?.message || "Invalid email or password");
}
*/
 
};

  const ErrorMessage = ({ message }) => message ? (
    <div className="text-red-500 text-sm mb-1">{message}</div>
  ) : null;

  return (
    <div className="min-h-screen flex justify-center items-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white shadow-2xl p-6 rounded-xl relative">
        <h2 className="text-2xl font-bold text-center mb-4">Welcome here!</h2>

        {/* Floating tooltip */}
        {formError && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-500 text-white text-sm px-4 py-2 rounded-md mt-[-50px] shadow-lg flex items-center gap-2">
             {formError}
          </div>
        )}

        {successMessage && (
          <div className="text-green-600 font-bold text-center mb-3">{successMessage}</div>
        )}

        {/* Email */}
        {touched.email && <ErrorMessage message={errors.email} />}
        <input
          id = "email"
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={e => handleChange("email", e.target.value)}
          onBlur={() => handleBlur("email", email)}
          className="w-full p-2 border rounded-md mb-3 pr-10  focus:ring-2 focus:ring-blue-400"
        />

        {/* Password */} 
        {touched.password && <ErrorMessage message={errors.password} />}
        <div className="relative mb-3">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter Password"
            value={password}
            onChange={e => handleChange("password", e.target.value)}
            onBlur={() => handleBlur("password", password)}
            className="w-full p-2 border rounded-md pr-10 focus:ring-2 focus:ring-blue-400"
        />
          
             <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 focus:outline-none focus:ring-0 focus:shadow-none outline-none"
  tabIndex={-1}
>

            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>

        </div>

        {/* Sign In */}
        <button
          type="submit"
          className="w-full bg-black text-white p-2 rounded-md hover:bg-gray-500 transition"
        >
          Sign In
        </button>

        <p className="text-center font-medium text-black mt-2">Or</p>

        <button
          type="button"
           onClick={() => {
  //window.location.href = 'http://localhost:5000/api/auth/google';
   const redirect = searchParams.get("redirect");
   const redirectParam = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";
    window.location.href = `http://localhost:5000/api/auth/google${redirectParam}`;
  }}
          className="w-full bg-black mt-2 flex items-center justify-center gap-3 border border-gray-300 py-2 rounded-md hover:bg-gray-500"
        >
          <FcGoogle size={24} />
          <span className="text-white font-medium">Continue with Google</span>
        </button>

        <p className="text-center text-sm mt-3">
          Don't have an account?{" "}
          <Link to="/signUp" className="text-blue-600 font-medium">
            Sign UP
          </Link>
        </p>
      </form>
    </div>
  );
}

export default SignIN;
