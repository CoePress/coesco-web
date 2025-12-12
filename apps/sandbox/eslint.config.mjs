import antfu from "@antfu/eslint-config";

export default antfu({
  type: "app",
  typescript: true,
  stylistic: {
    indent: 2,
    semi: true,
    quotes: "double",
  },
  vue: false,
  react: false,
}, {
  rules: {
    "no-console": ["warn"],
    "node/no-process-env": ["error"],
    "perfectionist/sort-imports": [
      "error",
      {
        internalPattern: ["^@/"],
      },
    ],
    "unicorn/filename-case": [
      "error",
      {
        case: "kebabCase",
        ignore: ["README.md"],
      },
    ],
  },
});
