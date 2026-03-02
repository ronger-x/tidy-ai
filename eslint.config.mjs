// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";
import prettier from "eslint-config-prettier";

export default withNuxt(
  {
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/max-attributes-per-line": ["error", { singleline: 3 }],
    },
  },
  // Must be last: disables all ESLint rules that would conflict with Prettier
  prettier,
);
