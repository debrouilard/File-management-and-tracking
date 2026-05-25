const level = process.env.LOG_LEVEL || "info";

function ts() {
  return new Date().toISOString();
}

export const logger = {
  info(...args) {
    if (level === "silent") return;
    console.log(ts(), "[info]", ...args);
  },
  warn(...args) {
    console.warn(ts(), "[warn]", ...args);
  },
  error(...args) {
    console.error(ts(), "[error]", ...args);
  },
};
