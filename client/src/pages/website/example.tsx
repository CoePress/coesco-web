import { Footer, Navbar } from "./home";
import { useState } from "react";

const product = {
  name: "ServoMaster 3000",
  tagline: "Precision. Power. Performance.",
  images: [
    "/products/servo-1.jpg",
    "/products/servo-2.jpg",
    "/products/servo-3.jpg",
    "/products/servo-4.jpg",
  ],
  specs: [
    { label: "Max Force", value: "3000 kN" },
    { label: "Bed Size", value: "2500 x 1200 mm" },
    { label: "Stroke Length", value: "400 mm" },
    { label: "Speed Range", value: "10–60 SPM" },
    { label: "Control System", value: "Siemens S7" },
    { label: "Power Supply", value: "400V / 50Hz" },
    { label: "Weight", value: "18,000 kg" },
    { label: "Warranty", value: "2 Years" },
  ],
  features: [
    {
      title: "Precision Engineering",
      description:
        "Achieve ±0.01mm accuracy with our advanced servo motor technology",
      icon: "PrecisionIcon",
    },
    {
      title: "Energy Efficient",
      description:
        "Up to h0% energy savings compared to conventional hydraulic presses",
      icon: "EnergyIcon",
    },
    {
      title: "Adaptive Control",
      description:
        "Self-optimizing algorithms adjust parameters in real-time for perfect results",
      icon: "ControlIcon",
    },
    {
      title: "Industry 4.0 Ready",
      description:
        "Seamless integration with manufacturing execution systems via OPC UA",
      icon: "NetworkIcon",
    },
  ],
  description:
    "The ServoMaster 3000 delivers unmatched precision and reliability for high-volume manufacturing. Engineered for efficiency, safety, and ease of integration, this industrial press represents the pinnacle of modern manufacturing technology.",
  applications: [
    "Automotive components",
    "Aerospace parts",
    "Medical device manufacturing",
    "Electronics assembly",
    "Heavy machinery components",
  ],
  testimonial: {
    quote:
      "The ServoMaster 3000 has transformed our production line. Downtime reduced by 37% and quality defects cut in half within the first month.",
    author: "Michael Chen",
    position: "Manufacturing Director, Precision Industries",
  },
};

// Simple icon components
const PrecisionIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-8 h-8 text-[#E6a513]"
    fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z" />
  </svg>
);

const EnergyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-8 h-8 text-[#E6a513]"
    fill="currentColor">
    <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 3.87-3.13 7-7 7s-7-3.13-7-7c0-3.53 2.61-6.43 6-6.92V2.05c-4.39.49-8 4.31-8 8.95 0 5 4.03 9 9 9s9-4 9-9c0-4.64-3.61-8.46-8-8.95z" />
  </svg>
);

const ControlIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-8 h-8 text-[#E6a513]"
    fill="currentColor">
    <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
  </svg>
);

const NetworkIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-8 h-8 text-[#E6a513]"
    fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7 7h2v10H7V7zm4 0h2v5h-2V7zm4 0h2v8h-2V7z" />
  </svg>
);

const ProductShowcase = () => {
  const [activeImage, setActiveImage] = useState(0);

  return (
    <div className="bg-[#121212] text-white min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#181818] via-[#232323] to-[#181818] py-16 px-4">
        <div className="container max-w-screen-2xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Info */}
            <div className="flex-1 flex flex-col items-start order-2 md:order-1">
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                {product.name}
              </h1>
              <h2 className="text-[#E6a513] text-lg font-semibold mb-2">
                {product.tagline}
              </h2>
              <p className="text-[#bbbbbb] mb-4 max-w-lg leading-relaxed text-sm">
                {product.description}
              </p>
              <div className="flex gap-4">
                <button className="bg-[#E6a513] hover:bg-[#d89b12] text-[#1d1d1d] text-sm px-3 py-1.5 rounded transition-all duration-200 cursor-pointer border border-[#E6a513]">
                  Request a Quote
                </button>
                <button className="hover:bg-[#d89b12] text-[#E6a513] text-sm px-3 py-1.5 rounded transition-all duration-200 cursor-pointer border border-[#E6a513]">
                  Download Brochure
                </button>
              </div>
            </div>

            {/* Featured Image */}
            <div className="flex-1 order-1 md:order-2">
              <div className="relative aspect-video overflow-hidden rounded-lg shadow-2xl border border-[#333] bg-[#191919]">
                <img
                  src={product.images[activeImage]}
                  alt={`${product.name} main view`}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex justify-center mt-4 gap-2">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      activeImage === index
                        ? "bg-[#E6a513] scale-125"
                        : "bg-[#555]"
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-[#161616] py-16 px-4">
        <div className="container max-w-screen-2xl mx-auto">
          <h3 className="text-3xl font-bold text-white mb-10 text-center">
            Advanced Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {product.features.map((feature, index) => {
              const IconComponent =
                feature.icon === "PrecisionIcon"
                  ? PrecisionIcon
                  : feature.icon === "EnergyIcon"
                  ? EnergyIcon
                  : feature.icon === "ControlIcon"
                  ? ControlIcon
                  : NetworkIcon;

              return (
                <div
                  key={index}
                  className="bg-[#1d1d1d] p-6 rounded-lg border border-[#333] hover:border-[#E6a513] transition-all hover:shadow-lg hover:shadow-[#E6a513]/10">
                  <div className="mb-4">
                    <IconComponent />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-[#bbbbbb]">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Specs Table */}
      <section className="bg-[#1d1d1d] py-16 px-4">
        <div className="container max-w-screen-2xl mx-auto">
          <h3 className="text-3xl font-bold text-white mb-8 text-center">
            Technical Specifications
          </h3>
          <div className="overflow-hidden rounded-lg shadow-lg border border-[#292929]">
            <table className="min-w-full bg-[#232323] text-left">
              <tbody>
                {product.specs.map((spec, i) => (
                  <tr
                    key={spec.label}
                    className={i % 2 === 0 ? "bg-[#1c1c1c]" : "bg-[#232323]"}>
                    <td className="px-6 py-4 text-[#E6a513] font-medium w-1/3 border-r border-[#333]">
                      {spec.label}
                    </td>
                    <td className="px-6 py-4 text-white">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Performance Metrics Section */}
      <section className="bg-[#161616] py-16 px-4">
        <div className="container max-w-screen-2xl mx-auto">
          <h3 className="text-3xl font-bold text-white mb-10 text-center">
            Performance That Delivers Results
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Metric Cards */}
            <div className="bg-gradient-to-br from-[#1d1d1d] to-[#242424] p-8 rounded-xl border border-[#333] shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#E6a513] opacity-5 rounded-full -mr-10 -mt-10"></div>
              <h4 className="text-5xl font-bold text-[#E6a513] mb-2">37%</h4>
              <p className="text-xl text-white mb-2">Reduced Downtime</p>
              <p className="text-[#999]">
                Compared to conventional hydraulic systems
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#1d1d1d] to-[#242424] p-8 rounded-xl border border-[#333] shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#E6a513] opacity-5 rounded-full -mr-10 -mt-10"></div>
              <h4 className="text-5xl font-bold text-[#E6a513] mb-2">2x</h4>
              <p className="text-xl text-white mb-2">Productivity</p>
              <p className="text-[#999]">
                Double your output with advanced cycle optimization
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#1d1d1d] to-[#242424] p-8 rounded-xl border border-[#333] shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#E6a513] opacity-5 rounded-full -mr-10 -mt-10"></div>
              <h4 className="text-5xl font-bold text-[#E6a513] mb-2">40%</h4>
              <p className="text-xl text-white mb-2">Energy Savings</p>
              <p className="text-[#999]">
                Lower operating costs with smart power management
              </p>
            </div>
          </div>

          {/* Testimonial with Industry Background */}
          <div className="bg-[#1A1A1A] p-8 lg:p-12 rounded-xl border border-[#333] shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/factory-floor-dark.jpg')] bg-cover bg-center opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A] via-[#1A1A1A] to-transparent"></div>

            <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-center">
              <div className="lg:w-2/3">
                <svg
                  viewBox="0 0 24 24"
                  className="w-16 h-16 text-[#E6a513] opacity-30 mb-6">
                  <path
                    fill="currentColor"
                    d="M6.5 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35.208-.086.39-.16.539-.222.302-.125.474-.197.474-.197L9.758 4.03c0 0-.218.052-.597.144C8.97 4.222 8.737 4.278 8.472 4.345c-.271.05-.56.187-.882.312C7.272 4.799 6.904 4.895 6.562 5.123c-.344.218-.741.4-1.091.692C5.132 6.116 4.723 6.377 4.421 6.76c-.33.358-.656.734-.909 1.162C3.219 8.33 3.02 8.778 2.81 9.221c-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539.017.109.025.168.025.168l.026-.006C2.535 17.474 4.338 19 6.5 19c2.485 0 4.5-2.015 4.5-4.5S8.985 10 6.5 10zM17.5 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35.208-.086.39-.16.539-.222.302-.125.474-.197.474-.197L20.758 4.03c0 0-.218.052-.597.144-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.317.143-.686.238-1.028.467-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.944-.33.358-.656.734-.909 1.162C14.219 8.33 14.02 8.778 13.81 9.221c-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539.017.109.025.168.025.168l.026-.006C13.535 17.474 15.338 19 17.5 19c2.485 0 4.5-2.015 4.5-4.5S19.985 10 17.5 10z"
                  />
                </svg>

                <p className="text-[#eee] text-xl italic mb-6 leading-relaxed">
                  {product.testimonial.quote}{" "}
                  <span className="text-[#E6a513]">
                    We've since expanded with three additional units across our
                    global facilities.
                  </span>
                </p>

                <div className="flex items-center gap-4 mb-6 lg:mb-0">
                  <div className="w-16 h-16 bg-[#333] rounded-full flex items-center justify-center border-2 border-[#444]">
                    <span className="text-2xl font-bold text-[#E6a513]">
                      MC
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">
                      {product.testimonial.author}
                    </p>
                    <p className="text-[#999]">
                      {product.testimonial.position}
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/3 bg-[#111] p-6 rounded-lg border border-[#333]">
                <h4 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 text-[#E6a513] mr-2">
                    <path
                      fill="currentColor"
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                    />
                  </svg>
                  Industry Applications
                </h4>
                <ul className="space-y-3">
                  {product.applications.map((app, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-3">
                      <div className="bg-[#222] p-1 rounded">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-4 h-4 text-[#E6a513]">
                          <path
                            fill="currentColor"
                            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                          />
                        </svg>
                      </div>
                      <span className="text-[#bbbbbb]">{app}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison/Benefits Section with Interactive Elements */}
      <section className="bg-[#0c0c0c] py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/circuit-pattern.png')] bg-repeat opacity-5"></div>

        <div className="container max-w-screen-2xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left column - ROI Calculator Preview */}
            <div className="lg:w-1/2">
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#222] p-6 rounded-xl border border-[#333] shadow-xl">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-6 h-6 text-[#E6a513] mr-2">
                    <path
                      fill="currentColor"
                      d="M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 2v16h16V4H4zm2 3h12v2H6V7zm0 4h12v2H6v-2zm0 4h8v2H6v-2z"
                    />
                  </svg>
                  ROI Calculator
                </h3>

                <div className="p-4 bg-[#151515] rounded-lg mb-6">
                  <div className="flex justify-between mb-3">
                    <span className="text-[#999]">Current Daily Output:</span>
                    <span className="text-white font-medium">1,200 units</span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <span className="text-[#999]">Projected Output:</span>
                    <span className="text-[#E6a513] font-bold">
                      2,400 units
                    </span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <span className="text-[#999]">Energy Cost Savings:</span>
                    <span className="text-[#E6a513] font-bold">
                      $128,500/year
                    </span>
                  </div>
                  <div className="flex justify-between mb-3">
                    <span className="text-[#999]">Maintenance Savings:</span>
                    <span className="text-[#E6a513] font-bold">
                      $83,200/year
                    </span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-[#333] flex justify-between">
                    <span className="text-white font-medium">
                      Payback Period:
                    </span>
                    <span className="text-[#E6a513] font-bold text-xl">
                      14 months
                    </span>
                  </div>
                </div>

                <a
                  href="/website/calculator"
                  className="flex items-center gap-2 bg-[#E6a513] hover:bg-[#d89b12] text-[#121212] rounded px-3 py-1.5 w-full transition justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5">
                    <path
                      fill="currentColor"
                      d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7v-7zm4-3h2v10h-2V7zm4 6h2v4h-2v-4z"
                    />
                  </svg>
                  Calculate Your Custom ROI
                </a>
              </div>
            </div>

            {/* Right column - Key Benefits & Action */}
            <div className="lg:w-1/2">
              <h3 className="text-3xl font-bold text-white mb-6">
                Why Upgrade to ServoMaster?
              </h3>

              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="mt-1 bg-[#E6a513] rounded-lg p-2 h-fit">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-6 h-6 text-[#0c0c0c]">
                      <path
                        fill="currentColor"
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-1">
                      Rapid Deployment
                    </h4>
                    <p className="text-[#aaa]">
                      Complete installation and operator training in just 5 days
                      with our certified technicians
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1 bg-[#E6a513] rounded-lg p-2 h-fit">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-6 h-6 text-[#0c0c0c]">
                      <path
                        fill="currentColor"
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-10h-2v6h2V7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-1">
                      Predictive Maintenance
                    </h4>
                    <p className="text-[#aaa]">
                      Our AI-driven system forecasts maintenance needs before
                      failures occur, minimizing costly downtime
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1 bg-[#E6a513] rounded-lg p-2 h-fit">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-6 h-6 text-[#0c0c0c]">
                      <path
                        fill="currentColor"
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-1">
                      Global Support Network
                    </h4>
                    <p className="text-[#aaa]">
                      24/7 technical assistance with service centers in 43
                      countries ensuring rapid response times
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/website/demo"
                  className="flex-1 bg-white hover:bg-[#f0f0f0] text-[#121212] rounded px-3 py-1.5 text-center shadow transition flex items-center justify-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5">
                    <path
                      fill="currentColor"
                      d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"
                    />
                  </svg>
                  Schedule Virtual Demo
                </a>
                <a
                  href="/website/contact"
                  className="flex-1 bg-[#E6a513] hover:bg-[#d89b12] text-[#121212] rounded px-3 py-1.5 text-center shadow transition flex items-center justify-center gap-2">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5">
                    <path
                      fill="currentColor"
                      d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"
                    />
                  </svg>
                  Contact Sales Team
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProductShowcase;
