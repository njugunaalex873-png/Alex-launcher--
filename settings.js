// ALEX LAUNCHER - PREMIUM CONTROL CENTER
import { APP_CATALOG, renderAppIconInto } from "./icons.js";
import {
  getRuntimeCapabilities,
  hashLauncherSecret,
  requestNativeNotificationAccess
} from "./android-bridge.js";

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
const DEFAULT_GESTURES = {
  "swipe-up": "drawer",
  "swipe-down": "notifications",
  "swipe-left": "sidebar",
  "swipe-right": "multitasking",
  "double-tap": "lock",
  "long-press": "customize",
  "two-finger": "private-space"
};

const GESTURE_ACTION_OPTIONS = [
  ["drawer", "Open App Drawer"],
  ["search", "Search Apps (Drawer)"],
  ["notifications", "Notification Shade"],
  ["multitasking", "Multitasking Recents"],
  ["sidebar", "Toggle Floating Sidebar"],
  ["lock", "Lock Launcher"],
  ["customize", "Open Control Center"],
  ["music", "Play / Pause Music"],
  ["weather", "Open Weather Location"],
  ["private-space", "Toggle Private Space"],
  ["none", "None"]
];

const FONTS = [
  "Roboto", "Poppins", "Montserrat", "Open Sans", "Lato",
  "Nunito", "Ubuntu", "Raleway", "Playfair Display",
  "Merriweather", "Oswald", "Bebas Neue", "Quicksand",
  "Dancing Script", "Pacifico", "Orbitron", "Space Grotesk",
  "Comfortaa", "Josefin Sans", "Cinzel"
];

const PROFILE_KEYS_SNAPSHOT = [
  "alex-theme",
  "alex-font",
  "alex-font-size",
  "alex-icon-pack",
  "alex-icon-shape",
  "alex-app-style",
  "alex-favourites",
  "alex-wheel-slots",
  "alex-enabled-widgets",
  "alex-widget-order",
  "alex-sidebar-apps",
  "alex-setting-wallpaper-mode",
  "alex-setting-particles-enabled",
  "alex-setting-glass-mode",
  "alex-setting-widgets-visible",
  "alex-setting-drawer-layout",
  "alex-setting-animation-intensity",
  "alex-setting-performance-mode",
  "alex-setting-clock-type",
  "alex-setting-edge-lighting",
  "alex-setting-sidebar-enabled"
];

const STARTER_PROFILES = {
  Personal: {
    "alex-theme": "purple",
    "alex-setting-wallpaper-mode": "amoled",
    "alex-setting-particles-enabled": "false",
    "alex-setting-widgets-visible": "true",
    "alex-setting-drawer-layout": "grid",
    "alex-setting-animation-intensity": "balanced",
    "alex-setting-performance-mode": "standard"
  },
  Work: {
    "alex-theme": "cyber",
    "alex-setting-wallpaper-mode": "amoled",
    "alex-setting-particles-enabled": "false",
    "alex-setting-widgets-visible": "true",
    "alex-setting-drawer-layout": "list",
    "alex-setting-animation-intensity": "subtle",
    "alex-setting-performance-mode": "standard",
    "alex-favourites": JSON.stringify(["Calendar", "Notes", "Mail", "Chrome"])
  },
  Study: {
    "alex-theme": "emerald",
    "alex-setting-wallpaper-mode": "amoled",
    "alex-setting-particles-enabled": "false",
    "alex-setting-widgets-visible": "true",
    "alex-setting-drawer-layout": "categories",
    "alex-setting-animation-intensity": "subtle",
    "alex-favourites": JSON.stringify(["Notes", "Calculator", "Calendar", "Chrome"])
  },
  Minimal: {
    "alex-theme": "black",
    "alex-setting-wallpaper-mode": "amoled",
    "alex-setting-particles-enabled": "false",
    "alex-setting-widgets-visible": "false",
    "alex-setting-drawer-layout": "list",
    "alex-setting-animation-intensity": "off",
    "alex-setting-performance-mode": "low"
  },
  Gaming: {
    "alex-theme": "crimson",
    "alex-setting-wallpaper-mode": "aurora",
    "alex-setting-particles-enabled": "true",
    "alex-setting-widgets-visible": "true",
    "alex-setting-animation-intensity": "vivid",
    "alex-setting-edge-lighting": "true",
    "alex-setting-performance-mode": "standard"
  }
};

function loadJson(key, fallback) {
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

document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const settingsHome = document.getElementById("settings-home");
  const pages = document.querySelectorAll(".settings-page");

  function openPage(pageId) {
    const selectedPage = document.getElementById("page-" + pageId);
    if (!selectedPage) return;
    if (settingsHome) settingsHome.style.display = "none";
    pages.forEach(page => page.classList.remove("active"));
    selectedPage.classList.add("active");

    if (pageId === "privacy") {
      renderHiddenAppsList();
      renderPrivacyChecklists();
      refreshPinStatus();
    }
    if (pageId === "about") renderCapabilities();
    if (pageId === "animations") renderPerfDiagnostics();
    if (pageId === "themes") renderCustomThemesList();
    if (pageId === "widgets") renderWidgetOrderList();
    if (pageId === "sidebar") renderSidebarChecklist();
    if (pageId === "notifications") renderNotifCenter();
    if (pageId === "profiles") renderProfilesList();
  }

  document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => openPage(button.dataset.page));
  });

  document.querySelectorAll(".settings-back").forEach(button => {
    if (!button.closest(".settings-page")) return;
    if (button.textContent.trim().startsWith("←")) {
      button.addEventListener("click", () => {
        pages.forEach(page => page.classList.remove("active"));
        if (settingsHome) settingsHome.style.display = "block";
      });
    }
  });

  document.getElementById("settings-close")?.addEventListener("click", () => {
    window.location.href = "./index.html";
  });

  // Support opening direct studio via hash e.g. #page=themes
  if (window.location.hash.startsWith("#page=")) {
    openPage(window.location.hash.replace("#page=", ""));
  }

  // FONTS & FONT SIZE
  const fontGrid = document.getElementById("font-grid");
  const customThemeFontSelect = document.getElementById("custom-theme-font");

  function applyFont(font) {
    const family = `"${font}", Arial, sans-serif`;
    root.style.setProperty("--launcher-font-family", family);
    document.body.style.fontFamily = family;
  }

  if (customThemeFontSelect) {
    FONTS.forEach(font => {
      const opt = document.createElement("option");
      opt.value = font;
      opt.textContent = font;
      customThemeFontSelect.appendChild(opt);
    });
  }

  if (fontGrid) {
    FONTS.forEach(font => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "font-option";
      button.dataset.font = font;
      button.style.fontFamily = `"${font}", Arial, sans-serif`;

      const title = document.createElement("strong");
      title.textContent = font;
      const sample = document.createElement("small");
      sample.textContent = "Alex Launcher • Aa Bb 123";
      button.append(title, sample);

      button.addEventListener("click", () => {
        applyFont(font);
        localStorage.setItem("alex-font", font);
        document.querySelectorAll(".font-option").forEach(item => item.classList.remove("selected"));
        button.classList.add("selected");
      });

      fontGrid.appendChild(button);
    });
  }

  const savedFont = localStorage.getItem("alex-font");
  if (savedFont) {
    applyFont(savedFont);
    document.querySelectorAll(".font-option").forEach(btn => {
      btn.classList.toggle("selected", btn.dataset.font === savedFont);
    });
  }

  const fontSize = document.getElementById("font-size");
  const fontSizeValue = document.getElementById("font-size-value");
  function applyFontSize(value) {
    root.style.setProperty("--launcher-font-size", value + "px");
    if (fontSizeValue) fontSizeValue.textContent = value + "px";
    localStorage.setItem("alex-font-size", value);
  }
  fontSize?.addEventListener("input", () => applyFontSize(fontSize.value));
  const savedFontSize = localStorage.getItem("alex-font-size");
  if (savedFontSize && fontSize) {
    fontSize.value = savedFontSize;
    applyFontSize(savedFontSize);
  }

  // THEME STUDIO (BUILT-IN + CUSTOM THEME CREATOR)
  function applyActiveTheme(themeId) {
    if (themeId && themeId.startsWith("custom:")) {
      const customId = themeId.slice(7);
      const list = loadJson("alex-custom-themes", []);
      const found = Array.isArray(list) ? list.find(t => t.id === customId) : null;
      if (found) {
        root.dataset.theme = "custom";
        applyDynamicCustomThemeVars(found, root);
        localStorage.setItem("alex-theme", themeId);
        document.querySelectorAll(".theme-option").forEach(i => i.classList.remove("selected"));
        return;
      }
    }
    applyDynamicCustomThemeVars(null, root);
    const base = themeId || "purple";
    root.dataset.theme = base;
    localStorage.setItem("alex-theme", base);
    document.querySelectorAll(".theme-option").forEach(button => {
      button.classList.toggle("selected", button.dataset.theme === base);
    });
  }

  document.querySelectorAll(".theme-option").forEach(button => {
    button.addEventListener("click", () => {
      if (!button.dataset.theme) return;
      applyActiveTheme(button.dataset.theme);
      renderCustomThemesList();
    });
  });

  applyActiveTheme(localStorage.getItem("alex-theme") || "purple");

  const customThemeNameInput = document.getElementById("custom-theme-name");
  const customThemeAccent = document.getElementById("custom-theme-accent");
  const customThemeBg = document.getElementById("custom-theme-bg");
  const customThemePack = document.getElementById("custom-theme-pack");
  const customThemeIntensity = document.getElementById("custom-theme-intensity");
  const customThemeStatus = document.getElementById("custom-theme-status");
  let editingCustomThemeId = null;

  function renderCustomThemesList() {
    const listEl = document.getElementById("custom-themes-list");
    if (!listEl) return;
    const savedList = loadJson("alex-custom-themes", []);
    const activeTheme = localStorage.getItem("alex-theme") || "purple";
    listEl.innerHTML = "";

    if (!Array.isArray(savedList) || savedList.length === 0) {
      listEl.innerHTML = '<small style="color: var(--text-subtle);">No saved custom themes yet.</small>';
      return;
    }

    savedList.forEach(t => {
      const card = document.createElement("div");
      card.className = "studio-item-card" + (activeTheme === `custom:${t.id}` ? " selected" : "");

      const top = document.createElement("div");
      top.className = "studio-item-top";

      const meta = document.createElement("div");
      meta.className = "studio-item-meta";
      const title = document.createElement("strong");
      title.textContent = t.name;
      const sub = document.createElement("small");
      sub.textContent = `${t.accent} · ${t.font} · ${t.pack} icons`;
      meta.append(title, sub);

      const swatch = document.createElement("span");
      swatch.style.width = "26px";
      swatch.style.height = "26px";
      swatch.style.borderRadius = "8px";
      swatch.style.border = `2px solid ${t.accent}`;
      swatch.style.background = t.bg;

      top.append(meta, swatch);

      const actions = document.createElement("div");
      actions.className = "studio-item-actions";

      const applyBtn = document.createElement("button");
      applyBtn.type = "button";
      applyBtn.className = "studio-mini-btn primary";
      applyBtn.textContent = activeTheme === `custom:${t.id}` ? "Active" : "Apply";
      applyBtn.addEventListener("click", () => {
        applyActiveTheme(`custom:${t.id}`);
        if (t.font) {
          applyFont(t.font);
          localStorage.setItem("alex-font", t.font);
        }
        if (t.pack) {
          root.dataset.iconPack = t.pack;
          localStorage.setItem("alex-icon-pack", t.pack);
        }
        if (t.intensity) {
          root.dataset.animationIntensity = t.intensity;
          localStorage.setItem("alex-setting-animation-intensity", t.intensity);
        }
        if (customThemeStatus) customThemeStatus.textContent = `Applied custom theme "${t.name}".`;
        renderCustomThemesList();
      });

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "studio-mini-btn";
      editBtn.textContent = "Edit / Rename";
      editBtn.addEventListener("click", () => {
        editingCustomThemeId = t.id;
        if (customThemeNameInput) customThemeNameInput.value = t.name;
        if (customThemeAccent) customThemeAccent.value = t.accent;
        if (customThemeBg) customThemeBg.value = t.bg;
        if (customThemeFontSelect) customThemeFontSelect.value = t.font || "Poppins";
        if (customThemePack) customThemePack.value = t.pack || "vivid";
        if (customThemeIntensity) customThemeIntensity.value = t.intensity || "balanced";
        if (customThemeStatus) customThemeStatus.textContent = `Editing "${t.name}" — tap Save & Apply to update.`;
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "studio-mini-btn";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", () => {
        const next = savedList.filter(item => item.id !== t.id);
        localStorage.setItem("alex-custom-themes", JSON.stringify(next));
        if (activeTheme === `custom:${t.id}`) applyActiveTheme("purple");
        renderCustomThemesList();
      });

      actions.append(applyBtn, editBtn, delBtn);
      card.append(top, actions);
      listEl.appendChild(card);
    });
  }

  document.getElementById("save-custom-theme-btn")?.addEventListener("click", () => {
    const name = (customThemeNameInput?.value || "").trim() || "Custom Neon";
    const list = loadJson("alex-custom-themes", []);
    const themeObj = {
      id: editingCustomThemeId || `ct-${Date.now()}`,
      name,
      accent: customThemeAccent?.value || "#b400ff",
      bg: customThemeBg?.value || "#050008",
      font: customThemeFontSelect?.value || "Poppins",
      pack: customThemePack?.value || "vivid",
      intensity: customThemeIntensity?.value || "balanced"
    };
    const next = Array.isArray(list) ? list.filter(x => x.id !== themeObj.id) : [];
    next.unshift(themeObj);
    localStorage.setItem("alex-custom-themes", JSON.stringify(next));
    editingCustomThemeId = null;
    if (customThemeNameInput) customThemeNameInput.value = "";

    applyActiveTheme(`custom:${themeObj.id}`);
    applyFont(themeObj.font);
    localStorage.setItem("alex-font", themeObj.font);
    localStorage.setItem("alex-icon-pack", themeObj.pack);
    localStorage.setItem("alex-setting-animation-intensity", themeObj.intensity);
    if (customThemeStatus) customThemeStatus.textContent = `Saved & applied "${themeObj.name}".`;
    renderCustomThemesList();
  });

  // WHEEL STYLE & WHEEL SLOTS & COLOR
  document.querySelectorAll(".wheel-style-option").forEach(button => {
    button.addEventListener("click", () => {
      const wheelStyle = button.dataset.wheelStyle;
      if (!wheelStyle) return;
      root.dataset.wheelStyle = wheelStyle;
      localStorage.setItem("alex-setting-wheel-style", wheelStyle);
      document.querySelectorAll(".wheel-style-option").forEach(item => {
        item.classList.toggle("selected", item === button);
      });
    });
  });

  const savedWheelStyle = localStorage.getItem("alex-setting-wheel-style") || "classic";
  root.dataset.wheelStyle = savedWheelStyle;
  document.querySelectorAll(".wheel-style-option").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.wheelStyle === savedWheelStyle);
  });

  const wheelColorInput = document.getElementById("wheel-custom-color");
  if (wheelColorInput) {
    const savedWheelColor = localStorage.getItem("alex-setting-wheel-color");
    if (savedWheelColor) wheelColorInput.value = savedWheelColor;
    wheelColorInput.addEventListener("input", () => {
      localStorage.setItem("alex-setting-wheel-color", wheelColorInput.value);
    });
  }
  document.getElementById("reset-wheel-color-btn")?.addEventListener("click", () => {
    localStorage.removeItem("alex-setting-wheel-color");
  });

  const wheelSlotsEditor = document.getElementById("wheel-slots-editor");
  const slotLabels = [
    "Top (12 o'clock)", "Top Right (2 o'clock)", "Bottom Right (4 o'clock)",
    "Bottom (6 o'clock)", "Bottom Left (8 o'clock)", "Top Left (10 o'clock)"
  ];

  // FIRST WHEEL (FAVOURITES) EDITOR (MAX 6 APPS)
  const favouritesSlotsEditor = document.getElementById("favourites-slots-editor");

  function loadFavouritesList() {
    const saved = loadJson("alex-favourites", null);
    const list = Array.isArray(saved) && saved.length > 0 ? saved : [...DEFAULT_FAVOURITES];
    return list.slice(0, 6);
  }

  function renderFavouritesEditor() {
    if (!favouritesSlotsEditor) return;
    favouritesSlotsEditor.innerHTML = "";
    const favs = loadFavouritesList();

    favs.forEach((appName, index) => {
      const wrap = document.createElement("div");
      wrap.className = "wheel-slot-field";
      const span = document.createElement("span");
      span.textContent = `Position ${index + 1}`;

      const select = document.createElement("select");
      select.className = "settings-select";
      APP_CATALOG.forEach(app => {
        const opt = document.createElement("option");
        opt.value = app.name;
        opt.textContent = app.name;
        select.appendChild(opt);
      });
      select.value = favs[index] || DEFAULT_FAVOURITES[0];
      select.addEventListener("change", () => {
        const current = loadFavouritesList();
        current[index] = select.value;
        localStorage.setItem("alex-favourites", JSON.stringify(current));
      });

      wrap.append(span, select);

      if (favs.length > 1) {
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "settings-back";
        removeBtn.textContent = "×";
        removeBtn.title = "Remove app from first wheel";
        removeBtn.style.padding = "4px 8px";
        removeBtn.addEventListener("click", () => {
          let current = loadFavouritesList();
          current.splice(index, 1);
          localStorage.setItem("alex-favourites", JSON.stringify(current));
          renderFavouritesEditor();
        });
        wrap.appendChild(removeBtn);
      }

      favouritesSlotsEditor.appendChild(wrap);
    });
  }

  renderFavouritesEditor();

  document.getElementById("add-favourite-slot-btn")?.addEventListener("click", () => {
    let current = loadFavouritesList();
    if (current.length >= 6) {
      showToast("First wheel supports a maximum of 6 apps.");
      return;
    }
    current.push("Camera");
    localStorage.setItem("alex-favourites", JSON.stringify(current));
    renderFavouritesEditor();
  });

  document.getElementById("reset-favourites-btn")?.addEventListener("click", () => {
    localStorage.setItem("alex-favourites", JSON.stringify([...DEFAULT_FAVOURITES]));
    renderFavouritesEditor();
  });

  // SECOND WHEEL (APP WHEEL) EDITOR (NO MAXIMUM)
  function loadWheelSlots() {
    const saved = loadJson("alex-wheel-slots", null);
    return Array.isArray(saved) && saved.length > 0 ? saved : [...DEFAULT_WHEEL_SLOTS];
  }

  function renderWheelSlotsEditor() {
    if (!wheelSlotsEditor) return;
    wheelSlotsEditor.innerHTML = "";
    const slots = loadWheelSlots();

    slots.forEach((slotVal, index) => {
      const wrap = document.createElement("div");
      wrap.className = "wheel-slot-field";
      const span = document.createElement("span");
      span.textContent = `Node ${index + 1}`;

      const select = document.createElement("select");
      select.className = "settings-select";
      const drawerOpt = document.createElement("option");
      drawerOpt.value = "__drawer__";
      drawerOpt.textContent = "App Drawer (▦)";
      select.appendChild(drawerOpt);

      APP_CATALOG.forEach(app => {
        const opt = document.createElement("option");
        opt.value = app.name;
        opt.textContent = app.name;
        select.appendChild(opt);
      });

      select.value = slots[index] || DEFAULT_WHEEL_SLOTS[0];
      select.addEventListener("change", () => {
        const current = loadWheelSlots();
        current[index] = select.value;
        localStorage.setItem("alex-wheel-slots", JSON.stringify(current));
      });

      wrap.append(span, select);

      if (slots.length > 1) {
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "settings-back";
        removeBtn.textContent = "×";
        removeBtn.title = "Remove app from wheel";
        removeBtn.style.padding = "4px 8px";
        removeBtn.addEventListener("click", () => {
          let current = loadWheelSlots();
          current.splice(index, 1);
          localStorage.setItem("alex-wheel-slots", JSON.stringify(current));
          renderWheelSlotsEditor();
        });
        wrap.appendChild(removeBtn);
      }

      wheelSlotsEditor.appendChild(wrap);
    });
  }
  renderWheelSlotsEditor();

  document.getElementById("add-wheel-slot-btn")?.addEventListener("click", () => {
    let current = loadWheelSlots();
    current.push("Camera");
    localStorage.setItem("alex-wheel-slots", JSON.stringify(current));
    renderWheelSlotsEditor();
  });

  document.getElementById("reset-wheel-slots")?.addEventListener("click", () => {
    localStorage.setItem("alex-wheel-slots", JSON.stringify([...DEFAULT_WHEEL_SLOTS]));
    renderWheelSlotsEditor();
  });

  // ICON STUDIO
  function loadCustomAppsMap() {
    const parsed = loadJson("alex-custom-apps", {});
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  }

  function loadFavourites() {
    const parsed = loadJson("alex-favourites", null);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_FAVOURITES];
  }

  function refreshPreviewBarAndSwatches() {
    const customMap = loadCustomAppsMap();
    document.querySelectorAll("[data-preview-app]").forEach(iconEl => {
      const baseName = iconEl.dataset.previewApp;
      const custom = customMap[baseName] || {};
      renderAppIconInto(iconEl, baseName, custom.icon || "");
      iconEl.style.borderColor = custom.color || "";
      iconEl.style.boxShadow = custom.color
        ? `0 0 var(--app-icon-glow, 9px) ${custom.color}`
        : "";
      const labelEl = iconEl.parentElement?.querySelector(".app-style-preview-label");
      if (labelEl) labelEl.textContent = custom.name || baseName;
    });
    document.querySelectorAll("[data-swatch-app]").forEach(swatch => {
      renderAppIconInto(swatch, swatch.dataset.swatchApp || "Camera");
    });
  }

  document.querySelectorAll(".icon-pack-option").forEach(button => {
    button.addEventListener("click", () => {
      const pack = button.dataset.iconPack;
      if (!pack) return;
      root.dataset.iconPack = pack;
      localStorage.setItem("alex-icon-pack", pack);
      document.querySelectorAll(".icon-pack-option").forEach(item => item.classList.remove("selected"));
      button.classList.add("selected");
      refreshPreviewBarAndSwatches();
    });
  });

  const savedIconPack = localStorage.getItem("alex-icon-pack") || "vivid";
  root.dataset.iconPack = savedIconPack;
  document.querySelectorAll(".icon-pack-option").forEach(b => {
    b.classList.toggle("selected", b.dataset.iconPack === savedIconPack);
  });

  const iconShapeSelect = document.getElementById("icon-shape-select");
  if (iconShapeSelect) {
    const savedShape = localStorage.getItem("alex-icon-shape") || "squircle";
    iconShapeSelect.value = savedShape;
    root.dataset.iconShape = savedShape;
    iconShapeSelect.addEventListener("change", () => {
      localStorage.setItem("alex-icon-shape", iconShapeSelect.value);
      root.dataset.iconShape = iconShapeSelect.value;
    });
  }

  const stylePresetDefaults = {
    neon: { radius: "30", glow: "9", border: "1" },
    squircle: { radius: "28", glow: "6", border: "1" },
    circle: { radius: "50", glow: "9", border: "1" },
    glossy: { radius: "33", glow: "10", border: "1" },
    minimal: { radius: "25", glow: "0", border: "0" },
    outline: { radius: "30", glow: "12", border: "2" }
  };

  const radiusControl = document.getElementById("app-corner-radius");
  const radiusValue = document.getElementById("app-corner-radius-value");
  const glowControl = document.getElementById("app-glow-size");
  const glowValue = document.getElementById("app-glow-size-value");
  const borderControl = document.getElementById("app-border-width");
  const borderValue = document.getElementById("app-border-width-value");

  function applyAppFineTuning() {
    const style = root.dataset.appStyle || "neon";
    const def = stylePresetDefaults[style] || stylePresetDefaults.neon;
    const r = localStorage.getItem("alex-setting-app-corner-radius") ?? def.radius;
    const g = localStorage.getItem("alex-setting-app-glow-size") ?? def.glow;
    const b = localStorage.getItem("alex-setting-app-border-width") ?? def.border;

    root.style.setProperty("--app-icon-radius", r + "%");
    if (radiusControl) radiusControl.value = r;
    if (radiusValue) radiusValue.textContent = r + "%";

    root.style.setProperty("--app-icon-glow", g + "px");
    if (glowControl) glowControl.value = g;
    if (glowValue) glowValue.textContent = g + "px";

    root.style.setProperty("--app-icon-border-width", b + "px");
    if (borderControl) borderControl.value = b;
    if (borderValue) borderValue.textContent = b + "px";
  }

  document.querySelectorAll(".app-style-option").forEach(button => {
    button.addEventListener("click", () => {
      const style = button.dataset.appStyle;
      if (!style) return;
      root.dataset.appStyle = style;
      localStorage.setItem("alex-app-style", style);
      document.querySelectorAll(".app-style-option").forEach(item => item.classList.remove("selected"));
      button.classList.add("selected");
      const preset = stylePresetDefaults[style];
      if (preset) {
        localStorage.setItem("alex-setting-app-corner-radius", preset.radius);
        localStorage.setItem("alex-setting-app-glow-size", preset.glow);
        localStorage.setItem("alex-setting-app-border-width", preset.border);
        applyAppFineTuning();
      }
    });
  });

  const savedAppStyle = localStorage.getItem("alex-app-style") || "neon";
  root.dataset.appStyle = savedAppStyle;
  document.querySelectorAll(".app-style-option").forEach(b => {
    b.classList.toggle("selected", b.dataset.appStyle === savedAppStyle);
  });
  applyAppFineTuning();

  radiusControl?.addEventListener("input", () => {
    localStorage.setItem("alex-setting-app-corner-radius", radiusControl.value);
    applyAppFineTuning();
  });
  glowControl?.addEventListener("input", () => {
    localStorage.setItem("alex-setting-app-glow-size", glowControl.value);
    applyAppFineTuning();
  });
  borderControl?.addEventListener("input", () => {
    localStorage.setItem("alex-setting-app-border-width", borderControl.value);
    applyAppFineTuning();
  });

  // Custom Icon Pack JSON Import + Restore All
  const iconPackInput = document.getElementById("import-icon-pack-input");
  const iconPackStatus = document.getElementById("icon-pack-import-status");
  iconPackInput?.addEventListener("change", () => {
    const file = iconPackInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const current = loadCustomAppsMap();
        let importedCount = 0;
        Object.entries(parsed).forEach(([appName, entry]) => {
          if (entry && typeof entry === "object") {
            current[appName] = { ...(current[appName] || {}), ...entry };
            importedCount++;
          }
        });
        localStorage.setItem("alex-custom-apps", JSON.stringify(current));
        refreshPreviewBarAndSwatches();
        if (iconPackStatus) iconPackStatus.textContent = `Imported custom icons for ${importedCount} apps.`;
      } catch {
        if (iconPackStatus) iconPackStatus.textContent = "Invalid icon pack JSON format.";
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("restore-all-icons-btn")?.addEventListener("click", () => {
    localStorage.removeItem("alex-custom-apps");
    refreshPreviewBarAndSwatches();
    if (editAppSelect) populateAppEditorFields(editAppSelect.value);
    if (iconPackStatus) iconPackStatus.textContent = "Restored all original SVG icons.";
  });

  // GENERIC & SYNCED BOOLEAN TOGGLES
  const toggleSyncListeners = {};
  function bindBooleanToggle(elementId, storageKey, defaultVal, onChange) {
    const btn = document.getElementById(elementId);
    const getVal = () =>
      localStorage.getItem(storageKey) !== null
        ? localStorage.getItem(storageKey) !== "false"
        : defaultVal;

    const applyVisual = val => {
      if (btn) {
        btn.classList.toggle("active", val);
        btn.setAttribute("aria-pressed", val ? "true" : "false");
      }
      onChange?.(val);
    };

    if (!toggleSyncListeners[storageKey]) toggleSyncListeners[storageKey] = [];
    toggleSyncListeners[storageKey].push(applyVisual);

    applyVisual(getVal());
    btn?.addEventListener("click", () => {
      const next = !getVal();
      localStorage.setItem(storageKey, next ? "true" : "false");
      toggleSyncListeners[storageKey].forEach(fn => fn(next));
    });
  }

  bindBooleanToggle("toggle-app-labels", "alex-setting-show-app-labels", true, v => {
    root.dataset.showLabels = v ? "true" : "false";
  });
  bindBooleanToggle("toggle-appearance-labels", "alex-setting-show-app-labels", true);
  bindBooleanToggle("toggle-edge-lighting", "alex-setting-edge-lighting", false);
  bindBooleanToggle("toggle-clock-24h", "alex-setting-clock-24h", true);
  bindBooleanToggle("toggle-clock-seconds", "alex-setting-clock-seconds", false);
  bindBooleanToggle("toggle-widgets-visible", "alex-setting-widgets-visible", true);
  bindBooleanToggle("toggle-glass-mode", "alex-setting-glass-mode", true, v => {
    root.dataset.glassMode = v ? "true" : "false";
  });
  bindBooleanToggle("toggle-3d-wallpaper", "alex-setting-3d-wallpaper", true, v => {
    root.dataset.threeDWallpaper = v ? "true" : "false";
  });
  bindBooleanToggle("toggle-motion-enabled", "alex-setting-motion-enabled", true, v => {
    root.dataset.motionEnabled = v ? "true" : "false";
  });
  bindBooleanToggle("toggle-charging-anim", "alex-setting-charging-anim", true);
  bindBooleanToggle("toggle-particles", "alex-setting-particles-enabled", false);
  bindBooleanToggle("toggle-perf-particles", "alex-setting-particles-enabled", false);
  bindBooleanToggle("toggle-3d-icons", "alex-setting-icons-3d", true, v => {
    root.dataset.icons3d = v ? "true" : "false";
  });
  bindBooleanToggle("toggle-icon-reflection", "alex-setting-icon-reflection", false, v => {
    root.dataset.iconReflection = v ? "true" : "false";
  });
  bindBooleanToggle("toggle-haptics", "alex-setting-haptics", true);
  bindBooleanToggle("toggle-music-native-sync", "alex-setting-music-native-sync", true);
  bindBooleanToggle("toggle-sidebar-enabled", "alex-setting-sidebar-enabled", true);
  bindBooleanToggle("toggle-private-home", "alex-private-mode", false);
  bindBooleanToggle("toggle-biometric", "alex-setting-biometric", false);
  bindBooleanToggle("toggle-notif-badges", "alex-setting-notif-badges", true);
  bindBooleanToggle("toggle-notif-consent", "alex-setting-notif-consent", true);
  bindBooleanToggle("toggle-reduce-motion", "alex-setting-reduce-motion", false);

  // Gyroscope permission UI
  const motionBtn = document.getElementById("enable-motion-sensor");
  const motionStatus = document.getElementById("motion-sensor-status");
  if (motionStatus) {
    if (!("DeviceOrientationEvent" in window)) {
      motionStatus.textContent = "Gyroscope not detected on this device; pointer parallax remains active.";
    } else if (typeof window.DeviceOrientationEvent.requestPermission === "function") {
      if (motionBtn) motionBtn.style.display = "inline-block";
      motionStatus.textContent = "Tap above to grant mobile tilt sensor permission.";
      motionBtn?.addEventListener("click", async () => {
        try {
          const perm = await window.DeviceOrientationEvent.requestPermission();
          motionStatus.textContent =
            perm === "granted"
              ? "Device tilt gyroscope enabled."
              : "Tilt sensor permission declined; pointer parallax active.";
        } catch {
          motionStatus.textContent = "Could not request motion permission in browser.";
        }
      });
    } else {
      motionStatus.textContent = "Device tilt gyroscope & pointer parallax supported automatically.";
    }
  }

  // Charging Animation Preview & Color
  const chargingColor = document.getElementById("charging-color");
  if (chargingColor) {
    chargingColor.value = localStorage.getItem("alex-setting-charging-color") || "#d000ff";
    chargingColor.addEventListener("input", () => {
      localStorage.setItem("alex-setting-charging-color", chargingColor.value);
    });
  }
  document.getElementById("preview-charging-btn")?.addEventListener("click", () => {
    const style = localStorage.getItem("alex-setting-charging-style") || "neon";
    const color = localStorage.getItem("alex-setting-charging-color") || "#d000ff";
    root.dataset.chargingStyle = style;
    root.style.setProperty("--charging-color", color);
    const previewOverlay = document.createElement("div");
    previewOverlay.className = "settings-charging-preview";
    previewOverlay.innerHTML = `
      <div class="charging-core">
        <div class="charging-ring outer"></div>
        <div class="charging-ring inner"></div>
        <div class="charging-readout">
          <span class="charging-bolt">⚡</span>
          <strong>Preview</strong>
          <small>Tap anywhere to close</small>
        </div>
      </div>
    `;
    previewOverlay.addEventListener("click", () => previewOverlay.remove());
    document.body.appendChild(previewOverlay);
    setTimeout(() => previewOverlay.remove(), 3400);
  });

  // INDIVIDUAL APP APPEARANCE EDITOR
  const editAppSelect = document.getElementById("edit-app-select");
  const editAppName = document.getElementById("edit-app-name");
  const editAppIcon = document.getElementById("edit-app-icon");
  const editAppImageInput = document.getElementById("edit-app-image-input");
  const editAppColor = document.getElementById("edit-app-color");
  const editAppClearColor = document.getElementById("edit-app-clear-color");
  const editAppFavourite = document.getElementById("edit-app-favourite");
  const editAppVisible = document.getElementById("edit-app-visible");
  const saveCustomAppBtn = document.getElementById("save-custom-app");
  const resetCustomAppBtn = document.getElementById("reset-custom-app");
  const editAppStatus = document.getElementById("edit-app-status");

  let editorAppVisible = true;
  let editorAppFavourite = false;
  let editorCustomColor = "";

  function populateAppEditorFields(appName) {
    const base = APP_CATALOG.find(a => a.name === appName);
    if (!base) return;
    const customMap = loadCustomAppsMap();
    const custom = customMap[appName] || {};
    const favs = loadFavourites();

    if (editAppName) editAppName.value = custom.name || base.name;
    if (editAppIcon) editAppIcon.value = custom.icon || "";
    editorCustomColor = custom.color || "";
    if (editAppColor) editAppColor.value = custom.color || "#a100ff";

    editorAppFavourite = favs.includes(appName);
    if (editAppFavourite) {
      editAppFavourite.classList.toggle("active", editorAppFavourite);
      editAppFavourite.setAttribute("aria-pressed", editorAppFavourite ? "true" : "false");
    }

    editorAppVisible = custom.hidden !== true;
    if (editAppVisible) {
      editAppVisible.classList.toggle("active", editorAppVisible);
      editAppVisible.setAttribute("aria-pressed", editorAppVisible ? "true" : "false");
    }

    if (editAppStatus) {
      editAppStatus.textContent = customMap[appName]
        ? `Custom appearance active for ${base.name}.`
        : `Using ${savedIconPack} SVG icon pack for ${base.name}.`;
    }
  }

  if (editAppSelect) {
    APP_CATALOG.forEach(app => {
      const opt = document.createElement("option");
      opt.value = app.name;
      opt.textContent = `${app.name} (${app.category})`;
      editAppSelect.appendChild(opt);
    });
    populateAppEditorFields(editAppSelect.value);
    refreshPreviewBarAndSwatches();
    editAppSelect.addEventListener("change", () => populateAppEditorFields(editAppSelect.value));
  } else {
    refreshPreviewBarAndSwatches();
  }

  editAppImageInput?.addEventListener("change", () => {
    const file = editAppImageInput.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      // Downscale uploaded icon image cleanly on canvas to save localStorage space
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, 128, 128);
        if (editAppIcon) editAppIcon.value = canvas.toDataURL("image/png");
        if (editAppStatus) editAppStatus.textContent = "Custom image ready — tap Save App to apply.";
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  editAppColor?.addEventListener("input", () => { editorCustomColor = editAppColor.value; });
  editAppClearColor?.addEventListener("click", () => {
    editorCustomColor = "";
    if (editAppStatus) editAppStatus.textContent = "Using active theme color (tap Save App).";
  });
  editAppFavourite?.addEventListener("click", () => {
    editorAppFavourite = !editorAppFavourite;
    editAppFavourite.classList.toggle("active", editorAppFavourite);
    editAppFavourite.setAttribute("aria-pressed", editorAppFavourite ? "true" : "false");
  });
  editAppVisible?.addEventListener("click", () => {
    editorAppVisible = !editorAppVisible;
    editAppVisible.classList.toggle("active", editorAppVisible);
    editAppVisible.setAttribute("aria-pressed", editorAppVisible ? "true" : "false");
  });

  saveCustomAppBtn?.addEventListener("click", () => {
    if (!editAppSelect) return;
    const baseName = editAppSelect.value;
    const base = APP_CATALOG.find(a => a.name === baseName);
    if (!base) return;
    const customMap = loadCustomAppsMap();
    const nextName = (editAppName?.value || "").trim() || base.name;
    const nextIcon = (editAppIcon?.value || "").trim();
    customMap[baseName] = { name: nextName, icon: nextIcon, color: editorCustomColor || "", hidden: !editorAppVisible };
    localStorage.setItem("alex-custom-apps", JSON.stringify(customMap));
    const favs = loadFavourites().filter(n => n !== baseName);
    if (editorAppFavourite) favs.unshift(baseName);
    localStorage.setItem("alex-favourites", JSON.stringify(favs));
    refreshPreviewBarAndSwatches();
    if (editAppStatus) editAppStatus.textContent = `Saved custom appearance for ${nextName}.`;
  });

  resetCustomAppBtn?.addEventListener("click", () => {
    if (!editAppSelect) return;
    const baseName = editAppSelect.value;
    const customMap = loadCustomAppsMap();
    delete customMap[baseName];
    localStorage.setItem("alex-custom-apps", JSON.stringify(customMap));
    populateAppEditorFields(baseName);
    refreshPreviewBarAndSwatches();
    if (editAppStatus) editAppStatus.textContent = `Restored default SVG icon for ${baseName}.`;
  });

  // WIDGET STUDIO: REORDER + ENABLE/DISABLE + COLORS + OPACITY
  const widgetAccentInput = document.getElementById("widget-accent-color");
  if (widgetAccentInput) {
    widgetAccentInput.value = localStorage.getItem("alex-setting-widget-color") || "#a100ff";
    widgetAccentInput.addEventListener("input", () => {
      localStorage.setItem("alex-setting-widget-color", widgetAccentInput.value);
    });
  }
  document.getElementById("reset-widget-color-btn")?.addEventListener("click", () => {
    localStorage.removeItem("alex-setting-widget-color");
  });

  function renderWidgetOrderList() {
    const listEl = document.getElementById("widget-order-list");
    if (!listEl) return;
    let order = loadJson("alex-widget-order", DEFAULT_WIDGET_ORDER);
    if (!Array.isArray(order) || order.length !== 4) order = [...DEFAULT_WIDGET_ORDER];
    let enabled = loadJson("alex-enabled-widgets", DEFAULT_WIDGET_ORDER);
    if (!Array.isArray(enabled)) enabled = [...DEFAULT_WIDGET_ORDER];

    const labels = {
      weather: "Weather Widget",
      music: "Music Player Widget",
      calendar: "Calendar & Events Widget",
      battery: "Battery & System Widget"
    };

    listEl.innerHTML = "";
    order.forEach((key, idx) => {
      const card = document.createElement("div");
      card.className = "studio-item-card";

      const top = document.createElement("div");
      top.className = "studio-item-top";

      const meta = document.createElement("div");
      meta.className = "studio-item-meta";
      meta.innerHTML = `<strong>${labels[key] || key}</strong><small>Position #${idx + 1}</small>`;

      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      const isOn = enabled.includes(key);
      toggleBtn.className = "studio-mini-btn" + (isOn ? " primary" : "");
      toggleBtn.textContent = isOn ? "Enabled" : "Hidden";
      toggleBtn.addEventListener("click", () => {
        const nextEnabled = isOn
          ? enabled.filter(x => x !== key)
          : [...enabled, key];
        localStorage.setItem("alex-enabled-widgets", JSON.stringify(nextEnabled));
        renderWidgetOrderList();
      });

      const upBtn = document.createElement("button");
      upBtn.type = "button";
      upBtn.className = "studio-mini-btn";
      upBtn.textContent = "↑";
      upBtn.disabled = idx === 0;
      upBtn.addEventListener("click", () => {
        const next = [...order];
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
        localStorage.setItem("alex-widget-order", JSON.stringify(next));
        renderWidgetOrderList();
      });

      const downBtn = document.createElement("button");
      downBtn.type = "button";
      downBtn.className = "studio-mini-btn";
      downBtn.textContent = "↓";
      downBtn.disabled = idx === order.length - 1;
      downBtn.addEventListener("click", () => {
        const next = [...order];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        localStorage.setItem("alex-widget-order", JSON.stringify(next));
        renderWidgetOrderList();
      });

      const actions = document.createElement("div");
      actions.className = "studio-item-actions";
      actions.append(toggleBtn, upBtn, downBtn);
      top.append(meta, actions);
      card.appendChild(top);
      listEl.appendChild(card);
    });
  }

  // GESTURE STUDIO
  const gestureSelects = document.querySelectorAll(".gesture-select");
  gestureSelects.forEach(sel => {
    GESTURE_ACTION_OPTIONS.forEach(([val, label]) => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = label;
      sel.appendChild(opt);
    });
    const key = "alex-setting-" + sel.id;
    sel.value = localStorage.getItem(key) || sel.dataset.defaultAction || "none";
    sel.addEventListener("change", () => {
      localStorage.setItem(key, sel.value);
    });
  });

  document.getElementById("reset-gestures-btn")?.addEventListener("click", () => {
    Object.entries(DEFAULT_GESTURES).forEach(([g, action]) => {
      const key = `alex-setting-gesture-${g}`;
      localStorage.setItem(key, action);
      const sel = document.getElementById(`gesture-${g}`);
      if (sel) sel.value = action;
    });
  });

  // SIDEBAR CHECKLIST
  function renderSidebarChecklist() {
    const grid = document.getElementById("sidebar-apps-checklist");
    if (!grid) return;
    const saved = loadJson("alex-sidebar-apps", DEFAULT_SIDEBAR_APPS);
    const activeSet = new Set(Array.isArray(saved) ? saved : DEFAULT_SIDEBAR_APPS);
    grid.innerHTML = "";

    APP_CATALOG.forEach(app => {
      const label = document.createElement("label");
      label.className = "checklist-pill";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = activeSet.has(app.name);
      cb.addEventListener("change", () => {
        if (cb.checked) activeSet.add(app.name);
        else activeSet.delete(app.name);
        localStorage.setItem("alex-sidebar-apps", JSON.stringify([...activeSet].slice(0, 6)));
      });
      const txt = document.createElement("span");
      txt.textContent = app.name;
      label.append(cb, txt);
      grid.appendChild(label);
    });
  }

  // PRIVACY CENTER (SALTED SHA-256 PIN/PASSWORD + APP LOCK + PRIVATE SPACE + HIDDEN APPS)
  function refreshPinStatus() {
    const status = document.getElementById("pin-status");
    const bioNote = document.getElementById("biometric-bridge-note");
    const caps = getRuntimeCapabilities();
    if (bioNote) {
      bioNote.textContent = caps.hasBiometricBridge
        ? "Native Android BiometricPrompt bridge connected."
        : "Browser Preview · Fingerprint requires native Android APK BiometricPrompt.";
    }
    if (!status) return;
    const stored = loadJson("alex-security-secret", null);
    status.textContent = stored?.hash
      ? `Active ${stored.type === "password" ? "Password" : "PIN"} lock stored with salted SHA-256 hash.`
      : "No launcher lock configured.";
  }

  document.getElementById("save-launcher-pin")?.addEventListener("click", async () => {
    const type = document.getElementById("lock-type-select")?.value || "pin";
    const input = document.getElementById("launcher-pin");
    const confirmInput = document.getElementById("launcher-pin-confirm");
    const status = document.getElementById("pin-status");
    if (!input || !confirmInput || !status) return;

    const secret = input.value.trim();
    const confirmSecret = confirmInput.value.trim();

    if (type === "pin" && !/^\d{4,8}$/.test(secret)) {
      status.textContent = "Enter a numeric PIN with 4 to 8 digits.";
      return;
    }
    if (type === "password" && secret.length < 4) {
      status.textContent = "Password must be at least 4 characters.";
      return;
    }
    if (secret !== confirmSecret) {
      status.textContent = "Entered values do not match.";
      return;
    }

    const hashed = await hashLauncherSecret(secret);
    localStorage.setItem(
      "alex-security-secret",
      JSON.stringify({ type, salt: hashed.salt, hash: hashed.hash, updatedAt: Date.now() })
    );
    input.value = "";
    confirmInput.value = "";
    refreshPinStatus();
  });

  document.getElementById("remove-launcher-pin")?.addEventListener("click", () => {
    localStorage.removeItem("alex-security-secret");
    localStorage.removeItem("alex-last-unlocked-at");
    refreshPinStatus();
  });

  function renderPrivacyChecklists() {
    const lockGrid = document.getElementById("app-lock-checklist");
    const privGrid = document.getElementById("private-apps-checklist");
    const lockedSet = new Set(loadJson("alex-locked-apps", []));
    const privSet = new Set(loadJson("alex-private-apps", []));

    if (lockGrid) {
      lockGrid.innerHTML = "";
      APP_CATALOG.forEach(app => {
        const label = document.createElement("label");
        label.className = "checklist-pill";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = lockedSet.has(app.name);
        cb.addEventListener("change", () => {
          if (cb.checked) lockedSet.add(app.name);
          else lockedSet.delete(app.name);
          localStorage.setItem("alex-locked-apps", JSON.stringify([...lockedSet]));
        });
        const span = document.createElement("span");
        span.textContent = app.name;
        label.append(cb, span);
        lockGrid.appendChild(label);
      });
    }

    if (privGrid) {
      privGrid.innerHTML = "";
      APP_CATALOG.forEach(app => {
        const label = document.createElement("label");
        label.className = "checklist-pill";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = privSet.has(app.name);
        cb.addEventListener("change", () => {
          if (cb.checked) privSet.add(app.name);
          else privSet.delete(app.name);
          localStorage.setItem("alex-private-apps", JSON.stringify([...privSet]));
        });
        const span = document.createElement("span");
        span.textContent = app.name;
        label.append(cb, span);
        privGrid.appendChild(label);
      });
    }
  }

  function renderHiddenAppsList() {
    const container = document.getElementById("hidden-apps-list");
    if (!container) return;
    const customMap = loadCustomAppsMap();
    const hiddenEntries = Object.entries(customMap).filter(([, d]) => d && d.hidden === true);
    container.innerHTML = "";
    if (hiddenEntries.length === 0) {
      container.innerHTML = '<small style="color: var(--text-subtle);">No applications are currently hidden.</small>';
      return;
    }
    hiddenEntries.forEach(([baseName, data]) => {
      const row = document.createElement("div");
      row.className = "hidden-app-row";
      const label = document.createElement("span");
      label.textContent = data.name || baseName;
      const unhideBtn = document.createElement("button");
      unhideBtn.type = "button";
      unhideBtn.className = "settings-back";
      unhideBtn.textContent = "Unhide";
      unhideBtn.addEventListener("click", () => {
        const nextMap = loadCustomAppsMap();
        if (nextMap[baseName]) {
          nextMap[baseName].hidden = false;
          localStorage.setItem("alex-custom-apps", JSON.stringify(nextMap));
        }
        renderHiddenAppsList();
      });
      row.append(label, unhideBtn);
      container.appendChild(row);
    });
  }

  // NOTIFICATION CENTER
  const notifBadgeColor = document.getElementById("notif-badge-color");
  if (notifBadgeColor) {
    notifBadgeColor.value = localStorage.getItem("alex-setting-notif-badge-color") || "#d000ff";
    notifBadgeColor.addEventListener("input", () => {
      localStorage.setItem("alex-setting-notif-badge-color", notifBadgeColor.value);
    });
  }

  document.getElementById("request-notif-access-btn")?.addEventListener("click", () => {
    const status = document.getElementById("notif-bridge-status");
    const launched = requestNativeNotificationAccess();
    if (status) {
      status.textContent = launched
        ? "Opened Android Notification Listener settings."
        : "Browser Preview: System notification badges require Android NotificationListenerService permission inside an APK.";
    }
  });

  function renderNotifCenter() {
    const status = document.getElementById("notif-bridge-status");
    const caps = getRuntimeCapabilities();
    if (status) {
      status.textContent = caps.hasNotificationsBridge
        ? "Connected to Android NotificationListenerService."
        : "Browser Preview · Android APK bridge required for live system notification counts.";
    }
    const mutedGrid = document.getElementById("notif-muted-checklist");
    if (!mutedGrid) return;
    const mutedSet = new Set(loadJson("alex-notif-muted-apps", []));
    mutedGrid.innerHTML = "";
    APP_CATALOG.forEach(app => {
      const label = document.createElement("label");
      label.className = "checklist-pill";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = mutedSet.has(app.name);
      cb.addEventListener("change", () => {
        if (cb.checked) mutedSet.add(app.name);
        else mutedSet.delete(app.name);
        localStorage.setItem("alex-notif-muted-apps", JSON.stringify([...mutedSet]));
      });
      const span = document.createElement("span");
      span.textContent = app.name;
      label.append(cb, span);
      mutedGrid.appendChild(label);
    });
  }

  // SAVE SELECT & RANGE SETTINGS
  const settingIds = [
    "home-icon-size", "wheel-size", "dock-count", "drawer-layout",
    "drawer-columns", "drawer-icon-size", "drawer-sort", "search-style",
    "animation-speed", "performance-mode", "clock-style", "clock-type",
    "widget-size", "widget-surface", "widget-transparency", "default-widget",
    "temp-unit", "glass-blur", "glass-alpha", "parallax-sensitivity",
    "animation-intensity", "music-style", "wallpaper-mode", "particles-count",
    "wallpaper-depth", "charging-style", "icon-anim", "icon-shadow",
    "wheel-double-tap", "sidebar-side", "sidebar-alpha", "lock-timeout",
    "notif-badge-style"
  ];
  const animSpeedMap = { fast: "0.15s", normal: "0.28s", slow: "0.55s" };

  function updateControlReadout(id, value) {
    const readout = document.getElementById(id + "-value");
    if (readout) {
      if (id === "glass-alpha") readout.textContent = `${value}% opacity`;
      else if (id === "widget-transparency" || id === "sidebar-alpha") readout.textContent = `${value}%`;
      else if (id === "parallax-sensitivity") readout.textContent = `${value}px depth shift`;
      else if (id === "particles-count") readout.textContent = `${value} particles`;
      else if (id === "wallpaper-depth") readout.textContent = `${(Number(value) / 10).toFixed(1)}x depth`;
      else readout.textContent = value + "px";
    }
    if (id === "animation-speed") root.style.setProperty("--anim-speed", animSpeedMap[value] || "0.28s");
    if (id === "performance-mode") root.dataset.performanceMode = value;
    if (id === "glass-blur") root.style.setProperty("--glass-blur", `${value}px`);
    if (id === "glass-alpha") {
      const decimal = (Math.max(10, Math.min(95, Number(value) || 72)) / 100).toFixed(2);
      root.style.setProperty("--glass-alpha", decimal);
    }
    if (id === "animation-intensity") root.dataset.animationIntensity = value;
    if (id === "music-style") root.dataset.musicStyle = value;
    if (id === "widget-size") root.dataset.widgetSize = value;
  }

  settingIds.forEach(id => {
    const control = document.getElementById(id);
    if (!control) return;
    const key = "alex-setting-" + id;
    const savedValue = localStorage.getItem(key);
    if (savedValue !== null) control.value = savedValue;
    updateControlReadout(id, control.value);

    const saveHandler = () => {
      localStorage.setItem(key, control.value);
      updateControlReadout(id, control.value);
    };
    control.addEventListener("input", saveHandler);
    control.addEventListener("change", saveHandler);
  });

  // WALLPAPER UPLOAD & RESET
  const wallpaperInput = document.getElementById("wallpaper-upload");
  const wallpaperStatus = document.getElementById("wallpaper-status");
  function applyWallpaperPreview(dataUrl) {
    if (dataUrl) {
      root.dataset.hasWallpaper = "true";
      document.body.style.backgroundImage = `url("${dataUrl}")`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
    } else {
      delete root.dataset.hasWallpaper;
      document.body.style.backgroundImage = "";
    }
  }

  wallpaperInput?.addEventListener("change", () => {
    const file = wallpaperInput.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 3 * 1024 * 1024) {
      if (wallpaperStatus) wallpaperStatus.textContent = "Choose a valid image under 3 MB.";
      return;
    }
    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result;
      if (typeof result !== "string") return;
      try {
        localStorage.setItem("alex-wallpaper", result);
        localStorage.setItem("alex-setting-wallpaper-mode", "custom");
        const modeSelect = document.getElementById("wallpaper-mode");
        if (modeSelect) modeSelect.value = "custom";
        applyWallpaperPreview(result);
        if (wallpaperStatus) wallpaperStatus.textContent = "Custom wallpaper saved and applied.";
      } catch {
        if (wallpaperStatus) wallpaperStatus.textContent = "Image too large for browser storage.";
      }
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("reset-wallpaper")?.addEventListener("click", () => {
    localStorage.removeItem("alex-wallpaper");
    localStorage.setItem("alex-setting-wallpaper-mode", "amoled");
    const modeSelect = document.getElementById("wallpaper-mode");
    if (modeSelect) modeSelect.value = "amoled";
    applyWallpaperPreview(null);
    if (wallpaperInput) wallpaperInput.value = "";
    if (wallpaperStatus) wallpaperStatus.textContent = "Default AMOLED background restored.";
  });

  const savedWallpaper = localStorage.getItem("alex-wallpaper");
  if (savedWallpaper) {
    applyWallpaperPreview(savedWallpaper);
    if (wallpaperStatus) wallpaperStatus.textContent = "Custom wallpaper active.";
  }

  // BACKUP & RESTORE WITH EXPLICIT CONFIRMATION STEP
  const exportBtn = document.getElementById("export-backup-btn");
  const importInput = document.getElementById("import-backup-input");
  const backupStatus = document.getElementById("backup-status");
  const confirmBox = document.getElementById("backup-confirm-box");
  const confirmText = document.getElementById("backup-confirm-text");
  const snapshotStatus = document.getElementById("snapshot-status");
  let stagedRestoreData = null;

  function collectAllLauncherPrefs() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("alex-")) data[k] = localStorage.getItem(k);
    }
    return data;
  }

  const refreshSnapshotStatus = () => {
    if (!snapshotStatus) return;
    const snap = loadJson("alex-config-snapshot", null);
    snapshotStatus.textContent = snap?.savedAt
      ? `Saved snapshot from ${new Date(snap.savedAt).toLocaleString()} (${Object.keys(snap.data || {}).length} items).`
      : "No local snapshot saved yet.";
  };
  refreshSnapshotStatus();

  document.getElementById("save-snapshot-btn")?.addEventListener("click", () => {
    const data = collectAllLauncherPrefs();
    delete data["alex-config-snapshot"];
    localStorage.setItem("alex-config-snapshot", JSON.stringify({ savedAt: Date.now(), data }));
    refreshSnapshotStatus();
  });

  document.getElementById("stage-snapshot-restore-btn")?.addEventListener("click", () => {
    const snap = loadJson("alex-config-snapshot", null);
    if (!snap || !snap.data) {
      if (snapshotStatus) snapshotStatus.textContent = "No snapshot available to restore.";
      return;
    }
    stagedRestoreData = snap.data;
    if (confirmText) {
      confirmText.textContent = `Overwrite current launcher settings with local snapshot (${Object.keys(snap.data).length} keys)?`;
    }
    if (confirmBox) confirmBox.hidden = false;
  });

  exportBtn?.addEventListener("click", () => {
    const data = collectAllLauncherPrefs();
    delete data["alex-config-snapshot"];
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "alex-launcher-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    if (backupStatus) backupStatus.textContent = "Backup JSON downloaded.";
  });

  importInput?.addEventListener("change", () => {
    const file = importInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        const validEntries = Object.entries(parsed).filter(
          ([k, v]) => k.startsWith("alex-") && typeof v === "string"
        );
        if (validEntries.length === 0) {
          if (backupStatus) backupStatus.textContent = "No valid Alex Launcher keys found in file.";
          return;
        }
        stagedRestoreData = Object.fromEntries(validEntries);
        if (confirmText) {
          confirmText.textContent = `Confirm overwriting current configuration with ${validEntries.length} imported settings from "${file.name}"?`;
        }
        if (confirmBox) confirmBox.hidden = false;
      } catch {
        if (backupStatus) backupStatus.textContent = "Invalid backup JSON file.";
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("backup-confirm-apply")?.addEventListener("click", () => {
    if (!stagedRestoreData) return;
    Object.entries(stagedRestoreData).forEach(([k, v]) => {
      if (k.startsWith("alex-") && typeof v === "string") {
        localStorage.setItem(k, v);
      }
    });
    stagedRestoreData = null;
    if (confirmBox) confirmBox.hidden = true;
    if (backupStatus) backupStatus.textContent = "Backup applied. Reloading Control Center...";
    setTimeout(() => window.location.reload(), 550);
  });

  document.getElementById("backup-confirm-cancel")?.addEventListener("click", () => {
    stagedRestoreData = null;
    if (confirmBox) confirmBox.hidden = true;
    if (importInput) importInput.value = "";
    if (backupStatus) backupStatus.textContent = "Restore cancelled — existing settings untouched.";
  });

  // PROFILE MANAGER (PERSONAL, WORK, STUDY, MINIMAL, GAMING + CUSTOM PROFILES)
  function captureCurrentProfileSnapshot() {
    const snap = {};
    PROFILE_KEYS_SNAPSHOT.forEach(k => {
      const val = localStorage.getItem(k);
      if (val !== null) snap[k] = val;
    });
    return snap;
  }

  function loadProfilesMap() {
    const saved = loadJson("alex-profiles", null);
    if (saved && typeof saved === "object" && Object.keys(saved).length > 0) return saved;
    localStorage.setItem("alex-profiles", JSON.stringify(STARTER_PROFILES));
    return { ...STARTER_PROFILES };
  }

  function renderProfilesList() {
    const listEl = document.getElementById("profiles-list");
    const statusEl = document.getElementById("profile-status");
    const activeName = localStorage.getItem("alex-active-profile") || "Personal";
    if (statusEl) statusEl.textContent = `Active profile: ${activeName}`;
    if (!listEl) return;

    const profiles = loadProfilesMap();
    listEl.innerHTML = "";
    Object.entries(profiles).forEach(([name, data]) => {
      const card = document.createElement("div");
      card.className = "studio-item-card" + (name === activeName ? " selected" : "");

      const top = document.createElement("div");
      top.className = "studio-item-top";
      const meta = document.createElement("div");
      meta.className = "studio-item-meta";
      const title = document.createElement("strong");
      title.textContent = name;
      const sub = document.createElement("small");
      sub.textContent = `Theme: ${data["alex-theme"] || "purple"} · Drawer: ${data["alex-setting-drawer-layout"] || "grid"}`;
      meta.append(title, sub);
      top.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "studio-item-actions";

      const applyBtn = document.createElement("button");
      applyBtn.type = "button";
      applyBtn.className = "studio-mini-btn primary";
      applyBtn.textContent = name === activeName ? "Active" : "Switch";
      applyBtn.addEventListener("click", () => {
        Object.entries(data).forEach(([k, v]) => {
          if (typeof v === "string") localStorage.setItem(k, v);
        });
        localStorage.setItem("alex-active-profile", name);
        window.location.reload();
      });

      const updateBtn = document.createElement("button");
      updateBtn.type = "button";
      updateBtn.className = "studio-mini-btn";
      updateBtn.textContent = "Update";
      updateBtn.addEventListener("click", () => {
        profiles[name] = captureCurrentProfileSnapshot();
        localStorage.setItem("alex-profiles", JSON.stringify(profiles));
        if (statusEl) statusEl.textContent = `Saved current launcher state to "${name}".`;
        renderProfilesList();
      });

      actions.append(applyBtn, updateBtn);

      if (!Object.prototype.hasOwnProperty.call(STARTER_PROFILES, name)) {
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "studio-mini-btn";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", () => {
          delete profiles[name];
          localStorage.setItem("alex-profiles", JSON.stringify(profiles));
          if (activeName === name) localStorage.setItem("alex-active-profile", "Personal");
          renderProfilesList();
        });
        actions.appendChild(delBtn);
      }

      card.append(top, actions);
      listEl.appendChild(card);
    });
  }

  document.getElementById("create-profile-btn")?.addEventListener("click", () => {
    const input = document.getElementById("new-profile-name");
    const status = document.getElementById("profile-status");
    const name = (input?.value || "").trim();
    if (!name) return;
    const profiles = loadProfilesMap();
    profiles[name] = captureCurrentProfileSnapshot();
    localStorage.setItem("alex-profiles", JSON.stringify(profiles));
    localStorage.setItem("alex-active-profile", name);
    if (input) input.value = "";
    if (status) status.textContent = `Created & activated profile "${name}".`;
    renderProfilesList();
  });

  // PERFORMANCE CENTER DIAGNOSTICS (REAL TELEMETRY ONLY)
  function renderPerfDiagnostics() {
    const listEl = document.getElementById("perf-diagnostics-list");
    if (!listEl) return;
    const caps = getRuntimeCapabilities();
    const conn = navigator.connection || navigator.mozConnection;
    const rows = [
      ["CPU Logical Cores", caps.cpuCores ? `${caps.cpuCores} cores` : "Unavailable"],
      ["Device Memory Hint", caps.deviceMemoryGb ? `${caps.deviceMemoryGb} GB` : "Not exposed by browser"],
      ["OS Reduce Motion", window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? "Enabled" : "Off"],
      ["Network Link", navigator.onLine ? (conn?.effectiveType?.toUpperCase() || "Online") : "Offline"],
      ["Active Graphics Profile", localStorage.getItem("alex-setting-performance-mode") === "low" ? "Low-RAM / Battery Saver" : "Standard Glass + 3D"]
    ];
    listEl.innerHTML = "";
    rows.forEach(([label, state]) => {
      const row = document.createElement("div");
      row.className = "capability-row";
      row.innerHTML = `<span>${label}</span><span class="capability-state">${state}</span>`;
      listEl.appendChild(row);
    });
  }

  document.getElementById("disable-widgets-btn")?.addEventListener("click", () => {
    localStorage.setItem("alex-setting-widgets-visible", "false");
    const widgetToggle = document.getElementById("toggle-widgets-visible");
    widgetToggle?.classList.remove("active");
    widgetToggle?.setAttribute("aria-pressed", "false");
    renderPerfDiagnostics();
  });

  // RUNTIME CAPABILITY DIAGNOSTICS (ABOUT PAGE)
  function renderCapabilities() {
    const listEl = document.getElementById("capability-list");
    if (!listEl) return;
    const caps = getRuntimeCapabilities();
    const rows = [
      ["Native Android Launcher Bridge", caps.isNativeAndroid ? "Connected" : "Requires Android APK"],
      ["Installed Packages List", caps.hasInstalledAppsBridge ? "Native Packages" : "Web Catalog Preview"],
      ["System Notifications Listener", caps.hasNotificationsBridge ? "Connected" : "Requires Android Listener"],
      ["Android MediaSession Bridge", caps.hasMediaBridge ? "Connected" : "Browser Preview / Local Audio"],
      ["Native BiometricPrompt", caps.hasBiometricBridge ? "Connected" : "Requires Android APK"],
      ["Native Screen Lock Bridge", caps.hasLockScreenBridge ? "Connected" : "Launcher Overlay Lock Only"],
      ["Device Contacts Search", caps.hasContactsBridge ? "Connected" : "Requires READ_CONTACTS Permission"],
      ["Device Tilt Sensor (3D Depth)", caps.hasDeviceOrientation ? "Available" : "Unavailable"],
      ["Battery Status API", caps.hasBatteryApi ? "Supported" : "Unavailable in browser"],
      ["Geolocation / Live Weather", caps.hasGeolocation ? "Available" : "Unavailable"]
    ];

    listEl.innerHTML = "";
    rows.forEach(([label, state]) => {
      const row = document.createElement("div");
      row.className = "capability-row";
      row.innerHTML = `<span>${label}</span><span class="capability-state">${state}</span>`;
      listEl.appendChild(row);
    });
  }
});
