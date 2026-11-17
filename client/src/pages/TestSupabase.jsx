
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function TestSupabase() {
    const [result, setResult] = useState("Not tested");

    const testConnection = async () => {
        setResult("Testing...");

        try {
            const { error } = await supabase.auth.getSession();

            if (error) throw error;

            setResult("Connected to Supabase!");
        } catch (error) {
            setResult(`Connection failed: ${error.message}`);
        }
    };

    return (
        <div className="p-6">
            <button
                onClick={testConnection}
                className="rounded bg-blue-600 px-4 py-2 text-white"
            >
                Test Supabase Connection
            </button>

            <p className="mt-4">{result}</p>
        </div>
    );
}
