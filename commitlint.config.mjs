// Conventional commits: feat(scope): …, fix(scope): …, refactor, docs, chore, test, ci, perf, style, build, revert.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Bodies hold real explanations; don't wrap them at 100 chars.
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
