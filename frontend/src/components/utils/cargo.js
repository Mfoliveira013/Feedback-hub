export function normalizeCargoValue(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function toLegacyCargo(value) {
  const cargo = normalizeCargoValue(value);
  if (cargo === "admin_global" || cargo === "admin_setor" || cargo === "administrador") {
    return "administrador";
  }
  if (cargo === "gestor") return "gestor";
  return "usuario";
}

export function getCargoScope(user = {}) {
  const explicitScope = normalizeCargoValue(user.cargo_scope);
  if (explicitScope === "admin_global" || explicitScope === "admin_setor") return explicitScope;
  if (explicitScope === "gestor" || explicitScope === "usuario") return explicitScope;

  const cargo = normalizeCargoValue(user.cargo);
  if (cargo === "admin_global" || cargo === "admin_setor") return cargo;
  if (cargo === "gestor") return "gestor";
  if (cargo === "administrador") return user.setor ? "admin_setor" : "admin_global";
  return "usuario";
}

export function isAdminCargo(user = {}) {
  const scope = getCargoScope(user);
  return scope === "admin_global" || scope === "admin_setor";
}

export function isGestorCargo(user = {}) {
  return getCargoScope(user) === "gestor";
}
