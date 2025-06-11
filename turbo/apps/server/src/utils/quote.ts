// export interface IQuoteService {
//   // business logic
//   createNewRevision(
//     quoteHeaderId: string,
//     notes?: string
//   ): Promise<IQuoteDetail>;
//   copyQuote(
//     quoteHeaderId: string,
//     newQuoteData: Partial<IQuoteHeader>
//   ): Promise<IQuoteHeader>;
//   changeQuoteStatus(
//     quoteDetailId: string,
//     status: QuoteStatus
//   ): Promise<IQuoteDetail>;

//   getQuoteWithCurrentRevision(quoteHeaderId: string): Promise<IQuoteFull>;
//   getQuoteHistory(quoteHeaderId: string): Promise<IQuoteDetail[]>;
//   getQuotesByRsm(rsmId: string): Promise<IQuoteHeader[]>;
//   getQuotesByCustomer(customerId: string): Promise<IQuoteHeader[]>;
//   getQuotesByDealer(dealerId: string): Promise<IQuoteHeader[]>;

//   addConfigurationToQuote(
//     quoteDetailId: string,
//     configurationId: string
//   ): Promise<IQuoteItem[]>;
//   createConfigurationFromQuote(
//     quoteDetailId: string,
//     configName: string
//   ): Promise<IConfiguration>;
// }

// export interface IProductConfigurationService {
//   // Configurations
//   calculateConfigurationPrice(selectedOptions: string[]): Promise<number>;

//   // Business Logic
//   getDefaultConfiguration(productClassId: string): Promise<IConfiguration>;
// }

// enum QuoteStatus {
//   DRAFT = "DRAFT",
//   SENT = "SENT",
//   ACCEPTED = "ACCEPTED",
//   REJECTED = "REJECTED",
//   EXPIRED = "EXPIRED",
// }

// export enum LeadSource {
//   TRADE_SHOW = "TRADE_SHOW",
//   REFERRAL = "REFERRAL",
//   WEBSITE = "WEBSITE",
//   COLD_OUTREACH = "COLD_OUTREACH",
//   EXISTING_CUSTOMER = "EXISTING_CUSTOMER",
//   OTHER = "OTHER",
// }

// // ProducedBy vs CreateInit ?
