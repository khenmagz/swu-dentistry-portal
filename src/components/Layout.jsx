import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import bgImage from "../assets/bg-villa.jpg";
import schoolLogo from "../assets/swu-logo.png";

export default function Layout() {
  return (
    <div className="min-h-screen bg-white font-sans flex flex-col relative">
      {/* THE WATERMARK LAYER */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.2]"
        style={{
          backgroundImage: `url('${bgImage}')`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          // Fix: Changed from 100% to cover so it doesn't look squished on tall phones
          backgroundSize: "cover",
        }}
      ></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Banner (Purple) */}
        {/* Fix: Adjusted padding for mobile */}
        <header className="bg-[radial-gradient(ellipse_at_center,var(--color-primary)_20%,var(--color-secondary)_100%)] text-white py-8 md:py-16 flex justify-center items-center px-4">
          {/* Fix: Stack logo under text on very small screens, side-by-side on larger screens */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <div className="flex items-center gap-2 md:gap-4">
              {/* Fix: text-5xl on mobile, text-7xl on tablets, text-9xl on desktop */}
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-semibold tracking-tight">
                SWU
              </h1>
              <span className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-semibold text-white/50">
                |
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-semibold tracking-wide">
                Dentistry
              </h1>
            </div>

            {/* Fix: Scaled down logo for mobile */}
            <img
              src={schoolLogo}
              alt="School Logo"
              className="h-16 sm:h-20 md:h-24 lg:h-32 w-auto object-contain md:translate-y-3"
            />
          </div>
        </header>

        {/* Navigation */}
        <nav className="sticky top-0 z-50">
          {" "}
          {/* Increased z-index to 50 so mobile menu sits above content */}
          <Navbar />
        </nav>

        {/* Dynamic Page Content */}
        <main className="grow w-full max-w-7xl mx-auto px-4 py-8 mt-4 rounded-t-lg">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
