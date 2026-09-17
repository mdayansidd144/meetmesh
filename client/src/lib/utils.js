// export function cn(...classes) {
//   return classes.filter(Boolean).join(" ");
// }
// const USERNAME_COLORS = [
//   "#ef4444",
//   "#ec4899",
//   "#8b5cf6",
//   "#3b82f6",
//   "#06b6d4",
//   "#14b8a6",
//   "#f59e0b",
//   "#f97316",
//   "#a3e635",
//   "#000000",
// ];
// export function colorForUsername(name) {
//   if (!name) return USERNAME_COLORS[3];
//   let hash = 0;
//   for (let i = 0; i < name.length; i++) {
//     hash = name.charCodeAt(i) + ((hash << 5) - hash);
//   }
//   const index = Math.abs(hash) % USERNAME_COLORS.length;
//   return USERNAME_COLORS[index];
// }
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const USERNAME_COLORS = [
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#3b82f6",
  "#06b6d4",
  "#14b8a6",
  "#f59e0b",
  "#f97316",
  "#a3e635",
  "#0ea5e9",
];

export function colorForUsername(name) {
  if (!name) return USERNAME_COLORS[3];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USERNAME_COLORS.length;
  return USERNAME_COLORS[index];
}