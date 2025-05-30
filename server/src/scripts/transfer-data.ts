import { quoteSequelize } from "@/config/database";
import { employeeService, quoteService } from "@/services";

// get employee, customer, dealer, address, contact
// backdate logs as best as possible

const qdata = async () => {
  const qdataRecords = (await quoteSequelize.query(
    "SELECT * FROM qdata"
  )) as any[];
  const records = qdataRecords[0];
  const record = records[2];

  console.log("Raw record:", record);
  console.log("Record type:", typeof record);
  console.log("Record keys:", Object.keys(record));

  const createdAt = new Date(record.createdate);
  const updatedAt = new Date(record.modifydate);

  const { data: rsm } = await employeeService.findBy({
    number: record.coersm,
  });

  const customer = {} as any;

  const dealer = {} as any;

  const newRecord = {
    rsmId: rsm.id,
    customerId: customer.id,
    dealerId: dealer.id,
    year: record.qyear,
    number: record.qnum,
    priority: record.priority,
    confidence: record.confidence,
    createdAt,
    updatedAt,
  };

  console.log({
    qyear: record.qyear,
    qnum: record.qnum,
    priority: record.priority,
    confidence: record.confidence,
  });

  console.log(newRecord);

  // for (const r of qdataRecords) {
  //   const createdAt = new Date(r.createdate);
  //   const updatedAt = new Date(r.modifydate);

  //   const newRecord = {
  //     year: r.qyear,
  //     number: r.qnum,
  //     priority: r.priority,
  //     confidence: r.confidence,
  //     createdAt,
  //     updatedAt,
  //   };

  //   await quoteService.create(newRecord as any);
  // }
};

qdata();
