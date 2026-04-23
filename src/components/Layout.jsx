import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import bgImage from "../assets/bg-villa.jpg";
import schoolLogo from "../assets/swu-logo.png";
export default function Layout() {
  return (
    // 1. Changed to bg-white for the whole page
    <div className="min-h-screen bg-white font-sans flex flex-col relative">
      {/* 2. THE WATERMARK LAYER */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.2]" // 5% opacity for a professional look
        style={{
          backgroundImage: `url('${bgImage}')`, // Replace with your actual image path in /public folder
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "100%", // Adjust size as needed
        }}
      ></div>

      {/* 3. CONTENT WRAPPER (Needs relative z-10 to stay ABOVE the watermark) */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Banner (Purple) */}
        <header className="bg-[radial-gradient(ellipse_at_center,var(--color-primary)_20%,var(--color-secondary)_100%)] text-white py-16 flex justify-center items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-9xl font-semibold tracking-tight">SWU</h1>
            <span className="text-9xl font-semibold text-white/50">|</span>
            <h1 className="text-9xl font-semibold tracking-wide">Dentistry</h1>

            {/* Added translate-y-3 to nudge it down manually */}
            <img
              src={schoolLogo}
              alt="School Logo"
              className="h-32 w-auto object-contain ml-4 translate-y-3"
            />
          </div>
        </header>

        {/* Navigation */}
        <nav className="sticky top-0 z-20">
          {" "}
          {/* Increased z-index to stay on top */}
          <Navbar />
        </nav>

        {/* Dynamic Page Content */}
        {/* I changed this to bg-white/80 (80% opacity) so the watermark is visible behind the content */}
        <main className="grow w-full max-w-7xl mx-auto px-4 py-8  mt-4 rounded-t-lg ">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
