import Navbar from "../components/Navbar.jsx";
import {Outlet} from "react-router-dom";
import Footer from "../components/Footer";
import ChatbotButton from "../components/ChatbotButton";
import ChatbotWindow from "../pages/ChatbotWindow";
import { useState } from "react";

function MainLayout(){

    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    return (
        <>
            <Navbar />

            <main>
                <Outlet />
            </main>
            
            <Footer />

            <ChatbotWindow isOpen={isChatbotOpen} />

            <ChatbotButton onClick={() => setIsChatbotOpen(!isChatbotOpen)}
            isOpen={isChatbotOpen} />
        </>
    )
}

export default MainLayout;