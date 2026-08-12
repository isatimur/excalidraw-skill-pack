// Hydration mints fresh ids/seeds/`updated` every run. Derive them from a key
// so rebuilds only diff when the diagram actually changed.
const ID_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
const FIXED_UPDATED = Date.UTC(2026, 0, 1);

function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stabilize(key, document) {
  const rand = mulberry32(fnv1a(key));
  const randInt = () => Math.floor(rand() * 2147483648);
  const ids = new Map();
  const idFor = (id) => {
    if (typeof id !== "string") return id;
    if (!ids.has(id)) {
      ids.set(
        id,
        Array.from({ length: 21 }, () => ID_ALPHABET[Math.floor(rand() * ID_ALPHABET.length)]).join("")
      );
    }
    return ids.get(id);
  };

  for (const el of document.elements) idFor(el.id);

  for (const el of document.elements) {
    el.id = idFor(el.id);
    el.seed = randInt();
    el.versionNonce = randInt();
    el.updated = FIXED_UPDATED;
    if (el.containerId) el.containerId = idFor(el.containerId);
    if (el.frameId) el.frameId = idFor(el.frameId);
    if (Array.isArray(el.groupIds)) el.groupIds = el.groupIds.map(idFor);
    if (Array.isArray(el.boundElements)) {
      el.boundElements = el.boundElements.map((bound) => ({ ...bound, id: idFor(bound.id) }));
    }
    for (const bindKey of ["startBinding", "endBinding"]) {
      if (el[bindKey]?.elementId) el[bindKey] = { ...el[bindKey], elementId: idFor(el[bindKey].elementId) };
    }
  }
  return document;
}
