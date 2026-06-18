import js from "@eslint/js";
import globals from "globals";
import prettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
  js.configs.recommended,
  prettier,

  {
    files: ["**/*.{js,mjs,cjs}"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },

    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "prefer-const": "error",
      "no-var": "error",

      eqeqeq: ["error", "always"],
      curly: ["error", "all"],

      "object-shorthand": "error",
      "dot-notation": "error",

      "no-console": "off",

      "no-restricted-globals": [
        "error",
        {
          name: "require",
          message: "Utilisez import à la place de require().",
        },
      ],

      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='require']",
          message: "Utilisez import à la place de require().",
        },
        {
          selector: "AssignmentExpression[left.object.name='module'][left.property.name='exports']",
          message: "Utilisez export à la place de module.exports.",
        },
        {
          selector: "AssignmentExpression[left.object.name='exports']",
          message: "Utilisez export à la place de exports.xxx.",
        },
      ],
    },
  },
]);