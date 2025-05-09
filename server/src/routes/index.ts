import { Request, Response, Router } from "express";
import fs from "fs";
import path from "path";

import Services from "@/services";
import { authRoutes } from "./auth.routes";
import { connectionRoutes } from "./connection.routes";
import { machineRoutes } from "./machine.routes";
import { stateRoutes } from "./state.routes";
import { systemRoutes } from "./system.routes";
import { userRoutes } from "./user.routes";

export const routes = (services: Services) => {
  const router = Router();

  router.use("/auth", authRoutes(services));
  router.use("/connections", connectionRoutes(services));
  router.use("/machines", machineRoutes(services));
  router.use("/states", stateRoutes(services));
  router.use("/system", systemRoutes(services));
  router.use("/users", userRoutes(services));

  router.get("/templates/:slug", (req: Request, res: Response) => {
    const slug = req.params.slug;
    const filePath = path.join(__dirname, `../templates/${slug}.html`);

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        const defaultPath = path.join(
          __dirname,
          "../templates/1.html"
        );

        fs.readFile(defaultPath, "utf8", (defaultErr, defaultData) => {
          if (defaultErr) {
            return res.send("No template found.");
          }

          res.send(defaultData);
        });
        return;
      }

      res.send(data);
    });
  });

  return router;
};
