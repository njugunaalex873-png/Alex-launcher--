import {
  APP_CATALOG,
  getAppCatalogEntry,
  renderAppIconInto,
  registerInstalledApps,
  getRegisteredAppCatalog
} from "./icons.js";
import {
  getRuntimeCapabilities,
  getNativeInstalledApps,
  getNativeNotifications,
  getNativeRecentTasks,
  searchNativeContacts,
  requestNativeLockScreen,
  requestNativeBiometric,
  verifyLauncherSecret,
  triggerHaptic,
  launchAndroidOrWebApp,
  fetchWeatherForCoordinates,
  fetchWeatherForCity,
  getCachedWeather,
  LauncherAudioEngine
} from "./android-bridge.js";

const THEME_META_COLORS = {
  purple: "#050008",
  cyber: "#020611",
  crimson: "#0a0003",
  gold: "#090700",
  ice: "#00080d",
  emerald: "#000904",
  black: "#000000"
};

const ANIMATION_SPEEDS = {
  fast: "0.15s",
  normal: "0.28s",
  slow: "0.55s"
};

const DEFAULT_WHEEL_SLOTS = [
  "Camera",
  "Settings",
  "__drawer__",
  "Contacts",
  "Phone",
  "Gallery"
];

const DEFAULT_FAVOURITES = ["YouTube", "Messages", "Chrome", "Camera"];
const DEFAULT_SIDEBAR_APPS = ["Camera", "Messages", "Chrome", "Music", "Notes"];
const DEFAULT_WIDGET_ORDER = ["weather", "music", "calendar", "battery"];

let activeCategory = "All";
let expandedLibraryCategory = null;
let manageAppsMode = false;
let toastTimer = null;
let wheelRotationDeg = 0;
let wheelOpen = true;
let wheelDragging = false;
let wheelAmbientFrame = null;
let particleFrame = null;
let chargingOverlayTimer = null;
let pendingUnlockCallback = null;

const audioEngine = new LauncherAudioEngine();

function showToast(message) {
  const toast = document.getElementById("launcher-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("visible");
  }, 2400);
}

function loadJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function hexToRgbTuple(hex) {
  const clean = (hex || "").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return "26, 8, 44";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function applyDynamicCustomThemeVars(themeObj, root) {
  const vars = [
    "--purple", "--neon", "--background", "--bg-radial-1", "--bg-radial-2",
    "--clock-grad-mid", "--clock-grad-end", "--glow-soft", "--glow-mid",
    "--glow-deep", "--pill-border", "--pill-active-bg", "--icon-border",
    "--icon-shadow", "--heading-accent", "--alpha-text", "--glass-tint"
  ];
  if (!themeObj) {
    vars.forEach(v => root.style.removeProperty(v));
    return;
  }
  const rgbAccent = hexToRgbTuple(themeObj.accent || "#b400ff");
  const rgbBg = hexToRgbTuple(themeObj.bg || "#050008");
  root.style.setProperty("--purple", themeObj.accent || "#b400ff");
  root.style.setProperty("--neon", themeObj.accent || "#b400ff");
  root.style.setProperty("--background", themeObj.bg || "#050008");
  root.style.setProperty("--bg-radial-1", `rgba(${rgbAccent}, 0.28)`);
  root.style.setProperty("--bg-radial-2", `rgba(${rgbAccent}, 0.18)`);
  root.style.setProperty("--clock-grad-mid", themeObj.accent || "#b400ff");
  root.style.setProperty("--clock-grad-end", themeObj.bg || "#050008");
  root.style.setProperty("--glow-soft", `rgba(${rgbAccent}, 0.38)`);
  root.style.setProperty("--glow-mid", `rgba(${rgbAccent}, 0.28)`);
  root.style.setProperty("--glow-deep", `rgba(${rgbAccent}, 0.20)`);
  root.style.setProperty("--pill-border", themeObj.accent || "#b400ff");
  root.style.setProperty("--pill-active-bg", `rgba(${rgbAccent}, 0.72)`);
  root.style.setProperty("--icon-border", themeObj.accent || "#b400ff");
  root.style.setProperty("--icon-shadow", `rgba(${rgbAccent}, 0.45)`);
  root.style.setProperty("--heading-accent", themeObj.accent || "#d8a4ff");
  root.style.setProperty("--alpha-text", themeObj.accent || "#d59bff");
  root.style.setProperty("--glass-tint", rgbBg);
}

function loadCustomAppsMap() {
  const parsed = loadJsonStorage("alex-custom-apps", {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function loadFavouriteNames() {
  const saved = loadJsonStorage("alex-favourites", null);
  const list = Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_FAVOURITES;
  return list.slice(0, 6);
}

function saveFavouriteNames(list) {
  localStorage.setItem("alex-favourites", JSON.stringify(list));
}

function loadWheelSlots() {
  const saved = loadJsonStorage("alex-wheel-slots", null);
  return Array.isArray(saved) && saved.length > 0 ? saved : [...DEFAULT_WHEEL_SLOTS];
}

function isPrivateModeActive() {
  return localStorage.getItem("alex-private-mode") === "true";
}

function getEffectiveApps(includeHidden = false) {
  const customMap = loadCustomAppsMap();
  const favSet = new Set(loadFavouriteNames());
  const privateSet = new Set(loadJsonStorage("alex-private-apps", []));
  const privateMode = isPrivateModeActive();
  const nativeResult = getNativeInstalledApps();

  if (nativeResult.apps && nativeResult.apps.length > 0) {
    registerInstalledApps(nativeResult.apps);
  }

  const sourceList =
    nativeResult.apps && nativeResult.apps.length > 0
      ? nativeResult.apps.map(item => ({
          name: item.name || item.label || "App",
          category: item.category || "Tools",
          packageName: item.packageName || "",
          webUrl: item.webUrl || null,
          nativeIconUrl: item.icon || item.nativeIconUrl || ""
        }))
      : getRegisteredAppCatalog();

  return sourceList
    .map(app => {
      const custom = customMap[app.name];
      const isPrivate = privateSet.has(app.name);
      const catalogEntry = getAppCatalogEntry(app.name);
      return {
        ...app,
        baseName: app.name,
        name: custom?.name || app.name,
        packageName: app.packageName || catalogEntry.packageName || "",
        nativeIconUrl: app.nativeIconUrl || catalogEntry.nativeIconUrl || "",
        customGlyph: custom?.icon || app.nativeIconUrl || catalogEntry.nativeIconUrl || "",
        color: custom?.color || "",
        hidden: custom?.hidden === true,
        isFavourite: favSet.has(app.name),
        isPrivate,
        source: nativeResult.source
      };
    })
    .filter(app => {
      if (!includeHidden && app.hidden) return false;
      if (privateMode && privateSet.size > 0) return app.isPrivate;
      return !privateMode && privateSet.has(app.baseName) ? false : true;
    });
}

// NOTIFICATION BADGES HELPER (HONEST NATIVE COUNTS ONLY)
function getNotificationCountMap() {
  const badgesOn = localStorage.getItem("alex-setting-notif-badges") !== "false";
  const consentOn = localStorage.getItem("alex-setting-notif-consent") !== "false";
  if (!badgesOn || !consentOn) return new Map();

  const res = getNativeNotifications();
  if (!res.supported || !Array.isArray(res.items)) return new Map();

  const muted = new Set(loadJsonStorage("alex-notif-muted-apps", []));
  const counts = new Map();
  res.items.forEach(item => {
    const appKey = item.app || item.packageName || "";
    if (!appKey || muted.has(appKey)) return;
    counts.set(appKey, (counts.get(appKey) || 0) + (item.count || 1));
  });
  return counts;
}

function attachBadgeIfAny(containerEl, baseName, countMap) {
  if (!containerEl || !baseName) return;
  containerEl.querySelectorAll(".app-notif-badge").forEach(b => b.remove());
  const count = countMap.get(baseName) || 0;
  if (count <= 0) return;
  const badge = document.createElement("span");
  badge.className = "app-notif-badge";
  badge.textContent = count > 99 ? "99+" : String(count);
  badge.setAttribute("aria-label", `${count} notifications`);
  containerEl.appendChild(badge);
}

// APPLY SAVED SETTINGS TO HOME SCREEN & APP DRAWER
function applyLauncherSettings() {
  const root = document.documentElement;
  const savedTheme = localStorage.getItem("alex-theme") || "purple";

  if (savedTheme.startsWith("custom:")) {
    const customId = savedTheme.slice(7);
    const list = loadJsonStorage("alex-custom-themes", []);
    const found = Array.isArray(list) ? list.find(t => t.id === customId) : null;
    if (found) {
      root.dataset.theme = "custom";
      applyDynamicCustomThemeVars(found, root);
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta) themeMeta.setAttribute("content", found.bg || "#050008");
    } else {
      root.dataset.theme = "purple";
      applyDynamicCustomThemeVars(null, root);
    }
  } else {
    root.dataset.theme = savedTheme;
    applyDynamicCustomThemeVars(null, root);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta && THEME_META_COLORS[savedTheme]) {
      themeMeta.setAttribute("content", THEME_META_COLORS[savedTheme]);
    }
  }

  const savedFont = localStorage.getItem("alex-font");
  const fontFamily = savedFont ? `"${savedFont}", Arial, sans-serif` : '"Poppins", Arial, sans-serif';
  root.style.setProperty("--launcher-font-family", fontFamily);
  if (document.body) document.body.style.fontFamily = savedFont ? fontFamily : "";

  root.style.setProperty("--launcher-font-size", (localStorage.getItem("alex-font-size") || "15") + "px");
  root.style.setProperty("--home-icon-size", (localStorage.getItem("alex-setting-home-icon-size") || "46") + "px");
  root.style.setProperty("--wheel-size", (localStorage.getItem("alex-setting-wheel-size") || "270") + "px");
  root.dataset.wheelStyle = localStorage.getItem("alex-setting-wheel-style") || "classic";
  root.dataset.wheelOpen = wheelOpen ? "true" : "false";

  const customWheelColor = localStorage.getItem("alex-setting-wheel-color");
  if (customWheelColor) root.style.setProperty("--wheel-accent", customWheelColor);
  else root.style.removeProperty("--wheel-accent");

  root.dataset.dockCount = localStorage.getItem("alex-setting-dock-count") || "5";
  root.dataset.drawerLayout = localStorage.getItem("alex-setting-drawer-layout") || "grid";
  root.style.setProperty("--drawer-columns", localStorage.getItem("alex-setting-drawer-columns") || "4");
  root.style.setProperty("--drawer-icon-size", (localStorage.getItem("alex-setting-drawer-icon-size") || "48") + "px");
  root.dataset.searchStyle = localStorage.getItem("alex-setting-search-style") || "rounded";

  const animSpeed = localStorage.getItem("alex-setting-animation-speed") || "normal";
  root.dataset.animationSpeed = animSpeed;
  root.style.setProperty("--anim-speed", ANIMATION_SPEEDS[animSpeed] || "0.28s");

  const perfMode = localStorage.getItem("alex-setting-performance-mode") || "standard";
  root.dataset.performanceMode = perfMode;
  root.dataset.reduceMotion = localStorage.getItem("alex-setting-reduce-motion") === "true" ? "true" : "false";

  const glassMode = localStorage.getItem("alex-setting-glass-mode") !== "false";
  root.dataset.glassMode = glassMode ? "true" : "false";
  root.style.setProperty("--glass-blur", `${localStorage.getItem("alex-setting-glass-blur") ?? "14"}px`);

  const glassAlphaRaw = Number(localStorage.getItem("alex-setting-glass-alpha") ?? "72");
  const glassAlpha = (Math.max(10, Math.min(95, Number.isFinite(glassAlphaRaw) ? glassAlphaRaw : 72)) / 100).toFixed(2);
  root.style.setProperty("--glass-alpha", glassAlpha);

  const threeDWallpaper = localStorage.getItem("alex-setting-3d-wallpaper") !== "false";
  root.dataset.threeDWallpaper = threeDWallpaper ? "true" : "false";
  const motionEnabled = localStorage.getItem("alex-setting-motion-enabled") !== "false";
  root.dataset.motionEnabled = motionEnabled ? "true" : "false";
  root.dataset.parallaxSensitivity = localStorage.getItem("alex-setting-parallax-sensitivity") ?? "14";
  root.dataset.animationIntensity = localStorage.getItem("alex-setting-animation-intensity") || "balanced";
  root.dataset.edgeLighting = localStorage.getItem("alex-setting-edge-lighting") === "true" ? "true" : "false";

  root.dataset.wallpaperMode = localStorage.getItem("alex-setting-wallpaper-mode") || "amoled";
  const depthNum = Number(localStorage.getItem("alex-setting-wallpaper-depth") ?? "10") / 10;
  root.style.setProperty("--wallpaper-depth", String(Math.max(0.5, Math.min(2.2, depthNum || 1))));
  root.dataset.particlesEnabled =
    localStorage.getItem("alex-setting-particles-enabled") === "true" && perfMode !== "low"
      ? "true"
      : "false";

  const musicStyle = localStorage.getItem("alex-setting-music-style") || "expanded";
  root.dataset.musicStyle = musicStyle;
  const musicToggleBtn = document.getElementById("music-layout-toggle");
  if (musicToggleBtn) musicToggleBtn.textContent = musicStyle === "compact" ? "Expand" : "Compact";

  if (!threeDWallpaper || !motionEnabled || perfMode === "low" || root.dataset.reduceMotion === "true") {
    root.style.setProperty("--px", "0px");
    root.style.setProperty("--py", "0px");
  }

  root.dataset.appStyle = localStorage.getItem("alex-app-style") || "neon";
  root.dataset.iconPack = localStorage.getItem("alex-icon-pack") || "vivid";
  root.dataset.iconShape = localStorage.getItem("alex-icon-shape") || "squircle";
  root.dataset.icons3d = localStorage.getItem("alex-setting-icons-3d") !== "false" ? "true" : "false";
  root.dataset.iconReflection = localStorage.getItem("alex-setting-icon-reflection") === "true" ? "true" : "false";
  root.dataset.iconAnim = localStorage.getItem("alex-setting-icon-anim") || "scale";
  root.style.setProperty("--app-icon-shadow", (localStorage.getItem("alex-setting-icon-shadow") || "14") + "px");

  root.dataset.clockStyle = localStorage.getItem("alex-setting-clock-style") || "modern";
  root.dataset.clockType = localStorage.getItem("alex-setting-clock-type") || "digital";
  root.dataset.widgetSize = localStorage.getItem("alex-setting-widget-size") || "standard";
  root.dataset.widgetSurface = localStorage.getItem("alex-setting-widget-surface") || "glass";
  root.dataset.widgetsVisible = localStorage.getItem("alex-setting-widgets-visible") !== "false" ? "true" : "false";
  root.dataset.showLabels = localStorage.getItem("alex-setting-show-app-labels") !== "false" ? "true" : "false";

  // Widget Custom Accent Color & Opacity
  const widgetStack = document.getElementById("widget-stack");
  if (widgetStack) {
    const widgetColor = localStorage.getItem("alex-setting-widget-color");
    widgetStack.style.borderColor = widgetColor || "";
    const wAlpha = localStorage.getItem("alex-setting-widget-transparency");
    if (wAlpha) {
      widgetStack.style.opacity = String(Math.max(0.25, Math.min(1, Number(wAlpha) / 100)));
    } else {
      widgetStack.style.opacity = "";
    }
  }

  const appRadius = localStorage.getItem("alex-setting-app-corner-radius");
  if (appRadius !== null) root.style.setProperty("--app-icon-radius", appRadius + "%");
  else root.style.removeProperty("--app-icon-radius");

  const appGlow = localStorage.getItem("alex-setting-app-glow-size");
  if (appGlow !== null) root.style.setProperty("--app-icon-glow", appGlow + "px");
  else root.style.removeProperty("--app-icon-glow");

  const appBorderWidth = localStorage.getItem("alex-setting-app-border-width");
  if (appBorderWidth !== null) root.style.setProperty("--app-icon-border-width", appBorderWidth + "px");
  else root.style.removeProperty("--app-icon-border-width");

  // Sidebar & Charging & Notifications & Private Mode attributes
  root.dataset.sidebarEnabled = localStorage.getItem("alex-setting-sidebar-enabled") !== "false" ? "true" : "false";
  root.dataset.sidebarSide = localStorage.getItem("alex-setting-sidebar-side") || "right";
  const sAlpha = Number(localStorage.getItem("alex-setting-sidebar-alpha") ?? "94") / 100;
  root.style.setProperty("--sidebar-alpha", String(Math.max(0.3, Math.min(1, sAlpha || 0.94))));

  root.dataset.chargingStyle = localStorage.getItem("alex-setting-charging-style") || "neon";
  root.style.setProperty("--charging-color", localStorage.getItem("alex-setting-charging-color") || "var(--neon)");

  root.dataset.notifBadges = localStorage.getItem("alex-setting-notif-badges") !== "false" ? "true" : "false";
  root.dataset.notifBadgeStyle = localStorage.getItem("alex-setting-notif-badge-style") || "count";
  root.style.setProperty("--notif-badge-color", localStorage.getItem("alex-setting-notif-badge-color") || "#d000ff");

  const privActive = isPrivateModeActive();
  root.dataset.privateMode = privActive ? "true" : "false";
  const profileChip = document.getElementById("status-profile-chip");
  if (profileChip) {
    profileChip.textContent = privActive
      ? "Private Space"
      : localStorage.getItem("alex-active-profile") || "Personal";
  }
  const shadePrivState = document.getElementById("shade-private-state");
  if (shadePrivState) shadePrivState.textContent = privActive ? "Active" : "Standard Home";
  const drawerPrivBtn = document.getElementById("drawer-private-toggle");
  if (drawerPrivBtn) drawerPrivBtn.setAttribute("aria-pressed", privActive ? "true" : "false");

  applyWidgetVisibilityAndOrder();
  applyHomeSlotsAndIcons();
  renderSidebarContents();

  const savedWallpaper = localStorage.getItem("alex-wallpaper");
  const wallpaperLayer = document.getElementById("launcher-wallpaper-layer");
  if (wallpaperLayer) {
    if (savedWallpaper) {
      root.dataset.hasWallpaper = "true";
      wallpaperLayer.style.backgroundImage = `url("${savedWallpaper}")`;
    } else {
      delete root.dataset.hasWallpaper;
      wallpaperLayer.style.backgroundImage = "";
    }
  }
}

function applyIconStylesToBox(iconBox, customColor) {
  if (!iconBox) return;
  if (customColor) {
    iconBox.style.borderColor = customColor;
    iconBox.style.boxShadow = `0 0 var(--app-icon-glow, 9px) ${customColor}`;
  } else {
    iconBox.style.borderColor = "";
    iconBox.style.boxShadow = "";
  }
}

function applyHomeSlotsAndIcons() {
  const customMap = loadCustomAppsMap();
  const favNames = loadFavouriteNames();
  const notifCounts = getNotificationCountMap();

  const favRow = document.getElementById("home-favourites");
  if (favRow) {
    favRow.innerHTML = "";
    const totalFav = favNames.length;
    favNames.forEach((appName, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "app";
      btn.dataset.app = appName;
      const angleDeg = -90 + (idx * (360 / Math.max(1, totalFav)));
      const rad = (angleDeg * Math.PI) / 180;
      const radiusPct = 43;
      btn.style.left = `${(50 + Math.cos(rad) * radiusPct).toFixed(2)}%`;
      btn.style.top = `${(50 + Math.sin(rad) * radiusPct).toFixed(2)}%`;

      const iconBox = document.createElement("span");
      iconBox.className = "app-icon-box";
      const custom = customMap[appName];
      renderAppIconInto(iconBox, appName, custom?.icon || "");
      applyIconStylesToBox(iconBox, custom?.color || "");

      const label = document.createElement("p");
      label.textContent = custom?.name || appName;

      btn.append(iconBox, label);
      btn.addEventListener("click", () => handleAppLaunch(appName, custom?.name || appName));
      attachBadgeIfAny(btn, appName, notifCounts);
      favRow.appendChild(btn);
    });
  }

  const wheelSlots = loadWheelSlots();
  const wheelEl = document.getElementById("app-wheel");
  if (wheelEl) {
    const centerToggle = document.getElementById("wheel-center-toggle");
    wheelEl.innerHTML = "";
    wheelSlots.forEach((slotValue, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `wheel-item slot-${idx}`;
      btn.dataset.slot = String(idx);

      if (slotValue === "__drawer__") {
        btn.dataset.action = "drawer";
        btn.setAttribute("aria-label", "Open App Drawer");
        const box = document.createElement("span");
        box.className = "app-icon-box wheel-apps-glyph";
        box.textContent = "▦";
        applyIconStylesToBox(box, "");
        const label = document.createElement("p");
        label.textContent = "Apps";
        btn.append(box, label);
        btn.addEventListener("click", () => openDrawer(""));
      } else {
        btn.dataset.app = slotValue;
        const custom = customMap[slotValue];
        const displayName = custom?.name || slotValue;
        btn.setAttribute("aria-label", `Open ${displayName}`);
        const box = document.createElement("span");
        box.className = "app-icon-box";
        renderAppIconInto(box, slotValue, custom?.icon || "");
        applyIconStylesToBox(box, custom?.color || "");
        const label = document.createElement("p");
        label.textContent = displayName;
        btn.append(box, label);
        btn.addEventListener("click", () => handleAppLaunch(slotValue, displayName));
        attachBadgeIfAny(btn, slotValue, notifCounts);
      }
      wheelEl.appendChild(btn);
    });
    if (centerToggle) wheelEl.appendChild(centerToggle);
    positionWheelSlots(wheelRotationDeg);
  }

  document.querySelectorAll("[data-app]").forEach(el => {
    if (el.classList.contains("wheel-item")) return;
    const baseName = el.dataset.app;
    if (!baseName) return;
    const custom = customMap[baseName];
    const iconBox = el.querySelector(".app-icon-box");
    const labelEl = el.querySelector("p");
    if (iconBox) {
      renderAppIconInto(iconBox, baseName, custom?.icon || "");
      applyIconStylesToBox(iconBox, custom?.color || "");
    }
    if (labelEl) labelEl.textContent = custom?.name || baseName;
    attachBadgeIfAny(el, baseName, notifCounts);
  });
}

function positionWheelSlots(offsetDeg = 0) {
  const wheelEl = document.getElementById("app-wheel");
  if (!wheelEl) return;
  const radiusPct = 36;
  const items = [...wheelEl.querySelectorAll(".wheel-item[data-slot]")];
  const total = items.length;
  items.forEach((item, index) => {
    const angleDeg = -90 + (index * (360 / Math.max(1, total))) + offsetDeg;
    const rad = (angleDeg * Math.PI) / 180;
    item.style.left = `${(50 + Math.cos(rad) * radiusPct).toFixed(2)}%`;
    item.style.top = `${(50 + Math.sin(rad) * radiusPct).toFixed(2)}%`;
  });
}

// CLOCK (DIGITAL + ANALOG) AND DATE
function updateClock() {
  const now = new Date();
  const clock = document.getElementById("clock");
  const secondsEl = document.getElementById("clock-seconds");
  const date = document.getElementById("date");
  const statusTime = document.getElementById("status-time");

  const use24h = localStorage.getItem("alex-setting-clock-24h") !== "false";
  const showSeconds = localStorage.getItem("alex-setting-clock-seconds") === "true";

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: !use24h
  });

  if (clock) clock.textContent = time;
  if (statusTime) statusTime.textContent = time;
  if (secondsEl) secondsEl.textContent = showSeconds ? ":" + String(now.getSeconds()).padStart(2, "0") : "";

  if (date) {
    date.textContent = now.toLocaleDateString([], {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  }

  // Update SVG Analog Clock hands
  const s = now.getSeconds();
  const m = now.getMinutes() + s / 60;
  const h = (now.getHours() % 12) + m / 60;
  const hourHand = document.getElementById("analog-hour-hand");
  const minHand = document.getElementById("analog-min-hand");
  const secHand = document.getElementById("analog-sec-hand");
  if (hourHand) hourHand.setAttribute("transform", `rotate(${(h * 30).toFixed(1)} 50 50)`);
  if (minHand) minHand.setAttribute("transform", `rotate(${(m * 6).toFixed(1)} 50 50)`);
  if (secHand) secHand.setAttribute("transform", `rotate(${(s * 6).toFixed(1)} 50 50)`);
}

// INTERACTIVE PARTICLE ENGINE (BATTERY-FRIENDLY, PAUSES WHEN HIDDEN OR LOW-RAM)
function initParticlesCanvas() {
  const canvas = document.getElementById("launcher-particles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let particles = [];
  let width = 0;
  let height = 0;

  const resize = () => {
    width = canvas.width = canvas.offsetWidth || window.innerWidth;
    height = canvas.height = canvas.offsetHeight || window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  const rebuild = count => {
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * (width || 360),
      y: Math.random() * (height || 720),
      r: 0.9 + Math.random() * 2.1,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -0.15 - Math.random() * 0.4,
      alpha: 0.25 + Math.random() * 0.55
    }));
  };

  const loop = () => {
    const d = document.documentElement.dataset;
    const enabled =
      d.particlesEnabled === "true" &&
      d.performanceMode !== "low" &&
      d.reduceMotion !== "true" &&
      !document.hidden;

    if (enabled) {
      const targetCount = Math.max(10, Math.min(80, Number(localStorage.getItem("alex-setting-particles-count") || 32)));
      if (particles.length !== targetCount) rebuild(targetCount);
      ctx.clearRect(0, 0, width, height);
      const neon = getComputedStyle(document.documentElement).getPropertyValue("--neon").trim() || "#d000ff";
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -6) p.y = height + 6;
        if (p.x < -6) p.x = width + 6;
        if (p.x > width + 6) p.x = -6;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = neon;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (particles.length > 0) {
      ctx.clearRect(0, 0, width, height);
    }
    particleFrame = requestAnimationFrame(loop);
  };
  particleFrame = requestAnimationFrame(loop);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && particleFrame) {
      cancelAnimationFrame(particleFrame);
      particleFrame = null;
    } else if (!document.hidden && !particleFrame) {
      particleFrame = requestAnimationFrame(loop);
    }
  });
}

// MODAL DIALOG SYSTEM
function openLauncherModal(title, renderBodyFn) {
  const modal = document.getElementById("launcher-modal");
  const titleEl = document.getElementById("modal-title");
  const bodyEl = document.getElementById("modal-body");
  if (!modal || !titleEl || !bodyEl) return;
  titleEl.textContent = title;
  bodyEl.innerHTML = "";
  renderBodyFn(bodyEl, closeLauncherModal);
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
}

function closeLauncherModal() {
  const modal = document.getElementById("launcher-modal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

function openCalculatorModal() {
  openLauncherModal("Calculator", body => {
    let expr = "";
    const display = document.createElement("div");
    display.className = "calc-display";
    display.textContent = "0";
    const grid = document.createElement("div");
    grid.className = "calc-grid";
    const keys = [
      "C", "⌫", "%", "/",
      "7", "8", "9", "*",
      "4", "5", "6", "-",
      "1", "2", "3", "+",
      "0", ".", "±", "="
    ];
    const safeEval = raw => {
      if (!/^[0-9+\-*/.%()\s]+$/.test(raw)) return "Error";
      try {
        const result = Function(`"use strict"; return (${raw})`)();
        return Number.isFinite(result) ? String(Math.round(result * 1e8) / 1e8) : "Error";
      } catch {
        return "Error";
      }
    };
    keys.forEach(k => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "calc-key" + (["C", "⌫", "%", "/", "*", "-", "+", "±"].includes(k) ? " op" : "") + (k === "=" ? " eq" : "");
      btn.textContent = k;
      btn.addEventListener("click", () => {
        if (k === "C") { expr = ""; display.textContent = "0"; }
        else if (k === "⌫") { expr = expr.slice(0, -1); display.textContent = expr || "0"; }
        else if (k === "±") { expr = expr.startsWith("-") ? expr.slice(1) : (expr ? "-" + expr : ""); display.textContent = expr || "0"; }
        else if (k === "=") {
          if (!expr) return;
          const out = safeEval(expr);
          display.textContent = out;
          expr = out === "Error" ? "" : out;
        } else { expr += k; display.textContent = expr; }
      });
      grid.appendChild(btn);
    });
    body.append(display, grid);
  });
}

function recordRecentApp(appName) {
  if (appName === "Settings") return;
  try {
    const existing = loadJsonStorage("alex-recent-apps", []);
    const next = [appName, ...(Array.isArray(existing) ? existing.filter(n => n !== appName) : [])].slice(0, 8);
    localStorage.setItem("alex-recent-apps", JSON.stringify(next));
    renderSidebarContents();
  } catch {
    // Ignore storage quota error
  }
}

function getRecentSuggestions() {
  const visibleApps = getEffectiveApps(false);
  const saved = loadJsonStorage("alex-recent-apps", []);
  if (Array.isArray(saved) && saved.length > 0) {
    const matched = saved.map(name => visibleApps.find(a => a.baseName === name || a.name === name)).filter(Boolean);
    if (matched.length > 0) {
      const defaults = DEFAULT_FAVOURITES
        .map(name => visibleApps.find(a => a.baseName === name))
        .filter(app => app && !matched.some(m => m.baseName === app.baseName));
      return [...matched, ...defaults].slice(0, 4);
    }
  }
  return DEFAULT_FAVOURITES.map(name => visibleApps.find(a => a.baseName === name)).filter(Boolean);
}

// PRIVACY LOCK OVERLAY & APP LOCK
function openLockOverlay({ title = "Alex Launcher Locked", subtitle = "Enter your PIN or password", allowCancel = false, onUnlock }) {
  const overlay = document.getElementById("lock-screen-overlay");
  const titleEl = document.getElementById("lock-screen-title");
  const subEl = document.getElementById("lock-screen-subtitle");
  const input = document.getElementById("lock-credential-input");
  const errEl = document.getElementById("lock-error-msg");
  const cancelBtn = document.getElementById("lock-cancel-btn");
  const bioBtn = document.getElementById("lock-biometric-btn");
  if (!overlay || !input) return;

  pendingUnlockCallback = onUnlock || null;
  if (titleEl) titleEl.textContent = title;
  if (subEl) subEl.textContent = subtitle;
  if (errEl) errEl.textContent = "";
  input.value = "";
  if (cancelBtn) cancelBtn.hidden = !allowCancel;

  const caps = getRuntimeCapabilities();
  const bioEnabled = localStorage.getItem("alex-setting-biometric") === "true";
  if (bioBtn) bioBtn.hidden = !(bioEnabled && caps.hasBiometricBridge);

  overlay.classList.add("active");
  overlay.setAttribute("aria-hidden", "false");
  setTimeout(() => input.focus(), 60);
}

function closeLockOverlay() {
  const overlay = document.getElementById("lock-screen-overlay");
  if (!overlay) return;
  overlay.classList.remove("active");
  overlay.setAttribute("aria-hidden", "true");
  pendingUnlockCallback = null;
}

function engageLockScreen() {
  const nativeRes = requestNativeLockScreen();
  const secret = loadJsonStorage("alex-security-secret", null);
  if (secret?.hash) {
    openLockOverlay({
      title: "Alex Launcher Locked",
      subtitle: "Enter your PIN or password to unlock",
      allowCancel: false,
      onUnlock: () => localStorage.setItem("alex-last-unlocked-at", String(Date.now()))
    });
  } else if (nativeRes.supported) {
    showToast("Screen locked via Android");
  } else {
    showToast("Set a PIN/password in Settings → Privacy Center to enable lock overlay");
  }
}

function initLockOverlay() {
  const input = document.getElementById("lock-credential-input");
  const errEl = document.getElementById("lock-error-msg");
  const unlockBtn = document.getElementById("lock-unlock-btn");
  const cancelBtn = document.getElementById("lock-cancel-btn");
  const bioBtn = document.getElementById("lock-biometric-btn");

  const attemptUnlock = async () => {
    const stored = loadJsonStorage("alex-security-secret", null);
    if (!stored?.hash) {
      const cb = pendingUnlockCallback;
      closeLockOverlay();
      cb?.();
      return;
    }
    const ok = await verifyLauncherSecret(input?.value.trim() || "", stored);
    if (ok) {
      localStorage.setItem("alex-last-unlocked-at", String(Date.now()));
      const cb = pendingUnlockCallback;
      closeLockOverlay();
      cb?.();
    } else {
      triggerHaptic(30);
      if (errEl) errEl.textContent = "Incorrect PIN or password.";
    }
  };

  unlockBtn?.addEventListener("click", attemptUnlock);
  input?.addEventListener("keydown", e => {
    if (e.key === "Enter") attemptUnlock();
  });
  cancelBtn?.addEventListener("click", closeLockOverlay);
  bioBtn?.addEventListener("click", async () => {
    const res = await requestNativeBiometric("Unlock Alex Launcher");
    if (res.verified) {
      localStorage.setItem("alex-last-unlocked-at", String(Date.now()));
      const cb = pendingUnlockCallback;
      closeLockOverlay();
      cb?.();
    } else if (errEl) {
      errEl.textContent = res.reason || "Biometric check failed.";
    }
  });

  // Check startup lock timeout
  const stored = loadJsonStorage("alex-security-secret", null);
  const timeoutMode = localStorage.getItem("alex-setting-lock-timeout") || "off";
  if (stored?.hash && timeoutMode !== "off") {
    const last = Number(localStorage.getItem("alex-last-unlocked-at") || "0");
    const diffSec = (Date.now() - last) / 1000;
    const threshold = timeoutMode === "immediate" ? 0 : Number(timeoutMode);
    if (!last || diffSec >= threshold) {
      openLockOverlay({
        title: "Alex Launcher Locked",
        subtitle: "Enter your PIN or password to continue",
        allowCancel: false
      });
    }
  }
}

function executeAppLaunch(appName, displayLabel) {
  triggerHaptic(10);
  recordRecentApp(appName);

  if (appName === "Settings") {
    window.location.href = "./settings.html";
    return;
  }
  if (appName === "Calculator") {
    openCalculatorModal();
    return;
  }
  if (appName === "Music") {
    selectWidgetTab("music");
    return;
  }
  if (appName === "Weather") {
    selectWidgetTab("weather");
    openWeatherCityModal();
    return;
  }
  if (appName === "Calendar") {
    selectWidgetTab("calendar");
  }

  const effectiveApps = getEffectiveApps(true);
  const matchedApp = effectiveApps.find(a => a.name === appName || a.baseName === appName);
  const catalogEntry = getAppCatalogEntry(appName);
  const entry = {
    ...catalogEntry,
    packageName: matchedApp?.packageName || catalogEntry.packageName || "",
    webUrl: matchedApp?.webUrl || catalogEntry.webUrl || null
  };

  const result = launchAndroidOrWebApp(entry, displayLabel || appName);
  if (result.mode === "native") {
    // Native Android app launched directly - no modal, no toast
    return;
  }
  if (result.mode === "internal" || result.mode === "protocol") {
    return;
  }
  if (result.mode === "web-intent" && result.url) {
    window.open(result.url, "_blank", "noopener,noreferrer");
    return;
  }
  showToast(`Opening ${displayLabel || appName}...`);
}

function handleAppLaunch(appName, displayLabel) {
  const lockedApps = loadJsonStorage("alex-locked-apps", []);
  const secret = loadJsonStorage("alex-security-secret", null);
  if (Array.isArray(lockedApps) && lockedApps.includes(appName) && secret?.hash) {
    openLockOverlay({
      title: `Unlock ${displayLabel || appName}`,
      subtitle: "App Lock is enabled for this application",
      allowCancel: true,
      onUnlock: () => executeAppLaunch(appName, displayLabel)
    });
    return;
  }
  executeAppLaunch(appName, displayLabel);
}

// WIDGETS: REORDER, VISIBILITY, SWITCHER, WEATHER, MUSIC, CALENDAR, BATTERY
function applyWidgetVisibilityAndOrder() {
  const tabBar = document.querySelector(".widget-tabs");
  if (!tabBar) return;
  let order = loadJsonStorage("alex-widget-order", DEFAULT_WIDGET_ORDER);
  if (!Array.isArray(order) || order.length === 0) order = [...DEFAULT_WIDGET_ORDER];
  let enabled = loadJsonStorage("alex-enabled-widgets", DEFAULT_WIDGET_ORDER);
  if (!Array.isArray(enabled) || enabled.length === 0) enabled = [...DEFAULT_WIDGET_ORDER];

  let visibleCount = 0;
  order.forEach(key => {
    const btn = tabBar.querySelector(`[data-widget-tab="${key}"]`);
    if (!btn) return;
    tabBar.appendChild(btn);
    const isEnabled = enabled.includes(key);
    btn.style.display = isEnabled ? "" : "none";
    if (isEnabled) visibleCount++;
  });
  tabBar.style.gridTemplateColumns = `repeat(${Math.max(1, visibleCount)}, minmax(0, 1fr))`;
}

function selectWidgetTab(tabName) {
  document.querySelectorAll("[data-widget-tab]").forEach(btn => {
    const active = btn.dataset.widgetTab === tabName;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });
  document.querySelectorAll("[data-widget-panel]").forEach(panel => {
    panel.classList.toggle("active", panel.dataset.widgetPanel === tabName);
  });
  localStorage.setItem("alex-active-widget-tab", tabName);
}

function formatTemp(tempC) {
  const unit = localStorage.getItem("alex-setting-temp-unit") || "C";
  return unit === "F" ? `${Math.round((tempC * 9) / 5 + 32)}°F` : `${Math.round(tempC)}°C`;
}

function getWeatherGlyphChar(kind) {
  switch (kind) {
    case "sun": return "☀";
    case "night": return "☾";
    case "partly": return "⛅";
    case "rain": return "🌧";
    case "snow": return "❄";
    case "storm": return "⚡";
    default: return "☁";
  }
}

function renderWeatherData(data) {
  const heroIcon = document.getElementById("hero-weather-icon");
  const heroTemp = document.getElementById("hero-weather-temp");
  const heroCity = document.getElementById("hero-weather-city");
  const wTemp = document.getElementById("w-weather-temp");
  const wCond = document.getElementById("w-weather-condition");
  const wMeta = document.getElementById("w-weather-meta");

  if (!data) {
    if (heroIcon) heroIcon.textContent = "☁";
    if (heroTemp) heroTemp.textContent = "--°";
    if (heroCity) heroCity.textContent = "Set Weather";
    return;
  }

  const formatted = formatTemp(data.tempC);
  if (heroIcon) heroIcon.textContent = getWeatherGlyphChar(data.kind);
  if (heroTemp) heroTemp.textContent = formatted;
  if (heroCity) heroCity.textContent = data.location;
  if (wTemp) wTemp.textContent = formatted;
  if (wCond) wCond.textContent = data.condition;
  if (wMeta) wMeta.textContent = `${data.location} · Humidity ${data.humidity}% · Wind ${data.windKmh} km/h`;
}

async function refreshWeatherFromGps() {
  const wCond = document.getElementById("w-weather-condition");
  if (!("geolocation" in navigator)) {
    showToast("Geolocation is unavailable in this browser");
    return;
  }
  if (wCond) wCond.textContent = "Locating...";
  navigator.geolocation.getCurrentPosition(
    async pos => {
      try {
        const data = await fetchWeatherForCoordinates(pos.coords.latitude, pos.coords.longitude, "Current Location");
        renderWeatherData(data);
        showToast(`Weather updated (${formatTemp(data.tempC)})`);
      } catch {
        if (wCond) wCond.textContent = "Weather fetch failed";
        showToast("Could not reach weather service");
      }
    },
    () => {
      if (wCond) wCond.textContent = "GPS permission denied";
      showToast("Location permission declined — use City search");
    },
    { timeout: 8000 }
  );
}

function openWeatherCityModal() {
  openLauncherModal("Weather Location", (body, close) => {
    const info = document.createElement("p");
    info.textContent = "Enter a city name for live Open-Meteo weather or use device GPS.";
    const input = document.createElement("input");
    input.type = "text";
    input.className = "modal-input";
    input.placeholder = "e.g. Nairobi, London, Tokyo...";
    input.value = localStorage.getItem("alex-weather-city") || "";
    const actions = document.createElement("div");
    actions.className = "modal-actions";

    const gpsBtn = document.createElement("button");
    gpsBtn.type = "button";
    gpsBtn.className = "modal-btn";
    gpsBtn.textContent = "Use GPS";
    gpsBtn.addEventListener("click", () => { close(); refreshWeatherFromGps(); });

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "modal-btn primary";
    saveBtn.textContent = "Load Weather";
    saveBtn.addEventListener("click", async () => {
      const city = input.value.trim();
      if (!city) return;
      saveBtn.textContent = "Loading...";
      saveBtn.disabled = true;
      try {
        const data = await fetchWeatherForCity(city);
        localStorage.setItem("alex-weather-city", city);
        renderWeatherData(data);
        close();
        showToast(`Weather loaded for ${data.location}`);
      } catch {
        saveBtn.textContent = "Load Weather";
        saveBtn.disabled = false;
        showToast("City not found or offline");
      }
    });

    actions.append(gpsBtn, saveBtn);
    body.append(info, input, actions);
    setTimeout(() => input.focus(), 40);
  });
}

function initWeatherWidget() {
  const cached = getCachedWeather();
  if (cached) {
    renderWeatherData(cached);
    if (Date.now() - (cached.updatedAt || 0) > 30 * 60 * 1000 && typeof cached.lat === "number") {
      fetchWeatherForCoordinates(cached.lat, cached.lon, cached.location).then(renderWeatherData).catch(() => {});
    }
  } else {
    const savedCity = localStorage.getItem("alex-weather-city");
    if (savedCity) fetchWeatherForCity(savedCity).then(renderWeatherData).catch(() => {});
  }
  document.getElementById("hero-weather-trigger")?.addEventListener("click", () => {
    selectWidgetTab("weather");
    openWeatherCityModal();
  });
  document.getElementById("weather-gps-btn")?.addEventListener("click", refreshWeatherFromGps);
  document.getElementById("weather-city-btn")?.addEventListener("click", openWeatherCityModal);
}

function formatSeconds(sec) {
  const safe = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function initMusicWidget() {
  const artworkImg = document.getElementById("music-artwork");
  const artworkWrap = document.getElementById("music-artwork-wrap");
  const sourceBadge = document.getElementById("music-source-badge");
  const previewNote = document.getElementById("music-preview-note");
  const layoutToggle = document.getElementById("music-layout-toggle");
  const titleEl = document.getElementById("music-track-title");
  const artistEl = document.getElementById("music-track-artist");
  const playBtn = document.getElementById("music-play-btn");
  const prevBtn = document.getElementById("music-prev-btn");
  const nextBtn = document.getElementById("music-next-btn");
  const fileInput = document.getElementById("music-file-input");
  const elapsedEl = document.getElementById("music-time-elapsed");
  const totalEl = document.getElementById("music-time-total");
  const progressTrack = document.getElementById("music-progress-track");
  const progressFill = document.getElementById("music-progress-fill");
  const shadeToggle = document.getElementById("shade-toggle-music");
  const shadeState = document.getElementById("shade-music-state");
  const caps = getRuntimeCapabilities();

  const syncUi = () => {
    const track = audioEngine.currentTrack;
    if (titleEl) titleEl.textContent = track.title;
    if (artistEl) artistEl.textContent = track.artist;
    if (artworkImg && track.artwork && artworkImg.src !== track.artwork) artworkImg.src = track.artwork;
    artworkWrap?.classList.toggle("is-playing", audioEngine.isPlaying);
    if (playBtn) playBtn.textContent = audioEngine.isPlaying ? "⏸" : "▶";

    if (sourceBadge) {
      if (audioEngine.playbackSource === "native-android") {
        sourceBadge.textContent = "Android Media";
        sourceBadge.classList.add("live");
      } else if (audioEngine.playbackSource === "local-file") {
        sourceBadge.textContent = "Local Audio";
        sourceBadge.classList.add("live");
      } else if (audioEngine.playbackSource === "browser-synth") {
        sourceBadge.textContent = audioEngine.isPlaying ? "Synth Playing" : "Synth Paused";
        sourceBadge.classList.toggle("live", audioEngine.isPlaying);
      } else {
        sourceBadge.textContent = caps.hasMediaBridge ? "Android Standby" : "Browser Preview";
        sourceBadge.classList.remove("live");
      }
    }

    if (previewNote) {
      if (audioEngine.playbackSource === "native-android") previewNote.textContent = track.album || "Synced with Android MediaSession";
      else if (audioEngine.playbackSource === "local-file") previewNote.textContent = track.album || "Playing from local device storage";
      else if (audioEngine.playbackSource === "browser-synth") {
        previewNote.textContent = audioEngine.isPlaying ? "Web Audio synth preview · Load Audio for your MP3 files" : "Synth preview paused · Tap ▶ or Audio";
      } else {
        previewNote.textContent = caps.hasMediaBridge
          ? "Waiting for system Android playback · Load Audio or tap ▶"
          : "Native Android media unavailable · Load Audio or tap ▶ preview";
      }
    }

    if (shadeState) {
      shadeState.textContent = audioEngine.isPlaying
        ? `Playing · ${track.title}`
        : audioEngine.playbackSource === "preview-idle"
        ? "Preview Standby"
        : "Paused";
    }
    if (elapsedEl) elapsedEl.textContent = formatSeconds(audioEngine.elapsed);
    if (totalEl) totalEl.textContent = track.duration > 0 ? formatSeconds(track.duration) : "--:--";
    const pct = track.duration > 0 ? Math.min(100, (audioEngine.elapsed / track.duration) * 100) : 0;
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressTrack) progressTrack.setAttribute("aria-valuenow", String(Math.round(pct)));
  };

  audioEngine.onUpdate = syncUi;
  if (caps.hasMediaBridge && localStorage.getItem("alex-setting-music-native-sync") !== "false") {
    audioEngine.syncNativeMedia();
    setInterval(() => {
      if (!document.hidden && localStorage.getItem("alex-setting-music-native-sync") !== "false") {
        audioEngine.syncNativeMedia();
      }
    }, 1500);
  }
  syncUi();

  layoutToggle?.addEventListener("click", () => {
    const next = (document.documentElement.dataset.musicStyle || "expanded") === "compact" ? "expanded" : "compact";
    document.documentElement.dataset.musicStyle = next;
    localStorage.setItem("alex-setting-music-style", next);
    layoutToggle.textContent = next === "compact" ? "Expand" : "Compact";
  });

  const handleSeek = clientX => {
    if (!progressTrack) return;
    const track = audioEngine.currentTrack;
    if (!track || track.duration <= 0) return;
    const rect = progressTrack.getBoundingClientRect();
    if (rect.width <= 0) return;
    audioEngine.seek(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * track.duration);
  };
  let scrubbing = false;
  progressTrack?.addEventListener("pointerdown", e => { scrubbing = true; progressTrack.setPointerCapture?.(e.pointerId); handleSeek(e.clientX); });
  progressTrack?.addEventListener("pointermove", e => { if (scrubbing) handleSeek(e.clientX); });
  progressTrack?.addEventListener("pointerup", () => { scrubbing = false; });
  progressTrack?.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") audioEngine.seek(audioEngine.elapsed + 5);
    if (e.key === "ArrowLeft") audioEngine.seek(audioEngine.elapsed - 5);
  });

  playBtn?.addEventListener("click", () => { triggerHaptic(10); audioEngine.togglePlay(); });
  shadeToggle?.addEventListener("click", () => { triggerHaptic(10); audioEngine.togglePlay(); });
  prevBtn?.addEventListener("click", () => { triggerHaptic(8); audioEngine.prev(); });
  nextBtn?.addEventListener("click", () => { triggerHaptic(8); audioEngine.next(); });
  fileInput?.addEventListener("change", () => {
    const count = audioEngine.addLocalFiles(fileInput.files);
    if (count > 0) showToast(`Added ${count} local audio track${count > 1 ? "s" : ""}`);
    fileInput.value = "";
  });
}

function getTodayIsoKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function renderCalendarWidget() {
  const monthLabel = document.getElementById("calendar-month-label");
  const summaryEl = document.getElementById("calendar-events-summary");
  const stripEl = document.getElementById("calendar-week-strip");
  const listEl = document.getElementById("calendar-events-list");
  const now = new Date();
  if (monthLabel) monthLabel.textContent = now.toLocaleDateString([], { month: "long", year: "numeric" });

  if (stripEl) {
    stripEl.innerHTML = "";
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - 3 + i);
      const pill = document.createElement("div");
      pill.className = "calendar-day-pill" + (-3 + i === 0 ? " today" : "");
      const wk = document.createElement("span");
      wk.textContent = d.toLocaleDateString([], { weekday: "narrow" });
      const num = document.createElement("strong");
      num.textContent = String(d.getDate());
      pill.append(wk, num);
      stripEl.appendChild(pill);
    }
  }

  const events = loadJsonStorage("alex-calendar-events", []);
  const todayKey = getTodayIsoKey();
  const todaysEvents = Array.isArray(events) ? events.filter(ev => !ev.date || ev.date === todayKey) : [];

  if (summaryEl) {
    summaryEl.textContent =
      todaysEvents.length === 0 ? "No reminders scheduled today" : `${todaysEvents.length} reminder${todaysEvents.length > 1 ? "s" : ""} today`;
  }

  if (listEl) {
    listEl.innerHTML = "";
    todaysEvents.forEach(ev => {
      const row = document.createElement("div");
      row.className = "calendar-event-row";
      const label = document.createElement("span");
      label.textContent = ev.time ? `${ev.time} · ${ev.title}` : ev.title;
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "calendar-event-del";
      delBtn.textContent = "×";
      delBtn.setAttribute("aria-label", `Remove ${ev.title}`);
      delBtn.addEventListener("click", () => {
        localStorage.setItem("alex-calendar-events", JSON.stringify(events.filter(item => item.id !== ev.id)));
        renderCalendarWidget();
      });
      row.append(label, delBtn);
      listEl.appendChild(row);
    });
  }
}

function initCalendarWidget() {
  renderCalendarWidget();
  document.getElementById("calendar-add-btn")?.addEventListener("click", () => {
    openLauncherModal("Add Calendar Reminder", (body, close) => {
      const titleInput = document.createElement("input");
      titleInput.type = "text";
      titleInput.className = "modal-input";
      titleInput.placeholder = "Reminder title";
      titleInput.maxLength = 40;
      const timeInput = document.createElement("input");
      timeInput.type = "time";
      timeInput.className = "modal-input";
      const actions = document.createElement("div");
      actions.className = "modal-actions";
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "modal-btn";
      cancelBtn.textContent = "Cancel";
      cancelBtn.addEventListener("click", close);
      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "modal-btn primary";
      saveBtn.textContent = "Save";
      saveBtn.addEventListener("click", () => {
        const title = titleInput.value.trim();
        if (!title) return;
        const events = loadJsonStorage("alex-calendar-events", []);
        localStorage.setItem(
          "alex-calendar-events",
          JSON.stringify([...(Array.isArray(events) ? events : []), { id: "ev-" + Date.now(), date: getTodayIsoKey(), title, time: timeInput.value || "" }])
        );
        renderCalendarWidget();
        close();
        showToast("Reminder saved");
      });
      actions.append(cancelBtn, saveBtn);
      body.append(titleInput, timeInput, actions);
      setTimeout(() => titleInput.focus(), 40);
    });
  });
}

// CHARGING ANIMATION OVERLAY + BATTERY / SYSTEM TELEMETRY
function triggerChargingAnimation(pct) {
  if (localStorage.getItem("alex-setting-charging-anim") === "false") return;
  const overlay = document.getElementById("charging-overlay");
  const pctEl = document.getElementById("charging-pct");
  const labelEl = document.getElementById("charging-label");
  if (!overlay) return;
  if (pctEl) pctEl.textContent = `${pct}%`;
  if (labelEl) labelEl.textContent = pct >= 100 ? "Fully Charged" : "Fast Charging";
  overlay.classList.add("active");
  overlay.setAttribute("aria-hidden", "false");
  if (chargingOverlayTimer) clearTimeout(chargingOverlayTimer);
  chargingOverlayTimer = setTimeout(() => {
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
  }, 3600);
}

function initSystemTelemetry() {
  const caps = getRuntimeCapabilities();
  const modeEl = document.getElementById("status-mode-label");
  const netEl = document.getElementById("status-network");
  const statusBattEl = document.getElementById("status-battery");
  const wBattLevel = document.getElementById("w-battery-level");
  const wBattState = document.getElementById("w-battery-state");
  const wBattBar = document.getElementById("w-battery-bar");
  const wSysSpecs = document.getElementById("w-system-specs");
  const drawerNote = document.getElementById("drawer-runtime-note");

  if (modeEl) modeEl.textContent = caps.isNativeAndroid ? "Android Native" : "Web Preview";
  if (drawerNote) {
    drawerNote.textContent = caps.hasInstalledAppsBridge
      ? "Native Android · Installed Device Apps"
      : "Browser Preview · Web & Launcher Catalog";
  }

  const updateNetAndSpecs = () => {
    const conn = navigator.connection || navigator.mozConnection;
    const onlineText = navigator.onLine ? (conn?.effectiveType ? conn.effectiveType.toUpperCase() : "Online") : "Offline";
    if (netEl) netEl.textContent = onlineText;
    const specs = [`Network: ${onlineText}`];
    if (caps.cpuCores) specs.push(`${caps.cpuCores} Cores`);
    if (caps.deviceMemoryGb) specs.push(`${caps.deviceMemoryGb} GB RAM`);
    specs.push(caps.isNativeAndroid ? "Android Bridge Active" : "Web Preview");
    if (wSysSpecs) wSysSpecs.textContent = specs.join(" · ");
  };

  updateNetAndSpecs();
  window.addEventListener("online", updateNetAndSpecs);
  window.addEventListener("offline", updateNetAndSpecs);
  navigator.connection?.addEventListener?.("change", updateNetAndSpecs);

  document.getElementById("charging-overlay")?.addEventListener("click", () => {
    document.getElementById("charging-overlay")?.classList.remove("active");
  });

  if (typeof navigator.getBattery === "function") {
    navigator.getBattery().then(battery => {
      let wasCharging = battery.charging;
      const updateBattery = () => {
        const pct = Math.round(battery.level * 100);
        if (statusBattEl) statusBattEl.textContent = `${battery.charging ? "⚡" : ""}${pct}%`;
        if (wBattLevel) wBattLevel.textContent = `${pct}%`;
        if (wBattState) wBattState.textContent = battery.charging ? "Charging" : "On Battery";
        if (wBattBar) wBattBar.style.width = `${pct}%`;
        if (battery.charging && !wasCharging) triggerChargingAnimation(pct);
        wasCharging = battery.charging;
      };
      updateBattery();
      battery.addEventListener("levelchange", updateBattery);
      battery.addEventListener("chargingchange", updateBattery);
    }).catch(() => {
      if (statusBattEl) statusBattEl.textContent = "N/A";
      if (wBattLevel) wBattLevel.textContent = "N/A";
      if (wBattState) wBattState.textContent = "Battery API blocked";
    });
  } else {
    if (statusBattEl) statusBattEl.textContent = "N/A";
    if (wBattLevel) wBattLevel.textContent = "N/A";
    if (wBattState) wBattState.textContent = "Unsupported in this browser";
  }
}

function initWidgetStack() {
  const defaultTab = localStorage.getItem("alex-setting-default-widget") || localStorage.getItem("alex-active-widget-tab") || "weather";
  selectWidgetTab(defaultTab);
  document.querySelectorAll("[data-widget-tab]").forEach(btn => {
    btn.addEventListener("click", () => selectWidgetTab(btn.dataset.widgetTab));
  });

  const stack = document.getElementById("widget-stack");
  let startX = 0;
  let startY = 0;
  let tracking = false;
  stack?.addEventListener("pointerdown", e => {
    if (e.target.closest("button, input, label")) return;
    startX = e.clientX;
    startY = e.clientY;
    tracking = true;
  });
  stack?.addEventListener("pointerup", e => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      const visibleTabs = [...document.querySelectorAll(".widget-tab")].filter(b => b.style.display !== "none").map(b => b.dataset.widgetTab);
      if (visibleTabs.length < 2) return;
      const current = document.querySelector(".widget-tab.active")?.dataset.widgetTab || visibleTabs[0];
      const idx = Math.max(0, visibleTabs.indexOf(current));
      const nextIdx = dx < 0 ? (idx + 1) % visibleTabs.length : (idx - 1 + visibleTabs.length) % visibleTabs.length;
      selectWidgetTab(visibleTabs[nextIdx]);
    }
  });
}

// RADIAL WHEEL (SWIPE + HAPTICS + DOUBLE TAP SHORTCUT + 3 STYLES)
function initRadialWheel() {
  const wheelEl = document.getElementById("app-wheel");
  const centerBtn = document.getElementById("wheel-center-toggle");
  if (!wheelEl) return;

  wheelRotationDeg = Number(localStorage.getItem("alex-wheel-angle") || "0") || 0;
  positionWheelSlots(wheelRotationDeg);

  let pointerDown = false;
  let movedFar = false;
  let lastAngle = 0;
  let lastHapticSector = Math.round(wheelRotationDeg / 60);
  let angularVelocity = 0;
  let inertiaFrame = null;
  let suppressClickUntil = 0;

  const getPointerAngle = (cx, cy) => {
    const rect = wheelEl.getBoundingClientRect();
    return (Math.atan2(cy - (rect.top + rect.height / 2), cx - (rect.left + rect.width / 2)) * 180) / Math.PI;
  };

  const stopInertia = () => {
    if (inertiaFrame) { cancelAnimationFrame(inertiaFrame); inertiaFrame = null; }
  };

  wheelEl.addEventListener("pointerdown", e => {
    if (e.target.closest("#wheel-center-toggle")) return;
    stopInertia();
    pointerDown = true;
    movedFar = false;
    angularVelocity = 0;
    lastAngle = getPointerAngle(e.clientX, e.clientY);
  });

  window.addEventListener("pointermove", e => {
    if (!pointerDown) return;
    const angle = getPointerAngle(e.clientX, e.clientY);
    let delta = angle - lastAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    if (Math.abs(delta) > 1.2) {
      movedFar = true;
      wheelDragging = true;
      wheelEl.classList.add("is-dragging");
    }
    if (wheelDragging) {
      wheelRotationDeg = (wheelRotationDeg + delta) % 360;
      angularVelocity = delta;
      positionWheelSlots(wheelRotationDeg);
      const sector = Math.round(wheelRotationDeg / 60);
      if (sector !== lastHapticSector) {
        lastHapticSector = sector;
        triggerHaptic(6);
      }
    }
    lastAngle = angle;
  });

  const finishDrag = () => {
    if (!pointerDown) return;
    pointerDown = false;
    if (movedFar) {
      suppressClickUntil = Date.now() + 260;
      localStorage.setItem("alex-wheel-angle", String(Math.round(wheelRotationDeg)));
      const coast = () => {
        if (Math.abs(angularVelocity) < 0.15) {
          wheelDragging = false;
          wheelEl.classList.remove("is-dragging");
          localStorage.setItem("alex-wheel-angle", String(Math.round(wheelRotationDeg)));
          return;
        }
        wheelRotationDeg = (wheelRotationDeg + angularVelocity) % 360;
        angularVelocity *= 0.92;
        positionWheelSlots(wheelRotationDeg);
        inertiaFrame = requestAnimationFrame(coast);
      };
      inertiaFrame = requestAnimationFrame(coast);
    } else {
      wheelDragging = false;
      wheelEl.classList.remove("is-dragging");
    }
  };

  window.addEventListener("pointerup", finishDrag);
  window.addEventListener("pointercancel", finishDrag);
  wheelEl.addEventListener("click", e => {
    if (Date.now() < suppressClickUntil) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  let centerClickTimer = null;
  centerBtn?.addEventListener("click", () => {
    const doubleAction = localStorage.getItem("alex-setting-wheel-double-tap") || "drawer";
    if (doubleAction !== "none" && centerClickTimer) {
      clearTimeout(centerClickTimer);
      centerClickTimer = null;
      triggerHaptic(18);
      runGestureAction(doubleAction);
      return;
    }
    if (doubleAction !== "none") {
      centerClickTimer = setTimeout(() => {
        centerClickTimer = null;
        wheelOpen = !wheelOpen;
        document.documentElement.dataset.wheelOpen = wheelOpen ? "true" : "false";
        centerBtn.setAttribute("aria-expanded", wheelOpen ? "true" : "false");
        triggerHaptic(10);
      }, 210);
    } else {
      wheelOpen = !wheelOpen;
      document.documentElement.dataset.wheelOpen = wheelOpen ? "true" : "false";
      centerBtn.setAttribute("aria-expanded", wheelOpen ? "true" : "false");
      triggerHaptic(10);
    }
  });

  let lastTick = performance.now();
  const tickAmbientOrbit = now => {
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    const d = document.documentElement.dataset;
    const reduced = d.reduceMotion === "true" || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (d.wheelStyle === "rotating" && wheelOpen && !wheelDragging && !document.hidden && d.performanceMode !== "low" && !reduced) {
      const degPerSec = d.animationSpeed === "fast" ? 22 : d.animationSpeed === "slow" ? 7 : 13;
      wheelRotationDeg = (wheelRotationDeg + degPerSec * Math.min(dt, 0.05)) % 360;
      positionWheelSlots(wheelRotationDeg);
    }
    wheelAmbientFrame = requestAnimationFrame(tickAmbientOrbit);
  };
  wheelAmbientFrame = requestAnimationFrame(tickAmbientOrbit);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && wheelAmbientFrame) { cancelAnimationFrame(wheelAmbientFrame); wheelAmbientFrame = null; }
    else if (!document.hidden && !wheelAmbientFrame) { lastTick = performance.now(); wheelAmbientFrame = requestAnimationFrame(tickAmbientOrbit); }
  });
}

// FLOATING EDGE SIDEBAR
function renderSidebarContents() {
  const pinnedListEl = document.getElementById("sidebar-apps-list");
  const recentListEl = document.getElementById("sidebar-recent-list");
  if (!pinnedListEl || !recentListEl) return;

  const customMap = loadCustomAppsMap();
  const pinnedNames = loadJsonStorage("alex-sidebar-apps", DEFAULT_SIDEBAR_APPS);
  const pinned = Array.isArray(pinnedNames) && pinnedNames.length > 0 ? pinnedNames : DEFAULT_SIDEBAR_APPS;

  const createSidebarAppBtn = baseName => {
    const custom = customMap[baseName];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sidebar-app-btn";
    btn.title = custom?.name || baseName;
    btn.setAttribute("aria-label", custom?.name || baseName);
    renderAppIconInto(btn, baseName, custom?.icon || "");
    btn.addEventListener("click", () => {
      document.getElementById("floating-sidebar")?.classList.remove("open");
      handleAppLaunch(baseName, custom?.name || baseName);
    });
    return btn;
  };

  pinnedListEl.innerHTML = "";
  pinned.slice(0, 5).forEach(name => pinnedListEl.appendChild(createSidebarAppBtn(name)));

  const recents = loadJsonStorage("alex-recent-apps", []);
  recentListEl.innerHTML = "";
  (Array.isArray(recents) ? recents : [])
    .filter(n => !pinned.includes(n))
    .slice(0, 3)
    .forEach(name => recentListEl.appendChild(createSidebarAppBtn(name)));
}

function initFloatingSidebar() {
  const sidebar = document.getElementById("floating-sidebar");
  const toggleBtn = document.getElementById("sidebar-toggle-btn");
  if (!sidebar || !toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    const open = sidebar.classList.toggle("open");
    toggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
    triggerHaptic(8);
  });

  document.getElementById("sidebar-recents-btn")?.addEventListener("click", () => {
    sidebar.classList.remove("open");
    openMultitaskingPanel();
  });

  document.getElementById("sidebar-lock-btn")?.addEventListener("click", () => {
    sidebar.classList.remove("open");
    engageLockScreen();
  });

  document.addEventListener("click", e => {
    if (!e.target.closest("#floating-sidebar")) {
      sidebar.classList.remove("open");
      toggleBtn.setAttribute("aria-expanded", "false");
    }
  });
}

// MULTITASKING PANEL
function renderMultitaskingPanel() {
  const cardsEl = document.getElementById("multitasking-cards");
  const favBar = document.getElementById("multitasking-fav-bar");
  const noteEl = document.getElementById("multitasking-note");
  if (!cardsEl || !favBar) return;

  const customMap = loadCustomAppsMap();
  const nativeRecents = getNativeRecentTasks();
  const sessionRecents = loadJsonStorage("alex-recent-apps", []);
  const items = nativeRecents.supported && nativeRecents.items.length > 0
    ? nativeRecents.items.map(i => i.app || i.name).filter(Boolean)
    : Array.isArray(sessionRecents) ? sessionRecents : [];

  if (noteEl) {
    noteEl.textContent = nativeRecents.supported
      ? "Connected to Android Recents · System task termination requires Android system permissions"
      : "Alex Launcher session recents · Clearing OS background apps requires native Android permissions";
  }

  cardsEl.innerHTML = "";
  if (items.length === 0) {
    cardsEl.innerHTML = '<p class="drawer-empty" style="padding: 18px;">No recent apps launched yet.</p>';
  } else {
    items.forEach(appName => {
      const custom = customMap[appName];
      const card = document.createElement("div");
      card.className = "multitasking-card";

      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "multitasking-card-close";
      closeBtn.textContent = "×";
      closeBtn.setAttribute("aria-label", `Remove ${appName}`);
      closeBtn.addEventListener("click", e => {
        e.stopPropagation();
        const next = (Array.isArray(sessionRecents) ? sessionRecents : []).filter(n => n !== appName);
        localStorage.setItem("alex-recent-apps", JSON.stringify(next));
        renderMultitaskingPanel();
      });

      const iconWrap = document.createElement("div");
      iconWrap.className = "app-icon-box";
      renderAppIconInto(iconWrap, appName, custom?.icon || "");

      const title = document.createElement("span");
      title.className = "multitasking-card-title";
      title.textContent = custom?.name || appName;

      card.append(closeBtn, iconWrap, title);
      card.addEventListener("click", () => {
        closeMultitaskingPanel();
        handleAppLaunch(appName, custom?.name || appName);
      });
      cardsEl.appendChild(card);
    });
  }

  favBar.innerHTML = "";
  loadFavouriteNames().forEach(fav => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "drawer-pill-btn";
    btn.textContent = customMap[fav]?.name || fav;
    btn.addEventListener("click", () => {
      closeMultitaskingPanel();
      handleAppLaunch(fav, customMap[fav]?.name || fav);
    });
    favBar.appendChild(btn);
  });
}

function openMultitaskingPanel() {
  const panel = document.getElementById("multitasking-panel");
  if (!panel) return;
  renderMultitaskingPanel();
  panel.classList.add("active");
  panel.setAttribute("aria-hidden", "false");
}

function closeMultitaskingPanel() {
  const panel = document.getElementById("multitasking-panel");
  if (!panel) return;
  panel.classList.remove("active");
  panel.setAttribute("aria-hidden", "true");
}

function initMultitaskingPanel() {
  document.getElementById("recents-trigger")?.addEventListener("click", openMultitaskingPanel);
  document.getElementById("shade-open-recents")?.addEventListener("click", () => {
    closeNotificationsShade();
    openMultitaskingPanel();
  });
  document.getElementById("multitasking-close")?.addEventListener("click", closeMultitaskingPanel);
  document.getElementById("multitasking-panel")?.addEventListener("click", e => {
    if (e.target.id === "multitasking-panel") closeMultitaskingPanel();
  });
  document.getElementById("multitasking-clear-all")?.addEventListener("click", () => {
    localStorage.setItem("alex-recent-apps", "[]");
    renderMultitaskingPanel();
    renderSidebarContents();
    showToast("Cleared launcher recents");
  });
}

// NOTIFICATION SHADE & PRIVATE SPACE TOGGLE & GESTURE ENGINE + 3D PARALLAX
function togglePrivateSpaceMode() {
  const next = !isPrivateModeActive();
  localStorage.setItem("alex-private-mode", next ? "true" : "false");
  applyLauncherSettings();
  displayApps();
  showToast(next ? "Private Space activated" : "Returned to Standard Home");
}

function openNotificationsShade() {
  const shade = document.getElementById("notifications-shade");
  const capText = document.getElementById("shade-capability-text");
  const listEl = document.getElementById("shade-notifications-list");
  if (!shade) return;

  const nativeNotifs = getNativeNotifications();
  const consentOn = localStorage.getItem("alex-setting-notif-consent") !== "false";

  if (capText) {
    capText.textContent = nativeNotifs.supported
      ? "Connected to Android NotificationListener"
      : "Browser Preview · Native Bridge Required for System Notifications";
  }
  if (listEl) {
    listEl.innerHTML = "";
    if (!consentOn) {
      listEl.textContent = "Notification reading disabled in Control Center → Notification Center.";
    } else if (nativeNotifs.supported && nativeNotifs.items.length > 0) {
      nativeNotifs.items.forEach(item => {
        const div = document.createElement("div");
        div.style.marginBottom = "8px";
        div.innerHTML = `<strong>${item.app || "App"}</strong>: ${item.text || item.title || ""}`;
        listEl.appendChild(div);
      });
    } else if (nativeNotifs.supported) {
      listEl.textContent = "No active Android notifications.";
    } else {
      listEl.textContent = nativeNotifs.reason;
    }
  }
  shade.classList.add("active");
  shade.setAttribute("aria-hidden", "false");
}

function closeNotificationsShade() {
  const shade = document.getElementById("notifications-shade");
  if (!shade) return;
  shade.classList.remove("active");
  shade.setAttribute("aria-hidden", "true");
}

function runGestureAction(action) {
  switch (action) {
    case "drawer": openDrawer(""); break;
    case "search":
      openDrawer("");
      setTimeout(() => document.getElementById("drawer-search")?.focus(), 40);
      break;
    case "notifications": openNotificationsShade(); break;
    case "multitasking": openMultitaskingPanel(); break;
    case "sidebar": {
      const sb = document.getElementById("floating-sidebar");
      const open = sb?.classList.toggle("open");
      document.getElementById("sidebar-toggle-btn")?.setAttribute("aria-expanded", open ? "true" : "false");
      break;
    }
    case "lock": engageLockScreen(); break;
    case "customize": window.location.href = "./settings.html"; break;
    case "music": selectWidgetTab("music"); audioEngine.togglePlay(); break;
    case "weather": selectWidgetTab("weather"); openWeatherCityModal(); break;
    case "private-space": togglePrivateSpaceMode(); break;
    default: break;
  }
}

function initHomeGesturesAndParallax() {
  const launcher = document.getElementById("launcher-root");
  if (!launcher) return;

  const getGestureSetting = (key, def) => localStorage.getItem("alex-setting-gesture-" + key) || def;
  let gestureStartX = 0;
  let gestureStartY = 0;
  let gestureActive = false;
  let twoFingerTriggered = false;
  let longPressTimer = null;
  let lastCanvasTapAt = 0;

  launcher.addEventListener("touchstart", e => {
    if (e.touches.length >= 2) {
      twoFingerTriggered = true;
      clearTimeout(longPressTimer);
      triggerHaptic(14);
      runGestureAction(getGestureSetting("two-finger", "private-space"));
    }
  }, { passive: true });

  launcher.addEventListener("pointerdown", e => {
    if (twoFingerTriggered) return;
    if (e.target.closest("#app-wheel, .favourites, #widget-stack, #floating-sidebar, input, select, button, a")) return;
    gestureStartX = e.clientX;
    gestureStartY = e.clientY;
    gestureActive = true;
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
      if (!gestureActive) return;
      gestureActive = false;
      triggerHaptic(18);
      runGestureAction(getGestureSetting("long-press", "customize"));
    }, 550);
  });

  launcher.addEventListener("pointermove", e => {
    if (!gestureActive) return;
    if (Math.hypot(e.clientX - gestureStartX, e.clientY - gestureStartY) > 16) {
      clearTimeout(longPressTimer);
    }
  });

  launcher.addEventListener("pointerup", e => {
    clearTimeout(longPressTimer);
    if (twoFingerTriggered) {
      twoFingerTriggered = false;
      gestureActive = false;
      return;
    }
    if (!gestureActive) return;
    gestureActive = false;

    const dx = e.clientX - gestureStartX;
    const dy = e.clientY - gestureStartY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absY > 68 && absY > absX * 1.3) {
      triggerHaptic(10);
      runGestureAction(dy < 0 ? getGestureSetting("swipe-up", "drawer") : getGestureSetting("swipe-down", "notifications"));
      return;
    }
    if (absX > 68 && absX > absY * 1.3) {
      triggerHaptic(10);
      runGestureAction(dx < 0 ? getGestureSetting("swipe-left", "sidebar") : getGestureSetting("swipe-right", "multitasking"));
      return;
    }
    if (absX < 12 && absY < 12) {
      const now = Date.now();
      if (now - lastCanvasTapAt < 280) {
        lastCanvasTapAt = 0;
        triggerHaptic(12);
        runGestureAction(getGestureSetting("double-tap", "lock"));
      } else {
        lastCanvasTapAt = now;
      }
    }
  });

  launcher.addEventListener("pointercancel", () => {
    clearTimeout(longPressTimer);
    gestureActive = false;
    twoFingerTriggered = false;
  });

  // 3D PARALLAX (POINTER + GYROSCOPE) RESPECTING DEPTH & BATTERY SETTINGS
  let parallaxFrame = null;
  let baseGamma = null;
  let baseBeta = null;

  const canParallaxMotion = () => {
    const d = document.documentElement.dataset;
    if (document.hidden || d.performanceMode === "low" || d.threeDWallpaper === "false" || d.motionEnabled === "false" || d.animationIntensity === "off" || d.reduceMotion === "true") {
      return false;
    }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return false;
    return true;
  };

  const applyParallaxOffset = (nxRatio, nyRatio) => {
    if (parallaxFrame) return;
    parallaxFrame = requestAnimationFrame(() => {
      parallaxFrame = null;
      if (!canParallaxMotion()) return;
      const sensitivity = Math.max(0, Math.min(30, Number(document.documentElement.dataset.parallaxSensitivity ?? 14)));
      const depthScale = Number(getComputedStyle(document.documentElement).getPropertyValue("--wallpaper-depth")) || 1;
      const px = -(nxRatio * sensitivity * depthScale);
      const py = -(nyRatio * sensitivity * depthScale);
      document.documentElement.style.setProperty("--px", `${px.toFixed(1)}px`);
      document.documentElement.style.setProperty("--py", `${py.toFixed(1)}px`);
    });
  };

  window.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse" || !canParallaxMotion()) return;
    applyParallaxOffset(
      Math.max(-1, Math.min(1, (e.clientX / window.innerWidth - 0.5) * 2)),
      Math.max(-1, Math.min(1, (e.clientY / window.innerHeight - 0.5) * 2))
    );
  });

  if ("DeviceOrientationEvent" in window) {
    window.addEventListener("deviceorientation", e => {
      if (e.gamma === null || e.beta === null || !canParallaxMotion()) return;
      if (baseGamma === null) baseGamma = e.gamma;
      if (baseBeta === null) baseBeta = e.beta;
      applyParallaxOffset(
        Math.max(-25, Math.min(25, e.gamma - baseGamma)) / 25,
        Math.max(-25, Math.min(25, e.beta - baseBeta)) / 25
      );
    });
  }
}

// APP DRAWER (GRID / NIAGARA LIST / SMART CATEGORIES / SORT / MANAGE)
function toggleAppFavourite(baseName) {
  const favs = loadFavouriteNames();
  const exists = favs.includes(baseName);
  saveFavouriteNames(exists ? favs.filter(n => n !== baseName) : [...favs, baseName]);
  applyHomeSlotsAndIcons();
  displayApps();
  showToast(exists ? `Removed ${baseName} from Favourites` : `Pinned ${baseName} to Favourites`);
}

function toggleAppHidden(baseName) {
  const customMap = loadCustomAppsMap();
  const current = customMap[baseName] || {};
  const nextHidden = current.hidden !== true;
  customMap[baseName] = { ...current, hidden: nextHidden };
  localStorage.setItem("alex-custom-apps", JSON.stringify(customMap));
  displayApps();
  showToast(nextHidden ? `${baseName} hidden (Settings → Privacy Center)` : `${baseName} restored`);
}

function createAppButton(app, notifCounts = new Map()) {
  const wrapper = document.createElement("div");
  wrapper.className = "drawer-app-card";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "drawer-app";
  button.dataset.appName = app.name;

  const icon = document.createElement("span");
  icon.className = "app-icon";
  if (app.nativeIconUrl) {
    const img = document.createElement("img");
    img.src = app.nativeIconUrl;
    img.alt = app.name;
    img.className = "custom-imported-icon";
    icon.appendChild(img);
  } else {
    renderAppIconInto(icon, app.baseName, app.customGlyph);
  }
  if (app.color) {
    icon.style.borderColor = app.color;
    icon.style.boxShadow = `0 0 var(--app-icon-glow, 9px) ${app.color}`;
  }

  const name = document.createElement("span");
  name.className = "app-name";
  name.textContent = app.name;
  const categoryTag = document.createElement("span");
  categoryTag.className = "app-category-tag";
  categoryTag.textContent = app.isFavourite ? `★ ${app.category}` : app.category;

  button.append(icon, name, categoryTag);
  button.addEventListener("click", () => handleAppLaunch(app.baseName || app.name, app.name));
  wrapper.appendChild(button);
  attachBadgeIfAny(wrapper, app.baseName, notifCounts);

  if (manageAppsMode) {
    const controls = document.createElement("div");
    controls.className = "drawer-app-manage-actions";
    const favBtn = document.createElement("button");
    favBtn.type = "button";
    favBtn.className = "drawer-mini-action" + (app.isFavourite ? " fav-active" : "");
    favBtn.textContent = app.isFavourite ? "★" : "☆";
    favBtn.addEventListener("click", e => { e.stopPropagation(); toggleAppFavourite(app.baseName); });
    const hideBtn = document.createElement("button");
    hideBtn.type = "button";
    hideBtn.className = "drawer-mini-action";
    hideBtn.textContent = "Hide";
    hideBtn.addEventListener("click", e => { e.stopPropagation(); toggleAppHidden(app.baseName); });
    controls.append(favBtn, hideBtn);
    wrapper.appendChild(controls);
  }
  return wrapper;
}

function createLibraryFolder(categoryName, categoryApps) {
  const wrapper = document.createElement("div");
  wrapper.className = "app-library-folder";
  const card = document.createElement("div");
  card.className = "library-folder-card";
  card.setAttribute("role", "group");
  card.setAttribute("aria-label", `${categoryName} folder`);

  const openFolder = () => { expandedLibraryCategory = categoryName; displayApps(); };
  card.addEventListener("click", event => { if (event.target === card) openFolder(); });

  const directApps = categoryApps.length > 4 ? categoryApps.slice(0, 3) : categoryApps.slice(0, 4);
  directApps.forEach(app => {
    const appBtn = document.createElement("button");
    appBtn.type = "button";
    appBtn.className = "library-big-icon";
    appBtn.title = app.name;
    renderAppIconInto(appBtn, app.baseName, app.customGlyph);
    if (app.color) {
      appBtn.style.borderColor = app.color;
      appBtn.style.boxShadow = `0 0 var(--app-icon-glow, 8px) ${app.color}`;
    }
    appBtn.addEventListener("click", e => { e.stopPropagation(); handleAppLaunch(app.baseName || app.name, app.name); });
    card.appendChild(appBtn);
  });

  if (categoryApps.length > 4) {
    const miniCluster = document.createElement("button");
    miniCluster.type = "button";
    miniCluster.className = "library-mini-cluster";
    categoryApps.slice(3, 7).forEach(miniApp => {
      const miniIcon = document.createElement("span");
      miniIcon.className = "library-mini-icon";
      renderAppIconInto(miniIcon, miniApp.baseName, miniApp.customGlyph);
      miniCluster.appendChild(miniIcon);
    });
    miniCluster.addEventListener("click", e => { e.stopPropagation(); openFolder(); });
    card.appendChild(miniCluster);
  }

  const label = document.createElement("button");
  label.type = "button";
  label.className = "library-folder-label";
  label.textContent = categoryName;
  label.addEventListener("click", openFolder);
  wrapper.append(card, label);
  return wrapper;
}

function displayApps(options = {}) {
  const { forceFlat = false } = options;
  const drawerGrid = document.getElementById("drawer-grid");
  const drawerHeading = document.getElementById("drawer-heading");
  const searchInput = document.getElementById("drawer-search");
  const searchText = (searchInput?.value || "").toLowerCase().trim();
  const visibleApps = getEffectiveApps(false);
  const sortMode = localStorage.getItem("alex-setting-drawer-sort") || "name";
  const recentOrder = loadJsonStorage("alex-recent-apps", []);
  const notifCounts = getNotificationCountMap();

  const filtered = visibleApps
    .filter(app => {
      const matchesCategory =
        activeCategory === "All" ||
        (activeCategory === "Favourites" && app.isFavourite) ||
        app.category === activeCategory;
      return matchesCategory && app.name.toLowerCase().includes(searchText);
    })
    .sort((a, b) => {
      if (sortMode === "category") {
        const cmp = a.category.localeCompare(b.category);
        return cmp !== 0 ? cmp : a.name.localeCompare(b.name);
      }
      if (sortMode === "recent" && Array.isArray(recentOrder)) {
        const ia = recentOrder.indexOf(a.baseName);
        const ib = recentOrder.indexOf(b.baseName);
        if (ia !== -1 || ib !== -1) {
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        }
      }
      return a.name.localeCompare(b.name);
    });

  drawerGrid.innerHTML = "";
  drawerGrid.classList.remove("library-folder-view", "library-expanded-view");

  if (drawerHeading) {
    drawerHeading.textContent = isPrivateModeActive()
      ? "Private Space"
      : activeCategory === "All"
      ? (searchText ? `Search results for "${searchText}"` : "All Applications")
      : activeCategory === "Favourites"
      ? "Favourite Applications"
      : `${activeCategory} Apps`;
  }

  if (filtered.length === 0) {
    drawerGrid.innerHTML = isPrivateModeActive()
      ? '<p class="drawer-empty">No apps assigned to Private Space (configure in Settings → Privacy Center).</p>'
      : '<p class="drawer-empty">No apps found</p>';
    return;
  }

  const layout = "categories";
  if (layout === "categories" && !forceFlat && searchText === "" && activeCategory === "All") {
    if (expandedLibraryCategory) {
      const folderApps =
        expandedLibraryCategory === "Suggestions"
          ? getRecentSuggestions()
          : visibleApps.filter(app => app.category === expandedLibraryCategory).sort((a, b) => a.name.localeCompare(b.name));
      if (folderApps.length > 0) {
        drawerGrid.classList.add("library-expanded-view");
        if (drawerHeading) drawerHeading.textContent = expandedLibraryCategory;
        const headerBar = document.createElement("div");
        headerBar.className = "library-expanded-header";
        const backBtn = document.createElement("button");
        backBtn.type = "button";
        backBtn.className = "library-back-btn";
        backBtn.textContent = "← App Library";
        backBtn.addEventListener("click", () => { expandedLibraryCategory = null; displayApps(); });
        const countBadge = document.createElement("span");
        countBadge.className = "library-count-badge";
        countBadge.textContent = `${folderApps.length} apps`;
        headerBar.append(backBtn, countBadge);
        const itemsGrid = document.createElement("div");
        itemsGrid.className = "library-expanded-grid";
        folderApps.forEach(app => itemsGrid.appendChild(createAppButton(app, notifCounts)));
        drawerGrid.append(headerBar, itemsGrid);
        return;
      }
      expandedLibraryCategory = null;
    }

    drawerGrid.classList.add("library-folder-view");
    if (drawerHeading) drawerHeading.textContent = isPrivateModeActive() ? "Private Library" : "App Library";
    const groups = new Map();
    groups.set("Suggestions", getRecentSuggestions());
    const categoryList = ["Tools", "Media", "Social", "Productivity", "Education", "Games"];
    filtered.forEach(app => {
      if (app.category && !categoryList.includes(app.category)) {
        categoryList.push(app.category);
      }
    });
    categoryList.forEach(cat => {
      const catApps = filtered.filter(app => app.category === cat);
      if (catApps.length > 0) groups.set(cat, catApps);
    });
    groups.forEach((groupApps, categoryName) => drawerGrid.appendChild(createLibraryFolder(categoryName, groupApps)));
    return;
  }

  if (layout === "list") {
    let lastLetter = "";
    filtered.forEach(app => {
      const firstLetter = app.name.charAt(0).toUpperCase();
      if (sortMode === "name" && firstLetter !== lastLetter) {
        lastLetter = firstLetter;
        const header = document.createElement("div");
        header.className = "niagara-letter-header";
        header.dataset.letterAnchor = firstLetter;
        header.textContent = firstLetter;
        drawerGrid.appendChild(header);
      }
      drawerGrid.appendChild(createAppButton(app, notifCounts));
    });
    return;
  }

  filtered.forEach(app => drawerGrid.appendChild(createAppButton(app, notifCounts)));
}

function openDrawer(initialSearch = "") {
  const drawer = document.getElementById("app-drawer");
  const drawerSearch = document.getElementById("drawer-search");
  if (!drawer) return;
  expandedLibraryCategory = null;
  drawer.classList.add("active");
  drawer.setAttribute("aria-hidden", "false");
  if (drawerSearch) drawerSearch.value = initialSearch;
  displayApps();
}

function closeDrawer() {
  const drawer = document.getElementById("app-drawer");
  if (!drawer) return;
  expandedLibraryCategory = null;
  drawer.classList.remove("active");
  drawer.setAttribute("aria-hidden", "true");
}

window.displayApps = displayApps;
window.openDrawer = openDrawer;
window.closeDrawer = closeDrawer;

document.addEventListener("DOMContentLoaded", () => {
  applyLauncherSettings();
  updateClock();
  setInterval(updateClock, 1000);

  initParticlesCanvas();
  initSystemTelemetry();
  initWidgetStack();
  initWeatherWidget();
  initMusicWidget();
  initCalendarWidget();
  initRadialWheel();
  initFloatingSidebar();
  initMultitaskingPanel();
  initLockOverlay();
  initHomeGesturesAndParallax();

  const appsButton = document.getElementById("apps-wheel-button");
  const dockButton = document.getElementById("open-apps");
  const drawerClose = document.getElementById("drawer-close");
  const manageBtn = document.getElementById("drawer-manage-toggle");

  appsButton?.addEventListener("click", () => openDrawer(""));
  dockButton?.addEventListener("click", () => openDrawer(""));
  drawerClose?.addEventListener("click", closeDrawer);
  document.getElementById("drawer-search")?.addEventListener("input", () => displayApps());
  manageBtn?.addEventListener("click", () => {
    manageAppsMode = !manageAppsMode;
    manageBtn.setAttribute("aria-pressed", manageAppsMode ? "true" : "false");
    manageBtn.textContent = manageAppsMode ? "Done" : "Manage";
    displayApps();
  });

  document.getElementById("notifications-trigger")?.addEventListener("click", openNotificationsShade);
  document.getElementById("shade-close")?.addEventListener("click", closeNotificationsShade);
  document.getElementById("notifications-shade")?.addEventListener("click", e => {
    if (e.target.id === "notifications-shade") closeNotificationsShade();
  });
  document.getElementById("shade-refresh-weather")?.addEventListener("click", () => {
    closeNotificationsShade();
    refreshWeatherFromGps();
  });
  document.getElementById("shade-open-drawer")?.addEventListener("click", () => {
    closeNotificationsShade();
    openDrawer("");
  });
  document.getElementById("modal-close")?.addEventListener("click", closeLauncherModal);
  document.getElementById("launcher-modal")?.addEventListener("click", e => {
    if (e.target.id === "launcher-modal") closeLauncherModal();
  });

  document.querySelectorAll("[data-app], .wheel-item[data-slot]").forEach(item => {
    item.addEventListener("click", () => {
      if (item.dataset.action === "drawer") { openDrawer(""); return; }
      const baseName = item.dataset.app;
      if (!baseName) return;
      const custom = loadCustomAppsMap()[baseName];
      handleAppLaunch(baseName, custom?.name || baseName);
    });
  });

  document.querySelectorAll(".drawer-categories button").forEach(button => {
    button.addEventListener("click", () => {
      expandedLibraryCategory = null;
      activeCategory = button.dataset.category || "All";
      document.querySelectorAll(".drawer-categories button").forEach(item => item.classList.remove("selected"));
      button.classList.add("selected");
      displayApps();
    });
  });

  // ALPHABET NAVIGATION & NIAGARA WAVE SCRUBBER
  const alphabetBar = document.getElementById("drawer-alphabet");
  const alphabetButtons = alphabetBar ? [...alphabetBar.querySelectorAll("button")] : [];
  const letterBubble = document.getElementById("niagara-letter-bubble");
  let isScrubbingAlphabet = false;
  let lastScrubbedLetter = "";

  function jumpToLetter(letter, smooth = true) {
    const targetLetter = (letter || "").toUpperCase();
    if (!targetLetter) return;
    expandedLibraryCategory = null;
    if (activeCategory !== "All") {
      activeCategory = "All";
      document.querySelectorAll(".drawer-categories button").forEach(item => item.classList.toggle("selected", item.dataset.category === "All"));
    }
    if (drawerSearch && drawerSearch.value !== "") drawerSearch.value = "";
    const currentLayout = document.documentElement.dataset.drawerLayout || "grid";
    if (currentLayout === "categories" || !drawerGrid?.children.length) displayApps({ forceFlat: true });
    if (!drawerGrid) return;
    const anchor = drawerGrid.querySelector(`[data-letter-anchor="${targetLetter}"]`);
    const matchingApp =
      anchor ||
      [...drawerGrid.querySelectorAll(".drawer-app")].find(item => {
        const nameEl = item.querySelector(".app-name");
        return nameEl && nameEl.textContent.toUpperCase().startsWith(targetLetter);
      });
    if (matchingApp) matchingApp.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: anchor ? "start" : "center" });
  }

  function updateAlphabetWave(clientY) {
    if (!alphabetBar || alphabetButtons.length === 0) return;
    let closestBtn = null;
    let closestDist = Infinity;
    alphabetButtons.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      const dist = Math.abs(clientY - (rect.top + rect.height / 2));
      if (dist < closestDist) { closestDist = dist; closestBtn = btn; }
      const radius = 90;
      if (dist < radius) {
        const ratio = Math.cos(((dist / radius) * Math.PI) / 2);
        btn.style.transform = `translateX(${-(ratio * 18).toFixed(1)}px) scale(${(1 + ratio * 0.42).toFixed(2)})`;
        btn.classList.toggle("wave-active", dist < 24);
      } else {
        btn.style.transform = "";
        btn.classList.remove("wave-active");
      }
    });
    if (closestBtn) {
      const letter = (closestBtn.dataset.letter || "").toUpperCase();
      if (letterBubble) {
        const contentRect = alphabetBar.parentElement?.getBoundingClientRect();
        if (contentRect) letterBubble.style.top = `${Math.max(32, Math.min(contentRect.height - 32, clientY - contentRect.top))}px`;
        letterBubble.textContent = letter;
        letterBubble.classList.add("active");
      }
      if (letter !== lastScrubbedLetter) { lastScrubbedLetter = letter; jumpToLetter(letter, false); }
    }
  }

  function resetAlphabetWave() {
    isScrubbingAlphabet = false;
    lastScrubbedLetter = "";
    alphabetButtons.forEach(btn => { btn.style.transform = ""; btn.classList.remove("wave-active"); });
    letterBubble?.classList.remove("active");
  }

  alphabetButtons.forEach(button => button.addEventListener("click", () => jumpToLetter(button.dataset.letter, true)));
  alphabetBar?.addEventListener("pointerdown", e => { isScrubbingAlphabet = true; alphabetBar.setPointerCapture?.(e.pointerId); updateAlphabetWave(e.clientY); });
  alphabetBar?.addEventListener("pointermove", e => { if (isScrubbingAlphabet) updateAlphabetWave(e.clientY); });
  alphabetBar?.addEventListener("pointerup", resetAlphabetWave);
  alphabetBar?.addEventListener("pointercancel", resetAlphabetWave);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      if (document.getElementById("launcher-modal")?.classList.contains("active")) closeLauncherModal();
      else if (document.getElementById("multitasking-panel")?.classList.contains("active")) closeMultitaskingPanel();
      else if (document.getElementById("notifications-shade")?.classList.contains("active")) closeNotificationsShade();
      else if (expandedLibraryCategory) { expandedLibraryCategory = null; displayApps(); }
      else closeDrawer();
    }
  });

  displayApps();
});

window.addEventListener("pageshow", () => {
  applyLauncherSettings();
  displayApps();
});

window.addEventListener("storage", () => {
  applyLauncherSettings();
  displayApps();
});
