// Uncaught errors are logged with the route, the user and the last API correlation id (plan
// section 9, "Error reporting"). The reporting tool is still open (question 7), so for now the
// report goes to the console in one structured line; swap `send` for the chosen tool's client.
let lastCorrelationId = "";
export const rememberCorrelationId = (id) => id && (lastCorrelationId = id);

function userId() {
  try {
    const raw = JSON.parse(localStorage.getItem("userDetail") || "null");
    const u = raw?.user ?? raw;
    return u?.id ?? u?.userId ?? u?.email ?? null;
  } catch {
    return null;
  }
}

const send = (report) => console.error("Marine error report", JSON.stringify(report));

export function report(error, extra = {}) {
  send({
    message: String(error?.message ?? error),
    stack: error?.stack?.split("\n").slice(0, 5).join("\n"),
    route: location.pathname + location.search,
    userId: userId(),
    correlationId: lastCorrelationId,
    at: new Date().toISOString(),
    ...extra,
  });
}

/** Hooks Vue's error handler and the window's unhandled errors, keeping any earlier handler. */
export function installErrorReporting(app) {
  const previous = app.config.errorHandler;
  app.config.errorHandler = (err, instance, info) => {
    report(err, { info, component: instance?.$options?.__name ?? instance?.$options?.name });
    if (previous) previous(err, instance, info);
    else console.error(err);
  };
  window.addEventListener("unhandledrejection", (e) => report(e.reason, { info: "unhandledrejection" }));
  window.addEventListener("error", (e) => report(e.error ?? e.message, { info: "window.error" }));
}
