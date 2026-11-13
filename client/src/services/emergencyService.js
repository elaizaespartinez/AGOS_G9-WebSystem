import {defaultLocalResponse, mockLocalResponse} from 
'../data/emergencyData.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const getLocalResponse = async ( {province, municipality, barangay }) => { 
    //mock only
    if (
        province == "batangas" &&
        municipality == "batangas-city" &&
        barangay == "alangilan"
    ) {
        return mockLocalResponse;
    }
    

    if (!API_BASE_URL) {
        console.error("API_BASE_URL is not defined. Please set the VITE_API_BASE_URL environment variable.");
        return defaultLocalResponse;
    }

    const params = new URLSearchParams({ province, municipality, barangay });

    const response = await fetch(`${API_BASE_URL}/local-response?${params.toString()}`);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch local response data: ${response.statusText}`);
    }

    return response.json();

}

export {getLocalResponse};