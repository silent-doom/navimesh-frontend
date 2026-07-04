// Maps raw axios / fetch errors into short, plain-language messages
// meant for non-technical end users. Returns a title + hint pair so
// the UI can render a consistent "what happened / what to do" block.

export interface FriendlyError {
  title: string;
  hint: string;
}

export function toFriendlyError(err: unknown): FriendlyError {
  const anyErr = err as any;
  const code: string | undefined = anyErr?.code;
  const status: number | undefined = anyErr?.response?.status;
  const serverDetail: string | undefined =
    anyErr?.response?.data?.detail || anyErr?.response?.data?.message;

  // Network / connectivity
  if (code === "ECONNABORTED" || /timeout/i.test(anyErr?.message ?? "")) {
    return {
      title: "The service took too long to respond.",
      hint: "This usually clears up on its own. Please try again in a moment.",
    };
  }
  if (code === "ERR_NETWORK" || anyErr?.message === "Network Error") {
    return {
      title: "We couldn't reach NaviMesh.",
      hint: "Check your internet connection and try again.",
    };
  }

  // HTTP status buckets
  if (status === 400 || status === 422) {
    return {
      title: "Something in the request didn't look right.",
      hint: serverDetail || "Double-check the inputs and try again.",
    };
  }
  if (status === 401 || status === 403) {
    return {
      title: "You aren't allowed to run this request.",
      hint: "If you think this is a mistake, please reach out to the team.",
    };
  }
  if (status === 404) {
    return {
      title: "We couldn't find what you asked for.",
      hint: "Try adjusting the city or query and running it again.",
    };
  }
  if (status === 413) {
    return {
      title: "That photo is too large.",
      hint: "Try a smaller image (under 5 MB works best).",
    };
  }
  if (status === 429) {
    return {
      title: "Too many requests, too quickly.",
      hint: "Give it a few seconds and try again.",
    };
  }
  if (status && status >= 500) {
    return {
      title: "The service ran into a problem on its side.",
      hint: "This is on us — please try again shortly.",
    };
  }

  return {
    title: "Something went wrong.",
    hint: serverDetail || "Please try again. If this keeps happening, refresh the page.",
  };
}
