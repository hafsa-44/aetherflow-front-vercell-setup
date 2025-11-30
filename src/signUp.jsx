import { useState } from "react";
import Select from "react-select";
import countryList from "react-select-country-list";
import { FcGoogle } from "react-icons/fc";
function SignUP() {
     const [name, setName] = useState("");
     const [email, setEmail] = useState("");
     const [password, setPassword] = useState("");
     const [confirmPassword, setConfirmPassword] = useState("");
     const [condition, setCondition] = useState("");
     const [selectedCountry, setSelectedCountry] = useState(null);

     const countries = countryList().getData();

     const handleSubmit = (e) => {
          e.preventDefault();
          console.log({ name, email, password, confirmPassword, condition, selectedCountry });
     };

     return (
          <div className="min-h-screen flex justify-center items-center">
               <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md bg-white shadow-2xl p-6 rounded-xl"
               >
                    <h2 className="text-xl font-bold text-center mb-5">
                         Please Sign Up
                    </h2>

                    {/* Username */}
                    <input
                         type="text"
                         placeholder="Enter Username"
                         value={name}
                         onChange={(e) => setName(e.target.value)}
                         className="w-full p-2 border rounded-md mb-3 focus:ring-2 focus:ring-blue-400"
                    />

                    {/* Email */}
                    <input
                         type="email"
                         placeholder="Enter Email"
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         className="w-full p-2 border rounded-md mb-3 focus:ring-2 focus:ring-blue-400"
                    />

                    {/* Password */}
                    <input
                         type="password"
                         placeholder="Enter Password"
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         className="w-full p-2 border rounded-md mb-3 focus:ring-2 focus:ring-blue-400"
                    />

                    {/* Confirm Password */}
                    <input
                         type="password"
                         placeholder="Confirm Password"
                         value={confirmPassword}
                         onChange={(e) => setConfirmPassword(e.target.value)}
                         className="w-full p-2 border rounded-md mb-3 focus:ring-2 focus:ring-blue-400"
                    />

                    {/* Country Select */}
                    <Select
                         options={countries}
                         value={selectedCountry}
                         onChange={setSelectedCountry}
                         placeholder="Seclect Country"
                         className="mb-3"
                    />
                    <button
                         type="submit"
                         className="w-full bg-black  text-white p-2 rounded-md hover:bg-gray-500 transition"
                    >
                         Sign Up
                    </button>
                    <p className="text-center font-medium text-black">Or</p>

                    <button
                         type="button"
                         className="w-full bg-black mt-2 flex items-center justify-center gap-3 border border-gray-300 py-2 rounded-md hover:bg-gray-500"
                    >
                         <FcGoogle size={24} />
                         <span className="text-white  gap-3 font-medium">Continue with Google</span>
                    </button>
                    {/* <p className="text-gray-600 mb-3">
                         Selected Country: <span className="font-bold">{selectedCountry?.label}</span>
                    </p> */}

                    {/* Submit Button */}

               </form>
          </div>
     );
}

export default SignUP;
