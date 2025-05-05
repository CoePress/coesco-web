import {
  MapPin,
  Search,
  X,
  User,
  Menu,
  DollarSign,
  Truck,
  FileText,
  ShoppingCart,
  Wrench,
  CheckCircle,
  Phone,
  Users,
  RefreshCcw,
  Layers,
  ArrowRight,
  Globe,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useRef } from "react";

const config = {
  baseUrl: "http://localhost:5173/website",
  linkedin: "https://www.linkedin.com/company/coe-press-equipment/",
  facebook: "https://www.facebook.com/coepressequipment",
  twitter: "https://twitter.com/COEpress",
  youtube: "https://www.youtube.com/@COEpress",
};

const equipment = [
  {
    name: "Conventional Lines",
    image: "/conventional.png",
    link: `${config.baseUrl}/equipment/conventional-lines`,
  },
  {
    name: "Servo Presses",
    image: "/equipment/equipment-2.png",
    link: `${config.baseUrl}/equipment/servo-presses`,
  },
  {
    name: "Transfer Systems",
    image: "/equipment/equipment-3.png",
    link: `${config.baseUrl}/equipment/transfer-systems`,
  },
  {
    name: "Automation Systems",
    image: "/equipment/equipment-4.png",
    link: `${config.baseUrl}/equipment/automation-systems`,
  },
];

const parts = [
  {
    name: "Hydraulic Components",
    image: "/parts/parts-1.png",
    link: `${config.baseUrl}/parts/hydraulic-components`,
  },
  {
    name: "Mechanical Components",
    image: "/parts/parts-2.png",
    link: `${config.baseUrl}/parts/mechanical-components`,
  },
  {
    name: "Electrical Components",
    image: "/parts/parts-3.png",
    link: `${config.baseUrl}/parts/electrical-components`,
  },
  {
    name: "Tooling & Dies",
    image: "/parts/parts-4.png",
    link: `${config.baseUrl}/parts/tooling-dies`,
  },
];

export const Navbar = () => {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isSideSheetOpen, setIsSideSheetOpen] = useState(false);
  const [activeMenuCategory, setActiveMenuCategory] = useState<string | null>(
    null
  );
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const navItemRef = useRef<HTMLAnchorElement>(null);

  const onHoverEntry = (category: string) => {
    setIsMegaMenuOpen(true);
    setActiveMenuCategory(category);
  };

  const onHoverExit = () => {
    setTimeout(() => {
      if (
        !megaMenuRef.current?.matches(":hover") &&
        !navItemRef.current?.matches(":hover")
      ) {
        setIsMegaMenuOpen(false);
      }
    }, 100);
  };

  const handleMegaMenuExit = () => {
    setTimeout(() => {
      if (
        !megaMenuRef.current?.matches(":hover") &&
        !navItemRef.current?.matches(":hover")
      ) {
        setIsMegaMenuOpen(false);
      }
    }, 100);
  };

  return (
    <div>
      {/* Banner */}
      <div className="bg-[#E6a513] px-4 py-2 text-[#1d1d1d]">
        <div className="mx-auto flex justify-between items-center relative text-xs">
          {/* <div className="flex gap-1">
            <p className="hidden md:block cursor-pointer">
              <span>info@cpec.com</span>
            </p>
            <span>|</span>
            <p className="hidden md:block cursor-pointer">
              <span>+1 (586) 301-6021</span>
            </p>
          </div> */}

          <div className="flex items-center gap-2 cursor-pointer transition-all duration-200">
            <Globe size={16} />
            <p>English</p>
          </div>
          <div className="flex items-center gap-2 cursor-pointer transition-all duration-200">
            <MapPin size={16} />
            <p>Find a Dealer</p>
          </div>

          {/* <div className="flex items-center gap-2">
            <Link
              to={config.facebook}
              target="_blank"
              className="cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 32 32">
                <path d="M16,2c-7.732,0-14,6.268-14,14,0,6.566,4.52,12.075,10.618,13.588v-9.31h-2.887v-4.278h2.887v-1.843c0-4.765,2.156-6.974,6.835-6.974,.887,0,2.417,.174,3.043,.348v3.878c-.33-.035-.904-.052-1.617-.052-2.296,0-3.183,.87-3.183,3.13v1.513h4.573l-.786,4.278h-3.787v9.619c6.932-.837,12.304-6.74,12.304-13.897,0-7.732-6.268-14-14-14Z"></path>
              </svg>
            </Link>
            <Link
              to={config.linkedin}
              target="_blank"
              className="cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 32 32">
                <path
                  d="M26.111,3H5.889c-1.595,0-2.889,1.293-2.889,2.889V26.111c0,1.595,1.293,2.889,2.889,2.889H26.111c1.595,0,2.889-1.293,2.889-2.889V5.889c0-1.595-1.293-2.889-2.889-2.889ZM10.861,25.389h-3.877V12.87h3.877v12.519Zm-1.957-14.158c-1.267,0-2.293-1.034-2.293-2.31s1.026-2.31,2.293-2.31,2.292,1.034,2.292,2.31-1.026,2.31-2.292,2.31Zm16.485,14.158h-3.858v-6.571c0-1.802-.685-2.809-2.111-2.809-1.551,0-2.362,1.048-2.362,2.809v6.571h-3.718V12.87h3.718v1.686s1.118-2.069,3.775-2.069,4.556,1.621,4.556,4.975v7.926Z"
                  fill-rule="evenodd"></path>
              </svg>
            </Link>
            <Link
              to={config.twitter}
              target="_blank"
              className="cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 32 32">
                <path d="M18.42,14.009L27.891,3h-2.244l-8.224,9.559L10.855,3H3.28l9.932,14.455L3.28,29h2.244l8.684-10.095,6.936,10.095h7.576l-10.301-14.991h0Zm-3.074,3.573l-1.006-1.439L6.333,4.69h3.447l6.462,9.243,1.006,1.439,8.4,12.015h-3.447l-6.854-9.804h0Z"></path>
              </svg>
            </Link>
            <Link
              to={config.youtube}
              target="_blank"
              className="cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 32 32">
                <path d="M31.331,8.248c-.368-1.386-1.452-2.477-2.829-2.848-2.496-.673-12.502-.673-12.502-.673,0,0-10.007,0-12.502,.673-1.377,.37-2.461,1.462-2.829,2.848-.669,2.512-.669,7.752-.669,7.752,0,0,0,5.241,.669,7.752,.368,1.386,1.452,2.477,2.829,2.847,2.496,.673,12.502,.673,12.502,.673,0,0,10.007,0,12.502-.673,1.377-.37,2.461-1.462,2.829-2.847,.669-2.512,.669-7.752,.669-7.752,0,0,0-5.24-.669-7.752ZM12.727,20.758V11.242l8.364,4.758-8.364,4.758Z"></path>
              </svg>
            </Link>
          </div> */}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-[#1d1d1d] text-white px-4 py-2">
        <div className="mx-auto flex justify-between items-center relative text-sm">
          <div className="flex items-center gap-4">
            <Link to={config.baseUrl}>
              <img
                src="/coe-logo.png"
                alt="logo"
                className="w-24"
              />
            </Link>

            <div className="items-center gap-4 hidden md:flex">
              <Link
                to={`${config.baseUrl}/why-coe`}
                className="hover:text-[#E6a513] cursor-pointer transition-all duration-200">
                Why Coe
              </Link>
              <Link
                ref={navItemRef as React.RefObject<HTMLAnchorElement>}
                to={`${config.baseUrl}/equipment`}
                className="hover:text-[#E6a513] cursor-pointer transition-all duration-200"
                onMouseEnter={() => onHoverEntry("equipment")}
                onMouseLeave={onHoverExit}>
                Equipment
              </Link>
              <Link
                to={`${config.baseUrl}/parts`}
                className="hover:text-[#E6a513] cursor-pointer transition-all duration-200"
                onMouseEnter={() => onHoverEntry("parts")}
                onMouseLeave={onHoverExit}>
                Parts
              </Link>
              <Link
                to={`${config.baseUrl}/service`}
                className="hover:text-[#E6a513] cursor-pointer transition-all duration-200">
                Service
              </Link>
              <Link
                to={`${config.baseUrl}/contact`}
                className="hover:text-[#E6a513] cursor-pointer transition-all duration-200">
                Contact
              </Link>
            </div>
          </div>

          <div className="items-center gap-2 hidden md:flex">
            <button className="flex items-center gap-2 hover:text-[#E6a513] cursor-pointer transition-all duration-200">
              <User size={16} />
              <p>Sign In</p>
            </button>

            <span>|</span>

            <button
              onClick={() => setIsSideSheetOpen(true)}
              className="flex items-center gap-2 hover:text-[#E6a513] cursor-pointer transition-all duration-200">
              <Search size={16} />
              <p>Search</p>
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setIsSideSheetOpen(true)}
              className="flex items-center gap-2 hover:text-[#E6a513] cursor-pointer transition-all duration-200">
              <Menu size={16} />
            </button>
          </div>
        </div>

        {isMegaMenuOpen && (
          <MegaMenu
            category={activeMenuCategory ?? ""}
            megaMenuRef={megaMenuRef as React.RefObject<HTMLDivElement>}
            onMouseLeave={handleMegaMenuExit}
          />
        )}
      </div>

      {isSideSheetOpen && (
        <SideSheet
          isSideSheetOpen={isSideSheetOpen}
          setIsSideSheetOpen={setIsSideSheetOpen}
        />
      )}
    </div>
  );
};

type MegaMenuProps = {
  category: string;
  megaMenuRef: React.RefObject<HTMLDivElement>;
  onMouseLeave: () => void;
};

const MegaMenu = ({ category, megaMenuRef, onMouseLeave }: MegaMenuProps) => {
  const items = category === "equipment" ? equipment : parts;

  return (
    <div
      ref={megaMenuRef}
      className="w-full bg-[#1d1d1d] py-4 z-50 absolute left-0"
      onMouseLeave={onMouseLeave}
      onMouseEnter={() => {}}>
      <div className="container max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-4 gap-4">
          {items.map((item, index) => (
            <Link
              key={index}
              to={item.link}
              className="group transition-all duration-300">
              <div className="bg-[#2a2a2a] rounded overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-3">
                  <h3 className="text-white group-hover:text-[#E6a513] transition-all duration-200">
                    {item.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

type SideSheetProps = {
  isSideSheetOpen: boolean;
  setIsSideSheetOpen: (isSideSheetOpen: boolean) => void;
};

const SideSheet = ({ isSideSheetOpen, setIsSideSheetOpen }: SideSheetProps) => {
  return (
    <div className="fixed top-0 right-0 w-96 h-full bg-[#1d1d1d] text-white z-50 shadow-lg p-4">
      <div className="container max-w-screen-2xl mx-auto h-full">
        <div className="flex justify-between items-center">
          <h1>Search</h1>
          <button
            onClick={() => setIsSideSheetOpen(false)}
            className="hover:text-[#E6a513] cursor-pointer transition-all duration-200">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

const Hero = () => {
  return (
    <div className="relative h-[650px] overflow-hidden">
      <img
        src="https://cpec.com/wp-content/uploads/2020/04/coe-section-bkg.jpg"
        alt="Industrial manufacturing"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-[#1d1d1d90] to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#1d1d1d] to-transparent opacity-90"></div>

      <div className="absolute inset-0 flex items-center">
        <div className="container max-w-screen-2xl mx-auto px-4">
          <div className="max-w-xl text-white z-10">
            <h1 className="text-5xl font-bold mb-4">
              Precision Engineering Excellence
            </h1>
            <p className="text-xl mb-8">
              Industry-leading press equipment and solutions that drive
              manufacturing innovation and performance.
            </p>
            <button className="bg-[#E6a513] hover:bg-[#d89b12] text-[#1d1d1d] text-sm px-3 py-1.5 rounded transition-all duration-200 cursor-pointer">
              Discover More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CallToAction = () => {
  return (
    <div className="bg-[#1d1d1d] py-12">
      <div className="container max-w-screen-2xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <ActionButton
            icon={<MapPin size={24} />}
            text="Find a Dealer"
          />
          <ActionButton
            icon={<DollarSign size={24} />}
            text="Build & Price"
          />
          <ActionButton
            icon={<Truck size={24} />}
            text="Shop Pre-Owned"
          />
          <ActionButton
            icon={<FileText size={24} />}
            text="Download Manuals"
          />
          <ActionButton
            icon={<ShoppingCart size={24} />}
            text="Buy Parts"
          />
          <ActionButton
            icon={<Wrench size={24} />}
            text="Service & Support"
          />
        </div>
      </div>
    </div>
  );
};

type ActionButtonProps = {
  icon: React.ReactNode;
  text: string;
};

const ActionButton = ({ icon, text }: ActionButtonProps) => {
  return (
    <button className="flex items-center justify-center bg-[#2a2a2a] hover:bg-[#363636] text-white p-4 rounded transition-all duration-200 h-full gap-2 cursor-pointer border border-[#3d3d3d]">
      <div className="text-[#E6a513]">{icon}</div>
      <span className="text-center font-medium">{text}</span>
    </button>
  );
};

const Solutions = () => (
  <section className="relative bg-gradient-to-br from-[#181818] via-[#232323] to-[#181818] py-24 overflow-hidden">
    <div
      className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none select-none"
      style={{
        background:
          "url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80') center/cover no-repeat",
      }}
    />
    <div className="container max-w-screen-2xl mx-auto px-4 relative z-10">
      <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
        What We Deliver
      </h2>
      <p className="text-[#e6a513] mb-12 max-w-2xl text-lg font-medium">
        Solutions engineered for the world's most demanding manufacturers.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#2a2a2a] rounded p-4 flex flex-col gap-4 shadow hover:shadow-lg transition-transform group border border-[#3d3d3d]">
          <Layers
            size={30}
            className="text-[#E6a513] mb-2 group-hover:rotate-6 transition-transform"
          />
          <h3 className="text-2xl text-white font-bold">
            Automated Press Lines
          </h3>
          <ul className="text-[#bbbbbb] text-base flex-1 space-y-1">
            <li>• High-speed, high-precision</li>
            <li>• Turnkey integration</li>
            <li>• Automotive & appliance ready</li>
          </ul>
          <a
            href="/website/equipment/conventional-lines"
            className="flex items-center gap-1 text-[#E6a513] font-semibold mt-2 hover:underline">
            See Details <ArrowRight size={18} />
          </a>
        </div>
        <div className="bg-[#2a2a2a] rounded p-4 flex flex-col gap-4 shadow hover:shadow-lg transition-transform group border border-[#3d3d3d]">
          <RefreshCcw
            size={30}
            className="text-[#E6a513] mb-2 group-hover:rotate-12 transition-transform"
          />
          <h3 className="text-2xl text-white font-bold">Retrofit & Upgrades</h3>
          <ul className="text-[#bbbbbb] text-base flex-1 space-y-1">
            <li>• Controls modernization</li>
            <li>• Automation add-ons</li>
            <li>• Safety & compliance</li>
          </ul>
          <a
            href="/website/parts/hydraulic-components"
            className="flex items-center gap-1 text-[#E6a513] font-semibold mt-2 hover:underline">
            Learn More <ArrowRight size={18} />
          </a>
        </div>
        <div className="bg-[#2a2a2a] rounded p-4 flex flex-col gap-4 shadow hover:shadow-lg transition-transform group border border-[#3d3d3d]">
          <Users
            size={30}
            className="text-[#E6a513] mb-2 group-hover:rotate-[-6deg] transition-transform"
          />
          <h3 className="text-2xl text-white font-bold">Custom Engineering</h3>
          <ul className="text-[#bbbbbb] text-base flex-1 space-y-1">
            <li>• Application-specific design</li>
            <li>• Full project management</li>
            <li>• On-site commissioning</li>
          </ul>
          <a
            href="/website/contact"
            className="flex items-center gap-1 text-[#E6a513] font-semibold mt-2 hover:underline">
            Start a Project <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </div>
  </section>
);

const ServiceSection = () => (
  <section className="bg-[#181818] py-24">
    <div className="container max-w-screen-2xl mx-auto px-4">
      <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight text-center">
        Industrial Repair Service
      </h2>
      <p className="text-[#bbbbbb] mb-12 text-lg text-center max-w-2xl mx-auto">
        Fast, expert repair for presses, automation, and CNC equipment. Get back
        up and running—minimize downtime, maximize productivity.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr">
        {/* Main Repair Card (Bento highlight) */}
        <div className="bg-gradient-to-br from-[#E6a513] to-[#b88a0a] rounded p-10 flex flex-col items-center justify-center shadow border border-[#292929] md:row-span-2">
          <Wrench
            size={48}
            className="text-[#1d1d1d] mb-4"
          />
          <h3 className="text-2xl font-extrabold text-[#1d1d1d] mb-2 text-center">
            Request a Repair
          </h3>
          <p className="text-[#1d1d1d] text-base mb-4 text-center font-medium">
            24/7 emergency response for breakdowns, failures, and urgent
            troubleshooting.
          </p>
          <a
            href="tel:+15863016021"
            className="inline-block bg-[#1d1d1d] hover:bg-[#232323] text-[#E6a513] font-bold rounded px-6 py-3 text-lg shadow transition">
            Call (586) 301-6021
          </a>
        </div>
        {/* Diagnostics */}
        <div className="bg-[#232323] rounded p-8 flex flex-col items-start shadow border border-[#292929]">
          <CheckCircle
            size={36}
            className="text-[#E6a513] mb-3"
          />
          <h3 className="text-xl font-bold text-white mb-2">Diagnostics</h3>
          <ul className="text-[#bbbbbb] text-base mb-4 space-y-1">
            <li>• Root cause analysis</li>
            <li>• Electrical & hydraulic troubleshooting</li>
            <li>• Vibration & thermal checks</li>
          </ul>
        </div>
        {/* On-Site Repair */}
        <div className="bg-[#232323] rounded p-8 flex flex-col items-start shadow border border-[#292929]">
          <Phone
            size={36}
            className="text-[#E6a513] mb-3"
          />
          <h3 className="text-xl font-bold text-white mb-2">On-Site Repair</h3>
          <ul className="text-[#bbbbbb] text-base mb-4 space-y-1">
            <li>• Presses, feeders, automation</li>
            <li>• Component replacement</li>
            <li>• Fast turnaround</li>
          </ul>
        </div>
        {/* Preventive & Emergency */}
        <div className="bg-[#232323] rounded p-8 flex flex-col items-start shadow border border-[#292929] md:col-span-2">
          <RefreshCcw
            size={36}
            className="text-[#E6a513] mb-3"
          />
          <h3 className="text-xl font-bold text-white mb-2">
            Preventive & Emergency
          </h3>
          <ul className="text-[#bbbbbb] text-base mb-4 space-y-1">
            <li>• Scheduled maintenance</li>
            <li>• Emergency breakdown service</li>
            <li>• 24/7 availability</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

export const Footer = () => {
  return (
    <footer className="bg-[#1d1d1d] text-white py-12 border-t border-[#2a2a2a]">
      <div className="mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo & Tagline */}
        <div>
          <img
            src="/coe-logo.png"
            alt="COE Press Equipment"
            className="w-28 mb-2"
          />
          <div className="text-[#E6a513] text-sm font-semibold mb-2">
            Coe Press Equipment Corporation
          </div>
          <div className="text-xs text-[#bbbbbb]">
            © {new Date().getFullYear()} Coe Press Equipment Corporation
          </div>
        </div>
        {/* Navigation */}
        <div>
          <h3 className="text-[#E6a513] font-semibold mb-2">Company</h3>
          <ul className="space-y-1 text-sm">
            <li>
              <Link
                to={`${config.baseUrl}/why-coe`}
                className="hover:text-[#E6a513] transition">
                Why Coe
              </Link>
            </li>
            <li>
              <Link
                to={`${config.baseUrl}/equipment`}
                className="hover:text-[#E6a513] transition">
                Equipment
              </Link>
            </li>
            <li>
              <Link
                to={`${config.baseUrl}/parts`}
                className="hover:text-[#E6a513] transition">
                Parts
              </Link>
            </li>
            <li>
              <Link
                to={`${config.baseUrl}/service`}
                className="hover:text-[#E6a513] transition">
                Service
              </Link>
            </li>
            <li>
              <Link
                to={`${config.baseUrl}/contact`}
                className="hover:text-[#E6a513] transition">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        {/* Contact */}
        <div>
          <h3 className="text-[#E6a513] font-semibold mb-2">Contact</h3>
          <div className="text-sm">+1 (586) 301-6021</div>
          <div className="flex gap-3 mt-2">
            <Link
              to={config.facebook}
              target="_blank"
              aria-label="Facebook">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 32 32">
                <path d="M16,2c-7.732,0-14,6.268-14,14,0,6.566,4.52,12.075,10.618,13.588v-9.31h-2.887v-4.278h2.887v-1.843c0-4.765,2.156-6.974,6.835-6.974,.887,0,2.417,.174,3.043,.348v3.878c-.33-.035-.904-.052-1.617-.052-2.296,0-3.183,.87-3.183,3.13v1.513h4.573l-.786,4.278h-3.787v9.619c6.932-.837,12.304-6.74,12.304-13.897,0-7.732-6.268-14-14-14Z"></path>
              </svg>
            </Link>
            <Link
              to={config.linkedin}
              target="_blank"
              aria-label="LinkedIn">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 32 32">
                <path d="M26.111,3H5.889c-1.595,0-2.889,1.293-2.889,2.889V26.111c0,1.595,1.293,2.889,2.889,2.889H26.111c1.595,0,2.889-1.293,2.889-2.889V5.889c0-1.595-1.293-2.889-2.889-2.889ZM10.861,25.389h-3.877V12.87h3.877v12.519Zm-1.957-14.158c-1.267,0-2.293-1.034-2.293-2.31s1.026-2.31,2.293-2.31,2.292,1.034,2.292,2.31-1.026,2.31-2.292,2.31Zm16.485,14.158h-3.858v-6.571c0-1.802-.685-2.809-2.111-2.809-1.551,0-2.362,1.048-2.362,2.809v6.571h-3.718V12.87h3.718v1.686s1.118-2.069,3.775-2.069,4.556,1.621,4.556,4.975v7.926Z"></path>
              </svg>
            </Link>
            <Link
              to={config.twitter}
              target="_blank"
              aria-label="Twitter">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 32 32">
                <path d="M18.42,14.009L27.891,3h-2.244l-8.224,9.559L10.855,3H3.28l9.932,14.455L3.28,29h2.244l8.684-10.095,6.936,10.095h7.576l-10.301-14.991h0Zm-3.074,3.573l-1.006-1.439L6.333,4.69h3.447l6.462,9.243,1.006,1.439,8.4,12.015h-3.447l-6.854-9.804h0Z"></path>
              </svg>
            </Link>
            <Link
              to={config.youtube}
              target="_blank"
              aria-label="YouTube">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 32 32">
                <path d="M31.331,8.248c-.368-1.386-1.452-2.477-2.829-2.848-2.496-.673-12.502-.673-12.502-.673,0,0-10.007,0-12.502,.673-1.377,.37-2.461,1.462-2.829,2.848-.669,2.512-.669,7.752-.669,7.752,0,0,0,5.241,.669,7.752,.368,1.386,1.452,2.477,2.829,2.847,2.496,.673,12.502,.673,12.502,.673,0,0,10.007,0,12.502-.673,1.377-.37,2.461-1.462,2.829-2.847,.669-2.512,.669-7.752,.669-7.752,0,0,0-5.24-.669-7.752ZM12.727,20.758V11.242l8.364,4.758-8.364,4.758Z"></path>
              </svg>
            </Link>
          </div>
        </div>
        {/* Newsletter */}
        <div>
          <h3 className="text-[#E6a513] font-semibold mb-2">Newsletter</h3>
          <form className="flex flex-col gap-2">
            <input
              type="email"
              placeholder="Your email"
              className="bg-[#2a2a2a] border border-[#444] rounded px-3 py-2 text-white text-sm"
              disabled
            />
            <button
              type="submit"
              className="bg-[#E6a513] hover:bg-[#d89b12] text-[#1d1d1d] rounded px-3 py-2 text-sm font-semibold cursor-not-allowed"
              disabled>
              Coming Soon
            </button>
          </form>
        </div>
      </div>
    </footer>
  );
};

const Home = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <CallToAction />
      <Solutions />
      <ServiceSection />
      <Footer />
    </div>
  );
};

export default Home;
