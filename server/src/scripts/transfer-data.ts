import { quoteSequelize } from "@/config/database";
import { quoteService } from "@/services";

// get employee, customer, dealer, address, contact

const qdata = async () => {
  // get all qdata records
  const qdataRecords = (await quoteSequelize.query("SELECT * FROM qdata")) as [
    { qyear: number; qnum: number; priority: number; confidence: number }[],
    any
  ];

  for (const record of qdataRecords) {
    // process specific unmapped fields
    const createdAt = new Date(record.createdate);
    const updatedAt = new Date(record.modifydate);

    // transfer mapped fields
    const newRecord = {
      year: record.qyear,
      number: record.qnum,
      priority: record.priority,
      confidence: record.confidence,
      createdAt,
      updatedAt,
    };

    await quoteService.create(newRecord);
  }
};

qdata();
