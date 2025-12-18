/* eslint-disable ts/no-namespace */
// Auto-generated from legacy database schemas
// Generated at: 2025-12-18T18:55:00.950Z
// Do not edit manually - run `npm run schema:generate` to regenerate

export namespace legacy {
  export namespace job {
    export interface BomChange {
      ChgId: number;
      Initials: string;
      TransDate: string;
      Notes: string;
      ChangeStatus: string;
    }

    export interface BomChg {
      ChgId: number;
      JobNumber: number;
      JobSuffix: string;
      BomItem: string;
      LineNumber: string;
      CompItem: string;
      ChgType: string;
      RefJobNumber: number;
      RefJobSuffix: string;
      RefBomItem: string;
      RefLineNumber: string;
      RefCompItem: string;
      ChgStatus: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface BomTrans {
      TransDate: string;
      TransTime: number;
      TransType: string;
      JobNumber: number;
      JobSuffix: string;
      BomItem: string;
      OldLineNum: string;
      LineNumber: string;
      OldCompItem: string;
      OldSource: string;
      OldInvQtyReq: number;
      OldCutQty: number;
      OldDimension: string;
      OldStandard: boolean;
      CompItem: string;
      Source: string;
      InvQtyReq: number;
      CutQty: number;
      Dimensions: string;
      Standard: boolean;
      Notes: string[];
      Initials: string;
    }

    export interface BudgetDetail {
      DeptCode: number;
      GlCode: number;
      Budgeted: number;
      Year: number;
    }

    export interface BudgetSpent {
      DeptCode: number;
      GlCode: number;
      BudgetYear: number;
      BudgetMon: number;
      Spent: number;
      Budgeted: number;
    }

    export interface CallXRef {
      CallRefNum: number;
      RefType: string;
      RefNumber: string;
    }

    export interface CheckHistory {
      JobNumber: number;
      CheckNumber: string;
      CheckAmount: number;
      DateRcvd: string;
      Notes: string;
    }

    export interface ChgBom {
      ChgId: number;
      JobNumber: number;
      JobSuffix: string;
      BomItem: string;
      LineNumber: string;
      CompItem: string;
      Standard: boolean;
      Source: string;
      InvQtyReq: number;
      CutQty: number;
      Dimensions: string;
      BOMRevision: string;
    }

    export interface COGSItem {
      Item: string;
      JobQty: number;
      OrdQty: number;
      TimeQty: number;
      Matl: number;
      Labor: number;
      Burden: number;
      Outside: number;
      Hours: number;
      WACQty: number;
      InvQty: number;
      CurQty: number;
    }

    export interface CompetingQuote {
      JobNumber: number;
      JobSuffix: string;
      Item: string;
      VendorNumber: number;
      QuoteNumber: string;
      QuotedPrice: number;
      PONumber: number;
      LineNumber: number;
    }

    export interface Contrl {
      Filename: string;
      KeyValue: number;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface CreditExemption {
      JobNumber: number;
      Company_ID: number;
      CreditStatus: string;
      Approved: boolean;
      AmountApproved: number;
      Notes: string;
      ApprDate: string;
      ApprInit: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface CTLAsnDetail {
      RefNumber: number;
      RefType: string;
      ASNSeq: number;
      LineNumber: number;
      Item: string;
      LineStatus: string;
      CutListId: number;
      OrderQtyRcvd: number;
      OrderUM: string;
      CostQtyRcvd: number;
      CostUM: string;
      Comments: string;
    }

    export interface CTLAsnHeader {
      RefNumber: number;
      RefType: string;
      ASNSeq: number;
      ASNStatus: string;
      ASNDateTime: string;
      VendorNumber: number;
      ShipperID: string;
      ShipDate: string;
      Comments: string;
      ASNApprover: string;
    }

    export interface CutList {
      JobNumber: number;
      JobSuffix: string;
      CutListNum: number;
      DeptCode: number;
      FrstLvlBOM: string;
      BomItem: string;
      LineNumber: string;
      CompItem: string;
      QtyToCut: number;
      QtyCut: number;
      Dimensions: string;
      ChangeType: string;
      CutStatus: string;
      ReleaseDate: string;
      OrderDate: string;
      CutDate: string;
      PONumber: number;
      Tracknum: number;
      Comment: string;
      CutListId: number;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface CutReqDtl {
      CutReqNum: number;
      JobNumber: number;
      JobSuffix: string;
      Item: string;
      InvQtyReq: number;
      QtyToCut: number;
      Dimensions: string;
      CutStatus: string;
    }

    export interface CutRequest {
      CutReqNum: number;
      ReqInit: string;
      ReqDate: string;
      ReqTime: number;
      Notes: string;
    }

    export interface CycleCount {
      BatchNum: number;
      Location: string;
      Item: string;
      CountDate: string;
      QtyCounted: number;
      QtyBefore: number;
      CountedBy: string;
      CountStatus: string;
      CyclePriority: string;
      LastCounted: string;
      SetManually: boolean;
      VolCriteria: number;
      CostCriteria: number;
    }

    export interface Department {
      DeptCode: number;
      DeptName: string;
      DeptMgr: number;
      Direct: boolean;
      EffectDate: string;
      LaborRate: number;
      BurdenRate: number;
      CreateDate: string;
      Active: boolean;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
      Password: string;
    }

    export interface DueRevision {
      JobNumber: number;
      JobSuffix: string;
      SchDueDate: string;
      Revision: number;
      RevCode: string;
      RevNotes: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface ErrorLog {
      ErrorStatus: string;
      TransDate: string;
      TransTime: number;
      Location: string;
      Item: string;
      JobNumber: number;
      JobSuffix: string;
      QtyOnHand: number;
      ProblemDesc: string[];
      ProgName: string;
      DateResolved: string;
      ResolvedBy: string;
      Notes: string[];
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface ExceptItems {
      ExcGroup: string;
      Item: string;
      Qualifier: string;
    }

    export interface ExceptJobs {
      ExcGroup: string;
      JobNumber: number;
      JobSuffix: string;
    }

    export interface ExpAllocation {
      ExpVoucher: string;
      DivisionId: number;
      JobNumber: number;
      JobSuffix: string;
      Amount: number;
      BSAcctCombined: string;
      AcctCombined: string;
      ExpStatus: string;
      HoldTransDate: string;
      ExpTransDate: string;
      AssignStatus: string;
    }

    export interface ExpenseReport {
      RefNumber: number;
      RefType: string;
      ExpDate: string;
      Document: string;
      GlCode: number;
      ExpAmount: number;
      DeptCode: number;
      BudgetCode: string;
    }

    export interface ExpList {
      JobNumber: number;
      JobSuffix: string;
    }

    export interface ExpRptWrkFil {
      JobNumber: number;
      JobSuffix: string;
      FrstLvlBOM: string;
      BomItem: string;
      LineNumber: string;
      CompItem: string;
      DeptCode: number;
      Initials: string;
    }

    export interface FactoryDtl {
      FONumber: number;
      LineNumber: number;
      FOStatus: string;
      Item: string;
      BomItem: string;
      InvQtyReq: number;
      CloseDate: string;
      CloseQty: number;
      Dimensions: string;
      JobNumber: number;
      JobSuffix: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface FactoryOrder {
      "FONumber": number;
      "Item": string;
      "InvQtyReq": number;
      "CloseQty": number;
      "OrderDate": string;
      "NeedByDate": string;
      "OrderedBy": string;
      "FOStatus": string;
      "Notes": string;
      "RouterSeq#": number;
      "CloseDate": string;
      "JobNumber": number;
      "JobSuffix": string;
      "CreateDate": string;
      "CreateInit": string;
      "ModifyDate": string;
      "ModifyInit": string;
      "PrevModDate": string;
      "PrevModInit": string;
    }

    export interface FaxRef {
      FaxId: number;
      FaxType: string;
      FaxReference: string;
    }

    export interface FOTimeSheet {
      EmpNum: number;
      WorkDate: string;
      EntryType: string;
      StartTime: number;
      EndTime: number;
      Lunch: boolean;
      ElapsedMin: number;
      FONumber: number;
      BomItem: string;
      Quantity: number;
      PostDate: string;
      PostTime: number;
      PayPeriod: string;
      CorrType: string;
      ClockPunch: boolean;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface FreightDetail {
      "Freight#": number;
      "Line#": number;
      "JobNumber": number;
      "JobSuffix": string;
      "Description": string;
      "LDim": string;
      "WDim": string;
      "HDim": string;
      "Weight": number;
      "WtUM": string;
      "InsureValue": number;
      "Charges": number;
      "Qty": number;
      "Rate": number;
      "HM": boolean;
    }

    export interface FreightHeader {
      "Freight#": number;
      "Initials": string;
      "Warehouse#": number;
      "ShipFrom": string;
      "ShipToNum": number;
      "ShipId": number;
      "ShipToAddress": string;
      "ShipToCont": number;
      "ContactName": string;
      "PhoneNumber": string;
      "FaxNumber": string;
      "Notes": string;
      "FreightOptions": string;
      "DelPayReq": boolean;
      "WeightByShipper": boolean;
      "MachTarped": boolean;
      "COD-Amt": number;
      "COD-Fee": number;
      "COD-FeeCollect": boolean;
      "COD-Remit": string;
      "ValueofShip": number;
      "ValuePer": string;
      "ShipDate": string;
      "CustPO": string;
      "ThirdParty": string;
    }

    export interface FreightQuote {
      "Freight#": number;
      "VendorNumber": number;
      "Insurance": number;
      "LTLDelivery": string;
      "LTLPrice": number;
      "FullDelivery": string;
      "FullPrice": number;
      "RFQStatus": string;
      "QuotedBy": string;
      "QuoteDate": string;
      "Comments": string;
    }

    export interface GlTrx {
      "GlCode": number;
      "Sub-Acct": number;
      "TransDate": string;
      "TrxAmount": number;
      "PostDate": string;
      "JobNumber": number;
      "JobSuffix": string;
      "TrxRef": number;
      "TrxSource": string;
      "SrcDocument": string;
    }

    export interface GPSTrx {
      BatchKey: number;
      GlCode: number;
      InvoiceDate: string;
      Debit: number;
      Credit: number;
      VendorNumber: number;
      VendorName: string;
      VoucherNumber: string;
      Matched: boolean;
    }

    export interface HotPart {
      HotPartID: number;
      Item: string;
      RequestInit: string;
      RequestDate: string;
      RequestTime: number;
      JobNumber: number;
      JobSuffix: string;
      RefType: string;
      RefNumber: string;
      ExpectDate: string;
      ExpectTime: number;
      HotStatus: string;
      CompleteInit: string;
      CompleteDate: string;
      CompleteTime: number;
      Notes: string;
    }

    export interface HotShtRisk {
      JobNumber: number;
      JobSuffix: string;
      BomItem: string;
      DeptIndex: number;
      RiskLevel: number;
      DateExpected: string;
      Notes: string;
      RiskStatus: string;
      CreateInit: string;
      CreateDT: string;
      ModifyDT: string;
      ModifyInit: string;
    }

    export interface HoursMapDept {
      HoursType: string;
      DivisionId: number;
      DeptCode: number;
      StartDate: string;
      EndDate: string;
      AcctCombined: string;
      BSAcctCombined: string;
    }

    export interface InvAcct {
      TransID: number;
      Item: string;
      JobNumber: number;
      JobSuffix: string;
      TransDate: string;
      TransTime: number;
      TransType: number;
      SubType: number;
      BQtyOHPA: number;
      BQtyOHPR: number;
      BQtyOHUA: number;
      BQtyOHUR: number;
      BAvgMatlCost: number;
      BAvgLaborCost: number;
      BAvgBurdenCst: number;
      BAvgOPCost: number;
      NetQtyChng: number;
      NetMatlChng: number;
      NetLaborChng: number;
      NetBurdenChng: number;
      NetOPChng: number;
      PONumber: number;
      LineNumber: number;
      POPrice: number;
      ProgramName: string;
      Notes: string;
      Notes2: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface InvCollDscWk {
      Initials: string;
      Location: string;
      Item: string;
      JobNumber: number;
      JobSuffix: string;
      QtyCollected: number;
      QtyInventory: number;
      HadJobNum: boolean;
    }

    export interface InventryColl {
      Location: string;
      Item: string;
      JobNumber: number;
      JobSuffix: string;
      SourceRecord: boolean;
      QtyOnHand: number;
      BatchNum: number;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
      Tag: number;
    }

    export interface InventryCtrl {
      Item: string;
      JobNumber: number;
      JobSuffix: string;
      QtyOHPA: number;
      QtyOHPR: number;
      QtyOHUA: number;
      QtyOHUR: number;
      QtyOOA: number;
      QtyOOR: number;
      QtyIPA: number;
      QtyIPR: number;
      AvgMatlCost: number;
      AvgLaborCost: number;
      AvgBurdenCst: number;
      AvgOPCost: number;
      QtyTBR: number;
      QtyOFR: number;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface InventryTran {
      Location: string;
      Item: string;
      JobNumber: number;
      JobSuffix: string;
      TransDate: string;
      TransTime: number;
      Initials: string;
      BeginningQty: number;
      AdjQty: number;
      EndingQty: number;
      Notes: string;
    }

    export interface InvLaborDtl {
      Item: string;
      JobNumber: number;
      JobSuffix: string;
      DeptCode: number;
      Rework: boolean;
      AvgLaborHrs: number;
      AvgLaborCost: number;
      AvgBurdenCst: number;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface InvLengths {
      Item: string;
      Length: number;
      UM: string;
      Qty: number;
      Dated: string;
      Initials: string;
      Notes: string;
    }

    export interface InvoiceBatch {
      InvoiceDate: string;
      BatchNumber: number;
      BatchStatus: string;
      PostDate: string;
    }

    export interface InvoiceDist {
      InvoiceNumber: number;
      GlCode: number;
      GLAmount: number;
      DistStatus: string;
    }

    export interface InvoiceDtl {
      InvoiceNumber: number;
      LineNumber: number;
      Item: string;
      ItemDescription: string;
      Quantity: number;
      UnitCost: number;
      SubTotal: number;
      CommAmount: number;
      CommAmount2: number;
      GlCode: number;
      LineType: string;
      RestockPercent: number;
      RestockCharge: number;
      RMALine: number;
      RestockFee: boolean;
      TaxFlag: string;
    }

    export interface InvoiceHeader {
      InvoiceNumber: number;
      InvoiceType: string;
      InvoiceStatus: string;
      InvoiceMethod: string;
      FinalInvoice: boolean;
      InvoiceDate: string;
      DueDate: string;
      PaidOn: string;
      CustPO: string;
      AlternatePO: string;
      JobNumber: number;
      JobSuffix: string;
      JobStatus: string;
      TermsLine: number;
      ShipToNum: number;
      ShipId: number;
      ShipDate: string;
      Carrier: string;
      AmountDue: number;
      Shipping: number;
      Handling: number;
      FreightGLCode: number;
      AmountPaid: number;
      AmountPastDue: number;
      AppliedAmount: number;
      TotalGross: number;
      TotalCommission: number;
      DepositApplied: number;
      CreditAmount: number;
      LinePrice: boolean;
      InvoiceNotes: string;
      PayNotes: string;
      BatchNumber: number;
      PrintDate: string;
      PrintTime: number;
      RefInvoiceNumber: number;
      RefInvoiceType: string;
      ShipToAddress: string;
      BillToNum: number;
      BillToId: number;
      OrderDate: string;
      RMANumber: number;
      RcptNumber: number;
      Salesman: number;
      OrigShipping: number;
      OrigHandling: number;
      Initials: string;
      COGSType: string;
      TotalRestocking: number;
      OriginalVia: string;
      InvoiceFile: string;
      EmailedTo: string;
      CreateInit: string;
      CreateDate: string;
    }

    export interface InvoiceSalesTax {
      InvoiceNumber: number;
      TZID: number;
      ShipToNum: number;
      ShipId: number;
      GrossSales: number;
      TaxableSales: number;
      Shipping: number;
      Handling: number;
      TaxFlag: string;
      TaxRate: number;
      TaxAmount: number;
      TaxRateDate: string;
      TaxDate: string;
      PaidDate: string;
      CheckNum: string;
    }

    export interface InvSummary {
      "BatchDate": string;
      "Section": string;
      "Warehouse#": number;
      "ClassSubClss": string;
      "MaterialCost": number;
      "LaborCost": number;
      "BurdenCost": number;
      "OutPrcCost": number;
      "TotalCost": number;
    }

    export interface InvTag {
      Tag: number;
      StartItem: string;
      EndItem: string;
      StartLoc: string;
      EndLoc: string;
      JobNumber: number;
      JobSuffix: string;
      CntBy: number;
      EnterBy: number;
      Voided: boolean;
    }

    export interface InvUsage {
      Item: string;
      StartDate: string;
      EndDate: string;
      JobQty: number;
      PartsQty: number;
      OtherQty: number;
      MaterialCost: number;
      LaborCost: number;
      BurdenCost: number;
      OutPrcCost: number;
    }

    export interface InvVal {
      BatchDate: string;
      Item: string;
      JobNumber: number;
      JobSuffix: string;
      Section: string;
      Type: string;
      QtyOnHand: number;
      AvgMatlCost: number;
      AvgLaborCost: number;
      AvgBurdenCst: number;
      AvgOPCost: number;
      TotalMatl: number;
      TotalLabor: number;
      TotalBurden: number;
      TotalOP: number;
      TotalCost: number;
    }

    export interface InvValLabor {
      BatchDate: string;
      Section: string;
      Type: string;
      DeptCode: number;
      TotalLabor: number;
      TotalBurden: number;
      TotalHours: number;
    }

    export interface JobBList {
      JobNumber: number;
      JobSuffix: string;
      SchDueDate: string;
      LastWorked: string;
      Complete: boolean;
    }

    export interface JobBOM {
      JobNumber: number;
      JobSuffix: string;
      BomItem: string;
      LineNumber: string;
      CompItem: string;
      Source: string;
      InvQtyReq: number;
      CutQty: number;
      Dimensions: string;
      Standard: boolean;
      QtyFromInv: number;
      QtyPulled: number;
      QtyTknFrmInv: number;
      QtyToPurch: number;
      QtyPurchased: number;
      QtyToMake: number;
      QtyMade: number;
      QtyFromSR: number;
      QtyTknFrmSR: number;
      Comments: string[];
      Complete: boolean;
      LaborCost: number;
      BurdenCost: number;
      MaterialCost: number;
      OutPrcCost: number;
      Exploded: boolean;
      BomHasOpt: boolean;
      SellingPrice: number;
      QtyShipped: number;
      QtyPosted: number;
      NeedByDate: string;
      EngReleased: boolean;
      PrintRun: boolean;
      MfgReleased: boolean;
      Counted: boolean;
      Shipped: boolean;
      TotalQty: number;
      MiscData: string;
      BOMRevision: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
      PullStatus: string;
    }

    export interface JobBudget {
      JobNumber: number;
      JobSuffix: string;
      BomItem: string;
      DeptCode: number;
      Complete: boolean;
      StdTime: number;
      ActTime: number;
      RwkTime: number;
      Variance: number;
      Varperc: number;
      Unused: number;
    }

    export interface JobBuildTime {
      JobNumber: number;
      JobSuffix: string;
      EngTime: number;
      BuildTime: string;
      StartupTime: string;
      MachineTime: string;
      PurchTime: string;
      ElectTime: string;
    }

    export interface JobChgApp {
      JobNumber: number;
      JobSuffix: string;
      ChgID: number;
      ChgDesc: string;
      MatrlCost: number;
      EngHrs: number;
      EngRate: number;
      EleHrs: number;
      EleRate: number;
      AsyHrs: number;
      AsyRate: number;
      FabHrs: number;
      FabRate: number;
      MachHrs: number;
      MachRate: number;
      ChkHrs: number;
      ChkRate: number;
      AmtAdded: number;
      RSMAppr: boolean;
      RSMEmpNum: number;
      RSMDate: string;
      EngAppr: boolean;
      EngEmpNum: number;
      EngDate: string;
      GSMAppr: boolean;
      GSMEmpNum: number;
      GSMDate: string;
      Released: boolean;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface JobDateLog {
      JobNumber: number;
      JobSuffix: string;
      DateType: string;
      DateValue: string;
      LastValue: string;
      Notes: string;
      CreateDT: string;
      CreateInit: string;
    }

    export interface JobDueDate {
      JobNumber: number;
      JobSuffix: string;
      DateType: string;
      DateValue: string;
      CreateDT: string;
      CreateInit: string;
    }

    export interface JobExpenses {
      JobNumber: number;
      COGSDate: string;
      JobType: string;
      ServiceType: string;
      Description: string;
      TransDate: string;
      Explanation: string;
      TransInit: string;
      Expense: number;
    }

    export interface JobInstList {
      JobNumber: number;
      JobSuffix: string;
      ID: number;
      CustInst: boolean;
      MfgInst: boolean;
      ThirdInst: boolean;
      EqPos: number;
    }

    export interface JobLaborDtl {
      JobNumber: number;
      JobSuffix: string;
      BomItem: string;
      DeptCode: number;
      Rework: boolean;
      LaborHrs: number;
      LaborCost: number;
      BurdenCost: number;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface JobMemo {
      JobNumber: number;
      JobSuffix: string;
      MemoDate: string;
      MemoTime: number;
      Initials: string;
      MemoText: string;
      Changed: string;
      SendTo: string;
      SendToOk: string;
      GrossSales: number;
      Commission: number;
      NetSales: number;
    }

    export interface JobNote {
      JobNumber: number;
      JobSuffix: string;
      Note: string[];
      Notes: string;
      ScheduleNotes: string;
      ReasonForOrder: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface JobOption {
      JobNumber: number;
      JobSuffix: string;
      BomItem: string;
      LineNumber: string;
      CompItem: string;
      Description: string[];
      DescID: number;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface JobOrder {
      "JobNumber": number;
      "JobName": string;
      "JobType": string;
      "JobStatus": string;
      "DealerNumber": number;
      "DlrId": number;
      "DlrContact": number;
      "DlrComm": number;
      "Dealer2": number;
      "DlrId2": number;
      "DlrContact2": number;
      "DlrComm2": number;
      "Salesman": number;
      "InvoiceNum": string;
      "BillToNum": number;
      "BillToCont": number;
      "BillToId": number;
      "CustPO": string;
      "ShipToNum": number;
      "ShipToCont": number;
      "ShipId": number;
      "Comments": string;
      "ShipPO": string;
      "DealerPO": string;
      "OrderDate": string;
      "OrigDueDate": string;
      "SchDueDate": string;
      "ShipDate": string;
      "InvoiceDate": string;
      "CostedDate": string;
      "CreditAmount": number;
      "GrossSales": number;
      "Commission": number;
      "NetSales": number;
      "LaborCost": number;
      "BurdenCost": number;
      "MaterialCost": number;
      "OutPrcCost": number;
      "COGSVariance": number;
      "Notes": string;
      "RefJobNumber": number;
      "RefJobSuffix": string;
      "JobPallet": string;
      "ShipServ": string;
      "ReleaseDate": string;
      "ApprovalOut": string;
      "ApprovalIn": string;
      "Terms": string[];
      "WarrantyTerms": string;
      "ForgiveShipping": boolean;
      "ForgiveHandling": boolean;
      "ApproveForgive": boolean;
      "BuildDate": string;
      "Quote#": string;
      "FOB": string;
      "Freight": string;
      "Discounted": boolean;
      "LinePrice": boolean;
      "CommNotice": string;
      "RefEquipment": string;
      "RefSerial#": string;
      "ContactName": string;
      "Attention": string;
      "PhoneNumber": string;
      "FaxNumber": string;
      "Email": string;
      "PrintDesc": boolean;
      "SalesGroup": string;
      "ServiceType": string;
      "ShipNotes": string;
      "DivisionId": number;
      "ReportType": string;
      "Lead_Source": string;
      "ProducedBy": string;
      "CreateDate": string;
      "CreateInit": string;
      "ModifyDate": string;
      "ModifyInit": string;
      "PrevModDate": string;
      "PrevModInit": string;
    }

    export interface JobPallet {
      JobNumber: number;
      JobSuffix: string;
      BomItem: string;
      CompItem: string;
      LineNumber: string;
      Pallet: string;
    }

    export interface JobPalletDtl {
      Pallet: string;
      Qty: number;
    }

    export interface JobPO {
      JobNumber: number;
      CustPO: string;
      POType: string;
      Company_ID: number;
      Address_ID: number;
      Cont_Id: number;
      POAmount: number;
      CreditAmount: number;
      CreditApplied: number;
      LinePrice: boolean;
      BillSeparate: boolean;
      Instructions: string;
      TermsUpdated: boolean;
      CreateDate: string;
      CreateInit: string;
    }

    export interface JobPODetail {
      JobNumber: number;
      CustPO: string;
      JobSuffix: string;
      PODescription: string;
      POAmount: number;
      CommAmount: number;
      CommAmount2: number;
      TaxFlag: string;
    }

    export interface JobRefDate {
      JobNumber: number;
      JobSuffix: string;
      DateName: string;
      Calculated: string;
      StartDate: string;
      EndDate: string;
    }

    export interface JobRelease {
      Item: string;
      JobNumber: number;
      JobSuffix: string;
      RelType: string;
      RelDate: string;
      RefJobNumber: number;
      RefJobSuffix: string;
      RefItem: string;
      ReleaseTime: number;
      Initials: string;
      Qty: number;
      ProcessStatus: string;
      ActivateDate: string;
      ActivateTime: number;
    }

    export interface JobRework {
      "JobNumber": number;
      "JobSuffix": string;
      "BomItem": string;
      "EmpNum": number;
      "WorkDate": string;
      "RouterSeq#": number;
      "Operation": number;
      "Description": string[];
      "CreateDate": string;
      "CreateInit": string;
      "ModifyDate": string;
      "ModifyInit": string;
      "PrevModDate": string;
      "PrevModInit": string;
    }

    export interface JobRouter {
      JobNumber: number;
      JobSuffix: string;
      BomItem: string;
      Sequence: number;
      Operation: number;
      StdTime: number;
      ActTime: number;
      QtyComplete: number;
      OperComplete: boolean;
      StdOPCost: number;
      ActOPCost: number;
      StdLaborCost: number;
      ActLaborCost: number;
      StdBurdenCst: number;
      ActBurdenCst: number;
      OutsideProc: boolean;
      QtyToMake: number;
      StdOPVendor: number;
      Initials: string;
      InWorkQue: boolean;
      QueStatus: string;
      ActOPVendor: number;
      QtOPCost: number;
      QtUpdated: string;
      StdStatus: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface JobSuffix {
      JobNumber: number;
      JobSuffix: string;
      SfxStatus: string;
      PartStatus: string;
      MachineItem: string;
      ShortDescr: string;
      JobPallet: string;
      OrderDate: string;
      OrigDueDate: string;
      SchDueDate: string;
      ShipDate: string;
      InvoiceDate: string;
      CostedDate: string;
      InvoiceNum: string;
      CreditAmount: number;
      GrossSales: number;
      Commission: number;
      NetSales: number;
      LaborCost: number;
      BurdenCost: number;
      MaterialCost: number;
      OutPrcCost: number;
      ShippingCost: number;
      StandardCost: number;
      ListPrice: number;
      QuoteCost: number;
      Commission2: number;
      MachWidth: number;
      MachStroke: number;
      MachFeedDir: boolean;
      MachPassline: string;
      MachColor: string[];
      MachVoltage: string;
      ShipToNum: number;
      Comments: string;
      ShipId: number;
      SoldStock: boolean;
      Notes: string[];
      BomApproved: boolean;
      RouterApprvd: boolean;
      Quantity: number;
      QtyShipped: number;
      Source: string;
      DealerNumber: number;
      DlrId: number;
      Salesman: number;
      BuildLoctn: number;
      RefJobNumber: number;
      SchedSrc: string;
      PulledBy: string;
      PullDate: string;
      RefJobSuffix: string;
      QtyFromInv: number;
      QtyPulled: number;
      QtyTknFrmInv: number;
      QtyToPurch: number;
      QtyPurchased: number;
      QtyToMake: number;
      QtyMade: number;
      QtyTknFrmSR: number;
      QtyFromSR: number;
      Exploded: boolean;
      BomHasOpt: boolean;
      Complete: boolean;
      ByDollars: string;
      CustChk: string;
      ProcessingComplete: boolean;
      EngineeringTime: number;
      ProcessingTime: number;
      Handling: number;
      BuildDate: string;
      Counted: boolean;
      BomArchived: boolean;
      DlrComm: number;
      DlrComm2: number;
      CustNotes: string;
      ProjectLead: string;
      MiscData: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface JobSumLabor {
      JobNumber: number;
      JobSuffix: string;
      DeptCode: number;
      StdHours: number;
      ActHours: number;
      RwkHours: number;
      StdLaborCost: number;
      ActLaborCost: number;
      RwkLaborCost: number;
      StdBurdenCost: number;
      ActBurdenCost: number;
      RwkBurdenCost: number;
    }

    export interface JobSummary {
      JobNumber: number;
      JobSuffix: string;
      StdMatl: number;
      Actmatl: number;
      StdOutPrc: number;
      ActOutPrc: number;
      ElecOutPrc: number;
      MachOutPrc: number;
    }

    export interface JobTerms {
      JobNumber: number;
      CustPO: string;
      DueOrder: number;
      Percent: number;
      Event: number;
      NetDays: number;
      Verbage: string;
      Amount: number;
      Invoiced: boolean;
      InvoiceNumber: number;
      DueDate: string;
      Automatic: boolean;
      DateReference: number;
      DateOffset: number;
      InvoiceType: string;
      CustomTerms: string;
      NotToExceed: number;
      AmountLocked: boolean;
    }

    export interface JobToAccount {
      JobNumber: number;
      JobSuffix: string;
      StartDate: string;
      EndDate: string;
      AcctCombined: string;
      BSAcctCombined: string;
    }

    export interface LaborRateHist {
      RefDeptCode: number;
      RefDeptType: string;
      LaborRate: number;
      BurdenRate: number;
      StartDate: string;
      EndDate: string;
      OverrideShiftPrem: boolean;
    }

    export interface LastInvCtrl {
      Item: string;
      JobNumber: number;
      JobSuffix: string;
      QtyOHPA: number;
      QtyOHPR: number;
      QtyOHUA: number;
      QtyOHUR: number;
      QtyOOA: number;
      QtyOOR: number;
      QtyIPA: number;
      QtyIPR: number;
      AvgMatlCost: number;
      AvgLaborCost: number;
      AvgBurdenCst: number;
      AvgOPCost: number;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface LastPhysInv {
      Location: string;
      Item: string;
      JobNumber: number;
      JobSuffix: string;
      QtyOnHand: number;
      InvCollDate: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface Letters {
      LetterId: string;
      LetterBody: string;
    }

    export interface MachineOwner {
      JobNumber: number;
      JobSuffix: string;
      ShipToNum: number;
      ShipId: number;
      ShipToContact: string;
      BillToNum: number;
      BillToId: number;
      BillToContact: string;
      OwnStatus: string;
      EffectDate: string;
      Notes: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface MatlAdj {
      Item: string;
      Qty: number;
      Location: string;
      AdjType: number;
      AdjStatus: string;
      ReqDate: string;
      ReqInit: string;
      ReqNotes: string;
      AdjNotes: string;
      CloseDate: string;
      RedTagDate: string;
      LeaderName: string;
      JobNumber: number;
      JobSuffix: string;
    }

    export interface MatlReq {
      MRStatus: string;
      ReqDate: string;
      ReqTime: number;
      Item: string;
      JobNumber: number;
      JobSuffix: string;
      Qty: number;
      RedTagQty: number;
      Notes: string[];
      LeaderInit: string;
      CloseDate: string;
      CloseTime: number;
      ClosedInit: string;
    }

    export interface OptWrkFile {
      JobNumber: number;
      JobSuffix: string;
      BomItem: string;
      LineNumber: string;
      CompItem: string;
      OptFlag: boolean;
      Sequence: number;
      Chosen: boolean;
    }

    export interface PartsCost {
      JobNumber: number;
      ShipmentNum: number;
      Item: string;
      LaborCost: number;
      BurdenCost: number;
      MaterialCost: number;
      OutPrcCost: number;
    }

    export interface PartsStatus {
      JobNumber: number;
      Item: string;
      Invoiced: boolean;
      Shipped: boolean;
      Posted: boolean;
      Closed: boolean;
      DropShipped: boolean;
    }

    export interface PartsXref {
      JobNumber: number;
      LineNumber: string;
      CompItem: string;
      RefJobNumber: number;
      RefJobSuffix: string;
    }

    export interface PastPurchase {
      "Initials": string;
      "Item": string;
      "VendorNumber": number;
      "VendorItem#": string;
      "Orderdate": string;
      "ReceiptDate": string;
      "PONumber": number;
      "RcptNumber": number;
      "JobNumber": number;
      "LineNumber": number;
      "JobSuffix": string;
    }

    export interface PhysInv {
      Location: string;
      Item: string;
      JobNumber: number;
      JobSuffix: string;
      QtyOnHand: number;
      InvCollDate: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface POApproval {
      PONumber: number;
      AppReqGroup: string;
      ApprovalOrder: number;
      Authorizer: string;
      Amount: number;
      DateStamp: string;
      AppStatus: string;
      Comment: string;
    }

    export interface POConfirm {
      PONumber: number;
      ID: string;
      ConfirmStatus: string;
      ConfirmDT: string;
      ConfirmBy: string;
      Accuracy: string;
      Comments: string;
    }

    export interface PODetail {
      "PONumber": number;
      "LineNumber": number;
      "LineType": string;
      "OrderQtyOrd": number;
      "OrderUM": string;
      "Item": string;
      "CostQtyOrd": number;
      "Destination": string;
      "PrintNumber": string;
      "JobNumber": number;
      "JobSuffix": string;
      "UnitCost": number;
      "CostUM": string;
      "CutCharge": number;
      "Extension": number;
      "Description": string;
      "DescrLine2": string;
      "VendorItem#": string;
      "LineStatus": string;
      "Dimensions": string;
      "RefLineNum": number;
      "TotOrdQtyRcv": number;
      "TotCstQtyRcv": number;
      "GlCode": number;
      "DeptCode": number;
      "RouterSeq#": number;
      "Operation": number;
      "ReqDelDate": string;
      "ConfDelDate": string;
      "PromiseDate": string;
      "MaxAmount": number;
      "ExpDate": string;
      "APRInit": string;
      "MemoText": string;
      "PrintNotes": boolean;
      "PurchMemo": string;
      "CutListId": number;
      "CreateDate": string;
      "CreateInit": string;
      "ModifyDate": string;
      "ModifyInit": string;
      "PrevModDate": string;
      "PrevModInit": string;
    }

    export interface POHeader {
      PONumber: number;
      POStatus: string;
      VendorNumber: number;
      ShipType: string;
      ShipNumber: number;
      ShipId: number;
      ShipName: string;
      ShipAddr1: string;
      ShipAddr2: string;
      ShipCity: string;
      ShipState: string;
      ShipZip: string;
      ShipCountry: string;
      ShipPhone: string;
      OrderDate: string;
      OrigDelDate: string;
      ReqDelDate: string;
      ConfDate: string;
      PromiseDate: string;
      NextFaxDate: string;
      BuyerInit: string;
      ReqInit: string;
      ReqOrderDate: string;
      VendPhone: string;
      VendContact: string;
      VendTerms: string;
      JobNumber: number;
      JobSuffix: string;
      JobName: string;
      Notes: string;
      PurchMemo: string;
      LateNotice: boolean;
      ReminderCnt: number;
      FaxReceived: boolean;
      ForStock: boolean;
      ShipMethod: string;
      NeedApproval: boolean;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface POPromise {
      PONumber: number;
      LineNumber: number;
      PromiseDate: string;
      PromCostQty: number;
      CostQtyRcvd: number;
      Notes: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface POReference {
      PONumber: number;
      RefPONumber: number;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface POReq {
      PONumber: number;
      ReqInit: string;
      ReqDate: string;
      ReqAmount: number;
      Justification: string;
      ExpenseType: string;
      Department: string;
      ReqTerms: string;
      FOB: string;
    }

    export interface POSchedule {
      PONumber: number;
      LineNumber: number;
      OrderDate: string;
      ReqDelDate: string;
      SchCostQty: number;
      CostQtyRcvd: number;
      Notes: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface PrintLabels {
      JobNumber: number;
      JobSuffix: string;
      DeptName: string;
      PrintNum: string;
      DeptCode: number;
      Type: string;
      Item: string;
      PrintOrder: number;
      PrintBatch: number;
    }

    export interface ProblemLine {
      ID: string;
      ErrorType: string;
      BOMItem: string;
      CheckingBOM: string;
      JobNumber: number;
      JobSuffix: string;
      TransDT: string;
      Lines: string;
      DateResolved: string;
      ResolvedBy: string;
      Notes: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface PullList {
      CompItem: string;
      JobNumber: number;
      JobSuffix: string;
      BomItem: string;
      LineNumber: string;
      QtyPulled: number;
      PulledBy: string;
      PullDate: string;
      RefJobNumber: number;
      RefJobSuffix: string;
      QtyInspected: number;
      Location: string;
    }

    export interface Rack {
      "Rack": string;
      "NumofShelves": number;
      "Warehouse#": number;
      "Description": string;
      "Activity": string;
      "MiscData": string;
      "CreateDate": string;
      "CreateInit": string;
      "ModifyDate": string;
      "ModifyInit": string;
      "PrevModDate": string;
      "PrevModInit": string;
    }

    export interface RcptDetail {
      RefNumber: number;
      RefType: string;
      RcptNumber: number;
      LineNumber: number;
      OrderQtyRcvd: number;
      CostQtyRcvd: number;
      InvoiceStatus: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
      BudgetCode: string;
    }

    export interface RcptHeader {
      RefNumber: number;
      RefType: string;
      RcptNumber: number;
      ReceiverInit: string;
      ReceiptDate: string;
      InvoiceDate: string;
      InvoiceStatus: string;
      ReceivedFrom: number;
      RefInfo: string;
      ConfirmedOn: string;
      ConfirmedBy: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface RefJobInfo {
      JobNumber: number;
      JobSuffix: string;
      RefJobNumber: number;
      RefJobSuffix: string;
      ProjID: number;
    }

    export interface RefNotes {
      FileName: string;
      KeyFields: string;
      ContactDate: string;
      ContactTime: number;
      Contact: string;
      PhoneNumber: string;
      FaxNumber: string;
      Email: string;
      InNotes: string;
      OrigInit: string;
      NewInit: string;
    }

    export interface ResourceAct {
      JobNumber: number;
      JobSuffix: string;
      Resource: number;
      PeriodStart: string;
      SetupHours: number;
      RunHours: number;
      ActHours: number;
      AsOfDate: string;
      AsOfTime: number;
    }

    export interface ResourceAdj {
      Resource: number;
      AdjDate: string;
      JobNumber: number;
      JobSuffix: string;
      Hours: number;
      Notes: string;
      AsOfDate: string;
      AsOfTime: number;
      AddedBy: string;
    }

    export interface ResourceDtl {
      JobNumber: number;
      JobSuffix: string;
      Resource: number;
      BOMItem: string;
      SetupHours: number;
      RunHours: number;
      ActHours: number;
      BudgetLeft: number;
      Complete: boolean;
      AsOfDate: string;
      AsOfTime: number;
    }

    export interface ResourceNeed {
      JobNumber: number;
      JobSuffix: string;
      Resource: number;
      DeptCode: number;
      SetupHours: number;
      RunHours: number;
      ActHours: number;
      AsOfDate: string;
      AsOfTime: number;
    }

    export interface ResvDiscrep {
      Initials: string;
      Item: string;
      JobNumber: number;
      JobSuffix: string;
      QtyOnHand: number;
      QtyOnOrder: number;
      QtyOnStkRn: number;
      BomQtyToMake: number;
      BomQtyStkRun: number;
      SfxStkToMake: number;
      SfxStkStkRun: number;
      SfxJobToMake: number;
      SfxJobStkRun: number;
    }

    export interface ReturnedGood {
      "RGNumber": number;
      "ReturnDate": string;
      "VendorAuth#": string;
      "OrigPONum": number;
      "OrigJobNum": number;
      "OrigInvoice#": string;
      "VendorPhone": string;
      "VendorFaxPhone": string;
      "VendContact": string;
      "EmployeeInit": string;
      "VendorNumber": number;
      "OrigJobName": string;
      "PurchAgent": string;
      "VendorName": string;
      "VendorAddr1": string;
      "VendorAddr2": string;
      "VendorCity": string;
      "VendorState": string;
      "VendorZip": string;
      "VendorCountry": string;
      "ShipTo": string;
      "RGStatus": string;
      "ReturnByDate": string;
      "BillToJob": number;
      "BillToSfx": string;
      "BillonPO": number;
      "RMANumber": number;
      "ShipMethod": string;
      "CreateDate": string;
      "CreateInit": string;
      "ModifyDate": string;
      "ModifyInit": string;
      "PrevModDate": string;
      "PrevModInit": string;
    }

    export interface RGDetail {
      "RGNumber": number;
      "LineNumber": number;
      "RGStatus": string;
      "Item": string;
      "Qty": number;
      "OrdQtySent": number;
      "OrdQtyRcvd": number;
      "OrderUM": string;
      "CostQtySent": number;
      "CostQtyRcvd": number;
      "InvQtyTkn": number;
      "IgnoreInv": boolean;
      "Description": string;
      "DescrLine2": string;
      "Serial#": string;
      "UnitCost": number;
      "Warranty": boolean;
      "ReasonForReturn": string;
      "Resolution": string;
      "Destination": string;
      "Approved": boolean;
      "AppDate": string;
      "AppInit": string;
      "InspectReq": boolean;
      "xRequestType": string;
      "GlCode": number;
      "CRReceived": boolean;
      "CRDateRcvd": string;
      "CreditAmount": number;
      "VendCRMemo#": string;
      "ChargeToJob": boolean;
      "CreateDate": string;
      "CreateInit": string;
      "ModifyDate": string;
      "ModifyInit": string;
      "PrevModDate": string;
      "PrevModInit": string;
    }

    export interface RMADetail {
      "RMANumber": number;
      "LineNumber": number;
      "JobNumber": number;
      "JobSuffix": string;
      "Item": string;
      "Qty": number;
      "QtyRcvd": number;
      "QtyToRec": number;
      "QtySent": number;
      "QtyToSend": number;
      "UnitCost": number;
      "SubTotal": number;
      "ReasonForReturn": string;
      "Resolution": string;
      "HandlingNotes": string;
      "SerialNum": string;
      "LineStatus": string;
      "UM": string;
      "Destination": string;
      "Warranty": boolean;
      "BillToJob": number;
      "BillToSfx": string;
      "IssueCredit": boolean;
      "CreditIssued": boolean;
      "CreditAmount": number;
      "ReturnToInv": string;
      "ReturnAs": string;
      "CreditDate": string;
      "CreditMemo#": number;
      "StandardCost": number;
      "MaterialCost": number;
      "LaborCost": number;
      "BurdenCost": number;
      "OutPrcCost": number;
      "JobCostStatus": string;
      "COGSDate": string;
      "CreateDate": string;
      "CreateInit": string;
      "ModifyDate": string;
      "ModifyInit": string;
      "PrevModDate": string;
      "PrevModInit": string;
    }

    export interface RMAHeader {
      "RMANumber": number;
      "JobNumber": number;
      "JobSuffix": string;
      "RefJobNumber": number;
      "CustDlrNum": number;
      "ShipLoc": string;
      "ShipId": number;
      "Warehouse#": number;
      "Contact": string;
      "PhoneNumber": string;
      "FaxPhoneNum": string;
      "Email": string;
      "RMAStatus": string;
      "Notes": string;
      "AuthInit": string;
      "AuthDate": string;
      "ExpectedDate": string;
      "CreateDate": string;
      "CreateInit": string;
      "ModifyDate": string;
      "ModifyInit": string;
      "PrevModDate": string;
      "PrevModInit": string;
    }

    export interface RouterTrans {
      TransDate: string;
      TransTime: number;
      TransType: string;
      JobNumber: number;
      JobSuffix: string;
      BomItem: string;
      OldSequence: number;
      Sequence: number;
      OldPrimary: string;
      Primary: string;
      OldOperation: number;
      OldStdTime: number;
      OldStdOPVend: number;
      OldStdOPCost: number;
      OldCstExpDt: string;
      OldStdLabCst: number;
      OldOperCmp: boolean;
      Operation: number;
      StdTime: number;
      StdOPVendor: number;
      StdOPCost: number;
      CostExpDate: string;
      Initials: string;
      StdLaborCost: number;
      OperComplete: boolean;
      Notes: string[];
    }

    export interface RwkHours {
      ProblemId: number;
      EmpNum: number;
      Hours: number;
    }

    export interface RwkSheet {
      ProblemId: number;
      TransDate: string;
      TransTime: number;
      JobNumber: number;
      JobSuffix: string;
      AssyItem: string;
      BomItem: string;
      Hours: number;
      Quantity: number;
      Cost: number;
      ProblemDesc: string;
      ActionTaken: string;
      TransDate2: string;
      TransTime2: number;
      UserEmpNum: number;
      UserDeptCode: number;
      ParentProblemId: number;
      RwkStatus: string;
    }

    export interface RwkSource {
      ProblemId: number;
      SourceType: string;
      SourceId: number;
      SourceName: string;
      OccurFixed: string;
      OccurFixedOn: string;
      StdFixed: string;
      StdFixedOn: string;
      JobsFixed: string;
      JobsFixedOn: string;
      InvFixed: string;
      InvFixedOn: string;
    }

    export interface SalesBrkDn {
      UserInitials: string;
      Country: string;
      StateProv: string;
      City: string;
      Class: string;
      BillToNum: number;
      DealerNum: number;
      JobNumber: number;
      JobSuffix: string;
      ShipDate: string;
      MachineItem: string;
      ShortDescr: string;
      Shipcsz: string;
      NetSales: number;
    }

    export interface Schedule {
      JobNumber: number;
      JobSuffix: string;
      JobName: string;
      JobType: string;
      ShortDescr: string;
      OrigDueDate: string;
      OrderDate: string;
      SchDueDate: string;
      SalesContact: string;
      EngRelDate: string;
      SalesRelDate: string;
      BomApproved: string;
      Weeknum: string;
      MachStatus: string;
      MachComments: string;
      ElectStatus: string;
      ElectComments: string;
      AssyStatus: string;
      AssyComments: string;
      ManualStatus: string;
      ManualComments: string;
      SchedComments: string;
      AddnComments: string;
      ToDoKeys: string;
    }

    export interface SellPriceLog {
      Item: string;
      JobNumber: number;
      JobSuffix: string;
      TransDate: string;
      TransTime: number;
      Initials: string;
      Notes: string;
      PrevSellingPrice: number;
      AdjSellingPrice: number;
      EndSellingPrice: number;
      Type: number;
    }

    export interface ServiceBill {
      JobNumber: number;
      BillStatus: string;
      Regular: number;
      Overtime: number;
      DoubleTime: number;
      Mileage: number;
      Travel: number;
      Rental: number;
      Overnight: number;
      Meals: number;
      Shipping: number;
      Special: number;
      SpecialDesc: string;
      RegularCost: number;
      OvertimeCost: number;
      DoubleTimeCost: number;
      MileageCost: number;
      OvernightCost: number;
      MealsCost: number;
      Approved: boolean;
      ActMileage: number;
      ActTravel: number;
      ActRental: number;
      ActSpecial: number;
      ActMileageCost: number;
      ActOvernightCost: number;
      ActMealsCost: number;
      AdminTotal: number;
      AdminRate: number;
      AdminFee: number;
      ServiceReport: string;
      Problem: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface ServiceIssue {
      CallRefNum: number;
      IssueNum: number;
      JobNumber: number;
      Problem: string;
      Resolution: string;
      IssueStatus: string;
      DateOpen: string;
      DateClosed: string;
      Issues: string;
    }

    export interface ServiceQuote {
      JobNumber: number;
      Regular: number;
      Overtime: number;
      DoubleTime: number;
      Mileage: number;
      Travel: number;
      Rental: number;
      Overnight: number;
      Meals: number;
      Shipping: number;
      Special: number;
      SpecialDesc: string;
      RegularCost: number;
      OvertimeCost: number;
      DoubleTimeCost: number;
      MileageCost: number;
      OvernightCost: number;
      MealsCost: number;
      AdminTotal: number;
      AdminRate: number;
      AdminFee: number;
      PartsDetail: boolean;
      PartCostDetail: boolean;
      LaborDetail: boolean;
      IsEstimate: boolean;
      NotToExceed: number;
      PriceFixed: boolean;
      FixedAmount: number;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface ShipDetail {
      RefNumber: number;
      ShipType: string;
      ShipmentNum: number;
      LineNumber: number;
      Item: string;
      InvQtyOut: number;
      JobSuffix: string;
      FromLocation: string;
      Description: string;
      DescrLine2: string;
      QtyPosted: number;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface ShipHeader {
      RefNumber: number;
      ShipType: string;
      ShipmentNum: number;
      ShipDate: string;
      VendCustNum: number;
      ShipId: number;
      Initials: string;
      Notes: string[];
      Carrier: string;
      IsInvoiced: boolean;
      ShipCost: number;
      Handling: number;
      EstDOA: string;
      BillofLading: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
      Confirmation: string;
    }

    export interface ShipTerms {
      JobNumber: number;
      CustPO: string;
      ShipmentNum: number;
      DueOrder: number;
      Percent: number;
      Event: number;
      NetDays: number;
      Verbage: string;
      Amount: number;
      AmountPaid: number;
      Invoiced: boolean;
      InvoiceNumber: number;
      DueDate: string;
      DateReference: number;
      DateOffset: number;
      InvoiceType: string;
    }

    export interface ShipTrans {
      JobNumber: number;
      ShipmentNum: number;
      LineNumber: number;
      TransDate: string;
      PostStatus: string;
      PostDate: string;
      Item: string;
      Quantity: number;
      MaterialCost: number;
      LaborCost: number;
      BurdenCost: number;
      OutPrcCost: number;
    }

    export interface TempLabor {
      JobNumber: number;
      JobSuffix: string;
      RecType: string;
      CodeNum: number;
      LaborHrs: number;
      Cost: number;
    }

    export interface TempMatl {
      JobNumber: number;
      JobSuffix: string;
      ClassCode: number;
      MaterialCost: number;
      LaborCost: number;
      BurdenCost: number;
      OutPrcCost: number;
    }

    export interface TempSales {
      MachineItem: string;
      Quantity: number;
      GrossSales: number;
      NetSales: number;
      Commission: number;
    }

    export interface TimeSheet {
      "EmpNum": number;
      "WorkDate": string;
      "EntryType": string;
      "StartTime": number;
      "EndTime": number;
      "Lunch": boolean;
      "ElapsedMin": number;
      "JobNumber": number;
      "JobSuffix": string;
      "BomItem": string;
      "RouterSeq#": number;
      "Operation": number;
      "Quantity": number;
      "PostDate": string;
      "PostTime": number;
      "PayPeriod": string;
      "CorrType": string;
      "CreateDate": string;
      "CreateInit": string;
      "ModifyDate": string;
      "ModifyInit": string;
      "PrevModDate": string;
      "PrevModInit": string;
    }

    export interface TimeShtDesc {
      EmpNum: number;
      WorkDate: string;
      StartTime: number;
      EndTime: number;
      JobNumber: number;
      JobSuffix: string;
      Description: string;
    }

    export interface TOCJob {
      JobNumber: number;
      JobSuffix: string;
      ManualId: number;
      SectionId: number;
      SubSectionId: number;
      LineNumber: number;
      Publication: string;
      PubVersion: string;
    }

    export interface Trackers {
      RefNumber: number;
      RefType: string;
      ShipmentNum: number;
      TrackingNumber: string;
      TrackerStatus: string;
    }

    export interface WarrantyLog {
      JobNumber: number;
      TransDateTm: string;
      Notes: string;
      Initials: string;
      FollowupDate: string;
      FollowupDone: boolean;
    }

    export interface WIPSched {
      JobNumber: number;
      JobSuffix: string;
      BomItem: string;
      Sequence: number;
      DeptCode: number;
      Resource: number;
      WeekBeg: string;
      LineNum: number;
      NeedDate: string;
      IncSetUp: boolean;
      QtyToMake: number;
      SetupTime: number;
      StdTime: number;
      ActTime: number;
      PrevSteps: number;
      MatlAvail: boolean;
      OperCmplt: boolean;
      RouterCheck: boolean;
      Processed: boolean;
      Operator: number;
      AvgTime: number;
    }

    export interface WorkCtr {
      WorkCtr: number;
      WorkCtrName: string;
      LaborRate: number;
      BurdenPerc: number;
      EffectDate: string;
      PrevLabRate: number;
      PrevBurPerc: number;
      Operation: number;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }
  }

  export namespace quote {
    export interface Advertisment {
      Ad_ID: number;
      Name: string;
      Inquiries: number;
      Orders: number;
      LastCleared: string;
    }

    export interface CoilType {
      CoilID: number;
      CoilDesc: string;
      CoilMult: number;
      SortOrder: string;
      IsArchived: boolean;
    }

    export interface EquCost {
      "ID": number;
      "Model": string;
      "Cell-Value": number[];
      "Quote-Value": number[];
    }

    export interface EquGroupInfo {
      EquGroup: string;
      EquFamily: string;
      GroupDesc: string;
      Desc1: string;
      Desc2: string;
      ImageLoc: string;
      ImageX: number;
      ImageY: number;
      EquipType: string;
    }

    export interface EquipList {
      EquGroup: string;
      Model: string;
      MaxWidth: number;
      MinThick: number;
      MaxThick: number;
      Ratio: string;
      PlusRatio: string;
      MaxSpeed: number;
      PlusMaxSpeed: number;
      Accel: number;
      RollDiam: number;
      AirDiam: number;
      PinchDiam: number;
      RollNum: number;
      RollType: string;
      LoopLength: number;
      CoilOD: number;
      CoilWeight: number;
      Stroke: number;
      SPM: number;
      Description: string;
      StdCost: number;
      PerMrg: number;
      Price: number;
      QuoteMode: string;
      EquipType: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
      Comm: number;
    }

    export interface EquipOpt {
      ID: number;
      Model: string;
      Price: number;
      QuoteMode: string;
      HideOption: boolean;
      Flags: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface EquToBOM {
      ID: number;
      Model: string;
      BOMID: number;
      ImpactType: string;
    }

    export interface Forcast {
      Item: string;
      CastMonth: number;
      CastQty: number;
    }

    export interface IDChangeLog {
      ID: number;
      IDType: string;
      Model: string;
      ChangeType: string;
      TableName: string;
      FieldChanged: string;
      BeforeValue: string;
      AfterValue: string;
      TransDtTm: string;
      ModInit: string;
    }

    export interface IO_MailList {
      ListName: string;
      SendTo: number;
      SendToPrinter: string;
    }

    export interface ItemToJob {
      Item: string;
      JobNumber: number;
      JobSuffix: string;
    }

    export interface JobOpts {
      JobNumber: number;
      JobSuffix: string;
      ID: number;
      Model: string;
      IsStd: boolean;
      Price: number;
      Stat: string;
      EqPosition: number;
      HideOption: boolean;
    }

    export interface JobSpecials {
      JobNumber: number;
      JobSuffix: string;
      Model: string;
      Name: string;
      Descr: string;
      Price: number;
      EqPosition: number;
      IsStd: boolean;
      Stat: string;
    }

    export interface JobToQuote {
      "JobNumber": number;
      "JobSuffix": string;
      "QYear": number;
      "QNum": number;
      "QRev": string;
      "Sfx": number;
      "Model": string;
      "EstPrice": number;
      "BasePrice": number;
      "OrigPrice": number;
      "Disc-Promo": number;
      "Stat": string;
      "CoilType": number[];
      "Yield": string[];
      "Tensile": string[];
      "Thickness": number[];
      "Width": number[];
      "IsMaxThick": boolean[];
      "PayOff": number;
      "ShowTensile": boolean;
    }

    export interface LeadTime {
      Model: string;
      Lead: number;
    }

    export interface Login {
      EmpInit: string;
      Login: string;
      Logout: string;
      WinHdl: string;
      Touch: number;
    }

    export interface Menus {
      EmpInit: string;
      MenuName: string;
      FrameBG: number;
      FrameFG: number;
      PriTitle: string;
      SecTitle: string;
      Programs: string[];
      ProgLabels: string[];
      Permissions: string[];
      BtnX: number[];
      BtnY: number[];
      BtnWidth: number[];
      BtnHeight: number[];
      Parameters: string[];
    }

    export interface ModelToJob {
      Model: string;
      JobNumber: number;
      JobSuffix: string;
      BOMType: string;
    }

    export interface Notes {
      NoteType: string;
      NoteIndex: string;
      NoteDate: string;
      NoteTime: number;
      NoteCreater: number;
      NoteSubject: string;
      NoteBody: string;
      NoteAlert: boolean;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface OldLogs {
      QNum: number;
      CustName: string;
      Equip: string;
      TtlCost: number;
    }

    export interface OptBOM {
      "BOMID": number;
      "Description": string;
      "JobNumber": number;
      "JobSuffix": string;
      "BOMItem": string;
      "LineNumber": string;
      "CompItem": string;
      "Cell-Value": number[];
      "Quote-Value": number[];
      "StdUpdated": string;
      "QtUpdated": string;
    }

    export interface OptGroup {
      GrpID: number;
      GrpName: string;
      GrpDescription: string;
      GrpOrder: number;
      Mandatory: string;
      Multiple: string;
      Flags: string;
      CreateDtTm: string;
      CreateInit: string;
    }

    export interface OptGrp {
      ID: number;
      Model: string;
      GrpID: number;
      CreateDtTm: string;
      CreateInit: string;
    }

    export interface OptHelp {
      HelpID: number;
      ID: number;
      Notes: string;
      CreateDtTm: string;
      CreateInit: string;
    }

    export interface OptLink {
      LinkID: number;
      ID: number;
      DescID: number;
      Comment: string;
      Condition: string;
      ApprStat: string;
      ApprInit: string;
      ApprDtTm: string;
      CreateDtTm: string;
      CreateInit: string;
    }

    export interface OptPic {
      PicID: number;
      Description: string;
      Filename: string;
      XPos: string;
      YPos: string;
      Width: string;
      Height: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface OtherEqu {
      QYear: number;
      QNum: number;
      QRev: string;
      Sfx: number;
      EqName: string;
      EqDesc: string;
      Model: string;
      EqPrice: number;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface PageLayout {
      CoeRSM: number;
      Program: string;
      TitleName: string;
      FieldName: string;
      FieldRow: number;
      FieldColumn: number;
      FieldWidth: number;
      FieldHeight: number;
      FieldInclude: boolean;
      FieldIndex: number;
    }

    export interface Photo_Lib {
      FileName: string;
      EquGroup: string;
      Description: string;
      ReltPath: string;
      PhotoStatus: string;
      XPos: string;
      YPos: string;
      Width: string;
      Height: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
    }

    export interface Photo_xRef {
      FileName: string;
      Model: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
    }

    export interface PkgDef {
      PkgID: number;
      PkgName: string;
      PkgDesc: string;
      SortOrder: number;
      CreateDtTm: string;
      CreateInit: string;
    }

    export interface PkgModel {
      PkgModelID: number;
      PkgID: number;
      ModelGroup: string;
      Model: string;
      Requirement: string;
      CreateDtTm: string;
      CreateInit: string;
    }

    export interface PkgOpt {
      PkgOptID: number;
      PkgID: number;
      Stage: number;
      ID: number;
      CreateDtTm: string;
      CreateInit: string;
    }

    export interface PriceHist {
      Changed: string;
      Model: string;
      StdCost: number;
      PerMrg: number;
    }

    export interface PrintQuote {
      QYear: number;
      QNum: number;
      QRev: string;
      cvrltr: string;
      Comments: string;
      Delivery: string;
      Valid: number;
      BillToDeal: boolean;
      IncDeal: boolean;
      QuoteToCust: boolean;
      isLine: boolean;
      ShipServ: string;
      ShipCost: number;
      Budgetary: string;
      InstallLetterID: string;
      InstallScope: string;
      EstDelDate1: string;
      EstDelDate2: string;
      EstDelivery: string;
      FOB: string;
      Freight: string;
      WarrantyType: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
      xTerms: string;
      xInc_Train: boolean;
    }

    export interface ProgRpt {
      EmpNum: number;
      ReptDate: string;
      ProgReport: string;
      StartTime: string;
      LunchOut: string;
      LunchIn: string;
      EndTime: string;
    }

    export interface Prosp_Notes {
      Pros_Id: number;
      ContDate: string;
      ContTime: number;
      Notes: string;
    }

    export interface Prospect {
      Pros_Id: number;
      Division: number;
      Company: string;
      FirstName: string;
      LastName: string;
      Address1: string;
      Address2: string;
      City: string;
      State: string;
      ZipCode: string;
      Country: string;
      Phone: string;
      PhoneExt: string;
      Fax: string;
      Email: string;
      Website: string;
      Dealer: number;
      CoeRSM: number;
      Ad_ID: number;
      LastDate: string;
      NextDate: string;
      CreateDate: string;
      CreateID: number;
    }

    export interface Prospect_Address {
      Pros_ID: number;
      Address_ID: number;
      Address1: string;
      Address2: string;
      City: string;
      State: string;
      Country: string;
      ZipCode: string;
      CreateDate: string;
      CreateID: number;
    }

    export interface Prospect_Contacts {
      Pros_ID: number;
      Cont_ID: number;
      Division: number;
      Address_ID: number;
      FirstName: string;
      LastName: string;
      PhoneNumber: string;
      PhoneExt: string;
      FaxPhoneNum: string;
      Email: string;
      Website: string;
      AD_ID: number;
      CreateDate: string;
      CreateID: number;
    }

    export interface PSModel {
      PSModel: string;
      Model: string;
      OptionList: string;
    }

    export interface QData {
      QYear: number;
      QNum: number;
      Division: number;
      CoeRSM: number;
      C_Company: number;
      C_Contact: number;
      C_Address: number;
      D_Company: number;
      D_Contact: number;
      D_Address: number;
      Canceled: boolean;
      LostToComp: boolean;
      Shipped: boolean;
      Priority: string;
      OrderDate: string;
      PhotoName: string;
      EstPODate: string;
      Confidence: number;
      Lead_Source: string;
      ProducedBy: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface QOptCostSheet {
      QYear: number;
      QNum: number;
      QRev: string;
      LineOrder: number;
      LineType: string;
      LineItem: string;
      Description: string;
      Quantity: number;
      SalesPrice: number;
      PriceText: string;
      CostEstimate: number;
      HideLinePrice: boolean;
      ShowOnQuote: boolean;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface QOpts {
      QYear: number;
      QNum: number;
      QRev: string;
      Sfx: number;
      ID: number;
      IsStd: boolean;
      Price: number;
      xModel: string;
      EqPosition: number;
      HideOption: boolean;
      PicID: number;
    }

    export interface QRev {
      "QYear": number;
      "QNum": number;
      "QRev": string;
      "Sfx": number;
      "Model": string;
      "QDate": string;
      "Options": string;
      "EstAmt": number;
      "EstShip": string;
      "EstPrice": number;
      "BasePrice": number;
      "OrigPrice": number;
      "Disc-Promo": number;
      "Lead": number;
      "Equ-Notes": string;
      "CoilType": number[];
      "Yield": string[];
      "Tensile": string[];
      "IsMaxThick": boolean[];
      "Thickness": number[];
      "Width": number[];
      "PayOff": number;
      "PhotoName": string;
      "OptionalStatus": string;
      "ShowTensile": boolean;
      "CreateDate": string;
      "CreateInit": string;
      "ModifyDate": string;
      "ModifyInit": string;
      "PrevModDate": string;
      "PrevModInit": string;
    }

    export interface QRevCostSheet {
      QYear: number;
      QNum: number;
      QRev: string;
      LineOrder: number;
      LineType: string;
      LineItem: string;
      Description: string;
      Quantity: number;
      SalesPrice: number;
      PriceText: string;
      CostEstimate: number;
      HideLinePrice: boolean;
      ShowOnQuote: boolean;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface QRevInstList {
      QYear: number;
      QNum: number;
      QRev: string;
      Sfx: number;
      ID: number;
      CustInst: boolean;
      MfgInst: boolean;
      ThirdInst: boolean;
      EqPos: number;
    }

    export interface QSpecs {
      "QYear": number;
      "QNum": number;
      "QRev": string;
      "CoilType": number;
      "MinThick": number;
      "MaxThick": number;
      "FullThick": number;
      "MinWidth": number;
      "MaxWidth": number;
      "FullWidth": number;
      "Length": number;
      "PayOff": number;
      "CoilOD": number;
      "JobDisc": number;
      "xNest": number;
      "xPinch": number;
      "xLinePrice": number;
      "xInc-Train": boolean;
      "xTrain": number;
    }

    export interface QtAlarm {
      QYear: number;
      QNum: number;
      QRev: string;
      CoeRSM: number;
      AlarmDue: string;
      AlarmTime: number;
      AlarmInfo: string;
      CreateDate: string;
    }

    export interface QtNotes {
      QYear: number;
      QNum: number;
      QRev: string;
      CoeRSM: number;
      NoteDate: string;
      NoteTime: number;
      Note: string;
    }

    export interface QtTerms {
      QYear: number;
      QNum: number;
      QRev: string;
      DueOrder: number;
      Percent: number;
      Event: number;
      NetDays: number;
      Verbage: string;
      Amount: number;
      InvoiceType: string;
      DateReference: number;
      DateOffSet: number;
      CustomTerms: string;
      NotToExceed: number;
    }

    export interface QuoteRequest {
      Request_ID: number;
      Firstname: string;
      LastName: string;
      JobTitle: string;
      Company: string;
      Address1: string;
      Address2: string;
      City: string;
      State: string;
      ZipCode: string;
      Telephone: string;
      Fax: string;
      InstallDate: string;
      CuttoLength: boolean;
      PressFeed: boolean;
      OtherEqu: string;
      Matrl: string;
      CreateDate: string;
      CoilWeight: string;
      MaxOD: string;
      MinOD: string;
      MaxID: string;
      MinID: string;
      MaxWidth: string;
      MinWidth: string;
      MaxThick: string;
      MinThick: string;
      FullThick: string;
      FullWidth: string;
      MaxLength: string;
      MinLength: string;
      MaxLenPM: string;
      MinLenPM: string;
      FeedDir: string;
      Voltage: string;
      Phase: string;
      Hertz: string;
      Air: string;
      Water: string;
    }

    export interface RefQuoteInfo {
      QYear: number;
      QNum: number;
      QRev: string;
      Sfx: number;
      RefJobNumber: number;
      RefJobSuffix: string;
    }

    export interface RollParms {
      QYear: number;
      QNum: number;
      QRev: string;
      Sfx: number;
      Num: number;
      Diam: number;
      Width: number;
      Acceleration: number;
      MaxSpeed: number;
      Length2: number[];
      Length: number[];
      Parmtitles: number[];
      A180: number[];
      A240: number[];
      Ratio: string;
      xModel: string;
      PressBedLength: number;
      TableTitles: string[];
      FeedLength: number[];
      SPM1: number[];
      FPM1: number[];
      SPM2: number[];
      FPM2: number[];
    }

    export interface Security {
      SecGroup: string;
      SecUser: string;
    }

    export interface SescoEquipmemt {
      EqModel: string;
      EqTitle: string;
      EqDesc: string;
    }

    export interface SescoProducts {
      "PdModel": string;
      "PdTitle": string;
      "PdDesc": string;
      "PDCustSpecs": string;
      "PDEquSpecs": string;
      "PDModel-Raw": string;
    }

    export interface Specials {
      QYear: number;
      QNum: number;
      QRev: string;
      Sfx: number;
      Name: string;
      Descr: string;
      Price: number;
      EqPosition: number;
      IsStd: boolean;
      xModel: string;
      PicID: number;
    }

    export interface Startup {
      QYear: number;
      QNum: number;
      QRev: string;
      Days: number;
      Techs: number;
      Type: number;
      Amount: number;
      Notes: string;
      Description: string;
      Manpower: string;
      Scope: string;
      StartupCompany: string;
      ReturnStatus: string;
      Contact1: string;
      Phone1: string;
      Email1: string;
      Contact2: string;
      Phone2: string;
      Email2: string;
      FaxNumber: string;
      QuoteStatus: string;
      QuotedBy: string;
    }

    export interface StdEqu {
      ID: number;
      Model: string;
      QuoteMode: string;
      HideOption: boolean;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface StdEquGroup {
      StdEquGrpID: number;
      GrpName: string;
      GrpDescription: string;
      GrpType: string;
      GrpOrder: number;
      CreateDtTm: string;
      CreateInit: string;
    }

    export interface StdEquip {
      ID: number;
      Name: string;
      Descr: string;
      EqPosition: number;
      QuoteMode: string;
      Application: string;
      PicID: number;
      OptionGrpID: number;
      HideOption: boolean;
      Flags: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface StdEquLink {
      StdEquLinkID: number;
      ID: number;
      RefID: number;
      Relationship: string;
      CreateDtTm: string;
      CreateInit: string;
    }

    export interface StdExcluded {
      ID: number;
      QYear: number;
      QNum: number;
      QRev: string;
      Sfx: number;
      JobNumber: number;
      JobSuffix: string;
    }

    export interface TaskList {
      EmpNum: number;
      TaskID: number;
      TaskDate: string;
      TaskDesc: string;
      TaskStatus: string;
      Complete: boolean;
    }
  }

  export namespace std {
    export interface AccountType {
      AccountType: string;
    }

    export interface Address {
      id: string;
      Company_ID: number;
      Address_ID: number;
      AddressName: string;
      Address1: string;
      Address2: string;
      Address3: string;
      City: string;
      State: string;
      Country: string;
      ZipCode: string;
      PhoneNumber: string;
      FaxPhoneNum: string;
      CanShip: boolean;
      CanBill: boolean;
      Notes: string;
      BillToNum: number;
      BillToId: number;
      ShipInstr: string;
      Directions: string;
      OriginalVia: string;
      EmailInvoiceTo: string;
      SystemNotes: string;
      InvoiceSubject: string;
      TaxID: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
      createdAt: string;
      createdBy: string;
      updatedAt: string;
      updatedBy: string;
      deletedAt: string;
      deletedBy: string;
      deleted: boolean;
    }

    export interface ADPXRef {
      "CompCode": string;
      "EmpNum": number;
      "File#": number;
      "StartDate": string;
    }

    export interface AfterHours {
      Ticket: number;
      RefJobNumber: number;
      InitCallDate: string;
      InitCallTime: number;
      ServiceType: string;
      PaymentMethod: string;
      ContactName: string;
      PhoneNumber: string;
      ContactEmail: string;
      BillingEmail: string;
      CustomerName: string;
      Company_ID: number;
      Problem: string;
      ServiceReport: string;
      Comments: string;
      Complaint: string;
      IssueResolved: boolean;
      TktResDate: string;
      TktResInit: string;
      TicketComplete: boolean;
      TktCompDate: string;
      TktCompInit: string;
      JobNumber: number;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface AHTimeSheet {
      Ticket: number;
      EmpNum: number;
      WorkDate: string;
      StartTime: number;
      EndTime: number;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface AssemblyCode {
      Item: string;
      AssemblyCode: string;
      CreateDate: string;
      CreateInit: string;
      ApprStatus: string;
    }

    export interface AssemblyGroup {
      AssemblyCode: string;
      MachineLink: string;
      CreateDate: string;
      CreateInit: string;
      ApprStatus: string;
    }

    export interface AssemblyMach {
      MachineLink: string;
      Description: string;
      CreateDate: string;
      CreateInit: string;
      ApprStatus: string;
    }

    export interface AssemblyName {
      AssemblyCode: string;
      Description: string;
      CreateDate: string;
      CreateInit: string;
      ApprStatus: string;
    }

    export interface AttrFile {
      AttrId: string;
      AttrName: string;
      AttrFormat: string;
      AttrModifier: string;
      AttrType: string;
      ValueRequired: string;
      AttrSize: number;
      ValueList: string;
      SystemLevel: string;
      AttrSecurity: string;
      WidgetType: string;
      WidgetAttr: string;
    }

    export interface AttrGroup {
      AttrModifier: string;
      GroupDesc: string;
      AttrSecurity: string;
    }

    export interface AXCapability {
      OperationCode: string;
      Capability: string;
      Mandatory: boolean;
      Level: number;
    }

    export interface AXDimenType {
      Dimension: string;
      DimenCode: string;
    }

    export interface AXDimenValue {
      DimenCode: string;
      DimenName: string;
      DimenValue: string;
    }

    export interface AXInvoice {
      Account: string;
      Invoice: string;
      InvoiceStatus: string;
      Debit: number;
      Credit: number;
      TransDate: string;
      Txt: string;
      SalesTax: number;
      Freight: number;
      TariffCharge: number;
      TariffInventory: boolean;
      ConfirmedTotal: number;
      Variance: number;
      Inventoried: boolean;
      InvTotal: number;
      VendorName: string;
      CreateDate: string;
      CreateTime: number;
      CreateInit: string;
    }

    export interface AXInvoiceDist {
      Account: string;
      Invoice: string;
      AcctCombined: string;
      LinePriority: number;
      Debit: number;
      Credit: number;
      Txt: string;
      Inventoried: boolean;
    }

    export interface AXInvoiceRcpt {
      Account: string;
      Invoice: string;
      RefNumber: number;
      RefType: string;
      RcptNumber: number;
    }

    export interface AXItemDim {
      AXItem: string;
      AXProductType: string;
      HasSize: boolean;
      HasConfig: boolean;
    }

    export interface AXItemExport {
      AXItem: string;
      AXSize: string;
      AXConfig: string;
      AXProductType: string;
      Item: string;
      Description: string;
      Exported: boolean;
    }

    export interface AXJournalBatch {
      BatchNumber: string;
      BatchStatus: string;
      Description: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface AXJournalLine {
      BatchNumber: string;
      RowOrder: number;
      AccountType: string;
      Account: string;
      Location: string;
      BusinessUnit: string;
      CostCenter: string;
      ProfitCenter: string;
      ProfitType: string;
      InventoryGroup: string;
      Department: string;
      Employee: string;
      Debit: number;
      Credit: number;
      TransDate: string;
      DueDate: string;
      PaymentTerms: string;
      PaymentMethod: string;
      Invoice: string;
      PONumber: string;
      Description: string;
      Reference: string;
    }

    export interface AXMainAccount {
      MainAccount: string;
      Name: string;
      AcctStruct: string;
      AccountType: string;
    }

    export interface AXOperation {
      Operation: number;
      Occurrence: number;
      OperationCode: string;
      OperationName: string;
      Exported: boolean;
      ResourceType: string;
      ResourceID: string;
      MainAccount: string;
      CostResource: string;
    }

    export interface AXResGroup {
      ResourceID: string;
      Name: string;
      SetupCategoryID: string;
      QtyCategoryID: string;
      ProcessCategoryID: string;
      Exported: boolean;
    }

    export interface AXResource {
      ResourceID: string;
      Name: string;
      Type: string;
      SetupCategoryID: string;
      QtyCategoryID: string;
      ProcessCategoryID: string;
      Exported: boolean;
      ResGroupID: string;
    }

    export interface AXResReq {
      Item: string;
      OperationCode: string;
      Capability: string;
      Level: number;
    }

    export interface AXRoute {
      OprId: string;
      RouteID: string;
      OprNum: number;
      AccError: number;
      ErrorPct: number;
      JobPayType: string;
      Level: string;
      OprNumNext: number;
      LinkType: string;
      OprPriority: string;
      Exported: boolean;
    }

    export interface AXRouteOpr {
      OprId: string;
      ItemCode: string;
      ItemRelation: string;
      ConfigID: string;
      DimConfig: string;
      DimSize: string;
      DimColor: string;
      DimStyle: string;
      RouteCode: string;
      RouteRelation: string;
      SiteID: string;
      RouteGroupID: string;
      FormulaFactor1: string;
      ProcessPerQty: number;
      ProcessTime: number;
      RouteType: string;
      SetupTime: number;
      SetupCategoryID: string;
      QtyCategoryID: string;
      ProcessCategoryID: string;
      SetupRequired: boolean;
      WrkCtrIDCost: string;
      QueueTimeBefore: number;
      QueueTimeAfter: number;
      TranspTime: number;
      ResourceType: string;
      ResourceID: string;
      Level: number;
      Exported: boolean;
    }

    export interface AXRouteTable {
      RouteID: string;
      Name: string;
      ItemGroupID: string;
      Route_Approved: boolean;
      Route_APNumber: string;
      Exported: boolean;
    }

    export interface AXRouteVersion {
      ItemID: string;
      RouteID: string;
      InventDimID: string;
      DimConfig: string;
      DimSize: string;
      DimColor: string;
      DimStyle: string;
      Name: string;
      InventSiteID: string;
      FromDate: string;
      ToDate: string;
      Active: boolean;
      Route_Approved: boolean;
      Route_APN: string;
      RouteVersion_APN: string;
      Budget_Approved: boolean;
      Budget_Approver: string;
      Exported: boolean;
    }

    export interface BizRule {
      RuleID: number;
      RuleType: string;
      PropName: string;
      PropType: string;
      ValueList: string;
      ParentRuleID: number;
      EvalOrder: number;
      Condition: string;
      RuleStatus: string;
      SortOrder: number;
      FieldLabel: string;
      CreateDtTm: string;
      CreateInit: string;
    }

    export interface BizRuleLink {
      LinkID: number;
      TableName: string;
      TableKey: string;
      EvalOrder: number;
      RuleID: number;
      CreateDtTm: string;
      CreateInit: string;
    }

    export interface BomImpTrans {
      TransDate: string;
      TransTime: number;
      TransType: string;
      BomItem: string;
      LineNumber: string;
      CompItem: string;
      ImpactedBom: string;
      OldImpLine: string;
      OldImpComp: string;
      OldAdjust: boolean;
      OldAdjInvQty: number;
      OldAdjCutQty: number;
      OldSource: string;
      OldDimension: string;
      ImpactedLine: string;
      ImpactedComp: string;
      Adjust: boolean;
      AdjustInvQty: number;
      AdjustCutQty: number;
      Source: string;
      Dimensions: string;
      Notes: string[];
      Initials: string;
    }

    export interface BomOptImpact {
      BomItem: string;
      LineNumber: string;
      CompItem: string;
      ImpactedBom: string;
      ImpactedLine: string;
      ImpactedComp: string;
      Adjust: boolean;
      AdjustInvQty: number;
      AdjustCutQty: number;
      Source: string;
      Dimensions: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface Cadfile {
      FileSys: string;
      Pathname: string;
      Filename: string;
      FileExt: string;
      FileStat: string;
      EditDate: string;
      CheckedOut: string;
      Notes: string;
    }

    export interface CallDetail {
      CallRefNum: number;
      CallStatus: string;
      CallDate: string;
      CallTime: number;
      CallType: string;
      FollowupDate: string;
      FollowupTime: number;
      CallOwner: string;
      CustComments: string;
      OurComments: string;
      CloseDate: string;
      CloseTime: number;
    }

    export interface CallHistory {
      "CallRefNum": number;
      "CallStatus": string;
      "CallDate": string;
      "CallTime": number;
      "CallType": string;
      "FollowupDate": string;
      "FollowupTime": number;
      "CallOwner": string;
      "Contactname": string;
      "PhoneNumber": string;
      "FaxNumber": string;
      "CustComments": string;
      "OurComments": string;
      "CustEmail": string;
      "Company_ID": number;
      "Address_ID": number;
      "Resolution": string;
      "StdEffected": boolean;
      "StdUpdated": boolean;
      "ServiceCodes": string;
      "Issues": string;
      "RefEquipment": string;
      "RefSerial#": string;
      "CloseDate": string;
      "CloseTime": number;
    }

    export interface Capability {
      Capability: string;
    }

    export interface CardCredit {
      DivisionId: number;
      RefType: string;
      RefCode: string;
      CardOrder: number;
      CardType: string;
      CardNumber: string;
      CardNoMask: string;
      ExpDate: string;
      Amount: number;
      CardStatus: string;
      CHName: string;
      CHAddress: string;
      CHAddress2: string;
      CHCity: string;
      CHState: string;
      CHZip: string;
      CHPhone: string;
      CHEmail: string;
      CVV2: string;
      TakenBy: string;
      TakenOn: string;
      TakenTime: number;
      ApprovedBy: string;
      ApprovedOn: string;
      ApprovedTime: number;
      ApprovalCode: string;
      ApprovalAmount: number;
      Comment: string;
      PONo: string;
      Tax: number;
      Company_ID: number;
      ReceiptType: string;
      ReceiptAddr: string;
      ReceiptFax: string;
      EncodedCheck: string;
    }

    export interface ccDist {
      TransNo: number;
      InvoiceNumber: number;
      Amount: number;
      PostStatus: string;
    }

    export interface ccTrans {
      TransNo: number;
      OSCID: string;
      BatchNo: number;
      Action: number;
      CardType: string;
      CardNo: string;
      CardNoMask: string;
      ExpDate: string;
      Amount: number;
      AuthAmount: number;
      CHName: string;
      CHAddress: string;
      CHAddress2: string;
      CHCity: string;
      CHState: string;
      CHZip: string;
      CHPhone: string;
      CHEmail: string;
      CVV2: string;
      EnteredBy: string;
      AVSResult: number;
      AuthStatus: number;
      AuthDetails: string;
      ApprCode: string;
      ReqDate: string;
      ReqTime: number;
      AuthDate: string;
      AuthTime: number;
      SettleDate: string;
      SettleTime: number;
      Comment: string;
      Source: string;
      doRetry: boolean;
      numTries: number;
      SubmitDate: string;
      SubmitTime: number;
      CurrencyCode: number;
      TrackData: string;
      PONo: string;
      Tax: number;
      RoutingNo: string;
      AccountNo: string;
      Company_ID: number;
      DivisionId: number;
      RefType: string;
      RefCode: string;
      CardOrder: number;
      ReceiptType: string;
      ReceiptAddr: string;
      ReceiptFax: string;
    }

    export interface ChangeLog {
      TableName: string;
      TableKey: string;
      TransDate: string;
      TransTime: number;
      ModInit: string;
      FieldChanged: string;
      BeforeValue: string;
      AfterValue: string;
    }

    export interface ChangeRequest {
      "Mod-ItemNum": string;
      "New-ItemNum": string;
      "EmpNum": number;
      "Date": string;
      "RevDesc": string;
      "Notes": string;
      "UseInv": boolean;
      "ModInv": boolean;
      "ModParts": boolean;
      "Type": string;
      "StockDelete": boolean;
      "StockAdd": boolean;
      "InvLevel": number;
      "Cost": number;
      "Processed": string;
      "InvNotes": string;
      "FileAttach": string;
    }

    export interface CNCFixture {
      FixtureID: string;
      FixtureName: string;
      FixtureLoc: string;
    }

    export interface CNCFtoM {
      FixtureID: string;
      MachineID: string;
    }

    export interface CNCMachine {
      MachineID: string;
      MachineDescr: string;
    }

    export interface CNCPart {
      PartNumber: string;
      PartDescription: string;
    }

    export interface CNCPtoF {
      PartNumber: string;
      FixtureID: string;
      FixtureStatus: string;
    }

    export interface COAStructType {
      AcctStruct: string;
    }

    export interface ComGroup {
      GroupName: string;
      GroupDesc: string;
    }

    export interface ComGrp {
      GroupName: string;
      CommCode: string;
    }

    export interface CommDesc {
      CommCode: string;
      PatternId: string;
      PatternOrder: number;
    }

    export interface Commodity {
      CommCode: string;
      Description: string;
      AttrList: string;
    }

    export interface Company {
      id: string;
      Company_ID: number;
      CustDlrName: string;
      Dealer: number;
      Active: boolean;
      IsDealer: boolean;
      IsExcDealer: boolean;
      CreditStatus: string;
      CreditNote: string;
      OnHoldBy: string;
      OnHoldDate: string;
      OffHoldBy: string;
      OffHoldDate: string;
      Classification: number;
      CustType: string;
      LastCreditStat: string;
      CoeRSM: number;
      Discounted: boolean;
      Notes: string;
      ShipInstr: string;
      BillToPhone: string;
      BillToExt: string;
      CreditLimit: number;
      AcctBalance: number;
      BalanceDate: string;
      TermsCode: string;
      Exported: boolean;
      SystemNotes: string;
      TaxID: string;
      URL: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
      createdAt: string;
      createdBy: string;
      updatedAt: string;
      updatedBy: string;
      deletedAt: string;
      deletedBy: string;
      deleted: boolean;
    }

    export interface CompanyAKA {
      Name: string;
      Type: string;
      Addr_Id: string;
    }

    export interface CompanyKey {
      NameKey: string;
      Type: string;
      Addr_Id: string;
    }

    export interface CompanyMaster {
      Master_Id: number;
      CompanyName: string;
      Type: string;
      Notes: string;
      MasterStatus: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface CompanyXRef {
      Master_Id: number;
      Company_ID: number;
    }

    export interface Constants {
      CType: string;
      CName: string;
      CDesc: string;
      CValue: number;
    }

    export interface ConstantValue {
      KeyName: string;
      StDate: string;
      EndDate: string;
      KeyType: string;
      StringValue: string;
      IntegerValue: number;
      DecimalValue: number;
      LogicalValue: boolean;
      DateValue: string;
    }

    export interface ContactGroup {
      ID: string;
      ContactGroup: string;
      Company_ID: number;
      Address_ID: number;
      Cont_ID: number;
      CreateDate: string;
      CreateInit: string;
    }

    export interface Contacts {
      id: string;
      Company_ID: number;
      Cont_Id: number;
      Address_ID: number;
      FirstName: string;
      LastName: string;
      Type: string;
      Notes: string;
      PhoneNumber: string;
      PhoneExt: string;
      FaxPhoneNum: string;
      Email: string;
      Website: string;
      ConTitle: string;
      AltPhone: string;
      AltDesc: string;
      MoreAddress: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
      createdAt: string;
      createdBy: string;
      updatedAt: string;
      updatedBy: string;
      deletedAt: string;
      deletedBy: string;
      deleted: boolean;
    }

    export interface Country {
      Country: string;
      ZipCodeFormat: string;
      CallingCode: string;
      CountryCode: string;
    }

    export interface County {
      County: string;
      State: string;
      Country: string;
    }

    export interface CreditCard {
      RefCode: string;
      CardType: string;
      CardNumber: string;
      CardHolder: string;
      CardExpDate: string;
      CardNotes: string;
      ZipCode: string;
      Address: string;
      ApprovalCode: string;
      TakenBy: string;
      TakenOn: string;
      TakenTime: number;
      CardStatus: string;
      SpecialRequest: string;
      ApprovedBy: string;
      ApprovedOn: string;
      ApprovedTime: number;
      ApprovalAmount: number;
    }

    export interface CreditHistory {
      Company_ID: number;
      StartDate: string;
      EndDate: string;
      CreditStatus: string;
      CreditLimit: number;
      Notes: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface CustomerItem {
      Company_ID: number;
      Item: string;
      CustomerItem: string;
    }

    export interface DaysAllotted {
      EmpNum: number;
      ExpDate: string;
      DayType: string;
      DaysAllotted: number;
      AuthDate: string;
      AuthInit: string;
      AllottedNotes: string;
      CreatedAt: string;
      CreateInit: string;
    }

    export interface DaysTaken {
      EmpNum: number;
      DayType: string;
      DateTaken: string;
      DayTaken: number;
      Flags: string;
      Notes: string;
      CreatedAt: string;
      CreateInit: string;
    }

    export interface DefBreakTime {
      DeptCode: number;
      EmpNum: number;
      StartDate: string;
      EndDate: string;
    }

    export interface Demographic {
      Category: string;
      Description: string;
      SortOrder: number;
      Parent_Category: string;
      Parent_Description: string;
      Use_Status: string;
    }

    export interface DemographMap {
      FieldName: string;
      Category: string;
    }

    export interface DeptArea {
      DeptArea: string;
      DispOrder: number;
      DeptList: string;
    }

    export interface DeptAreaTarget {
      DeptArea: string;
      StDate: string;
      ProdTarget: number;
      CreateDate: string;
      CreateInit: string;
    }

    export interface DescTemplate {
      PatternId: string;
      Pattern: string;
      PatternName: string;
    }

    export interface Division {
      "DivisionId": number;
      "DivisionName": string;
      "Shortname": string;
      "Address1": string;
      "Address2": string;
      "City": string;
      "State": string;
      "ZipCode": string;
      "PhoneNumber": string;
      "FaxPhoneNum": string;
      "LogoFile": string;
      "DBDirectory": string;
      "Self_Connect": string;
      "Remote_Connect": string;
      "TaxID#": string;
    }

    export interface DocLink {
      DocID: number;
      TableName: string;
      TableKey: string;
    }

    export interface Document {
      DocID: number;
      DocName: string;
      DocClass: string;
      DocDesc: string;
      DocMemo: string;
      DeleteOn: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface DynamicFile {
      FileName: string;
      KeyFields: string;
      RawData: unknown;
    }

    export interface EmpHistory {
      EmpNum: number;
      DeptCode: number;
      StDate: string;
      DivisionId: number;
      Salaried: boolean;
      LaborRateClass: string;
      ShiftPrem: string;
      WorkShift: string;
    }

    export interface EmpHoursTarget {
      EmpNum: number;
      StDate: string;
      HoursTarget: number;
      CreateDate: string;
      CreateInit: string;
    }

    export interface Employee {
      EmpNum: number;
      EmpLastName: string;
      EmpFirstName: string;
      EmpMiddleInt: string;
      EmpInitials: string;
      DivisionId: number;
      DeptCode: number;
      Salaried: boolean;
      LaborRateClass: string;
      ShiftPrem: string;
      WorkShift: string;
      StartDate: string;
      TermDate: string;
      PayrollTermDate: string;
      HireDate: string;
      Emptitle: string;
      EmpFaxPhone: string;
      HomePhone: string;
      DirectPhone: string;
      MobilePhone: string;
      Address1: string;
      Address2: string;
      Address3: string;
      City: string;
      State: string;
      ZipCode: string;
      Country: string;
      LaborRate: number;
      EffectDate: string;
      PrevLabRate: number;
      PinCode: string;
      Password: string;
      Permissions: string;
      ClientNums: string;
      LabelOrder: string;
      DefaultInfo: string;
      PayrollInfo: string;
      VacationDays: number;
      VacDate: string;
      VendorNumber: number;
      CreateDate: string;
      UserMenu: string;
      UserAsMain: boolean;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface EmployeeType {
      EmpType: string;
      Payroll: boolean;
      Description: string;
    }

    export interface EmpMgr {
      EmpNum: number;
      MgrNum: number;
    }

    export interface EmpTarget {
      EmpNum: number;
      StDate: string;
      ProdTarget: number;
      CreateDate: string;
      CreateInit: string;
    }

    export interface ExpCategory {
      Description: string;
      SortOrder: number;
      BSMainAccount: string;
      COGSAccount: string;
      MainAccount: string;
      ExtendedField: string;
    }

    export interface ExpenseTrans {
      ExpVoucher: string;
      VendorNumber: number;
      TransDate: string;
      PostDate: string;
      Mileage: number;
      MileRate: number;
      Amount: number;
      Description: string;
      BSAccount: string;
      ExpAccount: string;
      ExpCategory: string;
      OtherAccount: string;
      APStatus: string;
      ExpStatus: string;
      ExpTransDate: string;
      EntryStatus: string;
      EnterBy: string;
      EnterDate: string;
      MgrApprBy: string;
      MgrApprDate: string;
      APApprBy: string;
      APApprDate: string;
      DeptCode: number;
      WasExpensed: boolean;
      PaymentCode: string;
    }

    export interface ExpReport {
      ExpReportNum: string;
      VendorNumber: number;
      DeptCode: number;
      DatePrepared: string;
      EntryStatus: string;
      APStatus: string;
      ExpStatus: string;
      Comment: string;
      SubmitBy: string;
    }

    export interface ExpReportDtl {
      ExpReportNum: string;
      ExpVoucher: string;
    }

    export interface ExtProp {
      PropKey: string;
      PropName: string;
      PropType: string;
      StringValue: string;
      IntegerValue: number;
      DecimalValue: number;
      LogicalValue: boolean;
      DateValue: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface FaxStatus {
      FaxId: number;
      Sender: string;
      TotalPages: number;
      Destination: string;
      XmittedOn: string;
      LoadDate: string;
      XmitTime: string;
      CurStatus: string;
      Tries: number;
    }

    export interface Funnel {
      FunnelID: number;
      SortOrder: number;
      FunnelStatus: string;
      Company_ID: number;
      Address_ID: number;
      DealerNumber: number;
      DlrId: number;
      TargetAccount: string;
      City: string;
      State: string;
      Industry: string;
      ProjectName: string;
      RSMInitiated: string;
      RSMHelped: string;
      RSMTerritory: string;
      LeadSource: string;
      LeadName: string;
      WklyInter: number;
      TypeOfLine: string;
      OppValue: number;
      OppStage: string;
      OppStartDate: string;
      ProbSubDate: string;
      DecisionTime: string;
      PORcvdDate: string;
      ActionDate: string;
      Competition: string;
      ChanceToWin: string;
      QuoteNum: string;
      NumDaysCycle: number;
      ReasonWonLost: string;
      Notes: string;
      OutcomeYear: number;
      CreateDate: string;
      ModifyDate: string;
    }

    export interface GeoRegions {
      AreaName: string;
      StateProv: string;
      DispName: string;
      Country: string;
      RegionStatus: string;
      Abbrev: string;
    }

    export interface GlCodes {
      GlCode: number;
      Description: string;
      Inventoried: boolean;
      Capital: boolean;
      Active: boolean;
      GLFlags: string;
    }

    export interface GLMap {
      GlCode: number;
      AcctCombined: string;
      Reversible: boolean;
      MainAccount: string;
    }

    export interface HelpContext {
      OSContext: string;
      Datafield: string;
      DataFile: string;
      IsMenu: boolean;
      HelpProg: string;
      RunPersist: boolean;
    }

    export interface HelpKey {
      OSContext: string;
      Context: string;
      KeyName: string;
      Action: string;
    }

    export interface Holiday {
      HolidayDate: string;
      Description: string;
    }

    export interface HoursMapEmp {
      HoursType: string;
      EmpNum: number;
      StartDate: string;
      EndDate: string;
      AcctCombined: string;
      BSAcctCombined: string;
    }

    export interface HoursType {
      HoursType: string;
      TypeName: string;
      MainAccount: string;
    }

    export interface HoursTypeMap {
      HoursType: string;
      StartDate: string;
      EndDate: string;
      AcctCombined: string;
      BSAcctCombined: string;
    }

    export interface ImportLog {
      FileType: string;
      FileName: string;
      ImportDtTm: string;
      ImportInit: string;
    }

    export interface InstallDesc {
      ID: number;
      Name: string;
      Descr: string;
      EqPos: number;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface InstallList {
      EquGroup: string;
      ID: number;
      CustInst: boolean;
      MfgInst: boolean;
      ThirdInst: boolean;
      EqPos: number;
    }

    export interface InvClass {
      InvClass: string;
      ClassDescr: string;
      Inventoried: boolean;
    }

    export interface ItemBlanketNote {
      Item: string;
      VendorNumber: number;
      SortOrder: number;
      Note: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface ItemChange {
      OldItem: string;
      NewItem: string;
      DateComplete: string;
      DivisionList: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface ItemGroup {
      MainAccount: string;
      ItemGroup: string;
    }

    export interface ItemLength {
      Item: string;
      Lengths: string;
    }

    export interface ItemLocation {
      Item: string;
      Location: string;
      MinStockLvl: number;
      MaxStockLvl: number;
      ReOrderQty: number;
      OrderMethod: string;
      FromLocation: string;
      Comment: string;
      Frequency: string;
      LastChecked: string;
      LastCheckBy: string;
      CreateDate: string;
      CreateInit: string;
      DivisionId: number;
    }

    export interface ItemLog {
      Item: string;
      JobNumber: number;
      JobSuffix: string;
      InvJobNumber: number;
      InvJobSuffix: string;
      DateTimeIn: string;
      UserIn: string;
      DateTimeOut: string;
      UserOut: string;
      Location: string;
      PurposeCode: string;
      Quantity: number;
      Dimensions: string;
      KitInfo: string;
      Notes: string;
    }

    export interface ItemMaster {
      Item: string;
      Description: string;
      DescrLine2: string;
      Source: string;
      Workcell: string;
      InvClass: string;
      OrderUM: string;
      CostUM: string;
      InvUM: string;
      ConvFactor: number;
      PrintNumber: string;
      LstCstQtyCst: number;
      LstInvQtyCst: number;
      SalesDescr: string[];
      BOMApproved: boolean;
      PrimInvLoc: string;
      DivisionId: number;
      MinStockLvl: number;
      MinReOrdrQty: number;
      MaxStockLvl: number;
      MinUpdated: string;
      MinVendorOrder: number;
      StdVendor: number;
      StdCstQtyCst: number;
      StdInvQtyCst: number;
      StdCutCharge: number;
      CostExpDate: string;
      QtInvQtyCst: number;
      QtCstQtyCst: number;
      QtUpdated: string;
      QtUpdateInit: string;
      PurchNotes: string[];
      PONotes: string;
      SetUpDescr: string[];
      Fixture: string[];
      MfgNotes: string[];
      ManualDescr: string;
      RouterApprvd: boolean;
      SellingPrice: number;
      Symbol: number;
      OldPartNum: string;
      LeadTime: number;
      LeadUpdated: string;
      CommCode: string;
      GlCode: number;
      LastUsed: string;
      FirstUsed: string;
      FirstJob: number;
      FirstSfx: string;
      SpecialRtr: boolean;
      ItemStatus: string;
      LastCounted: string;
      CyclePriority: string;
      Documents: string;
      SparePart: boolean;
      AttrList: string;
      AttrValue: string;
      PatternId: string;
      MadeToPrint: boolean;
      PrintSize: string;
      VendorStocked: boolean;
      PurchaseType: string;
      BomRevision: string;
      MiscData: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface ItemReminder {
      Item: string;
      FieldName: string;
      ReviewDate: string;
      ReviewStatus: string;
      Notes: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface ItemSubClass {
      "ClassSubClss": string;
      "SubClassDesc": string;
      "Model#Prefix": string;
      "GlCode": number;
      "PriceMult": number;
      "ClassType": string;
      "Construction": boolean;
      "ItemGroup": string;
      "CreateDate": string;
      "CreateInit": string;
      "ModifyDate": string;
      "ModifyInit": string;
      "PrevModDate": string;
      "PrevModInit": string;
    }

    export interface ItemTimeEst {
      Item: string;
      MinPerCut: number;
      MinPerBench: number;
      BenchFactor: number;
      EstBy: string;
      EstDate: string;
      EstNotes: string;
    }

    export interface ItemToModel {
      Item: string;
      Model: string;
      Options: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface ItemTran {
      Item: string;
      TransDate: string;
      Initials: string;
      FieldChanged: string;
      Changes: string;
    }

    export interface JobType {
      JobType: string;
      TypeName: string;
      BomReqd: boolean;
      Production: boolean;
    }

    export interface Journey {
      ID: string;
      Target_Account: string;
      City: string;
      State_Province: string;
      Country: string;
      Company_ID: number;
      Address_ID: number;
      Industry: string;
      Other_Industry: string;
      Dealer: string;
      Other_Dealer: string;
      Dealer_Contact: string;
      OEM: string;
      Competition: string;
      RSM: string;
      RSM_Helped: string;
      RSM_Territory: string;
      ProducedBy: string;
      Service_Tech: string;
      Lead_Source: string;
      Journey_Type: string;
      Journey_Value: number;
      Journey_Stage: string;
      Journey_Start_Date: string;
      Priority: string;
      RFQ_Complete: string;
      Quote_Completed_Date: string;
      Quote_Presentation_Date: string;
      Expected_Decision_Date: string;
      Date_PO_Received: string;
      Action_Date: string;
      Last_Activity_Date: string;
      Equipment_Type: string;
      Quote_Type: string;
      Project_Models: string;
      Chance_To_Secure_order: string;
      Quote_Key_Value: string;
      Quote_Number: string;
      Reason_Won_Lost: string;
      Reason_Won: string;
      Reason_Lost: string;
      Qty_of_Items: number;
      Next_Steps: string;
      Notes: string;
      Visit_Outcome: string;
      Anticipated_Visit_Date: string;
      Visit_Date: string;
      Journey_Status: string;
      Project_Name: string;
      Project_Notes: string;
      Presentation_Method: string;
      Presentation_Method_OK: string;
      Date_Lost: string;
      Main_Contact_ID: string;
      CreateDT: string;
      CreateInit: string;
      Deleted: boolean;
    }

    export interface Journey_Contact {
      ID: string;
      Jrn_ID: string;
      Contact_Name: string;
      Contact_Email: string;
      Contact_Office: string;
      Contact_Mobile: string;
      Contact_Position: string;
      Contact_Note: string;
      CreateDtTm: string;
      CreateInit: string;
      IsPrimary: boolean;
    }

    export interface Journey_Log {
      ID: string;
      Jrn_ID: string;
      Action: string;
      CreateDtTm: string;
      CreateInit: string;
    }

    export interface Journey_Note {
      ID: string;
      Jrn_ID: string;
      Note: string;
      CreateDtTm: string;
      Activity: string;
      CreateInit: string;
    }

    export interface KeyJobDate {
      DateName: string;
      DateDesc: string;
      SortOrder: number;
      Days: number;
      Calculated: string;
      StartDate: string;
      EndDate: string;
    }

    export interface MailList {
      ListID: number;
      ListDesc: string;
      AppliesTo: string;
      Frequency: string;
      NextDate: string;
    }

    export interface MailTo {
      SendTo: number;
      Subject: string;
      Body: string;
      SendDate: string;
      SentDate: string;
      FileAttach: string;
      SentFrom: string;
    }

    export interface MailxRef {
      ListId: number;
      AddressID: string;
      AddressType: string;
      ContactID: number;
      AuthInit: string;
    }

    export interface MenuAccess {
      Activity: string;
      UserInits: string;
      MenuVersion: number;
      AccessCount: number;
    }

    export interface MenuChange {
      Activity: string;
      MenuVersion: number;
      TransDate: string;
      ChangesMade: string;
      LinesChanged: string;
    }

    export interface MenuDetail {
      MenuName: string;
      LineNumber: number;
      ProgName: string;
      ProgDesc: string;
      Parameters: string;
      HelpDescr: string[];
      MenuDescr: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface MenuHeader {
      MenuName: string;
      MenuTitle: string;
      OSContext: string;
      MenuOwner: string;
      MenuVersion: number;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface MenuShortcut {
      ProgName: string;
      Parameters: string;
      Shortcut: string;
      UserInits: string;
    }

    export interface MileageRate {
      StartDate: string;
      CentsPerMile: number;
      SellPerMile: number;
    }

    export interface ModelDtl {
      "Model-Idx": string;
      "IsGroup": boolean;
      "Model-Descr": string;
      "Model-Order": number;
      "Family-Pos": number;
      "CustPfx": string;
    }

    export interface newTerritory {
      Company_Id: number;
      Address_ID: number;
      AreaName: string;
      IsExclusive: boolean;
      IsLocation: boolean;
      Active: boolean;
      StartDate: string;
      EndDate: string;
    }

    export interface OneStep {
      Profile: string;
      BrokerHost: string;
      BrokerPort: string;
      SerialNo: string;
      LicenseKey: string;
      UserName: string;
      Password: string;
    }

    export interface Operation {
      Operation: number;
      OperDesc: string;
      Abbrev: string;
      DeptCode: number;
      WorkCtr: number;
      OutsideProc: boolean;
      SetUpRework: string;
      StdOPVendor: number;
      OpGlCode: number;
      Resource: number;
      Flags: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface OperListToRoute {
      OperList: string;
      Item: string;
      RouteID: string;
    }

    export interface OptGroupDef {
      SortOrder: number;
      GroupDesc: string;
      RangeMin: number;
      RangeMax: number;
    }

    export interface OptionOrder {
      OrderId: number;
      Description: string;
      RangeMin: number;
      RangeMax: number;
      Comments: string;
      SortOrder: number;
    }

    export interface PalletInfo {
      Pallet: string;
      Location: string;
      DateTimeIn: string;
      UserIn: string;
      PalletStatus: string;
      PalletPurpose: string;
      PalletType: string;
      Destination: string;
      Comments: string;
      CreateDateTm: string;
      CreateUser: string;
    }

    export interface PalletLink {
      Pallet: string;
      JobNumber: number;
      JobSuffix: string;
      BOMItem: string;
      LineNumber: string;
      CompItem: string;
      Quantity: number;
      Dimensions: string;
      DateTimeIn: string;
      UserIn: string;
      KitInfo: string;
      Inventoried: boolean;
    }

    export interface PalletLog {
      Pallet: string;
      LogType: string;
      LogSeq: number;
      DateTimeIn: string;
      UserIn: string;
      DateTimeOut: string;
      UserOut: string;
      PurposeCode: string;
      JobNumber: number;
      JobSuffix: string;
      BOMItem: string;
      Location: string;
    }

    export interface PalletPurpose {
      Pallet: string;
      PurposeCode: string;
      JobNumber: number;
      JobSuffix: string;
      BOMItem: string;
      DateTimeIn: string;
      UserIn: string;
      PalletStatus: string;
    }

    export interface PayPremium {
      EmpNum: number;
      WorkDate: string;
      HoursCodes: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface Permission {
      "Activity": string;
      "Can-Run": string;
      "Permissions": string[];
      "PermType": string;
      "Purpose": string;
      "DistGroup": boolean;
      "Recursive": boolean;
      "CreateDate": string;
      "CreateInit": string;
      "ModifyDate": string;
      "ModifyInit": string;
      "PrevModDate": string;
      "PrevModInit": string;
    }

    export interface Printers {
      Printnum: number;
      PrintName: string;
      PrintDesc: string;
      PrintType: string;
      PrintPerm: string;
    }

    export interface PrintGrp {
      PrintGrp: number;
      Printnum: number;
    }

    export interface PrintNumber {
      PrintNumber: string;
      Description: string;
      CreateInit: string;
      CreateDate: string;
      RefInformation: string;
    }

    export interface PrintUsrGrp {
      Printnum: number;
      EmpNum: number;
    }

    export interface ProjectEst {
      ProjID: number;
      Date: string;
      Source: string;
      EstTime: number;
      Estimator: string;
      EstNotes: string;
      EstOrgHrs: number[];
      EstOrgCost: number[];
      EstRevHrs: number[];
      EstRevCost: number[];
      EstEffDate: string;
      RevEffDate: string;
    }

    export interface ProjectLink {
      ProjID: number;
      TableName: string;
      TableKey: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface ProjectRev {
      ProjID: number;
      RevDate: string;
      RevTime: number;
      RevInit: string;
      EstRevHrs: number[];
      EstRevCost: number[];
      Notes: string;
      AuthorizedBy: string;
      RevEffDate: string;
    }

    export interface PublicItem {
      Publication: string;
      Item: string;
    }

    export interface PurposeCode {
      PurposeCode: string;
      Description: string;
    }

    export interface QRevService {
      ID: string;
      QYear: number;
      QNum: number;
      QRev: string;
      QuoteID: number;
      CreatedAt: string;
      CreateInit: string;
    }

    export interface ReqForm {
      ReqID: number;
      ReqDate: string;
      EmpNum: number;
      ReqType: string;
      Priority: number;
      ProgLoc: string;
      RequestEd: string;
      MISNotesEd: string;
      MISStatus: string;
      MISTime: number;
      MISActTime: number;
      StartDate: string;
      FinishDate: string;
      Phase: string;
      TaskModule: string;
      TaskName: string;
      WBSCode: string;
      Predecessors: string;
      Resources: string;
      ProjectId: number;
      ParentId: number;
      RequestOrder: number;
    }

    export interface ReqTimeSheet {
      "EmpNum": number;
      "WorkDate": string;
      "StartTime": string;
      "EndTime": string;
      "Hours": number;
      "Accomplished": string;
      "ReqId": number;
      "JobNumber": number;
      "JobSuffix": string;
      "BOMItem": string;
      "RouterSeq#": number;
      "Operation": number;
      "Quantity": number;
      "ShiftNote": string;
      "CreateDate": string;
      "CreateInit": string;
    }

    export interface Resource {
      Resource: number;
      Description: string;
      AvailableTime: number;
      ExtendedTime: number;
      UnitOfTime: string;
      Consumption: number;
      ColumnHdr: string[];
      DeptCode: number;
      NextDept: number;
      Active: boolean;
      RatioList: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface ResourceAssignment {
      ResourceID: number;
      Resource: number;
      StartDate: string;
      EndDate: string;
      DailyHours: number[];
      Hours: number;
      ProdPerc: number;
      ProdHours: number;
      HasChanged: boolean;
      AssignBy: string;
      AssignOn: string;
    }

    export interface ResourceLink {
      ResourceID: number;
      Resource: number;
      StartDate: string;
      EndDate: string;
      DailyHours: number[];
      Hours: number;
      ProdHours: number;
      ProdPerc: number;
    }

    export interface ResourceName {
      ResourceID: number;
      Description: string;
      ResourceType: string;
      ResourceCode: number;
      IsActive: boolean;
    }

    export interface ResourcePeriod {
      Resource: number;
      PeriodStart: string;
      Hours: number;
      HrsPerDay: number;
      Days: number;
      People: number;
      AssignBy: string;
      AssignOn: string;
    }

    export interface RootFileSys {
      FileSys: string;
      RootDirectory: string;
      RebuiltOn: string;
      RebuiltAt: number;
      Flags: string;
      SearchOrder: number;
    }

    export interface RSMActivity {
      RSM: string;
      PeriodType: string;
      PeriodStart: string;
      Activity: string;
      Cnt: number;
    }

    export interface RtrImpTrans {
      TransDate: string;
      TransTime: number;
      TransType: string;
      BomItem: string;
      LineNumber: string;
      CompItem: string;
      ImpactedBom: string;
      OldImpSeq: number;
      OldAdjust: boolean;
      OldAdjTime: number;
      OldAdjOPCost: number;
      OldOperation: number;
      OldStdVendor: number;
      ImpactedSeq: number;
      Adjust: boolean;
      AdjustTime: number;
      AdjustOPCost: number;
      Operation: number;
      StdOPVendor: number;
      Notes: string[];
      Initials: string;
    }

    export interface RtrOptImpact {
      BomItem: string;
      LineNumber: string;
      CompItem: string;
      ImpactedBom: string;
      ImpactedSeq: number;
      Adjust: boolean;
      AdjustTime: number;
      AdjustOPCost: number;
      Operation: number;
      StdOPVendor: number;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface RwkProblem {
      DeptCode: number;
      ProblemItem: string;
    }

    export interface SalesCode {
      DivisionId: number;
      CodeType: string;
      Description: string;
      GlCode: number;
    }

    export interface ScanMenu {
      MenuName: string;
      MenuDescription: string;
    }

    export interface ScanMenuItem {
      MenuName: string;
      LineNumber: number;
      Description: string;
      Action: string;
    }

    export interface ServiceCampaign {
      CampaignID: number;
      StartDate: string;
      Description: string;
      Notes: string;
      StatusCode: string;
      ItemList: string;
    }

    export interface ServiceEstimate {
      ID: string;
      QuoteID: number;
      CustomerInfo: string;
      ReferenceInfo: string;
      Scope: string;
      ManualScope: boolean;
      LevelOfService: number;
      InstallCategory: string;
      QuoteDate: string;
      QuotedBy: number;
      QuotedAmount: number;
      QuotedCost: number;
      CreatedAt: string;
      CreateInit: string;
    }

    export interface ServiceEstimateTrip {
      ID: string;
      QuoteID: number;
      TripID: number;
      Order: number;
      CreatedAt: string;
      CreateInit: string;
    }

    export interface ServiceTrip {
      ID: string;
      TripID: number;
      CustomerInfo: string;
      ReferenceInfo: string;
      Description: string;
      AdminMarkup: number;
      DesiredMargin: number;
      EffectDate: string;
      RegularRate: number;
      OvertimeRate: number;
      DoubleTimeRate: number;
      RegularCost: number;
      OvertimeCost: number;
      DoubleTimeCost: number;
      RentalCarPerDay: number;
      CompanyCarPerDay: number;
      MaxHoursPerDay: number;
      MPH: number;
      RentalMPG: number;
      CompanyMPG: number;
      GasPerGal: number;
      TravelPerDiem: number;
      PerDiemType: string;
      ChargePerMile: number;
      HotelPerDay: number;
      TypeOfTechnician: string;
      LeaveOnWeekday: number;
      IncludeCar: boolean;
      VehicleType: string;
      RentalCarCost: number;
      CompanyCarCost: number;
      Miles: number;
      MilesPersonalCar: number;
      MilesRentalCar: number;
      MilesCompanyCar: number;
      MileageCost: number;
      InPlantDays: number;
      DailyWorkHours: number;
      Airfare: number;
      TechCount: number;
      IncludeHotel: boolean;
      HoursByDay: string;
      RegularHours: number;
      OvertimeHours: number;
      DoubleTimeHours: number;
      TravelHours: number;
      FuelCost: number;
      CompanyFuelCost: number;
      LocalTrip: boolean;
      WorkSaturday: boolean;
      WorkSunday: boolean;
      MilesToAirport: number;
      MilesToHotel: number;
      MilesCoeToHotel: number;
      MilesHotelToPlant: number;
      NumOfTrips: number;
      OneWayTrip: boolean;
      TravelDayBefore: boolean;
      TravelDayAfter: boolean;
      TripHoursAtAirport: number;
      TripFlightTime: number;
      TripMiles: number;
      TripDriveTime: number;
      TripTravelTime: number;
      TravelFirstDay: boolean;
      TravelLastDay: boolean;
      PlantMiles: number;
      PlantDriveTime: number;
      PerDiem: number;
      HotelNights: number;
      RegularHoursCharge: number;
      OvertimeHoursCharge: number;
      DoubleTimeHoursCharge: number;
      TravelCharge: number;
      HotelCharge: number;
      RentalCarCharge: number;
      AirfareCharge: number;
      MileageCharge: number;
      TechVisitQuote: number;
      TechVisitCost: number;
      CreatedAt: string;
      CreateInit: string;
    }

    export interface ServiceTripSpecial {
      ID: string;
      TripID: number;
      Order: number;
      Description: string;
      Quantity: number;
      UnitCost: number;
      UnitRate: number;
      MarkupRate: number;
      MarkupMethod: string;
      Charge: number;
      CreatedAt: string;
      CreateInit: string;
    }

    export interface ShipCarrier {
      ShipService: string;
      Carrier: string;
      SortOrder: number;
      LastTrackId: string;
      InsuranceRate: number;
    }

    export interface SparePartRef {
      Item: string;
      LinkType: string;
      BOMItem: string;
      SuggestQty: number;
      LinkStatus: string;
      AddedBy: string;
    }

    export interface SrvCampIssue {
      CampaignID: number;
      Description: string;
      Notes: string;
    }

    export interface SrvCampLoc {
      CampaignID: number;
      Company_ID: number;
      Address_ID: number;
      StatusCode: string;
      ServiceNotes: string;
      SalesNotes: string;
    }

    export interface SrvCampXref {
      CampaignID: number;
      Company_ID: number;
      Address_ID: number;
      DivisionId: number;
      JobNumber: number;
      JobSuffix: string;
      Completion: string;
      ItemList: string;
      BOMInfo: string;
    }

    export interface StartupParams {
      ParamName: string;
      FileName: string;
    }

    export interface State {
      StateProv: string;
      StateName: string;
      Country: string;
    }

    export interface StatusCode {
      StatusGroup: string;
      StatusCode: string;
      Description: string;
      SortOrder: number;
      FullDesc: string;
    }

    export interface StdBOM {
      BomItem: string;
      LineNumber: string;
      CompItem: string;
      Source: string;
      InvQtyReq: number;
      CutQty: number;
      Dimensions: string;
      Standard: boolean;
      MiscData: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface StdBOMDef {
      BomItem: string;
      LineNumber: string;
      LineDesc: string;
      Requirement: string;
      Activity: string;
      Comments: string;
      ApprStat: string;
      ApprInit: string;
      ApprDtTm: string;
      CreateDtTm: string;
      CreateInit: string;
    }

    export interface StdBTrans {
      TransDate: string;
      TransTime: number;
      TransType: string;
      BomItem: string;
      OldLineNum: string;
      LineNumber: string;
      OldCompItem: string;
      OldSource: string;
      OldInvQtyReq: number;
      OldCutQty: number;
      OldDimension: string;
      OldStandard: boolean;
      CompItem: string;
      Source: string;
      InvQtyReq: number;
      CutQty: number;
      Dimensions: string;
      Standard: boolean;
      Notes: string[];
      Initials: string;
    }

    export interface StdCost {
      "Item": string;
      "Cell-Value": number[];
      "Quote-Value": number[];
    }

    export interface StdCostLog {
      Item: string;
      CostType: string;
      EffectDate: string;
      CostValue: number;
      LastValue: number;
      CostSource: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface StdOptDesc {
      DescID: number;
      Description: string;
      OptionGrpID: number;
      SortOrder: number;
      EditActivity: string;
      PickActivity: string;
      ApprStat: string;
      ApprInit: string;
      ApprDtTm: string;
      CreateDtTm: string;
      CreateInit: string;
    }

    export interface StdOption {
      BomItem: string;
      LineNumber: string;
      CompItem: string;
      Description: string[];
      CreateDate: string;
      DescID: number;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface StdRevision {
      BomItem: string;
      BomRevision: string;
      LineNumber: string;
      CompItem: string;
      CompRevision: string;
      Source: string;
      InvQtyReq: number;
      CutQty: number;
      Dimensions: string;
      Standard: boolean;
      Effective: string;
      Obsolete: string;
    }

    export interface StdRouter {
      BomItem: string;
      Sequence: number;
      Primary: string;
      Operation: number;
      StdTime: number;
      StdOPCost: number;
      CostExpDate: string;
      StdOPVendor: number;
      QtOPCost: number;
      QtUpdated: string;
      QtUpdateInit: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface StdRTrans {
      TransDate: string;
      TransTime: number;
      TransType: string;
      BomItem: string;
      OldSequence: number;
      Sequence: number;
      OldPrimary: string;
      Primary: string;
      OldOperation: number;
      OldStdTime: number;
      OldStdOPVend: number;
      OldStdOPCost: number;
      OldCstExpDt: string;
      OldStdLabCst: number;
      OldOperCmp: boolean;
      Operation: number;
      StdTime: number;
      StdOPVendor: number;
      StdOPCost: number;
      CostExpDate: string;
      Initials: string;
      StdLaborCost: number;
      OperComplete: boolean;
      Notes: string[];
    }

    export interface StdRtrDesc {
      BomItem: string;
      Sequence: number;
      Operation: number;
      Description: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface StdTerms {
      Event: string;
      EventType: number;
      EventReference: string;
      EventOffset: number;
      InvoiceType: string;
      Standard: boolean;
      CreateDate: string;
      CreateInit: string;
      NotToExceed: number;
    }

    export interface TaxFlags {
      LinkType: string;
      LinkKey: string;
      TaxFlag: string;
      Certificate: string;
      DateEntered: string;
      UserEntered: string;
      TaxRateAdj: number;
      ExpiresOn: string;
    }

    export interface TaxGroup {
      ZoneGroup: string;
      LocExemptFlags: string;
      JobExemptFlags: string;
      BOMExemptFlags: string;
      FreightTaxable: string;
      ServiceTaxable: string;
      PermissionType: string;
      InvoiceMsg: string;
      TaxAcctId: string;
      CodeType: string;
    }

    export interface TaxZone {
      TZID: number;
      Country: string;
      State: string;
      County: string;
      City: string;
      ZoneName: string;
      ZoneGroup: string;
      ZoneType: string;
      GlCode: number;
    }

    export interface TaxZoneRate {
      TZID: number;
      TaxRate: number;
      StartDate: string;
      EndDate: string;
      Flags: string;
    }

    export interface tb_AppMessages {
      in_MsgNumber: number;
      ch_Language: string;
      ch_Message: string;
      ch_AdditionalInformation: string;
    }

    export interface TeleList {
      Ext: number;
      PCNum: number;
      EmpNum: number;
      Descr: string;
    }

    export interface TimeShtType {
      EntryType: string;
      Description: string;
      Production: boolean;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface TimezoneCode {
      ZipTimeZone: string;
    }

    export interface TOCImpact {
      Publication: string;
      ImpPublication: string;
    }

    export interface TOCManual {
      ManualId: number;
      ManualName: string;
    }

    export interface TOCPub {
      Publication: string;
      PubVersion: string;
      DocumentName: string;
      IsDocument: boolean;
      RevisedBy: string;
      RevisedOn: string;
      Notes: string;
      RevisionType: string;
      PublicationName: string;
      CurrentVersion: boolean;
    }

    export interface TOCSection {
      SectionId: number;
      SectionName: string;
      SectionQualifier: string;
    }

    export interface TOCStd {
      ManualId: number;
      SectionId: number;
      SubSectionId: number;
      LineNumber: number;
      Publication: string;
    }

    export interface ValueList {
      ValueID: number;
      ListID: number;
      VarValue: string;
      SortOrder: number;
      Comment: string;
      ValueStatus: string;
      ValueActivity: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface ValueListType {
      ListID: number;
      ListName: string;
      ListStatus: string;
      ListActivity: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface ValueMatrix {
      MatrixID: number;
      VarID: number;
      ValueID: number;
      RefVarID: number;
      RefValueID: number;
      CreateDate: string;
      CreateInit: string;
    }

    export interface VarDef {
      VarID: number;
      VarName: string;
      VarFormat: string;
      VarViewAs: string;
      ListID: number;
      Comment: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface VarGroup {
      GroupID: number;
      GroupName: string;
      DisplayHeader: string;
      ShowHeader: boolean;
      GroupActivity: string;
      CreateDate: string;
      CreateInit: string;
    }

    export interface VarGroupMember {
      MemID: number;
      GroupID: number;
      MemberType: string;
      MemberID: number;
      SortOrder: number;
      CreateDate: string;
      CreateInit: string;
    }

    export interface VarProperty {
      PropID: number;
      TableName: string;
      TableKey: string;
      VarID: number;
      ValueID: number;
      CreateDate: string;
      CreateInit: string;
    }

    export interface VendItemGroup {
      VendorNumber: number;
      Item: string;
      Type: string;
      Operation: number;
      VendorStatus: string;
      Notes: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface VendorIndex {
      VendIdx: string;
      GlCode: number;
      VendType: string;
      VendorNumber: number;
      SpecificItems: boolean;
      Include: boolean;
      CreateDate: string;
      CreateInit: string;
    }

    export interface VendorItem {
      "VendorNumber": number;
      "Item": string;
      "VendorItem#": string;
      "Type": string;
      "Operation": number;
      "StdCstQtyCst": number;
      "StdInvQtyCst": number;
      "LstCstQtyCst": number;
      "LstInvQtyCst": number;
      "LeadTime": number;
      "CreateDate": string;
      "CreateInit": string;
      "ModifyDate": string;
      "ModifyInit": string;
      "PrevModDate": string;
      "PrevModInit": string;
    }

    export interface VendorMaster {
      "VendorNumber": number;
      "VendorName": string;
      "Address1": string;
      "Address2": string;
      "City": string;
      "State": string;
      "ZipCode": string;
      "Country": string;
      "PhoneNumber": string;
      "FaxNumber": string;
      "Contact1": string;
      "Contact2": string;
      "Contact3": string;
      "DocumentGrp": string;
      "VendorClass": string;
      "TermsCode": string;
      "Perm-Temp": boolean;
      "LateNotice": boolean;
      "GLGroup": number;
      "MailCode": string;
      "Notes": string;
      "VendEMail": string;
      "VendStatus": string;
      "VendType": string;
      "Keyinfo": string;
      "Y2kContact": string;
      "Y2kPhoneNumber": string;
      "Y2kCompliant": string;
      "CreateDate": string;
      "CreateInit": string;
      "ModifyDate": string;
      "ModifyInit": string;
      "PrevModDate": string;
      "PrevModInit": string;
    }

    export interface VendorPerf {
      VPRId: number;
      VendorNumber: number;
      Orders: string;
      Invoices: string;
      Contactname: string;
      Buyer: string;
      EntryDate: string;
      Problem: string;
      Solution: string;
      ProblemTypes: string;
    }

    export interface VendorTypes {
      VendType: string;
    }

    export interface VPRTypes {
      TypeId: string;
      ProblemText: string;
      SortOrder: number;
    }

    export interface Warehouse {
      "Warehouse#": number;
      "Name": string;
      "Address1": string;
      "Address2": string;
      "City": string;
      "State": string;
      "ZipCode": string;
      "PhoneNumber": string;
    }

    export interface WorkBookMap {
      MapID: number;
      WorkBookID: number;
      PropName: string;
      CellRef: string;
      CreateDtTm: string;
      CreateInit: string;
    }

    export interface WorkBookType {
      WorkBookID: number;
      WorkBookType: string;
      WorkBookRev: string;
      SignatureCell: string;
      SignatureValue: string;
      CellFormat: string;
      CreateDtTm: string;
      CreateInit: string;
    }

    export interface Workcell {
      Workcell: string;
      Description: string;
    }

    export interface WorkSchedule {
      WorkDate: string;
      EmpNum: number;
      DivisionId: number;
      JobNumber: number;
      JobSuffix: string;
      JobCode: string;
      TechDesc: string;
    }

    export interface ZipCode {
      ZipCode: string;
      City: string;
      StateProv: string;
      Country: string;
      CreateDate: string;
      CreateInit: string;
      ModifyDate: string;
      ModifyInit: string;
      PrevModDate: string;
      PrevModInit: string;
    }

    export interface ZipData {
      ZipCode: string;
      ZipType: string;
      PrimaryCity: string;
      StateProv: string;
      County: string;
      AccCity: string;
      UnAccCity: string;
      ZipTimeZone: string;
      AreaCodes: string;
      Latitude: string;
      Longitude: string;
      WorldRegion: string;
      Country: string;
      Decommissioned: string;
      EstPopulation: string;
      Notes: string;
    }
  }
}

export default legacy;
