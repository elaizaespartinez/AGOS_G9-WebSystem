import logo from "../assets/agos_logo.png";
import {Eye, EyeOff, LoaderCircle} from "lucide-react";
import { useState } from "react";
import googleLogo from "../assets/google-logo.png";
import login from "../assets/visuals/login.png";
import {Link} from "react-router-dom";
import { useNavigate } from "react-router-dom";

function Login(){


    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setIsLoading(true);

        try {
            // supabase

        } catch (error) {
            setError('An error occurred during login. Please try again.');
        } finally {
            setIsLoading(false);
        }

  
    };

    const handleGoogleLogin = async () => {
        setError('');
        setIsGoogleLoading(true);
        try {
            // supabase
            
        } catch (error) {
            setError('An error occurred during Google login. Please try again.');
        } finally {
            setIsGoogleLoading(false);
        }
    };

    return (
        <main className="min-h-dvh flex items-center justify-center bg-primary p-3 sm:p-4">

            <div className="flex flex-col md:flex-row bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-md md:max-w-4xl drop-shadow-2xl">
                
                <section className="flex flex-col items-center justify-center bg-white text-white p-4 md:p-8 md:w-1/2">
                    <img src={login} alt="Login" className="w-full max-w-30 md:max-w-xs max-h-120 mx-auto object-contain"/>
                </section>

                <section className="flex flex-col justify-center bg-white text-gray-800 pb-8 pt-0 px-8 md:px-10 md:py-8 md:w-1/2">
                    <h1 className="text-3xl font-extrabold mb-4 text-text text-center">Login</h1>

                    <form noValidate onSubmit={handleLogin} className="space-y-4">
                        
                        <div className="mb-2">
                            <label htmlFor="email" className="block text-text/70 font-medium text-sm">Email</label>
                            <input type="email" id="email" name="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background rounded-lg w-full p-3 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary" placeholder="e.g., juan@example.com"/>
                        </div>

                        <div className="mb-4">
                            <div className="mb-2">
                                <label htmlFor="password" className="block text-text/70 font-medium text-sm">Password</label>
                                <div className="relative">
                                    <input type={showPassword ? "text" : "password"} id="password" name="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="bg-background rounded-lg w-full p-3 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary mb-2 " placeholder="Enter your password"/>
                                    <button type="button" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <Eye /> : <EyeOff />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                    <input type="checkbox" id="remember" name="remember" 
                                    checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} 
                                    className="form-checkbox h-4 w-4 text-secondary focus:ring-secondary border-gray-300 rounded" />
                                    <label htmlFor="remember" className="ml-2 text-xs text-text/70 ">Remember me</label>
                                </div>

                                <Link to="/forgot-password" className="text-xs text-text/70 hover:underline cursor-pointer text-end">Forgot Password?</Link>
                            </div>
                            
                        </div>

                        {error && <p role="alert" className="text-red-500 text-xs mb-2">{error}</p>}
                        
                        <button type="submit" 
                            disabled={isLoading || isGoogleLoading} 
                            className="bg-secondary text-white py-3 px-4 rounded-lg hover:bg-secondary-hover focus:outline-none focus:ring-1 focus:ring-secondary  w-full mb-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? 'Logging in...' : 'Login'}
                            {isLoading && <LoaderCircle className="animate-spin ml-2 inline-block" size={16} />}
                        </button>

                        <div className="flex items-center justify-center mb-2">
                            <hr className="flex-1 border-gray-300" />
                            <span className="text-center text-text/70 m-0 text-sm mx-3">Or</span>
                            <hr className="flex-1 border-gray-300" />
                            
                        </div>

                        <button
                            type="button" onClick={handleGoogleLogin} disabled={isGoogleLoading || isLoading}
                            className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2focus:ring-offset-2 focus:ring-gray-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            <img src={googleLogo} alt="Google" className="w-5 h-5 mr-2" />
                            <span>{isGoogleLoading ? 'Signing in...' : 'Sign in with Google'}</span>
                            {isGoogleLoading && <LoaderCircle className="animate-spin ml-2 inline-block" size={16} />}
                        </button>

                        <p className="text-xs text-text text-center">Dont have an account? <Link to="/register" className="text-blue-500 hover:underline">Register</Link></p>                     
                    </form>
                </section>
            </div>
        </main>
    )
}

export default Login;