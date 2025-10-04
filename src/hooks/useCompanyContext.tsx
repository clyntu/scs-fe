// hooks/useCompanyContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export interface Company {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

interface CompanyContextType {
  currentCompany: string | null;
  companies: Company[];
  setCurrentCompany: (companyCode: string) => void;
  isLoading: boolean;
  error: string | null;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompanyContext = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompanyContext must be used within CompanyProvider");
  }
  return context;
};

export const getCurrentCompany = (): string | null => {
  // This can be called from non-React contexts (like axios interceptors)
  const stored = localStorage.getItem("currentCompany");
  return stored !== null && stored !== "" ? stored : "company-a";
};

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider = ({
  children,
}: CompanyProviderProps): JSX.Element => {
  const [currentCompany, setCurrentCompanyState] = useState<string | null>(
    null,
  );
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial company from localStorage
  useEffect(() => {
    const savedCompany = localStorage.getItem("currentCompany");
    if (savedCompany !== null && savedCompany !== "") {
      setCurrentCompanyState(savedCompany);
    } else {
      // Default to company-a if no saved company
      setCurrentCompanyState("company-a");
      localStorage.setItem("currentCompany", "company-a");
    }
  }, []);

  // Fetch available companies (this will work after Phase 4 API updates)
  useEffect(() => {
    const fetchCompanies = async (): Promise<void> => {
      try {
        setIsLoading(true);
        // Note: This endpoint will be available after Phase 4
        // For now, use hardcoded companies
        const mockCompanies: Company[] = [
          {
            id: 1,
            code: "company-a",
            name: "Peterson Parts Trading",
            isActive: true,
          },
          {
            id: 2,
            code: "company-b",
            name: "Medstore Inc.",
            isActive: true,
          },
        ];
        setCompanies(mockCompanies);
      } catch (err) {
        setError("Failed to load companies");
        console.error("Error loading companies:", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCompanies();
  }, []);

  const setCurrentCompany = (companyCode: string): void => {
    setCurrentCompanyState(companyCode);
    localStorage.setItem("currentCompany", companyCode);
    // Also update legacy companyId for backward compatibility
    localStorage.setItem("companyId", companyCode);
  };

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        companies,
        setCurrentCompany,
        isLoading,
        error,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};
