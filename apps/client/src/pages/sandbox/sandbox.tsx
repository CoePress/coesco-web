import { Button, BottomSheet, Table } from "@/components";
import AddressAutocomplete from "@/components/feature/address-input";
import { useState, useEffect, useRef } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import type { TableColumn } from "@/components/ui/table";

// Type definitions
interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  address: string | null;
  id?: number;
}

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface ParsedAddress {
  street_number?: string;
  street_name?: string;
  city?: string;
  state?: string;
  state_long?: string;
  country?: string;
  country_long?: string;
  postal_code?: string;
}

interface AddressData {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: AddressComponent[];
  parsed: ParsedAddress;
}

// Extend the Window interface to include additional Google Maps types

const Sandbox = () => {
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(
    null
  );
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationHistory, setLocationHistory] = useState<Location[]>([]);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const { notify } = useNotifications();
  const { success, error, warning, info } = useToast();

  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [bottomSheetSize, setBottomSheetSize] = useState<"small" | "medium" | "large" | "full">("medium");
  const [bottomSheetContent, setBottomSheetContent] = useState("basic");

  interface SampleData {
    id: number;
    name: string;
    email: string;
    role: string;
    status: string;
  }

  const sampleTableData: SampleData[] = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", status: "Active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User", status: "Active" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "Manager", status: "Inactive" },
    { id: 4, name: "Alice Williams", email: "alice@example.com", role: "User", status: "Active" },
    { id: 5, name: "Charlie Brown", email: "charlie@example.com", role: "Admin", status: "Active" },
  ];

  const tableColumns: TableColumn<SampleData>[] = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs ${
          value === "Active"
            ? "bg-success/20 text-success"
            : "bg-error/20 text-error"
        }`}>
          {value as string}
        </span>
      )
    },
    {
      key: "id",
      header: "Actions",
      render: (_, row) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            info(`Editing ${row.name}`);
          }}>
          Edit
        </Button>
      )
    }
  ];

  const GOOGLE_API_KEY = "AIzaSyAggNUxlA-WkP5yvP_l3kCIQckeQBPEyOU";

  useEffect(() => {
    const initMap = () => {
      if (mapRef.current && window.google) {
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          zoom: 13,
          center: { lat: 42.58989240286784, lng: -83.05560293111002 },
          styles: [
            {
              featureType: "all",
              elementType: "geometry.fill",
              stylers: [{ color: "#f8f8f8" }],
            },
            {
              featureType: "road",
              elementType: "geometry.fill",
              stylers: [{ color: "#ffffff" }],
            },
          ],
        });
        setMap(mapInstance);
      }
    };

    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  const notifyMe = () => {
    notify({
      title: "Hello",
      body: "World",
    });
  };

  // Add marker to map
  const addMarker = (location: Location, title: string, type = "current") => {
    if (!map) return;

    const marker = new window.google.maps.Marker({
      position: { lat: location.latitude, lng: location.longitude },
      map: map,
      title: title,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor:
          type === "current"
            ? "#e8a80c"
            : type === "history"
              ? "#0284c7"
              : "#34d399",
        fillOpacity: 0.8,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="color: #202020; font-family: 'Roboto Mono', monospace;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${title}</h3>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Lat:</strong> ${location.latitude.toFixed(
            6
          )}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Lng:</strong> ${location.longitude.toFixed(
            6
          )}</p>
          ${
            location.accuracy
              ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Accuracy:</strong> ${location.accuracy.toFixed(
                  0
                )}m</p>`
              : ""
          }
          ${
            location.timestamp
              ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Time:</strong> ${new Date(
                  location.timestamp
                ).toLocaleString()}</p>`
              : ""
          }
        </div>
      `,
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });

    setMarkers((prev) => [...prev, marker]);
    return marker;
  };

  // Clear all markers
  const clearMarkers = () => {
    markers.forEach((marker) => marker.setMap(null));
    setMarkers([]);
  };

  // Update map with all locations
  const updateMapMarkers = () => {
    clearMarkers();

    // Add current location
    if (currentLocation) {
      addMarker(currentLocation, "Current Location", "current");
      map.setCenter({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      });
    }

    // Add location history
    locationHistory.forEach((location, index) => {
      addMarker(location, `History ${index + 1}`, "history");
    });

    // Add selected address if it has coordinates
    if (selectedAddress && selectedAddress.geometry) {
      const addressLocation: Location = {
        latitude: selectedAddress.geometry.location.lat,
        longitude: selectedAddress.geometry.location.lng,
        accuracy: 0,
        timestamp: new Date().toISOString(),
        address: selectedAddress.formatted_address,
      };
      addMarker(
        addressLocation,
        selectedAddress.formatted_address || "Selected Address",
        "address"
      );
    }
  };

  useEffect(() => {
    if (map) {
      updateMapMarkers();
    }
  }, [currentLocation, locationHistory, selectedAddress, map]);

  const handleAddressSelect = (address: AddressData) => {
    setSelectedAddress(address);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
          address: null,
        };
        setCurrentLocation(locationData);
        setLocationError(null);
      },
      (error) => {
        let errorMessage = "";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
          default:
            errorMessage = "An unknown error occurred.";
            break;
        }
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const startTracking = () => {
    setIsTracking(true);
    getCurrentLocation();

    const interval = setInterval(() => {
      getCurrentLocation();
    }, 30000);

    window.trackingInterval = interval;
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (window.trackingInterval) {
      clearInterval(window.trackingInterval);
      window.trackingInterval = null;
    }
  };

  const logCurrentLocation = () => {
    if (currentLocation) {
      const entry: Location = {
        ...currentLocation,
        id: Date.now(),
      };
      setLocationHistory((prev) => [entry, ...prev]);
      console.log("Current Location:", currentLocation);
    } else {
      console.log("No location data available");
    }
  };

  const logSelectedAddress = () => {
    if (selectedAddress) {
      console.log("Selected Address:", selectedAddress);
    } else {
      console.log("No address selected");
    }
  };

  const clearHistory = () => {
    setLocationHistory([]);
  };

  const centerOnLocation = (location: Location) => {
    if (map) {
      map.setCenter({ lat: location.latitude, lng: location.longitude });
      map.setZoom(16);
    }
  };

  useEffect(() => {
    return () => {
      if (window.trackingInterval) {
        clearInterval(window.trackingInterval);
      }
    };
  }, []);

  return (
    <div className="flex gap-2 p-2 flex-1 bg-background">
      {/* Left Panel - Controls */}
      <div className="w-80 flex flex-col gap-2">
        {/* Address Input Section */}
        <div
          className="bg-foreground rounded-lg p-4"
          style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
          <label className="block text-sm font-medium text-text-muted mb-2">
            Manual Address Entry
          </label>
          <AddressAutocomplete
            apiKey={GOOGLE_API_KEY}
            onAddressSelect={handleAddressSelect}
            placeholder="Enter address manually"
          />
          <Button
            onClick={logSelectedAddress}
            className="mt-2 w-full">
            Log Selected Address
          </Button>
          {selectedAddress && (
            <div className="mt-2 p-2 bg-surface rounded text-sm text-text">
              <strong>Selected:</strong> {selectedAddress.formatted_address}
            </div>
          )}
        </div>

        {/* Toast Testing Section */}
        <div
          className="bg-foreground rounded-lg p-4"
          style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
          <h3 className="text-lg font-semibold text-text mb-4">
            Toast Testing
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button
              onClick={() => success("Operation completed successfully!")}
              variant="primary"
              size="sm">
              Success
            </Button>
            <Button
              onClick={() => error("Something went wrong!")}
              variant="destructive"
              size="sm">
              Error
            </Button>
            <Button
              onClick={() => warning("Please check your input!")}
              variant="secondary"
              size="sm">
              Warning
            </Button>
            <Button
              onClick={() => info("Here's some helpful information.")}
              variant="ghost"
              size="sm">
              Info
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => success("This is a toast with a title!", { title: "Success!" })}
              variant="primary-outline"
              size="sm"
              className="flex-1">
              With Title
            </Button>
            <Button onClick={notifyMe} variant="secondary-outline" size="sm" className="flex-1">
              Browser Notification
            </Button>
          </div>
        </div>

        {/* Bottom Sheet Testing Section */}
        <div
          className="bg-foreground rounded-lg p-4"
          style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
          <h3 className="text-lg font-semibold text-text mb-4">
            Bottom Sheet Testing
          </h3>
          <p className="text-sm text-text-muted mb-4">
            Mobile-optimized modal alternative with drag-to-dismiss
          </p>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button
              onClick={() => {
                setBottomSheetSize("small");
                setBottomSheetContent("basic");
                setBottomSheetOpen(true);
              }}
              variant="primary"
              size="sm">
              Small
            </Button>
            <Button
              onClick={() => {
                setBottomSheetSize("medium");
                setBottomSheetContent("basic");
                setBottomSheetOpen(true);
              }}
              variant="primary"
              size="sm">
              Medium
            </Button>
            <Button
              onClick={() => {
                setBottomSheetSize("large");
                setBottomSheetContent("basic");
                setBottomSheetOpen(true);
              }}
              variant="primary"
              size="sm">
              Large
            </Button>
            <Button
              onClick={() => {
                setBottomSheetSize("full");
                setBottomSheetContent("basic");
                setBottomSheetOpen(true);
              }}
              variant="primary"
              size="sm">
              Full
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                setBottomSheetSize("medium");
                setBottomSheetContent("form");
                setBottomSheetOpen(true);
              }}
              variant="secondary"
              size="sm">
              Form Example
            </Button>
            <Button
              onClick={() => {
                setBottomSheetSize("large");
                setBottomSheetContent("list");
                setBottomSheetOpen(true);
              }}
              variant="ghost"
              size="sm">
              List Example
            </Button>
          </div>
        </div>

        {/* Mobile Table View Testing Section */}
        <div
          className="bg-foreground rounded-lg p-4"
          style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
          <h3 className="text-lg font-semibold text-text mb-4">
            Mobile Table View
          </h3>
          <p className="text-sm text-text-muted mb-4">
            Resize window to mobile to see card view (or use dev tools)
          </p>
          <div className="h-[400px] bg-background rounded-lg overflow-hidden">
            <Table
              columns={tableColumns}
              data={sampleTableData}
              total={sampleTableData.length}
              onRowClick={(row) => info(`Clicked: ${row.name}`)}
              mobileCardView={true}
            />
          </div>
        </div>

        {/* Location Tracking Section */}
        <div
          className="bg-foreground rounded-lg p-4"
          style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
          <h3 className="text-lg font-semibold text-text mb-4">
            Employee Location Tracking
          </h3>

          <div className="flex gap-2 mb-4">
            <Button
              onClick={getCurrentLocation}
              className="flex-1">
              Get Location
            </Button>
            {!isTracking ? (
              <Button
                onClick={startTracking}
                className="flex-1 bg-success hover:bg-success/80">
                Start Tracking
              </Button>
            ) : (
              <Button
                onClick={stopTracking}
                className="flex-1 bg-error hover:bg-error/80">
                Stop Tracking
              </Button>
            )}
          </div>

          {locationError && (
            <div className="bg-error/10 border border-error/20 rounded p-3 mb-4">
              <p className="text-error text-sm">{locationError}</p>
            </div>
          )}

          {currentLocation && (
            <div className="bg-surface rounded p-3 mb-4">
              <h4 className="font-medium text-text mb-2">Current Position:</h4>
              <div className="text-sm text-text-muted space-y-1">
                <p>
                  <strong>Lat:</strong> {currentLocation.latitude.toFixed(6)}
                </p>
                <p>
                  <strong>Lng:</strong> {currentLocation.longitude.toFixed(6)}
                </p>
                <p>
                  <strong>Accuracy:</strong>{" "}
                  {currentLocation.accuracy.toFixed(0)}m
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={logCurrentLocation}
                  size="sm"
                  className="flex-1">
                  Log Location
                </Button>
                <Button
                  onClick={() => centerOnLocation(currentLocation)}
                  size="sm"
                  variant="ghost"
                  className="flex-1">
                  Center Map
                </Button>
              </div>
            </div>
          )}

          {isTracking && (
            <div className="bg-primary/10 border border-primary/20 rounded p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <p className="text-primary text-sm font-medium">
                  Actively tracking...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Location History */}
        {locationHistory.length > 0 && (
          <div
            className="bg-foreground rounded-lg p-4"
            style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text">
                Location History
              </h3>
              <Button
                onClick={clearHistory}
                size="sm"
                variant="ghost">
                Clear
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {locationHistory.map((location) => (
                <div
                  key={location.id}
                  className="bg-surface rounded p-3 cursor-pointer hover:bg-surface/80"
                  onClick={() => centerOnLocation(location)}>
                  <div className="text-xs text-text-muted mb-1">
                    {new Date(location.timestamp).toLocaleString()}
                  </div>
                  <div className="text-sm text-text">
                    <p>
                      {location.latitude.toFixed(6)},{" "}
                      {location.longitude.toFixed(6)}
                    </p>
                    <p className="text-text-muted">
                      ±{location.accuracy.toFixed(0)}m accuracy
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Map */}
      <div
        className="flex-1 bg-foreground rounded-lg overflow-hidden"
        style={{ boxShadow: `0 1px 3px var(--shadow)` }}>
        <div className="bg-surface p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text">Location Map</h2>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-text-muted">Current Location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-info"></div>
              <span className="text-text-muted">Location History</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span className="text-text-muted">Selected Address</span>
            </div>
          </div>
        </div>
        <div
          ref={mapRef}
          className="w-full h-full min-h-[600px]"></div>
      </div>

      {/* Bottom Sheet Component */}
      <BottomSheet
        isOpen={bottomSheetOpen}
        onClose={() => setBottomSheetOpen(false)}
        title={
          bottomSheetContent === "basic"
            ? "Bottom Sheet Example"
            : bottomSheetContent === "form"
            ? "Quick Form"
            : "Select an Option"
        }
        snapPoint={bottomSheetSize}
        footer={
          bottomSheetContent === "form" ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setBottomSheetOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  success("Form submitted!");
                  setBottomSheetOpen(false);
                }}>
                Submit
              </Button>
            </div>
          ) : null
        }>
        {bottomSheetContent === "basic" && (
          <div className="space-y-3">
            <p className="text-text">
              This is a mobile-optimized bottom sheet component. Try dragging it down to dismiss!
            </p>
            <div className="bg-surface p-4 rounded-lg">
              <h4 className="font-medium mb-2">Features:</h4>
              <ul className="text-sm text-text-muted space-y-1 list-disc list-inside">
                <li>Drag to dismiss gesture</li>
                <li>Multiple size options (snap points)</li>
                <li>Backdrop click to close</li>
                <li>Smooth animations</li>
                <li>Touch-friendly interface</li>
                <li>z-index: 60 (doesn't conflict with Modal at 50)</li>
              </ul>
            </div>
          </div>
        )}

        {bottomSheetContent === "form" && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">
                Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">
                Message
              </label>
              <textarea
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text min-h-[100px]"
                placeholder="Enter your message"
              />
            </div>
          </div>
        )}

        {bottomSheetContent === "list" && (
          <div className="space-y-2">
            {[
              { label: "Dashboard", icon: "📊" },
              { label: "Profile", icon: "👤" },
              { label: "Settings", icon: "⚙️" },
              { label: "Notifications", icon: "🔔" },
              { label: "Messages", icon: "💬" },
              { label: "Calendar", icon: "📅" },
              { label: "Reports", icon: "📈" },
              { label: "Help", icon: "❓" },
            ].map((item, index) => (
              <button
                key={index}
                className="w-full flex items-center gap-3 p-3 bg-surface hover:bg-surface/80 rounded-lg transition-colors"
                onClick={() => {
                  info(`Selected: ${item.label}`);
                  setBottomSheetOpen(false);
                }}>
                <span className="text-2xl">{item.icon}</span>
                <span className="text-text font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default Sandbox;
