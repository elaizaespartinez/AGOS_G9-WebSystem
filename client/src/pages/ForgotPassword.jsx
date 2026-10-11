import {LockKeyhole} from "lucide-react";
import forgotPasswordImage from "../assets/visuals/forgot-password.png";
import { useState } from "react";

function ForgotPassword() {

    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter your email address.');
            return;
        }
        try {
            // supabase
          
        } catch (error) {
            setError('An error occurred while sending the reset link. Please try again.');
        } 
    };

    return (
        <main className="min-h-dvh flex items-center justify-center bg-primary p-4">
            <div className="flex flex-col md:flex-row bg-white rounded-lg shadow-lg overflow-hidden md:w-full max-w-4xl drop-shadow-2xl">
                <section className="flex flex-col items-center justify-center bg-white text-white p-4 md:p-8 md:w-1/2">
                    <img src={forgotPasswordImage} alt="Forgot Password" className="w-full max-w-30 md:max-w-sm max-h-120 mx-auto object-contain"/>
                </section>

                <section className="flex flex-col justify-center bg-white text-gray-800 pb-8 pt-0 px-8 md:px-10 md:w-1/2">
                    <div className="hidden md:flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 p-3">
                        <LockKeyhole className="w-12 h-12 text-primary" />
                    </div>
                    
                    <h1 className="text-2xl font-extrabold mb-4 text-text text-center">Forgot Password</h1>
                    <p className="text-text/70 text-sm mb-4 text-center">Enter your email address to reset your password.</p>

                    <form noValidate className="mb-4" onSubmit={handleForgotPassword}>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-text/70 font-medium text-sm mb-2">Email</label>
                            <input type="email" id="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-background rounded-lg w-full p-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary" placeholder="e.g., juandela@example.com" />
                        </div>
                        {error && <p role="alert" className="text-red-500 text-xs mb-2">{error}</p>}
                        <button type="submit" className="w-full bg-secondary text-white rounded-lg py-3 px-4 text-sm font-medium hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1">Send Reset Link</button>

                        {success && <p role="alert" className="text-green-500 text-xs mb-2">Reset link sent successfully!</p>}
                    </form>
                   
                </section>
            </div>
        </main>
    );
}

export default ForgotPassword;