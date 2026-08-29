export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function jsonOk(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
