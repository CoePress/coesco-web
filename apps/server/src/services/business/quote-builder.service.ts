import { quoteService } from "../repository";

export class QuoteBuilderService {
  async createQuote(data: any) {
    const currentYear = new Date().getFullYear();
    const isDraft = data.status === "DRAFT" || !data.status;

    const quoteNumber = await this.getNextQuoteNumber(isDraft);
    const revision = "A";

    const newQuote = await quoteService.create({
      ...data,
      year: currentYear,
      number: quoteNumber,
      revision,
      status: data.status || "DRAFT",
    });

    return newQuote;
  }

  async getNextQuoteNumber(isDraft: boolean = false): Promise<string> {
    const currentYear = new Date().getFullYear();

    const quotesResult = await quoteService.getAll({
      filter: {
        year: currentYear,
        number: {
          not: {
            startsWith: "DRAFT-",
          },
        },
      } as any,
      sort: "number",
      order: "desc",
      limit: 1,
    });

    let nextNumber: string;

    if (!quotesResult.success || !quotesResult.data || quotesResult.data.length === 0 || !quotesResult.data[0].number) {
      nextNumber = `${String(currentYear)}0001`;
    }
    else {
      const lastQuote = quotesResult.data[0];
      const currentNumber = lastQuote.number.replace(/^DRAFT-/, "");
      const numericPart = Number.parseInt(currentNumber.slice(-4));
      const nextNumericPart = (numericPart + 1).toString().padStart(4, "0");
      nextNumber = String(currentYear) + nextNumericPart;
    }

    return isDraft ? `DRAFT-${nextNumber}` : nextNumber;
  }

  async getNextQuoteRevision(quoteNumber: string, year?: number): Promise<string> {
    const currentYear = year || new Date().getFullYear();

    const relatedQuotesResult = await quoteService.getAll({
      filter: {
        year: currentYear,
        number: quoteNumber,
      } as any,
      sort: "revision",
      order: "desc",
    });

    if (!relatedQuotesResult.success || !relatedQuotesResult.data || relatedQuotesResult.data.length === 0) {
      return "A";
    }

    const lastRevision = relatedQuotesResult.data[0].revision;

    if (!lastRevision || lastRevision === "") {
      return "A";
    }

    if (/^\d+$/.test(lastRevision)) {
      return (Number.parseInt(lastRevision) + 1).toString();
    }

    if (/^[A-Z]$/.test(lastRevision)) {
      if (lastRevision === "Z") {
        return "AA";
      }
      return String.fromCharCode(lastRevision.charCodeAt(0) + 1);
    }

    if (/^[A-Z]{2}$/.test(lastRevision)) {
      const firstChar = lastRevision[0];
      const secondChar = lastRevision[1];

      if (secondChar === "Z") {
        if (firstChar === "Z") {
          return "AAA";
        }
        return `${String.fromCharCode(firstChar.charCodeAt(0) + 1)}A`;
      }
      return firstChar + String.fromCharCode(secondChar.charCodeAt(0) + 1);
    }

    return "A";
  }
}
