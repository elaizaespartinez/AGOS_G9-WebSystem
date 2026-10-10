import logo from "../assets/agos_logo.png";
import {Eye, EyeOff} from "lucide-react";
import { useState } from "react";

function Login(){

    const [showPassword, setShowPassword] = useState(false);
    return (
        <main className="min-h-dvh flex items-center justify-center bg-primary p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 bg-white rounded-lg shadow-lg overflow-hidden w-full md:w-full max-w-4xl drop-shadow-2xl">
                <section className="flex flex-col items-center justify-center bg-primary/10 text-white p-0 md:p-10">
                    <img src={logo} alt="AGOS Logo" className="w-20 md:w-50 md:h-50" />
                </section>

                <section className="flex flex-col justify-center bg-white text-gray-800 py-10 px-8 md:px-10">
                    <h1 className="text-3xl font-extrabold mb-4 text-text text-center">Login</h1>
                    <form>
                        <div className="mb-2">
                            <label htmlFor="email" className="block text-text/70 font-medium text-sm">Email</label>
                            <input type="email" id="email" name="email" required className="bg-background rounded-lg w-full p-3 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary" placeholder="e.g., juan@example.com"/>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="password" className="block text-text/70 font-medium text-sm">Password</label>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} id="password" name="password" required className="bg-background rounded-lg w-full p-3 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary mb-2 " placeholder="Enter your password"/>
                                <button type="button" className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <Eye /> : <EyeOff />}
                                </button>
                            </div>
                            <p className="text-sm text-text/70 hover:underline cursor-pointer text-end">Forgot Password?</p>
                        </div>
                        
                        <button className="bg-secondary text-white py-3 px-4 rounded-lg hover:bg-secondary-hover focus:outline-none focus:ring-1 focus:ring-secondary  w-full mb-2">
                            Login
                        </button>
                        <p className="text-center text-text/70 m-0 text-sm">Or</p>
                        <hr className="border-t border-gray-300 mt-1 mb-4" />

                        <button className="bg-white text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary  w-full border-secondary border">
                            Continue with Google
                        </button>
                    </form>
                </section>
            </div>
        </main>
    )
}

export default Login;