export type DayAccent = {
  solid: string;
  deep: string;
  soft: string;
  border: string;
  text: string;
  glow: string;
};

const dayAccentPalette: DayAccent[] = [
  {
    solid: "#2563eb",
    deep: "#1d4ed8",
    soft: "rgba(219, 234, 254, 0.88)",
    border: "rgba(37, 99, 235, 0.24)",
    text: "#1d4ed8",
    glow: "rgba(37, 99, 235, 0.16)",
  },
  {
    solid: "#f97316",
    deep: "#ea580c",
    soft: "rgba(255, 237, 213, 0.9)",
    border: "rgba(249, 115, 22, 0.24)",
    text: "#c2410c",
    glow: "rgba(249, 115, 22, 0.18)",
  },
  {
    solid: "#10b981",
    deep: "#059669",
    soft: "rgba(209, 250, 229, 0.9)",
    border: "rgba(16, 185, 129, 0.24)",
    text: "#047857",
    glow: "rgba(16, 185, 129, 0.18)",
  },
  {
    solid: "#a855f7",
    deep: "#9333ea",
    soft: "rgba(243, 232, 255, 0.9)",
    border: "rgba(168, 85, 247, 0.24)",
    text: "#7e22ce",
    glow: "rgba(168, 85, 247, 0.18)",
  },
  {
    solid: "#ef4444",
    deep: "#dc2626",
    soft: "rgba(254, 226, 226, 0.9)",
    border: "rgba(239, 68, 68, 0.24)",
    text: "#b91c1c",
    glow: "rgba(239, 68, 68, 0.18)",
  },
  {
    solid: "#14b8a6",
    deep: "#0f766e",
    soft: "rgba(204, 251, 241, 0.9)",
    border: "rgba(20, 184, 166, 0.24)",
    text: "#0f766e",
    glow: "rgba(20, 184, 166, 0.18)",
  },
];

export function getDayAccent(dayNumber = 1) {
  const normalizedIndex = Math.max(0, Number(dayNumber || 1) - 1) % dayAccentPalette.length;
  return dayAccentPalette[normalizedIndex] ?? dayAccentPalette[0];
}
