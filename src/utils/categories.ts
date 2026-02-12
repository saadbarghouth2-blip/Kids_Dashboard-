import type { PlaceCategory } from "../types";

export function categoryEmoji(c: PlaceCategory) {
  switch (c) {
    case "fresh": return "💧";
    case "salty": return "🌊";
    case "problem": return "⚠️";
    case "project": return "🏗️";
    case "mega": return "🚀";
    case "agri": return "🌿";
    case "transport": return "🚆";
    case "urban": return "🏙️";
    case "aquaculture": return "🐟";
    case "waterway": return "🚢";
    case "energy": return "⚡";
    case "renewable": return "☀️";
    case "mineral": return "⛏️";
    default: return "📍";
  }
}
