import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "Coesco API",
    description: "Description",
  },
  host: "localhost:8080",
};

const outputFile = "./src/config/swagger-output.json";
const routes = ["./src/routes/index.ts"];

swaggerAutogen()(outputFile, routes, doc);
