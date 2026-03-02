import reactRouterConfig from "@Hamoria/eslint-config/react-router";

/** @type {import('typescript-eslint').Config} */
export default [
  ...reactRouterConfig,
  {
    ignores: ["server-build/**"],
  },
];
