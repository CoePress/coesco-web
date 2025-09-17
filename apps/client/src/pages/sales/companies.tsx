import {
  MoreHorizontal,
  PlusCircleIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";

import { Table, Button, PageHeader } from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useGetEntities } from "@/hooks/_base/use-get-entities";

const Companies = () => {
  const { entities: companies } = useGetEntities("/crm/companies");
  const [legacyCompanies, setLegacyCompanies] = useState<any[] | null>(null);
  const [_legacyContacts, setLegacyContacts] = useState<any[] | null>(null);

  const adaptLegacyCompany = (raw: any, contacts: any[] = []) => {
    const companyContacts = contacts.filter(contact => contact.Company_ID === raw.Company_ID);
    const primaryContact = companyContacts.find(contact => contact.Type === 'A') || companyContacts[0];
    
    return {
      id: raw.Company_ID,
      name: raw.CustDlrName || `Company ${raw.Company_ID}`,
      phone: primaryContact?.PhoneNumber || raw.BillToPhone || "",
      email: primaryContact?.Email || "",
      website: primaryContact?.Website || "",
      dealer: raw.Dealer,
      active: raw.Active,
      isDealer: raw.IsDealer,
      isExcDealer: raw.IsExcDealer,
      creditStatus: raw.CreditStatus,
      creditNote: raw.CreditNote,
      onHoldBy: raw.OnHoldBy,
      onHoldDate: raw.OnHoldDate,
      offHoldBy: raw.OffHoldBy,
      offHoldDate: raw.OffHoldDate,
      classification: raw.Classification,
      custType: raw.CustType,
      lastCreditStat: raw.LastCreditStat,
      coeRSM: raw.CoeRSM,
      discounted: raw.Discounted,
      notes: raw.Notes,
      shipInstr: raw.ShipInstr,
      billToExt: raw.BillToExt,
      creditLimit: raw.CreditLimit,
      acctBalance: raw.AcctBalance,
      balanceDate: raw.BalanceDate,
      termsCode: raw.TermsCode,
      exported: raw.Exported,
      systemNotes: raw.SystemNotes,
      // Additional contact info
      primaryContact,
      allContacts: companyContacts,
    };
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Fetch companies and contacts in parallel
        const [companiesResponse, contactsResponse] = await Promise.all([
          fetch(
            `http://localhost:8080/api/legacy/base/Company?sort=Company_ID&order=desc`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
            }
          ),
          fetch(
            `http://localhost:8080/api/legacy/base/Contacts?sort=Company_ID&order=desc&limit=500`,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
            }
          )
        ]);

        let contactsData = [];
        if (contactsResponse.ok) {
          const rawContacts = await contactsResponse.json();
          contactsData = Array.isArray(rawContacts) ? rawContacts : [];
          if (!cancelled) setLegacyContacts(contactsData);
        } else {
          console.error("Legacy contacts fetch failed:", contactsResponse.status, await contactsResponse.text());
        }

        if (companiesResponse.ok) {
          const rawCompanies = await companiesResponse.json();
          const mapped = Array.isArray(rawCompanies) ? rawCompanies.map(company => adaptLegacyCompany(company, contactsData)) : [];
          if (!cancelled) setLegacyCompanies(mapped);
        } else {
          console.error("Legacy companies fetch failed:", companiesResponse.status, await companiesResponse.text());
        }
      } catch (error) {
        console.error("Error fetching Companies and Contacts:", error);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const baseCompanies = legacyCompanies?.length ? legacyCompanies : (companies ?? []);

  // Batch loading state
  const [batchSize, setBatchSize] = useState(500);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const displayedCompanies = baseCompanies.slice(0, batchSize);
  const hasMoreCompanies = baseCompanies.length > batchSize;

  const loadMoreCompanies = useCallback(() => {
    if (isLoadingMore || !hasMoreCompanies) return;
    
    setIsLoadingMore(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setBatchSize(prev => prev + 200);
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, hasMoreCompanies]);

  // Scroll detection for auto-loading
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    if (!target) return;
    
    const { scrollTop, scrollHeight, clientHeight } = target;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold
    
    if (isNearBottom && hasMoreCompanies && !isLoadingMore) {
      loadMoreCompanies();
    }
  }, [hasMoreCompanies, isLoadingMore, loadMoreCompanies]);

  // Add scroll listener
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;

    const scrollContainer = containerRef.current;

    // Throttle scroll events
    let timeoutId: NodeJS.Timeout;
    const throttledScroll = (e: Event) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handleScroll(e), 100);
    };

    scrollContainer.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      scrollContainer.removeEventListener('scroll', throttledScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [handleScroll]);

  const columns: TableColumn<any>[] = [
    {
      key: "name",
      header: "Name",
      className: "text-primary hover:underline",
      render: (_, row) => (
        <Link to={`/sales/companies/${row.id}`}>{row.name}</Link>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      className: "hover:underline",
      render: (_, row) =>
        row.phone ? <Link to={`tel:${row.phone}`}>{row.phone}</Link> : "-",
    },
    {
      key: "email",
      header: "Email",
      className: "hover:underline",
      render: (_, row) =>
        row.email ? <Link to={`mailto:${row.email}`}>{row.email}</Link> : "-",
    },
    {
      key: "website",
      header: "Website",
      className: "hover:underline",
      render: (_, row) =>
        row.website ? (
          <Link
            to={row.website}
            target="_blank">
            {row.website}
          </Link>
        ) : (
          "-"
        ),
    },
    {
      key: "actions",
      header: "",
      render: () => (
        <button onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal size={16} />
        </button>
      ),
    },
  ];

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button>
          <PlusCircleIcon size={20} /> Create New
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Companies"
        description={baseCompanies ? `${baseCompanies?.length} total companies` : ""}
        actions={<Actions />}
      />

      <div ref={containerRef} className="flex-1 overflow-auto">
        <div className="flex flex-col h-full">
          <Table<any>
            columns={columns}
            data={displayedCompanies || []}
            total={baseCompanies?.length || 0}
            idField="id"
            className="bg-foreground rounded shadow-sm border flex-shrink-0"
          />
          {hasMoreCompanies && (
            <div className="p-4 bg-foreground flex justify-center flex-shrink-0">
              <Button
                variant="secondary-outline"
                onClick={loadMoreCompanies}
                disabled={isLoadingMore}
                className="min-w-32"
              >
                {isLoadingMore 
                  ? "Loading..." 
                  : `Load ${Math.min(200, baseCompanies.length - batchSize)} More (${baseCompanies.length - batchSize} remaining)`
                }
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Companies;