import { quoteSequelize } from "@/config/database";
import { Router, RequestHandler } from "express";

const getValidEntities = async () => {
  const result = (await quoteSequelize.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'"
  )) as [{ table_name: string }[], any];

  return result.map((row) => row[0]);
};

const doesEntityExist = async (entity: string) => {
  const result = await quoteSequelize.query(
    `SELECT EXISTS (SELECT 1 FROM "${entity}" LIMIT 1)`
  );

  return (result[0][0] as { exists: boolean }).exists;
};

const router = Router();

router.get("/", async (req, res) => {
  const validEntities = await getValidEntities();
  res.status(200).json({
    message: "Valid entities",
    entities: validEntities,
  });
});

router.get("/:entity", (async (req, res) => {
  const { entity } = req.params;

  try {
    const exists = await doesEntityExist(entity);
    if (!exists) {
      return res.status(404).json({
        error: `No records found in ${entity}`,
      });
    }

    // TODO: Implement actual archive logic here
    res.status(200).json({
      message: `Archive endpoint for ${entity}`,
      entity,
      exists,
    });
  } catch (error) {
    console.error(`Error checking ${entity}:`, error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
}) as RequestHandler);

export default router;
