import logo from "../assets/agos_logo.png";
import {Link} from "react-router-dom";
import { useState } from "react";
import {Eye, EyeOff, LoaderCircle} from "lucide-react";

function Register (){

        const [name, setName] = useState('');
        const [email, setEmail] = useState('');
        const [city, setCity] = useState('');
        const [barangayId, setBarangayId] = useState('');
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
        const [error, setError] = useState('');
        const [isLoading, setIsLoading] = useState(false);

        const handleRegister = (e) => {
            e.preventDefault();
            setError('');

            if (!name.trim()) {
                setError('Please enter your name.');
                return;
            }
            if (!email) {
                setError('Please enter your email.');
                return;
            }
            if (!city) {
                setError('Please select your city.');
                return;
            }
            if (!barangayId) {
                setError('Please select your barangay.');
                return;
            }

            if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setError('Please enter a valid email address.');
                return;
            }

            if (!Object.values(passwordRequirements).every(Boolean)) {
                setError('Password does not meet the requirements.');
                return;
            }

            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                return;
            }

            setIsLoading(true);

            try {
                //supabase
            } catch (error) {
                setError('An error occurred during registration. Please try again.');
            } finally {
                setIsLoading(false);
            }
        }

    return (
        <main className="min-h-dvh flex items-center justify-center bg-primary p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-white rounded-lg shadow-lg overflow-hidden md:w-full max-w-4xl drop-shadow-2xl">
                <section className="flex flex-col items-center justify-center bg-primary/10 text-white p-0 md:p-8">
                    <img src={logo} alt="AGOS Logo" className="w-20 md:w-50 md:h-50" />
                </section>
                
                <section className="flex flex-col justify-center bg-white text-gray-800 p-8">
                    <h1 className="text-2xl font-extrabold mb-2 text-center">Register an account</h1>

                    <form noValidate onSubmit={handleRegister} className="">
                        <div className="mb-2">
                            <label htmlFor="name" className="block text-text/70 font-medium text-sm">Name</label>
                            <input type="text" id="name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-background rounded-lg w-full p-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary" placeholder="e.g., Juan Dela Cruz"/>
                        </div>

                        <div className="mb-2">
                            <label htmlFor="address" className="block text-text/70 font-medium text-sm">Address</label>
                            <div className="flex flex-col md:flex-row gap-2">

                                <label htmlFor="city" className="sr-only">City</label>
                                <select id="city" name="city" value={city} onChange={(e) => setCity(e.target.value)} required className="bg-background rounded-lg w-full p-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary">
                                    <option value="">Select your City</option>
                                    <option value="City 1">Batangas City</option>
                                    <option value="City 2">City 2</option>
                                    <option value="City 3">City 3</option>
                                </select>


                                <label htmlFor="barangay" className="sr-only">Barangay</label>
                                <select id="barangay" name="barangay" value={barangayId} onChange={(e) => setBarangayId(e.target.value)} required className="bg-background rounded-lg w-full p-2 text-xs border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary">
                                    <option value="">Select your Barangay</option>
                                    <option value="Address 1">Address 1</option>
                                    <option value="Address 2">Address 2</option>
                                    <option value="Address 3">Address 3</option>
                                </select>
                           </div>
                        </div>

                        <div className="mb-2">
                            <label htmlFor="email" className="block text-text/70 font-medium text-sm">Email</label>
                            <input type="email" id="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background rounded-lg w-full p-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary" placeholder="e.g., juan@example.com"/>
                        </div>
                       
                        <div className="mb-2">
                            <label htmlFor="password" className="block text-text/70 font-medium text-sm">Password</label>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} id="password" name="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required
                                className="bg-background rounded-lg w-full p-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary" placeholder="Enter your password"/>

                                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none">
                                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                            </div>

                            {password && (
                                <div className="text-xs mt-3" aria-live="polite">
                                
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
                                <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                                className="bg-background rounded-lg w-full p-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary" placeholder="Confirm your password"/>
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none">
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

                        {error && <p role="alert" className="text-red-500 text-xs mb-2">{error}</p>}

                        <button type="submit" disabled={isLoading} aria-busy={isLoading} className="bg-secondary text-white py-2.5 px-4 rounded-lg hover:bg-secondary-hover focus:outline-none focus:ring-1 focus:ring-secondary my-4 w-full">
                            {isLoading ? 'Registering...' : 'Register'}
                            {isLoading && <LoaderCircle className="ml-2 animate-spin" size={16} />}
                        </button>
                        
                    </form>

                    <p className="text-xs text-gray-600 text-center">
                        Already have an account? <Link to="/login" className="text-blue-500 hover:underline text-xs">
                            Log in
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    )
}

export default Register;