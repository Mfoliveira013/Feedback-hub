import { listAllowedSetoresByUserId } from "../repositories/user-setores.repo.js";
import { findUserById } from "../repositories/users.repo.js";
import { getCargoScope } from "../utils/cargo.js";

function normalizeSetor(value = "") {
  return String(value || "").trim();
}

function uniqueSetores(values = []) {
  return Array.from(new Set(values.map((value) => normalizeSetor(value)).filter(Boolean)));
}

async function getLegacySetorByUserId(userId) {
  const user = await findUserById(userId);
  const setor = normalizeSetor(user?.setor);
  return setor ? [setor] : [];
}

export async function resolveAllowedSetoresForUser(authUser = {}) {
  const userId = Number(authUser?.id ?? authUser?.sub);
  if (!Number.isFinite(userId) || userId <= 0) {
    return [];
  }

  const cargoScope = getCargoScope(authUser);
  if (cargoScope !== "admin_setor") {
    return [];
  }

  const explicitSetores = await listAllowedSetoresByUserId(userId);
  if (explicitSetores.length > 0) {
    return uniqueSetores(explicitSetores);
  }

  return getLegacySetorByUserId(userId);
}
