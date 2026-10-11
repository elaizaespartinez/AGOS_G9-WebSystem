import {KeyRound, Eye, EyeOff, Check} from "lucide-react";
import resetPasswordImage from "../assets/visuals/reset-password.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
function ResetPassword() {

    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const passwordRequirements = {
            length: newPassword.length >= 8,
            uppercase: /[A-Z]/.test(newPassword),
            lowercase: /[a-z]/.test(newPassword),
            number: /[0-9]/.test(newPassword),
            specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
        }
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);


    const handleResetPassword = async (e) => {
        e.preventDefault(); 
        setError('');

        if (!newPassword || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }   

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        
        if (!Object.values(passwordRequirements).every(Boolean)) {
                setError('Password does not meet the requirements.');
                return;
        }

        

        try {
            // supabase

            setSuccess(true);
        } catch (error) {
            setError('An error occurred while resetting the password. Please try again.');
        }

    }
    

    return (
        <main className="min-h-dvh flex items-center justify-center bg-primary p-4">
            <div className="flex flex-col md:flex-row bg-white rounded-lg shadow-lg overflow-hidden md:w-full max-w-4xl drop-shadow-2xl">
                <section className="flex flex-col items-center justify-center bg-white text-white p-3 md:p-8 md:w-1/2">
                    <img src={resetPasswordImage} alt="Reset Password" className="block w-full max-w-30 md:max-w-sm md:max-h-120 mx-auto object-contain"/>
                </section>

                <section className="flex flex-col justify-center bg-white text-gray-800 pb-8 pt-0 px-8 md:px-10 md:w-1/2">
                    <div className="hidden md:flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 p-3">
                        <KeyRound className="w-12 h-12 text-primary" />
                    </div>
                    
                    <h1 className="text-2xl font-extrabold mb-4 text-text text-center">Set your new password</h1>
                    <p className="text-text/70 text-sm mb-4 text-center">Create a new password to regain access to your account.</p>

                    <form noValidate className="mb-4" onSubmit={handleResetPassword}>
                        <div className="mb-2">
                            <label htmlFor="newPassword" className="block text-text/70 font-medium text-sm">New Password</label>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} id="newPassword" name="newPassword" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
                                className="bg-background rounded-lg w-full p-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary" placeholder="Enter your new password"/>

                                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none">
                                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                            </div>

                            {newPassword && (
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
                            <label htmlFor="confirmPassword" className="block text-text/70 font-medium text-sm">Confirm New Password</label>
                            <div className="relative">
                                <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                                className="bg-background rounded-lg w-full p-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary" placeholder="Confirm your password"/>
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none">
                                    {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                            </div>
                        
                            {confirmPassword && (
                                <div className="text-xs mt-1">
                                    {confirmPassword === newPassword ? (
                                        <p className="text-green-500">Passwords match</p>
                                    ) : (
                                        <p className="text-red-500">Passwords do not match</p>
                                    )}
                                </div>
                            )}                         
                        </div>

                        {error && <p role="alert" className="text-red-500 text-xs mb-2">{error}</p>}


                        <button type="submit" className="w-full bg-secondary text-white rounded-lg py-3 px-4 text-sm font-medium hover:bg-secondary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 mt-3">Reset Password</button>

                    </form>

                    {success && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                            <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl">
                                
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                                    <Check className="h-8 w-8 text-green-500" />
                                </div>

                                <h2 className="mb-2 text-xl font-bold text-text">
                                    Password Reset Successful
                                </h2>

                                <p className="mb-6 text-sm text-text/70">
                                    Your password has been successfully reset.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="w-full rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-white hover:bg-secondary-hover"
                                >
                                    Back to Login
                                </button>

                            </div>
                        </div>
)}
                   
                </section>
            </div>
        </main>
    );
}

export default ResetPassword