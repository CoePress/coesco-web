import { useEffect, useState } from "react";

export function useMobileDetection(breakpoint: number = 768) {
  const getInitialState = () => {
    if (typeof window === "undefined")
      return false;
    return window.innerWidth < breakpoint;
  };

  const [isMobile, setIsMobile] = useState(getInitialState);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    handleChange(mediaQuery);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [breakpoint]);

  return isMobile;
}
