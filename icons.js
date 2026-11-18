// ALEX LAUNCHER - REALISTIC APPLICATION ICONS & ICON PACKS

let svgUidCounter = 0;

export const APP_CATALOG = [
  {
    name: "Phone",
    category: "Social",
    packageName: "com.android.dialer",
    webUrl: "tel:",
    accent: "#16c760",
    bg1: "#18d868",
    bg2: "#097a38"
  },
  {
    name: "Messages",
    category: "Social",
    packageName: "com.google.android.apps.messaging",
    webUrl: "sms:",
    accent: "#2e8bff",
    bg1: "#4ea3ff",
    bg2: "#1457d1"
  },
  {
    name: "Chrome",
    category: "Tools",
    packageName: "com.android.chrome",
    webUrl: "https://www.google.com",
    accent: "#4285f4",
    bg1: "#242c3e",
    bg2: "#111622"
  },
  {
    name: "Camera",
    category: "Media",
    packageName: "com.android.camera2",
    webUrl: null,
    accent: "#a855f7",
    bg1: "#2e323d",
    bg2: "#111319"
  },
  {
    name: "YouTube",
    category: "Media",
    packageName: "com.google.android.youtube",
    webUrl: "https://www.youtube.com",
    accent: "#ff2e43",
    bg1: "#ff3347",
    bg2: "#b80d22"
  },
  {
    name: "Gallery",
    category: "Media",
    packageName: "com.android.gallery3d",
    webUrl: null,
    accent: "#ff8a3d",
    bg1: "#ff9e44",
    bg2: "#d63e6c"
  },
  {
    name: "Photos",
    category: "Media",
    packageName: "com.google.android.apps.photos",
    webUrl: "https://photos.google.com",
    accent: "#f59e0b",
    bg1: "#252936",
    bg2: "#11141c"
  },
  {
    name: "Music",
    category: "Media",
    packageName: "com.google.android.apps.youtube.music",
    webUrl: null,
    accent: "#d000ff",
    bg1: "#b324ff",
    bg2: "#4d0099"
  },
  {
    name: "Calendar",
    category: "Productivity",
    packageName: "com.google.android.calendar",
    webUrl: "https://calendar.google.com",
    accent: "#3b82f6",
    bg1: "#3b82f6",
    bg2: "#1d4ed8"
  },
  {
    name: "Clock",
    category: "Tools",
    packageName: "com.google.android.deskclock",
    webUrl: null,
    accent: "#60a5fa",
    bg1: "#2563eb",
    bg2: "#10286b"
  },
  {
    name: "Calculator",
    category: "Tools",
    packageName: "com.google.android.calculator",
    webUrl: null,
    accent: "#14b8a6",
    bg1: "#1f2937",
    bg2: "#0b111a"
  },
  {
    name: "Contacts",
    category: "Social",
    packageName: "com.google.android.contacts",
    webUrl: "https://contacts.google.com",
    accent: "#38bdf8",
    bg1: "#0284c7",
    bg2: "#0c4a6e"
  },
  {
    name: "Drive",
    category: "Productivity",
    packageName: "com.google.android.apps.docs",
    webUrl: "https://drive.google.com",
    accent: "#22c55e",
    bg1: "#1f2937",
    bg2: "#111827"
  },
  {
    name: "Files",
    category: "Tools",
    packageName: "com.google.android.apps.nbu.files",
    webUrl: null,
    accent: "#3b82f6",
    bg1: "#2563eb",
    bg2: "#1e3a8a"
  },
  {
    name: "Gmail",
    category: "Productivity",
    packageName: "com.google.android.gm",
    webUrl: "mailto:",
    accent: "#ef4444",
    bg1: "#2b2530",
    bg2: "#141118"
  },
  {
    name: "Google",
    category: "Tools",
    packageName: "com.google.android.googlequicksearchbox",
    webUrl: "https://www.google.com",
    accent: "#60a5fa",
    bg1: "#1f2430",
    bg2: "#0e1118"
  },
  {
    name: "Maps",
    category: "Tools",
    packageName: "com.google.android.apps.maps",
    webUrl: "https://maps.google.com",
    accent: "#22c55e",
    bg1: "#25303b",
    bg2: "#10171e"
  },
  {
    name: "Play Store",
    category: "Tools",
    packageName: "com.android.vending",
    webUrl: "https://play.google.com/store",
    accent: "#06b6d4",
    bg1: "#1e293b",
    bg2: "#0b1120"
  },
  {
    name: "Settings",
    category: "Tools",
    packageName: "com.android.settings",
    webUrl: "./settings.html",
    accent: "#94a3b8",
    bg1: "#3f4656",
    bg2: "#161922"
  },
  {
    name: "WhatsApp",
    category: "Social",
    packageName: "com.whatsapp",
    webUrl: "https://web.whatsapp.com",
    accent: "#25d366",
    bg1: "#25d366",
    bg2: "#0f8a3d"
  },
  {
    name: "Weather",
    category: "Tools",
    packageName: "com.google.android.apps.weather",
    webUrl: null,
    accent: "#38bdf8",
    bg1: "#0284c7",
    bg2: "#0f172a"
  },
  {
    name: "Notes",
    category: "Productivity",
    packageName: "com.google.android.keep",
    webUrl: "https://keep.google.com",
    accent: "#facc15",
    bg1: "#eab308",
    bg2: "#854d0e"
  },
  {
    name: "Books",
    category: "Education",
    packageName: "com.google.android.apps.books",
    webUrl: "https://books.google.com",
    accent: "#38bdf8",
    bg1: "#0ea5e9",
    bg2: "#0369a1"
  },
  {
    name: "Arcade",
    category: "Games",
    packageName: "com.google.android.play.games",
    webUrl: null,
    accent: "#a855f7",
    bg1: "#9333ea",
    bg2: "#4c1d95"
  }
];

export const ICON_PACKS = {
  vivid: { id: "vivid", name: "Vivid Android", desc: "Realistic full-color icons" },
  neon: { id: "neon", name: "Cyber Neon Glass", desc: "Luminous AMOLED glyphs" },
  minimal: { id: "minimal", name: "Monochrome Slate", desc: "Minimal silver geometry" },
  material: { id: "material", name: "Material You", desc: "Tonal adaptive palette" }
};

function getAppGlyphMarkup(baseName, uid, pack) {
  const isMono = pack === "neon" || pack === "minimal";
  const fg = isMono ? "currentColor" : "#ffffff";

  switch (baseName) {
    case "Phone":
      return `<path d="M16.2 11.4c.6-.6 1.6-.6 2.2 0l3.1 3.1c.6.6.6 1.5.1 2.1l-1.9 2.3a13.6 13.6 0 0 0 8.4 8.4l2.3-1.9c.6-.5 1.5-.5 2.1.1l3.1 3.1c.6.6.6 1.6 0 2.2l-1.9 1.9c-1.4 1.4-3.5 1.9-5.4 1.2-7.4-2.8-13.4-8.8-16.2-16.2-.7-1.9-.2-4 1.2-5.4l1.9-1.9Z" fill="${fg}"/>`;
    case "Messages":
      return `<path d="M11 14.5A4.5 4.5 0 0 1 15.5 10h17A4.5 4.5 0 0 1 37 14.5v13A4.5 4.5 0 0 1 32.5 32H21l-6.6 5.1c-.7.5-1.6 0-1.6-.8V32.1A4.5 4.5 0 0 1 11 27.5v-13Z" fill="${fg}" fill-opacity="${isMono ? "0.2" : "0.95"}" stroke="${fg}" stroke-width="2"/><circle cx="19" cy="21" r="1.8" fill="${isMono ? fg : "#1457d1"}"/><circle cx="24" cy="21" r="1.8" fill="${isMono ? fg : "#1457d1"}"/><circle cx="29" cy="21" r="1.8" fill="${isMono ? fg : "#1457d1"}"/>`;
    case "Chrome":
      if (isMono) {
        return `<circle cx="24" cy="24" r="12" fill="none" stroke="${fg}" stroke-width="2.4"/><circle cx="24" cy="24" r="4.8" fill="${fg}"/><path d="M24 12h11M18.8 27l-5.5-9.5M29.2 27l-5.5 9.5" stroke="${fg}" stroke-width="2.2" stroke-linecap="round"/>`;
      }
      return `<circle cx="24" cy="24" r="13" fill="#fbbc05"/><path d="M24 11a13 13 0 0 1 11.4 6.7H24l-5.6 9.6-6.2-10.7A13 13 0 0 1 24 11Z" fill="#ea4335"/><path d="M12.2 16.6A13 13 0 0 0 23.2 37l5.8-10H24l-5.6-9.6-6.2-.8Z" fill="#34a853"/><circle cx="24" cy="24" r="6.2" fill="#ffffff"/><circle cx="24" cy="24" r="4.6" fill="#4285f4"/>`;
    case "Camera":
      return `<rect x="10" y="15" width="28" height="20" rx="5" fill="${isMono ? "none" : "#222631"}" stroke="${fg}" stroke-width="2.1"/><path d="M18 15l2-3h8l2 3" fill="none" stroke="${fg}" stroke-width="2.1" stroke-linejoin="round"/><circle cx="24" cy="25" r="6.5" fill="${isMono ? "none" : "#0b0e14"}" stroke="${fg}" stroke-width="2.1"/><circle cx="24" cy="25" r="3" fill="${isMono ? fg : "#a855f7"}"/><circle cx="33" cy="19.5" r="1.3" fill="${isMono ? fg : "#38bdf8"}"/>`;
    case "YouTube":
      return `<rect x="9" y="14" width="30" height="20" rx="6" fill="${isMono ? "none" : "#ffffff"}" stroke="${fg}" stroke-width="2"/><path d="M21 19.5l9 4.5-9 4.5v-9Z" fill="${isMono ? fg : "#dc2626"}"/>`;
    case "Gallery":
      return `<rect x="10" y="12" width="28" height="24" rx="5" fill="${isMono ? "none" : "rgba(255,255,255,0.18)"}" stroke="${fg}" stroke-width="2"/><circle cx="18.5" cy="19.5" r="2.6" fill="${isMono ? fg : "#fde047"}"/><path d="M12.5 33l8-8.5 5 5.2 4-4.2 6 7.5h-23Z" fill="${fg}" fill-opacity="0.9"/>`;
    case "Photos":
      if (isMono) {
        return `<path d="M24 11a6.5 6.5 0 0 1 6.5 6.5V24H24V11ZM37 24a6.5 6.5 0 0 1-6.5 6.5H24V24h13ZM24 37a6.5 6.5 0 0 1-6.5-6.5V24H24v13ZM11 24a6.5 6.5 0 0 1 6.5-6.5H24V24H11Z" fill="none" stroke="${fg}" stroke-width="2"/>`;
      }
      return `<path d="M24 10.5c3.8 0 6.8 3 6.8 6.8V24H24V10.5Z" fill="#fbbc05"/><path d="M37.5 24c0 3.8-3 6.8-6.8 6.8H24V24h13.5Z" fill="#4285f4"/><path d="M24 37.5c-3.8 0-6.8-3-6.8-6.8V24H24v13.5Z" fill="#34a853"/><path d="M10.5 24c0-3.8 3-6.8 6.8-6.8H24V24H10.5Z" fill="#ea4335"/>`;
    case "Music":
      return `<circle cx="24" cy="24" r="12.5" fill="none" stroke="${fg}" stroke-width="2" stroke-opacity="0.55"/><path d="M21 29.5V17.2l11-2.4v12.2" fill="none" stroke="${fg}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="18.2" cy="29.8" r="3.2" fill="${fg}"/><circle cx="29.2" cy="27.4" r="3.2" fill="${fg}"/>`;
    case "Calendar": {
      const todayNum = new Date().getDate();
      return `<rect x="11" y="13" width="26" height="24" rx="5" fill="${isMono ? "none" : "#ffffff"}" stroke="${fg}" stroke-width="2"/><path d="M11 19h26" stroke="${isMono ? fg : "#2563eb"}" stroke-width="2.2"/><path d="M18 10v5M30 10v5" stroke="${fg}" stroke-width="2.4" stroke-linecap="round"/><text x="24" y="31.5" text-anchor="middle" font-size="11.5" font-weight="800" font-family="system-ui,sans-serif" fill="${isMono ? fg : "#1e3a8a"}">${todayNum}</text>`;
    }
    case "Clock":
      return `<circle cx="24" cy="24" r="12.5" fill="${isMono ? "none" : "rgba(255,255,255,0.16)"}" stroke="${fg}" stroke-width="2.2"/><path d="M24 16v8l5.5 3.5" fill="none" stroke="${fg}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="24" cy="24" r="1.8" fill="${fg}"/>`;
    case "Calculator":
      return `<rect x="12" y="10" width="24" height="28" rx="4.5" fill="none" stroke="${fg}" stroke-width="2"/><rect x="15.5" y="14" width="17" height="5.5" rx="1.5" fill="${isMono ? fg : "#14b8a6"}" fill-opacity="0.85"/><circle cx="17.5" cy="24.5" r="1.6" fill="${fg}"/><circle cx="24" cy="24.5" r="1.6" fill="${fg}"/><circle cx="30.5" cy="24.5" r="1.6" fill="${isMono ? fg : "#f59e0b"}"/><circle cx="17.5" cy="30.5" r="1.6" fill="${fg}"/><circle cx="24" cy="30.5" r="1.6" fill="${fg}"/><circle cx="30.5" cy="30.5" r="1.6" fill="${isMono ? fg : "#f59e0b"}"/>`;
    case "Contacts":
      return `<circle cx="24" cy="18.5" r="5" fill="${fg}"/><path d="M13.5 34.5c0-4.8 4.7-8 10.5-8s10.5 3.2 10.5 8" fill="none" stroke="${fg}" stroke-width="2.6" stroke-linecap="round"/>`;
    case "Drive":
      if (isMono) {
        return `<path d="M24 12l10 17.5-4.8 7.5H18.8L14 29.5 24 12Z" fill="none" stroke="${fg}" stroke-width="2.2" stroke-linejoin="round"/><path d="M14 29.5h20" stroke="${fg}" stroke-width="2"/>`;
      }
      return `<path d="M19 13h10l8.5 14.8-5 8.2H24l4.5-8.2L19 13Z" fill="#fbbc05"/><path d="M19 13l-8.5 14.8 5 8.2L24 21.2 19 13Z" fill="#34a853"/><path d="M15.5 36h17l5-8.2h-17l-5 8.2Z" fill="#4285f4"/>`;
    case "Files":
      return `<path d="M11 16a3.5 3.5 0 0 1 3.5-3.5h6.2l2.8 3H33.5A3.5 3.5 0 0 1 37 19v13.5A3.5 3.5 0 0 1 33.5 36h-19A3.5 3.5 0 0 1 11 32.5V16Z" fill="${isMono ? "none" : "#60a5fa"}" stroke="${fg}" stroke-width="2"/><path d="M11 21h26" stroke="${fg}" stroke-width="1.8" stroke-opacity="0.7"/>`;
    case "Gmail":
      return `<rect x="10" y="14" width="28" height="20" rx="3.5" fill="${isMono ? "none" : "#ffffff"}" stroke="${fg}" stroke-width="2"/><path d="M11 16.5l13 9.5 13-9.5" fill="none" stroke="${isMono ? fg : "#ea4335"}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    case "Google":
      if (isMono) {
        return `<path d="M35.2 24.3c0-.8-.1-1.6-.2-2.3H24v4.6h6.4c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.3-5.2 3.3-8.9Z" fill="${fg}"/><path d="M24 35.8c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1c2 4 6.1 6.5 10.6 6.5Z" fill="${fg}" fill-opacity="0.8"/><path d="M17.4 26.2a7 7 0 0 1 0-4.4v-3.1h-4a11.8 11.8 0 0 0 0 10.6l4-3.1Z" fill="${fg}" fill-opacity="0.65"/><path d="M24 16.9c1.7 0 3.3.6 4.5 1.8l3.4-3.4C29.9 13.4 27.2 12.2 24 12.2c-4.5 0-8.6 2.5-10.6 6.5l4 3.1c.9-2.8 3.5-4.9 6.6-4.9Z" fill="${fg}"/>`;
      }
      return `<path d="M35.4 24.3c0-.8-.1-1.6-.2-2.3H24v4.6h6.4c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z" fill="#4285f4"/><path d="M24 35.8c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1c2 4 6.1 6.5 10.6 6.5Z" fill="#34a853"/><path d="M17.4 26.2a7 7 0 0 1 0-4.4v-3.1h-4a11.8 11.8 0 0 0 0 10.6l4-3.1Z" fill="#fbbc05"/><path d="M24 16.9c1.7 0 3.3.6 4.5 1.8l3.4-3.4C29.9 13.4 27.2 12.2 24 12.2c-4.5 0-8.6 2.5-10.6 6.5l4 3.1c.9-2.8 3.5-4.9 6.6-4.9Z" fill="#ea4335"/>`;
    case "Maps":
      return `<path d="M24 10.5c-5 0-9 4-9 9 0 6.5 9 17.5 9 17.5s9-11 9-17.5c0-5-4-9-9-9Z" fill="${isMono ? "none" : "#ea4335"}" stroke="${fg}" stroke-width="2"/><circle cx="24" cy="19.5" r="3.4" fill="${isMono ? fg : "#ffffff"}"/>`;
    case "Play Store":
      if (isMono) {
        return `<path d="M15 12.5l19.5 11.5L15 35.5V12.5Z" fill="none" stroke="${fg}" stroke-width="2.2" stroke-linejoin="round"/><path d="M15.5 13l12.5 11-12.5 11" fill="none" stroke="${fg}" stroke-width="1.6"/>`;
      }
      return `<path d="M15 12.5l13.5 11.5L15 35.5V12.5Z" fill="#34a853"/><path d="M15 12.5l19.5 11.5-6 3.5-13.5-15Z" fill="#4285f4"/><path d="M28.5 24l6-3.5-6 11.5-13.5 3.5L28.5 24Z" fill="#fbbc05"/><path d="M15 35.5l13.5-11.5 6 3.5L15 35.5Z" fill="#ea4335" fill-opacity="0.85"/>`;
    case "Settings":
      return `<path d="M24 17.2a6.8 6.8 0 1 0 0 13.6 6.8 6.8 0 0 0 0-13.6Z" fill="none" stroke="${fg}" stroke-width="2.4"/><path d="M24 10v3.2M24 34.8V38M10 24h3.2M34.8 24H38M14.1 14.1l2.3 2.3M31.6 31.6l2.3 2.3M33.9 14.1l-2.3 2.3M16.4 31.6l-2.3 2.3" stroke="${fg}" stroke-width="2.8" stroke-linecap="round"/>`;
    case "WhatsApp":
      return `<path d="M24 11.5a12.2 12.2 0 0 0-10.6 18.2l-1.4 5.3 5.5-1.4A12.2 12.2 0 1 0 24 11.5Z" fill="none" stroke="${fg}" stroke-width="2.2" stroke-linejoin="round"/><path d="M19.8 18.8c-.4-.7-.8-.7-1.2-.7h-.8c-.3 0-.8.2-1.2.6-.4.5-1.5 1.4-1.5 3.5 0 2 1.5 4 1.7 4.3.2.3 2.9 4.5 7.2 6.2 3.5 1.4 4.2 1.1 5 1 .8-.1 2.5-1 2.8-2 .4-1 .4-1.8.3-2-.1-.2-.4-.3-.9-.5-.5-.2-2.5-1.2-2.9-1.4-.4-.1-.7-.2-1 .2-.3.4-1.1 1.4-1.3 1.7-.2.3-.5.3-1 .1-.5-.2-2-.7-3.8-2.3-1.4-1.2-2.3-2.7-2.6-3.2-.3-.5 0-.7.2-1 .2-.2.5-.6.7-.9.2-.3.3-.5.5-.8.1-.3 0-.6-.1-.9-.1-.2-.9-2.2-1.3-3Z" fill="${fg}"/>`;
    case "Weather":
      return `<circle cx="20" cy="20" r="5.5" fill="${isMono ? "none" : "#facc15"}" stroke="${fg}" stroke-width="2"/><path d="M17.5 32.5h13a5.5 5.5 0 0 0 .8-10.9 7.2 7.2 0 0 0-13.9-1.5A5.2 5.2 0 0 0 17.5 32.5Z" fill="${isMono ? "none" : "#e2e8f0"}" stroke="${fg}" stroke-width="2"/>`;
    case "Notes":
      return `<rect x="12" y="11" width="24" height="26" rx="4" fill="${isMono ? "none" : "rgba(255,255,255,0.16)"}" stroke="${fg}" stroke-width="2"/><path d="M17 19h14M17 24h14M17 29h9" stroke="${fg}" stroke-width="2.2" stroke-linecap="round"/>`;
    case "Books":
      return `<path d="M12 14c4 0 8 1.4 12 3.6 4-2.2 8-3.6 12-3.6v20c-4 0-8 1.3-12 3.4-4-2.1-8-3.4-12-3.4V14Z" fill="none" stroke="${fg}" stroke-width="2.2" stroke-linejoin="round"/><path d="M24 17.6v19.8" stroke="${fg}" stroke-width="2"/>`;
    case "Arcade":
      return `<rect x="10" y="16" width="28" height="16" rx="8" fill="none" stroke="${fg}" stroke-width="2.2"/><path d="M17 21v6M14 24h6" stroke="${fg}" stroke-width="2.2" stroke-linecap="round"/><circle cx="29" cy="22" r="1.4" fill="${fg}"/><circle cx="32.5" cy="25.5" r="1.4" fill="${fg}"/>`;
    default: {
      const letter = (baseName || "A").charAt(0).toUpperCase();
      return `<circle cx="24" cy="24" r="12" fill="none" stroke="${fg}" stroke-width="2" stroke-opacity="0.45"/><text x="24" y="29" text-anchor="middle" font-size="16" font-weight="700" font-family="system-ui,sans-serif" fill="${fg}">${letter}</text>`;
    }
  }
}

export function getAppCatalogEntry(baseName) {
  return (
    APP_CATALOG.find(item => item.name === baseName) || {
      name: baseName,
      category: "Tools",
      packageName: "",
      webUrl: null,
      accent: "#a100ff",
      bg1: "#28003f",
      bg2: "#100018"
    }
  );
}

export function createAppIconMarkup(baseName, customIconOverride = "", packOverride = null) {
  const trimmedCustom = (customIconOverride || "").trim();
  if (trimmedCustom) {
    if (
      trimmedCustom.startsWith("data:image/") ||
      trimmedCustom.startsWith("blob:") ||
      trimmedCustom.startsWith("https://")
    ) {
      const img = document.createElement("img");
      img.src = trimmedCustom;
      img.alt = baseName || "App icon";
      img.className = "custom-imported-icon";
      return img;
    }
    const span = document.createElement("span");
    span.className = "custom-glyph-icon";
    span.textContent = trimmedCustom;
    return span;
  }

  const pack =
    packOverride || localStorage.getItem("alex-icon-pack") || "vivid";
  const entry = getAppCatalogEntry(baseName);
  const uid = `alex_ico_${++svgUidCounter}`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 48 48");
  svg.setAttribute("class", `app-svg-icon pack-${pack}`);
  svg.setAttribute("aria-hidden", "true");

  let bgMarkup = "";
  if (pack === "vivid") {
    bgMarkup = `<defs><linearGradient id="${uid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${entry.bg1}"/><stop offset="100%" stop-color="${entry.bg2}"/></linearGradient></defs><rect x="0" y="0" width="48" height="48" fill="url(#${uid})"/><rect x="0" y="0" width="48" height="22" fill="#ffffff" fill-opacity="0.08"/>`;
  } else if (pack === "material") {
    bgMarkup = `<rect x="0" y="0" width="48" height="48" fill="${entry.bg2}" fill-opacity="0.55"/><circle cx="24" cy="24" r="22" fill="${entry.accent}" fill-opacity="0.22"/>`;
  } else if (pack === "neon") {
    bgMarkup = `<rect x="0" y="0" width="48" height="48" fill="rgba(10, 0, 20, 0.45)"/>`;
  } else {
    bgMarkup = `<rect x="0" y="0" width="48" height="48" fill="rgba(255, 255, 255, 0.04)"/>`;
  }

  svg.innerHTML = bgMarkup + getAppGlyphMarkup(baseName, uid, pack);
  return svg;
}

export function renderAppIconInto(container, baseName, customIconOverride = "", packOverride = null) {
  if (!container) return;
  container.innerHTML = "";
  container.appendChild(
    createAppIconMarkup(baseName, customIconOverride, packOverride)
  );
}
