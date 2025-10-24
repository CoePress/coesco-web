import eslintConfig from "@coesco/eslint-config";

export default eslintConfig(
  {},
  {
    files: ["**/__tests__/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
    rules: {
      "no-console": "off",
      "node/no-process-env": "off",
      "unicorn/filename-case": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "ts/no-explicit-any": "off",
    },
  },
);
