import React, { useState, useEffect, useRef } from "react";

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

interface AddressInputProps {
  onAddressSelect: (address: AddressData) => void;
  placeholder?: string;
  apiKey: string;
}

// Singleton to manage Google Maps API loading
const googleMapsLoader = {
  isLoading: false,
  isLoaded: false,
  loadPromise: null as Promise<void> | null,
  script: null as HTMLScriptElement | null,

  load(apiKey: string): Promise<void> {
    if (this.isLoaded) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = new Promise<void>((resolve, reject) => {
      if (window.google?.maps?.places) {
        this.isLoaded = true;
        this.isLoading = false;
        resolve();
        return;
      }

      // Remove any existing script
      const existingScript = document.querySelector(
        `script[src*="maps.googleapis.com"]`
      );
      if (existingScript) {
        document.head.removeChild(existingScript);
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        // Wait a bit to ensure everything is properly initialized
        setTimeout(() => {
          if (window.google?.maps?.places) {
            this.isLoaded = true;
            this.isLoading = false;
            resolve();
          } else {
            this.isLoading = false;
            this.loadPromise = null;
            reject(new Error("Google Maps API failed to load properly"));
          }
        }, 100);
      };

      script.onerror = () => {
        this.isLoading = false;
        this.loadPromise = null;
        reject(new Error("Failed to load Google Maps API"));
      };

      this.script = script;
      document.head.appendChild(script);
    });

    return this.loadPromise;
  },

  cleanup() {
    if (this.script && document.head.contains(this.script)) {
      document.head.removeChild(this.script);
    }
    this.script = null;
    this.isLoaded = false;
    this.isLoading = false;
    this.loadPromise = null;
  },
};

const AddressInput = ({
  onAddressSelect,
  placeholder = "Enter address...",
  apiKey,
}: AddressInputProps) => {
  const [input, setInput] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<InstanceType<
    typeof window.google.maps.places.AutocompleteService
  > | null>(null);
  const placesService = useRef<InstanceType<
    typeof window.google.maps.places.PlacesService
  > | null>(null);

  useEffect(() => {
    if (!apiKey) {
      setError("API key is required");
      return;
    }

    const initialize = async () => {
      try {
        await googleMapsLoader.load(apiKey);
        initializeServices();
        setIsGoogleLoaded(true);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize Google Maps"
        );
        setIsGoogleLoaded(false);
      }
    };

    initialize();

    return () => {
      // Only cleanup if this is the last instance
      if (document.querySelectorAll("[data-google-maps-loaded]").length <= 1) {
        googleMapsLoader.cleanup();
      }
    };
  }, [apiKey]);

  const initializeServices = () => {
    try {
      if (!window.google?.maps?.places) {
        throw new Error("Google Maps API not loaded");
      }

      autocompleteService.current =
        new window.google.maps.places.AutocompleteService();
      const dummyDiv = document.createElement("div");
      placesService.current = new window.google.maps.places.PlacesService(
        dummyDiv
      );
    } catch (err) {
      throw new Error("Failed to initialize Google Maps services");
    }
  };

  const fetchPredictions = async (searchInput: string) => {
    if (!isGoogleLoaded || !autocompleteService.current) {
      return;
    }

    if (searchInput.length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const request = {
      input: searchInput,
      types: ["address"], // Focus on addresses
    };

    autocompleteService.current.getPlacePredictions(
      request,
      (predictions, status) => {
        setIsLoading(false);

        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          predictions
        ) {
          setPredictions(predictions);
          setShowDropdown(true);
        } else if (
          status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS
        ) {
          setPredictions([]);
          setShowDropdown(false);
        } else {
          setError(`API Error: ${status}`);
          setPredictions([]);
          setShowDropdown(false);
        }
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce API calls
    debounceRef.current = setTimeout(() => {
      fetchPredictions(value);
    }, 300);
  };

  const handlePredictionSelect = (prediction: {
    place_id: string;
    description: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
  }) => {
    if (!placesService.current) return;

    setInput(prediction.description);
    setShowDropdown(false);
    setIsLoading(true);

    // Get detailed place information
    const request = {
      placeId: prediction.place_id,
      fields: [
        "formatted_address",
        "address_components",
        "geometry",
        "place_id",
        "name",
      ],
    };

    placesService.current.getDetails(request, (place, status) => {
      setIsLoading(false);

      if (
        status === window.google.maps.places.PlacesServiceStatus.OK &&
        place
      ) {
        const addressData = {
          place_id: place.place_id,
          formatted_address: place.formatted_address,
          geometry: {
            location: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            },
          },
          address_components: place.address_components,
          parsed: parseAddressComponents(place.address_components),
        };

        onAddressSelect?.(addressData);
      } else {
        setError(`Failed to get place details: ${status}`);
      }
    });
  };

  // Helper function to parse address components into common fields
  const parseAddressComponents = (
    components: AddressComponent[]
  ): ParsedAddress => {
    const parsed: ParsedAddress = {};

    components.forEach((component) => {
      const types = component.types;

      if (types.includes("street_number")) {
        parsed.street_number = component.long_name;
      }
      if (types.includes("route")) {
        parsed.street_name = component.long_name;
      }
      if (types.includes("locality")) {
        parsed.city = component.long_name;
      }
      if (types.includes("administrative_area_level_1")) {
        parsed.state = component.short_name;
        parsed.state_long = component.long_name;
      }
      if (types.includes("country")) {
        parsed.country = component.short_name;
        parsed.country_long = component.long_name;
      }
      if (types.includes("postal_code")) {
        parsed.postal_code = component.long_name;
      }
    });

    return parsed;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (error) {
    return (
      <div className="w-full max-w-md p-4 bg-red-50 border border-destructive rounded-sm">
        <p className="text-red-700 text-sm">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder={isGoogleLoaded ? placeholder : "Loading Google Maps..."}
          disabled={!isGoogleLoaded}
          className="w-full p-2 border border-border rounded-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors disabled:bg-surface disabled:cursor-not-allowed text-text"
          onFocus={() =>
            input.length >= 3 && predictions.length > 0 && setShowDropdown(true)
          }
        />

        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
          </div>
        )}
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-foreground border border-border rounded-sm shadow max-h-60 overflow-y-auto">
          {predictions.map((prediction) => (
            <div
              key={prediction.place_id}
              onClick={() => handlePredictionSelect(prediction)}
              className="p-2 hover:bg-surface cursor-pointer border-b border-border last:border-b-0 transition-colors">
              <div className="text-sm font-medium text-text">
                {prediction.structured_formatting.main_text}
              </div>
              <div className="text-sm text-text-muted">
                {prediction.structured_formatting.secondary_text}
              </div>
            </div>
          ))}

          {predictions.length === 0 && !isLoading && input.length >= 3 && (
            <div className="px-4 py-3 text-text-muted text-center">
              No addresses found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressInput;
