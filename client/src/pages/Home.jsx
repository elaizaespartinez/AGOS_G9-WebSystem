import ServiceCard from '../components/ServiceCard'
import {Map, BusFront, PhoneIncoming, ContactRound, Mail, Phone} from "lucide-react";
import {Link} from "react-router-dom";
import register from './Register';
import ContactUs from './ContactUs';

function Home() {
    return (
        <main>

            {/* current conditions */}
            <section>
                <div>
                    <h1>28&deg;C</h1>
                    <p>Cloudy</p>
                </div>

                <div>
                    <p>Brgy. Alangilan</p>
                    <p>MON, September 28</p>
                    <p>4:48:30 PM</p>
                </div>
            </section>

            {/* agos dashboard */}
            <section>
                
                <header>
                    <h1>AGOS Dashboard</h1>
                </header>

                <div>
                    <div>
                        <article>
                            <h3>Current Flood Status</h3>
                            <p>Alangilan, Batangas City</p>
                            <p>Moderate Risk</p>
                        </article>
                        <article>
                            <h3>Active Alerts</h3>
                            <p>Heavy Rainfall</p>
                            <p>Flooding Reported in Cuta</p>
                        </article>
                    </div>

                    <article>
                        <header>
                            <h3>Quick Emergency Hotline</h3>
                           
                        </header>

                        <ul>
                            <li>
                                <p>Mayor's Action Center</p>
                                <div>
                                    <a href="tel:7231511">723-1511</a>
                                </div>
                            </li>

                            <li>
                                <p>24/7 EBD Emergency Health Hotline</p>
                                <div>
                                    <a href="tel:09992226626">0999-222-6626</a>
                                </div>
                            </li>

                            <li>
                                <p>City DRRM</p>
                                <div>
                                    <a href="tel:7023902">702-3902</a>
                                </div>
                            </li>

                            <li>
                                <p>BFP Batangas City</p>
                                <div>
                                    <a href="tel:4257163">425-7163</a>
                                    <a href="tel:09156021984">09156021984</a>
                                </div>
                            </li>

                            <li>
                                <p>Batangas Component Police Station</p>
                                <div>
                                    <a href="tel:7232030">723-2030</a>
                                    <a href="tel:09164291515">0916-429-1515</a>
                                    <a href="tel:09996946805">0999-694-6805</a>
                                </div>
                            </li>
                        </ul>
                    </article>
                </div>

            </section>

            {/*quick actions*/}
            <section>
                <h1>Quick Actions</h1>

                <div>
                    <ServiceCard
                        icon={<Map size={32} />}
                        title="Flood Map"
                        description="View flood-prone areas and check the current flood risk around Batangas City."
                        to="/flood-map"
                    />

                    <ServiceCard
                        icon={<BusFront size={32} />}
                        title="Transportation"
                        description="Find PUJ routes and identify routes affected by flooding or other hazards."
                        to="/transportation"
                    />

                    <ServiceCard
                        icon={<PhoneIncoming size={32} />}
                        title="Hotlines"
                        description="Quickly access important emergency and rescue contact numbers."
                        to="/emergency"
                    />

                    <ServiceCard
                        icon={<ContactRound size={32} />}
                        title="Contact Us"
                        description="Reach the AGOS  team for inquiries, concerns, feedback, or assistance."
                        to="#contact"
                    />
                </div>
            </section>

            {/*about agos*/}
            <section>
                <h2>
                    About
                </h2>

                <div>
                    <div><img src="" alt="" /></div>
                    <div>
                        <p>Sa bawat AGOS, may gabay</p>
                        <p>The name AGOS (“current” or “flow”) reflects both the flow of floodwater that the system monitors and the flow of timely information it delivers back to communities, turning a hazard into a guided, navigable situation.</p>
                    </div>
                </div>
            </section>

            {/*contact form*/}
            <section id="contact">
                <ContactUs />
            </section>



        </main>
    )
}

export default Home;