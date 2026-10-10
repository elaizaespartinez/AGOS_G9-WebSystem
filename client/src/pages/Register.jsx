import logo from "../assets/agos_logo.png";
import {Link} from "react-router-dom";
import { useState } from "react";
import {Eye, EyeOff} from "lucide-react";

function Register (){


        const [password, setPassword] = useState('');
        const passwordRequirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        }
        
        const [showPassword, setShowPassword] = useState(false);
        const [confirmPassword, setConfirmPassword] = useState('');
        const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <main className="min-h-dvh flex items-center justify-center bg-primary p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-white rounded-lg shadow-lg overflow-hidden md:w-full max-w-4xl drop-shadow-2xl">
                <section className="flex flex-col items-center justify-center bg-primary/10 text-white p-0 md:p-8">
                    <img src={logo} alt="AGOS Logo" className="w-20 md:w-50 md:h-50" />
                </section>
                
                <section className="flex flex-col justify-center bg-white text-gray-800 p-8">
                    <h1 className="text-2xl font-extrabold mb-2 text-center">Register an account</h1>
                    <form className="">
                        <div className="mb-2">
                            <label htmlFor="name" className="block text-text/70 font-medium text-sm">Name</label>
                            <input type="text" id="name" name="name" required className="bg-background rounded-lg w-full p-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary" placeholder="e.g., Juan Dela Cruz"/>
                        </div>

                         <div className="mb-2">
                            <label htmlFor="address" className="block text-text/70 font-medium text-sm">Address</label>
                           <div className="flex flex-col md:flex-row gap-2">

                                <select id="city" name="city" required className="bg-background rounded-lg w-full p-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary">
                                    <option value="">Select your City</option>
                                    <option value="City 1">Batangas City</option>
                                    <option value="City 2">City 2</option>
                                    <option value="City 3">City 3</option>
                                </select>

                                <select id="address" name="address" required className="bg-background rounded-lg w-full p-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary">
                                    <option value="">Select your Barangay</option>
                                    <option value="Address 1">Address 1</option>
                                    <option value="Address 2">Address 2</option>
                                    <option value="Address 3">Address 3</option>
                                </select>
                           </div>
                        </div>

                         <div className="mb-2">
                            <label htmlFor="email" className="block text-text/70 font-medium text-sm">Email</label>
                            <input type="email" id="email" name="email" required className="bg-background rounded-lg w-full p-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary" placeholder="e.g., juan@example.com"/>
                        </div>
                       
                        <div className="mb-2">
                            <label htmlFor="password" className="block text-text/70 font-medium text-sm">Password</label>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                                className="bg-background rounded-lg w-full p-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary" placeholder="Enter your password"/>

                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none">
                                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                            </div>

                            {password && (
                                <div className="text-xs mt-3 ">
                                
                                    <p className={passwordRequirements.length ? "text-green-500 " : "text-red-500"}>• At least 8 characters</p>
                                    <p className={passwordRequirements.uppercase ? "text-green-500" : "text-red-500"}>• At least one uppercase letter</p>
                                    <p className={passwordRequirements.lowercase ? "text-green-500" : "text-red-500"}>• At least one lowercase letter</p>
                                    <p className={passwordRequirements.number ? "text-green-500" : "text-red-500"}>• At least one number</p>
                                    <p className={passwordRequirements.specialChar ? "text-green-500" : "text-red-500"}>• At least one special character</p>
                            
                                </div>
                            )}

                        </div>

                        <div className="mb-2">
                            <label htmlFor="confirmPassword" className="block text-text/70 font-medium text-sm">Confirm Password</label>
                            <div className="relative">
                                <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                                className="bg-background rounded-lg w-full p-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary" placeholder="Confirm your password"/>
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none">
                                    {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                            </div>
                        
                        {confirmPassword && (
                            <div className="text-xs mt-1">
                                {confirmPassword === password ? (
                                    <p className="text-green-500">Passwords match</p>
                                ) : (
                                    <p className="text-red-500">Passwords do not match</p>
                                )}
                            </div>
                        )}
                          
                        </div>
                        <button type="submit" className="bg-secondary text-white py-2 px-4 rounded-lg hover:bg-secondary-hover focus:outline-none focus:ring-1 focus:ring-secondary my-4 w-full">
                            Register
                        </button>
                    </form>
                    <p className="text-sm text-gray-600 text-center">
                        Already have an account? 
                        <Link to="/login" className="text-secondary hover:underline">
                            Log in
                        </Link>
                    </p>
                </section>
            </div>

        </main>
    )
}

export default Register;