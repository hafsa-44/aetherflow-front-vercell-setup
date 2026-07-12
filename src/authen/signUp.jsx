/*import { useState } from "react";
import Select from "react-select";
import countryList from "react-select-country-list";
import { FcGoogle } from "react-icons/fc";
import { handleSignup } from "./signuphandler";
import { Link } from "react-router-dom";

function SignUP() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [successMessage ,setSuccessMessage]= useState("");

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(""); // main error at top
  const [touched, setTouched] = useState({}); // track field interaction

  const countries = countryList().getData();
  const emailRegex = /^[a-zA-Z0-9.#_-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Validate a single field
  const validateField = (field, value) => {
    switch (field) {
      case "name":
        if (!value) return "Username is required";
        if (value.length < 5) return "Username must be at least 5 characters";
        if (/^\d/.test(value)) return "Username cannot start with a digit";
        return null;
      case "email":
  
      if (!value) return "Email is required";

  // user is still typing (no intent yet)
     if (!value.includes("@")) return null;

  // user typed @ but no domain yet
    if (!value.includes(".")) return "Email is invalid";

  // final validation
     if (!emailRegex.test(value)) return "Email is invalid";

     return null;

      
     case "password":
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return null;
      case "confirmPassword":
        if (!value) return "Please confirm your password";
        if (value !== password) return "Passwords do not match";
        return null;
      case "country":
        if (!value) return "Country selection is required";
        return null;
      default:
        return null;
    }
  };

  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field, value) => {
    switch (field) {
      case "name":
        setName(value);
        break;
      case "email":
        setEmail(value);
        break;
      case "password":
        setPassword(value);
        break;
      case "confirmPassword":
        setConfirmPassword(value);
        break;
      case "country":
        setSelectedCountry(value);
        break;
      default:
        break;
    }

    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {
      name: validateField("name", name),
      email: validateField("email", email),
      password: validateField("password", password),
      confirmPassword: validateField("confirmPassword", confirmPassword),
      country: validateField("country", selectedCountry),
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      setFormError(" !All fields are required.");
      return;
    } else {
      setFormError("");
    }

    // Call backend
   
 

  const result = await handleSignup({
    name,
    email,
    password,
    confirmPassword,
    country: selectedCountry?.label,
    
  });
  if (result.success) {
  console.log("Signup success:", result);

  const user =
    result.data?.user || result.user || null;

  console.log("User:", user);

  setSuccessMessage("Signup successful!");
  setFormError("");
} else {
  setSuccessMessage("");
  setFormError(result.message);
}

}
    
 const ErrorMessage = ({ message }) => {
    if (!message) return null;
    return <div className="text-red-500 text-sm mb-1">{message}</div>;
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
      <form
      noValidate
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white shadow-2xl p-6 rounded-xl"
      >
        <h2 className="text-xl font-bold text-center mb-3">Please Sign Up</h2>

        {formError && (
          <div className="text-red-500 text-sm mb-3 text-center font-medium">
            {formError}
          </div>
        )}
        {successMessage && (
  <div className="bg-green-100 text-green-700 text-sm mb-3 text-center font-medium p-2 rounded-md">
    {successMessage}
  </div>
)}


        {touched.name && <ErrorMessage message={errors.name} />}
        <input
          type="text"
          placeholder="Enter Username"
          value={name}
          onChange={(e) => handleChange("name", e.target.value)}
          onBlur={() => handleBlur("name", name)}
          className="w-full p-2 border rounded-md mb-3 focus:ring-2 focus:ring-blue-400"
        />

        {touched.email && <ErrorMessage message={errors.email} />}
        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => handleChange("email", e.target.value)}
          onBlur={() => handleBlur("email", email)}
          className="w-full p-2 border rounded-md mb-3 focus:ring-2 focus:ring-blue-400"
        />

        {touched.password && <ErrorMessage message={errors.password} />}
        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => handleChange("password", e.target.value)}
          onBlur={() => handleBlur("password", password)}
          className="w-full p-2 border rounded-md mb-3 focus:ring-2 focus:ring-blue-400"
        />

        {touched.confirmPassword && <ErrorMessage message={errors.confirmPassword} />}
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          onBlur={() => handleBlur("confirmPassword", confirmPassword)}
          className="w-full p-2 border rounded-md mb-3 focus:ring-2 focus:ring-blue-400"
        />

        {touched.country && <ErrorMessage message={errors.country} />}
        <Select
          options={countries}
          value={selectedCountry}
          onChange={(value) => handleChange("country", value)}
          onBlur={() => handleBlur("country", selectedCountry)}
          placeholder="Select Country"
          className="mb-3"
        />

        <button
          type="submit"
          className="w-full bg-black text-white p-2 rounded-md hover:bg-gray-500 transition"
        >
          Sign Up
        </button>

        <p className="text-center mt-3 text-sm">
          Already have an account?{" "}
          <Link to="/signin" className="text-blue-600 font-medium">
            Sign In
          </Link>
        </p>

        <p className="text-center font-medium text-black mt-2">Or</p>

        <button
          type="button"
          className="w-full bg-black mt-2 flex items-center justify-center gap-3 border border-gray-300 py-2 rounded-md hover:bg-gray-500"
        >
          <FcGoogle size={24} />
          <span className="text-white font-medium">Continue with Google</span>
        </button>
      </form>
    </div>
  );
}

export default SignUP;
*/
import { useState } from "react";

import Select from "react-select";
import countryList from "react-select-country-list";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { handleSignup } from "./signuphandler";
import { Link } from "react-router-dom";
import { useAuth } from "../context/authcontext";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function SignUP() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const countries = countryList().getData();
  const emailRegex = /^[a-zA-Z0-9.#_-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  // ---------- VALIDATION ----------
  const validateField = (field, value, onSubmit = false) => {
    switch (field) {
      case "name":
        if (!value) return "Username is required";
        if (value.length < 5) return "Username must be at least 5 characters";
        if (/^\d/.test(value)) return "Username cannot start with a digit";
        return null;

      case "email":
        if (!value) return "Email is required";

    
          // allow typing without showing error immediately
          //if (!value.includes("@")) return null;
          //if (!value.includes(".")) return null;
        

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

      {/*case "password":
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return null;
*/}
      case "confirmPassword":
        if (!value) return "Please confirm your password";
        if (value !== password) return "Passwords do not match";
        return null;

      case "country":
        if (!value) return "Country is required";
        return null;

      default:
        return null;
    }
  };

  const isFormValid =
    !validateField("name", name, true) &&
    !validateField("email", email, true) &&
    !validateField("password", password, true) &&
    !validateField("confirmPassword", confirmPassword, true) &&
    !validateField("country", selectedCountry, true);

  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field, value) => {
    const setters = {
      name: setName,
      email: setEmail,
      password: setPassword,
      confirmPassword: setConfirmPassword,
      country: setSelectedCountry,
    };
    setters[field]?.(value);

    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  // ---------- SUBMIT ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {
      name: validateField("name", name, true),
      email: validateField("email", email, true),
      password: validateField("password", password, true),
      confirmPassword: validateField("confirmPassword", confirmPassword, true),
      country: validateField("country", selectedCountry, true),
    };

    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      country: true,
    });

    if (Object.values(newErrors).some(Boolean)) {
      setFormError("All fields are required!");
      return;
    } else {
      setFormError("");
    }
  let result;
   try {
     result = await handleSignup({
      name,
      email,
      password,
      confirmPassword,
      country: selectedCountry?.label,
    });
  }
catch (err) {
  setFormError("Server error. Please try again.");
  return;
}
if (!result) {
  setFormError("Unexpected error. Please try again.");
  return;
}
if (result?.success) {
  setSuccessMessage("Sign up successful!");
  //await login(result.token); 
  await login(result.accessToken);
  //await login(data.accessToken); // ← saves to localStorage + populates currentUser in context
  
  // Handle invite redirect — if user came from /invite/:token, go back there
  const redirect = searchParams.get("redirect")
    navigate(redirect || "/dashboard");
} else {
  setFormError(result?.message || "Sign up failed. Please try again.");
}
/*if (result?.success) {
  setSuccessMessage("Sign up successful!");
  
  localStorage.setItem("token", result.token);
  setTimeout(() => {
    navigate("/dashboard");
  }, 1500);

} else {
  setFormError(result?.message || "Invalid email or password");
}

    
        //localStorage.setItem("user", JSON.stringify(result.data)); // store user info
  
        // localStorage.setItem("token", result.token);
 
*/        
};

  const ErrorMessage = ({ message }) =>
    message ? <div className="text-red-500 text-sm mb-1">{message}</div> : null;

  return (
    <div className="min-h-screen flex justify-center items-center relative">
      {/* Global Error Tooltip */}
      {formError && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
          <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-red-500 absolute -top-2 left-1/2 -translate-x-1/2"></div>
          <span>{formError}</span>
        </div>
      )}

      <form
        noValidate
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white shadow-2xl p-6 rounded-xl"
      >
        <h2 className="text-xl font-bold text-center mb-3">Please Sign Up</h2>

        {successMessage && (
          <div className="bg-green-100 text-green-700 text-sm mb-3 text-center font-medium p-2 rounded-md">
            {successMessage}
          </div>
        )}

        {/* Username */}
        {touched.name && <ErrorMessage message={errors.name} />}
        <input
          type="text"
          placeholder="Enter Username"
          value={name}
          onChange={(e) => handleChange("name", e.target.value)}
          onBlur={() => handleBlur("name", name)}
          className="w-full p-2 border rounded-md mb-3 focus:ring-2 focus:ring-blue-400"
        />

        {/* Email */}
        {touched.email && <ErrorMessage message={errors.email} />}
        <input
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) => handleChange("email", e.target.value)}
          onBlur={() => handleBlur("email", email)}
          className="w-full p-2 border rounded-md mb-3 focus:ring-2 focus:ring-blue-400"
        />

        {/* Password */}
        {touched.password && <ErrorMessage message={errors.password} />}
        <div className="relative mb-3">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter Password"
            value={password}
            onChange={(e) => handleChange("password", e.target.value)}
            onBlur={() => handleBlur("password", password)}
            className="w-full p-2 border rounded-md pr-10 focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={15} />}
          </button>
        </div>

        {/* Confirm Password */}
        {touched.confirmPassword && <ErrorMessage message={errors.confirmPassword} />}
        <div className="relative mb-3">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => handleChange("confirmPassword", e.target.value)}
            onBlur={() => handleBlur("confirmPassword", confirmPassword)}
            className="w-full p-2 border rounded-md pr-10 focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={15} />}
          </button>
        </div>

        {/* Country */}
        {touched.country && <ErrorMessage message={errors.country} />}
        <Select
         classNamePrefix="react-select"
          options={countries}
          value={selectedCountry}
          onChange={(value) => handleChange("country", value)}
          onBlur={() => handleBlur("country", selectedCountry)}
          placeholder="Select Country"
          className="mb-3"
        />

        {/* Signup Button */}
        <button
          type="submit"
          disabled={!isFormValid}
          className={`w-full p-2 rounded-md transition ${
            isFormValid
              ? "bg-black text-white hover:bg-gray-500"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Sign Up
        </button>

        <p className="text-center mt-3 text-sm">
          Already have an account?{" "}
          <Link to="/signin" className="text-blue-600 font-medium">
            Sign In
          </Link>
        </p>

        <p className="text-center font-medium text-black mt-2">Or</p>

        <button
          type="button"
          onClick={() => {
            // ✅ Correct - should point to the START of Google OAuth flow
           window.location.href = 'http://localhost:5000/api/auth/google';
    //window.location.href = window.location.href = 'http://localhost:5000/api/auth/google/callback?code=...';
 
  }}
             
          className="w-full bg-black mt-2 flex items-center justify-center gap-3 border border-gray-300 py-2 rounded-md hover:bg-gray-500"
        >
          <FcGoogle size={24} />
          <span className="text-white font-medium">Continue with Google</span>
        </button>
      </form>
    </div>
  );
}

export default SignUP;
