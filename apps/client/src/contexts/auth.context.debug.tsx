import React, {
    createContext,
    useState,
    ReactNode,
    useContext,
} from "react";

interface IAuthContextType {
    user: any;
    employee: any;
    setUser: (user: any, employee: any) => void;
    isLoading: boolean;
}

export const AuthContext = createContext<IAuthContextType | undefined>(
    undefined
);

interface AuthProviderProps {
    children: ReactNode;
}

// Minimal AuthProvider to test if the issue is with hooks or something else
export const AuthProvider = ({ children }: AuthProviderProps) => {
    console.log("AuthProvider rendering - React available:", !!React);
    console.log("useState available:", !!useState);

    try {
        const [user, setUserState] = useState<any>(null);
        const [employee, setEmployeeState] = useState<any>(null);
        const [isLoading, setIsLoading] = useState(false);

        const setUser = (user: any, employee: any) => {
            setUserState(user);
            setEmployeeState(employee);
            setIsLoading(false);
        };

        console.log("AuthProvider hooks initialized successfully");

        return (
            <AuthContext.Provider value={{ user, employee, setUser, isLoading }}>
                {children}
            </AuthContext.Provider>
        );
    } catch (error) {
        console.error("Error in AuthProvider:", error);
        throw error;
    }
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
