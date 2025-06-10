import { useState } from "react";

const Companies = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Mock data
  const companies = [
    {
      id: 1,
      name: "HubSpot",
      domain: "hubspot.com",
      industry: "Software",
      employees: "5,000-10,000",
      location: "Cambridge, MA",
      stage: "Opportunity",
      revenue: "$1.5B",
      lastActivity: "2 days ago",
      contacts: 2,
    },
    {
      id: 2,
      name: "Salesforce",
      domain: "salesforce.com",
      industry: "Software",
      employees: "10,000+",
      location: "San Francisco, CA",
      stage: "Customer",
      revenue: "$26.5B",
      lastActivity: "1 week ago",
      contacts: 5,
    },
    {
      id: 3,
      name: "Tesla",
      domain: "tesla.com",
      industry: "Automotive",
      employees: "10,000+",
      location: "Austin, TX",
      stage: "Lead",
      revenue: "$96.8B",
      lastActivity: "3 days ago",
      contacts: 1,
    },
    {
      id: 4,
      name: "Shopify",
      domain: "shopify.com",
      industry: "E-commerce",
      employees: "1,000-5,000",
      location: "Ottawa, ON",
      stage: "Opportunity",
      revenue: "$5.6B",
      lastActivity: "5 days ago",
      contacts: 3,
    },
    {
      id: 5,
      name: "Stripe",
      domain: "stripe.com",
      industry: "Fintech",
      employees: "1,000-5,000",
      location: "San Francisco, CA",
      stage: "Customer",
      revenue: "$12B",
      lastActivity: "1 day ago",
      contacts: 4,
    },
  ];

  const industries = [
    "Software",
    "Automotive",
    "E-commerce",
    "Fintech",
    "Healthcare",
    "Manufacturing",
  ];
  const sizes = [
    "1-50",
    "51-200",
    "201-1,000",
    "1,000-5,000",
    "5,000-10,000",
    "10,000+",
  ];
  const stages = ["Lead", "Opportunity", "Customer", "Closed"];

  const filteredCompanies = companies.filter((company) => {
    return (
      (company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.domain.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedIndustry === "" || company.industry === selectedIndustry) &&
      (selectedSize === "" || company.employees === selectedSize) &&
      (selectedStage === "" || company.stage === selectedStage) &&
      (selectedLocation === "" ||
        company.location.toLowerCase().includes(selectedLocation.toLowerCase()))
    );
  });

  const clearFilters = () => {
    setSelectedIndustry("");
    setSelectedSize("");
    setSelectedLocation("");
    setSelectedStage("");
    setSearchTerm("");
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Lead":
        return "text-info bg-info/10";
      case "Opportunity":
        return "text-warning bg-warning/10";
      case "Customer":
        return "text-success bg-success/10";
      case "Closed":
        return "text-text-muted bg-surface";
      default:
        return "text-text bg-surface";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Search and Filters */}
      <div className="bg-foreground border-b border-border px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <circle
                cx="11"
                cy="11"
                r="8"
              />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search companies by name or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded hover:bg-surface text-text">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
            </svg>
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-surface rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Industry
              </label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">All Industries</option>
                {industries.map((industry) => (
                  <option
                    key={industry}
                    value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Company Size
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">All Sizes</option>
                {sizes.map((size) => (
                  <option
                    key={size}
                    value={size}>
                    {size} employees
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Location
              </label>
              <input
                type="text"
                placeholder="Enter location..."
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Stage
              </label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded text-text focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="">All Stages</option>
                {stages.map((stage) => (
                  <option
                    key={stage}
                    value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-text-muted hover:text-text text-sm">
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="px-6 py-4 bg-background">
        <p className="text-text-muted text-sm">
          Showing {filteredCompanies.length} of {companies.length} companies
        </p>
      </div>

      {/* Table */}
      <div className="px-6 pb-6">
        <div
          className="bg-foreground rounded-lg overflow-hidden"
          style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface border-b border-border">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-text">
                    Company
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-text">
                    Industry
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-text">
                    Size
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-text">
                    Location
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-text">
                    Stage
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-text">
                    Revenue
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-text">
                    Last Activity
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-text">
                    Contacts
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company, index) => (
                  <tr
                    key={company.id}
                    className="border-b border-border hover:bg-surface cursor-pointer transition-colors"
                    onClick={() => {
                      // This would navigate to the detail page
                      console.log("Navigate to company detail:", company.id);
                    }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mr-3">
                          <svg
                            className="w-6 h-6 text-primary"
                            fill="currentColor"
                            viewBox="0 0 24 24">
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-text">
                            {company.name}
                          </div>
                          <div className="text-sm text-info">
                            {company.domain}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text">{company.industry}</td>
                    <td className="px-6 py-4 text-text">{company.employees}</td>
                    <td className="px-6 py-4 text-text">{company.location}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(
                          company.stage
                        )}`}>
                        {company.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text font-semibold">
                      {company.revenue}
                    </td>
                    <td className="px-6 py-4 text-text-muted">
                      {company.lastActivity}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-surface text-text px-2 py-1 rounded text-sm">
                        {company.contacts}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto w-12 h-12 text-text-muted/50 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <circle
                  cx="11"
                  cy="11"
                  r="8"
                />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <p className="text-text-muted">
                No companies found matching your criteria
              </p>
              <button
                onClick={clearFilters}
                className="mt-2 text-primary hover:underline text-sm">
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {filteredCompanies.length > 0 && (
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between">
            <p className="text-text-muted text-sm">
              Showing 1 to {filteredCompanies.length} of{" "}
              {filteredCompanies.length} results
            </p>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 border border-border rounded text-text-muted hover:bg-surface disabled:opacity-50"
                disabled>
                Previous
              </button>
              <button className="px-3 py-1 bg-primary text-white rounded">
                1
              </button>
              <button
                className="px-3 py-1 border border-border rounded text-text-muted hover:bg-surface disabled:opacity-50"
                disabled>
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
