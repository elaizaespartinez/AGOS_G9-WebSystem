import logo from "../assets/agos_logo.png";

function Footer(){
    return(
        <footer className="flex flex-col justify-between items-center gap-4 p-4 md:px-32 bg-primary/10 text-white">
            <div className="w-32 md:w-64">
                <img src={logo} alt="AGOS Logo" className="w-full h-auto"/>
                
            </div>
            <p className="text-lg text-text  font-bold text-center mt-0 italic">
                    <span className="text-primary">A</span>BISO AT <span className="text-primary">G</span>ABAY SA <span className="text-primary">O</span>RAS NG <span className="text-primary">S</span>AKUNA
                </p>
            <hr className="w-full border-1.5 border-primary" />
            <div>
                <p className="text-xs text-center text-primary font-medium italic">
                    © 2026 AGOS. Abiso at Gabay sa Oras ng Sakuna. All rights reserved.
                </p>
            </div>
        </footer>
    )

}

export default Footer;