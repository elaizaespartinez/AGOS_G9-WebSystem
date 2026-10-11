import logo from "../assets/agos_logo.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";


function CompleteProfile (){

    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [provinceID, setProvinceID] = useState('');
    const [cityId, setCityId] = useState('');
    const [barangayId, setBarangayId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCompleteProfile = async (e) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || !email || !cityId || !barangayId) {
            setError('Please fill in all fields.');
            return;
        }

        setIsLoading(true);

        try {
            // supabase
            // navigate to home    
        }
        catch (error) {
            setError('An error occurred while completing your profile. Please try again.');
        }
        finally {
            setIsLoading(false);
        }   

    };


    return (
        <main className="min-h-dvh flex items-center justify-center bg-primary p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-white rounded-lg shadow-lg overflow-hidden md:w-full max-w-4xl drop-shadow-2xl">
                <section className="flex flex-col items-center justify-center bg-primary/10 text-white p-0 md:p-8">
                    <img src={logo} alt="AGOS Logo" className="w-20 md:w-50 md:h-50" />
                </section>
                
                <section className="flex flex-col justify-center bg-white text-gray-800 p-6">

                    <h1 className="text-lg font-extrabold mb-2 text-center">Complete Your Profile</h1>
                    <p className="text-sm text-text/70 text-center font-agos-sub">Just a few more details to get started with AGOS</p>

                    <form onSubmit={handleCompleteProfile} className="">
                        <div className="mb-2">
                            <label htmlFor="name" className="block text-text/70 font-medium text-sm">Name</label>
                            <input type="text" id="name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required className="bg-background rounded-lg w-full p-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary" placeholder="e.g., Juan Dela Cruz"/>
                        </div>

                        <div className="mb-2">
                            <label htmlFor="email" className="block text-text/70 font-medium text-sm">Email</label>
                            <input type="email" readOnly id="email" name="email"  required value={email}  className="bg-background rounded-lg w-full p-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary read-only:cursor-not-allowed read-only:bg-gray-100 read-only:border-gray-300" placeholder="e.g., juan@example.com"/>
                        </div>
                        
                        <div className="mb-2">
                            <label htmlFor="province" className="block text-text/70 font-medium text-sm">Province</label>
                            <select id="province" name="province" required value={provinceID} onChange={(e) => setProvinceID(e.target.value)} className="bg-background rounded-lg w-full p-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary">
                                <option value="">Select your Province</option>
                                <option value="1">Batangas</option>
                                <option value="2">Province 2</option>
                                <option value="3">Province 3</option>
                            </select>
                        </div>

                        <div className="mb-2">
                            <label htmlFor="city" className="block text-text/70 font-medium text-sm">City</label>
                            <select id="city" name="city" required value={cityId} onChange={(e) => setCityId(e.target.value)} className="bg-background rounded-lg w-full p-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary">
                                <option value="">Select your City</option>
                                <option value="1">Batangas City</option>
                                <option value="2">City 2</option>
                                <option value="3">City 3</option>
                            </select>
                        </div>

                        <div className="mb-2">
                            <label htmlFor="barangay" className="block text-text/70 font-medium text-sm">Barangay</label>
                            <select id="barangay" name="barangay" required value={barangayId} onChange={(e) => setBarangayId(e.target.value)} className="bg-background rounded-lg w-full p-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-secondary">
                                <option value="">Select your Barangay</option>
                                <option value="1">Barangay 1</option>
                                <option value="2">Barangay 2</option>
                                <option value="3">Barangay 3</option>
                            </select>
                        </div>

                        

                        {error && <p role ="alert" className="text-red-500 text-xs mt-2">{error}</p>}
                       
                        
                        <button type="submit" 
                        disabled={isLoading} className="bg-secondary text-white py-2 px-4 rounded-lg hover:bg-secondary-hover focus:outline-none focus:ring-1 focus:ring-secondary mt-4 w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                            {isLoading ? 'Completing...' : 'Complete Profile'}
                            {isLoading && <LoaderCircle className="ml-2 animate-spin" size={16} />}
                        </button>
                        
                        <p className="text-xs font-agos-sub text-gray-600 text-center mt-4">
                            Your profile helps AGOS provide relevant local disaster information.
                        </p>

                    </form>
                                    
                </section>
            </div>
        </main>
    )
}

export default CompleteProfile;