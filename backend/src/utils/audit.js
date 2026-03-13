function normalizeActorId(user = {}) {
  const id = Number(user?.id ?? user?.sub);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function buildActor(user = {}) {
  return {
    id: normalizeActorId(user),
    email: user?.email || null,
    cargo: user?.cargo || null,
    cargo_scope: user?.cargo_scope || null,
  };
}

export function recordAuditEvent(req, payload = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    action: payload.action || "unknown_action",
    resource: payload.resource || "unknown_resource",
    resource_id: payload.resourceId ?? null,
    result: payload.result || "success",
    reason: payload.reason || null,
    actor: buildActor(req?.user || {}),
    method: req?.method || null,
    path: req?.originalUrl || req?.url || null,
    metadata: payload.metadata || null,
  };

  // eslint-disable-next-line no-console
  console.info("[AUDIT]", JSON.stringify(entry));
}
