/** Fisher-Yates: shuffle a copy, with an injectable RNG for deterministic tests. */
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
/** Randomize house groups once per ballot session while preserving each house roster. */
export function orderCandidates(candidates, random = Math.random) {
  const groups = new Map();
  for (const candidate of candidates) {
    if (!groups.has(candidate.house)) groups.set(candidate.house, []);
    groups.get(candidate.house).push(candidate);
  }
  return shuffle([...groups.values()], random).flat();
}
export function createBallot(candidates, config) {
  const valid = new Set(candidates.map((c) => c.id));
  if (
    valid.size !== candidates.length ||
    !Number.isInteger(config.leaderCount) ||
    config.leaderCount < 1 ||
    !Number.isInteger(config.representativeCount) ||
    config.representativeCount < 1 ||
    valid.size < config.leaderCount + config.representativeCount
  )
    throw new Error("Invalid election configuration.");
  const leaders = new Set(),
    representatives = new Set();
  return {
    selections(role) {
      return [...(role === "leaders" ? leaders : representatives)];
    },
    toggle(role, id) {
      if (!["leaders", "representatives"].includes(role) || !valid.has(id))
        throw new Error("Unknown candidate or ballot section.");
      const selected = role === "leaders" ? leaders : representatives;
      const limit =
        role === "leaders" ? config.leaderCount : config.representativeCount;
      if (selected.has(id)) {
        selected.delete(id);
        return;
      }
      if (role === "representatives" && leaders.has(id))
        throw new Error("Already selected for leadership.");
      if (selected.size >= limit)
        throw new Error(
          `Choose up to ${limit}. Deselect someone before changing your choice.`,
        );
      selected.add(id);
      if (role === "leaders") representatives.delete(id);
    },
    complete(role) {
      return (
        (role === "leaders" ? leaders.size : representatives.size) ===
        (role === "leaders" ? config.leaderCount : config.representativeCount)
      );
    },
    payload() {
      if (
        leaders.size !== config.leaderCount ||
        representatives.size !== config.representativeCount
      )
        throw new Error("Complete both sections before submitting.");
      return {
        leaders: Object.fromEntries([...leaders].map((id) => [id, true])),
        representatives: Object.fromEntries(
          [...representatives].map((id) => [id, true]),
        ),
      };
    },
  };
}
