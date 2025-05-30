import { quoteSequelize } from "@/config/database";
import { quoteService } from "@/services";

// get employee, customer, dealer, address, contact

const qdata = async () => {
  const qdataRecords = (await quoteSequelize.query(
    "SELECT * FROM qdata"
  )) as any[];
  const records = qdataRecords[0];
  const record = records[0];

  console.log("Raw record:", record);
  console.log("Record type:", typeof record);
  console.log("Record keys:", Object.keys(record));

  console.log({
    qyear: record.qyear,
    qnum: record.qnum,
    priority: record.priority,
    confidence: record.confidence,
  });

  for (const r of qdataRecords) {
    const createdAt = new Date(r.createdate);
    const updatedAt = new Date(r.modifydate);

    const newRecord = {
      year: r.qyear,
      number: r.qnum,
      priority: r.priority,
      confidence: r.confidence,
      createdAt,
      updatedAt,
    };

    await quoteService.create(newRecord as any);
  }
};

qdata();
