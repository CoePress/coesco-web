import { prisma } from "@/utils/prisma";

type EntityType = "company" | "contact" | "journey" | "quote";

interface SearchResult {
  id: string;
  label: string;
  type: EntityType;
}

export class SearchService {
  async searchEntities(entityType: EntityType, query: string, limit: number = 5): Promise<SearchResult[]> {
    const searchTerm = `%${query}%`;

    switch (entityType) {
      case "company":
        return this.searchCompanies(searchTerm, limit);
      case "contact":
        return this.searchContacts(searchTerm, limit);
      case "journey":
        return this.searchJourneys(searchTerm, limit);
      case "quote":
        return this.searchQuotes(searchTerm, limit);
      default:
        throw new Error(`Invalid entity type: ${entityType}`);
    }
  }

  private async searchCompanies(searchTerm: string, limit: number): Promise<SearchResult[]> {
    const companies = await prisma.company.findMany({
      where: {
        AND: [
          { deletedAt: null },
          {
            OR: [
              { name: { contains: searchTerm.replace(/%/g, ""), mode: "insensitive" } },
              { email: { contains: searchTerm.replace(/%/g, ""), mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
      },
      take: limit,
      orderBy: { name: "asc" },
    });

    return companies.map(company => ({
      id: company.id,
      label: company.name,
      type: "company" as EntityType,
    }));
  }

  private async searchContacts(searchTerm: string, limit: number): Promise<SearchResult[]> {
    const contacts = await prisma.contact.findMany({
      where: {
        AND: [
          { deletedAt: null },
          {
            OR: [
              { firstName: { contains: searchTerm.replace(/%/g, ""), mode: "insensitive" } },
              { lastName: { contains: searchTerm.replace(/%/g, ""), mode: "insensitive" } },
              { email: { contains: searchTerm.replace(/%/g, ""), mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
      orderBy: { firstName: "asc" },
    });

    return contacts.map(contact => ({
      id: contact.id,
      label: `${contact.firstName} ${contact.lastName || ""}`.trim() + (contact.company?.name ? ` (${contact.company.name})` : ""),
      type: "contact" as EntityType,
    }));
  }

  private async searchJourneys(searchTerm: string, limit: number): Promise<SearchResult[]> {
    const journeys = await prisma.journey.findMany({
      where: {
        AND: [
          { deletedAt: null },
          {
            OR: [
              { name: { contains: searchTerm.replace(/%/g, ""), mode: "insensitive" } },
              { id: { contains: searchTerm.replace(/%/g, ""), mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return journeys.map(journey => ({
      id: journey.id,
      label: journey.name || journey.id,
      type: "journey" as EntityType,
    }));
  }

  private async searchQuotes(searchTerm: string, limit: number): Promise<SearchResult[]> {
    const search = searchTerm.replace(/%/g, "");

    const quotes = await prisma.quote.findMany({
      where: {
        AND: [
          { deletedAt: null },
          {
            OR: [
              { year: { contains: search, mode: "insensitive" } },
              { number: { contains: search, mode: "insensitive" } },
            ],
          },
        ],
      },
      select: {
        id: true,
        year: true,
        number: true,
      },
      take: limit,
      orderBy: [{ year: "desc" }, { number: "desc" }],
    });

    return quotes.map(quote => ({
      id: quote.id,
      label: `${quote.year.slice(-2)}-${quote.number.padStart(5, "0")}`,
      type: "quote" as EntityType,
    }));
  }
}
