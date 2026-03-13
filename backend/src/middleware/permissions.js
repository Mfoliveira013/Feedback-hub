import { getCargoScope, normalizeCargoValue } from "../utils/cargo.js";
import { recordAuditEvent } from "../utils/audit.js";

function matchesRequiredRole(scope, requiredRole) {
  const normalizedRole = normalizeCargoValue(requiredRole);

  if (normalizedRole === "administrador") {
    return scope === "admin_global" || scope === "admin_setor";
  }

  return scope === normalizedRole;
}

export function requireRole(...roles) {
  const requiredRoles = roles.map((role) => normalizeCargoValue(role)).filter(Boolean);

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (requiredRoles.length === 0) {
      return next();
    }

    const scope = getCargoScope(req.user);
    const allowed = requiredRoles.some((role) => matchesRequiredRole(scope, role));

    if (!allowed) {
      recordAuditEvent(req, {
        action: "access_denied",
        resource: "permission",
        result: "denied",
        reason: "role_not_allowed",
        metadata: {
          required_roles: requiredRoles,
          actor_scope: scope,
        },
      });
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
}
