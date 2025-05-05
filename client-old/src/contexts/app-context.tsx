import React, { createContext, useEffect, useState } from "react";

interface AppContextType {
  sidebarExpanded: boolean;
  toggleSidebar: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(() => {
    const savedState = localStorage.getItem("sidebarExpanded");
    return savedState ? JSON.parse(savedState) : false;
  });

  const toggleSidebar = () => {
    setSidebarExpanded((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebarExpanded", JSON.stringify(newState));
      return newState;
    });
  };

  useEffect(() => {
    localStorage.setItem("sidebarExpanded", JSON.stringify(sidebarExpanded));
  }, [sidebarExpanded]);

  return (
    <AppContext.Provider
      value={{
        sidebarExpanded,
        toggleSidebar,
      }}>
      {children}
    </AppContext.Provider>
  );
};
