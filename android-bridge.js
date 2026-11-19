// ALEX LAUNCHER - ANDROID BRIDGE, DEVICE APIs, WEATHER & AUDIO ENGINE

export function getRuntimeCapabilities() {
  const hasNativeBridge = Boolean(
    window.AlexAndroid && typeof window.AlexAndroid.launchApp === "function"
  );
  const hasCapacitorNative = Boolean(
    window.Capacitor &&
      typeof window.Capacitor.isNativePlatform === "function" &&
      window.Capacitor.isNativePlatform()
  );

  return {
    isNativeAndroid: hasNativeBridge || hasCapacitorNative,
    hasInstalledAppsBridge: Boolean(
      window.AlexAndroid && typeof window.AlexAndroid.getInstalledApps === "function"
    ),
    hasNotificationsBridge: Boolean(
      window.AlexAndroid && typeof window.AlexAndroid.getNotifications === "function"
    ),
    hasBatteryApi: typeof navigator.getBattery === "function",
    hasGeolocation: "geolocation" in navigator,
    hasNetworkInfo: Boolean(navigator.connection || navigator.mozConnection),
    hasMediaSession: "mediaSession" in navigator,
    hasMediaBridge: Boolean(
      window.AlexAndroid && typeof window.AlexAndroid.getMediaState === "function"
    ),
    hasBiometricBridge: Boolean(
      window.AlexAndroid && typeof window.AlexAndroid.authenticateBiometric === "function"
    ),
    hasLockScreenBridge: Boolean(
      window.AlexAndroid && typeof window.AlexAndroid.lockScreen === "function"
    ),
    hasContactsBridge: Boolean(
      window.AlexAndroid && typeof window.AlexAndroid.searchContacts === "function"
    ),
    hasRecentTasksBridge: Boolean(
      window.AlexAndroid && typeof window.AlexAndroid.getRecentTasks === "function"
    ),
    hasVibration: typeof navigator.vibrate === "function",
    hasDeviceOrientation: "DeviceOrientationEvent" in window,
    cpuCores: navigator.hardwareConcurrency || null,
    deviceMemoryGb: navigator.deviceMemory || null
  };
}

export function triggerHaptic(durationMs = 12) {
  try {
    if (localStorage.getItem("alex-setting-haptics") === "false") return false;
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate(durationMs);
      return true;
    }
  } catch {
    // Ignore vibration denial
  }
  return false;
}

export async function requestNativeBiometric(reason = "Unlock Alex Launcher") {
  try {
    if (
      window.AlexAndroid &&
      typeof window.AlexAndroid.authenticateBiometric === "function"
    ) {
      const ok = await Promise.resolve(window.AlexAndroid.authenticateBiometric(reason));
      return { supported: true, verified: Boolean(ok) };
    }
  } catch {
    return { supported: true, verified: false };
  }
  return {
    supported: false,
    verified: false,
    reason: "Native Android BiometricPrompt requires an Android APK bridge."
  };
}

export function requestNativeLockScreen() {
  try {
    if (
      window.AlexAndroid &&
      typeof window.AlexAndroid.lockScreen === "function"
    ) {
      const ok = window.AlexAndroid.lockScreen();
      if (ok !== false) return { supported: true, locked: true };
    }
  } catch {
    // Fall through cleanly
  }
  return {
    supported: false,
    locked: false,
    reason: "System power lock requires Android Accessibility / DeviceAdmin permission in APK."
  };
}

export function searchNativeContacts(query) {
  const q = (query || "").trim();
  if (!q) return { supported: false, items: [] };
  try {
    if (
      window.AlexAndroid &&
      typeof window.AlexAndroid.searchContacts === "function"
    ) {
      const raw = window.AlexAndroid.searchContacts(q);
      const list = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(list)) {
        return { supported: true, items: list };
      }
    }
  } catch {
    // Ignore contact bridge parse errors
  }
  return {
    supported: false,
    items: [],
    reason: "Device contacts search requires READ_CONTACTS permission in native Android."
  };
}

export function getNativeRecentTasks() {
  try {
    if (
      window.AlexAndroid &&
      typeof window.AlexAndroid.getRecentTasks === "function"
    ) {
      const raw = window.AlexAndroid.getRecentTasks();
      const list = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(list)) {
        return { supported: true, items: list };
      }
    }
  } catch {
    // Ignore recents bridge errors
  }
  return { supported: false, items: [] };
}

export function requestNativeNotificationAccess() {
  try {
    if (
      window.AlexAndroid &&
      typeof window.AlexAndroid.requestNotificationAccess === "function"
    ) {
      window.AlexAndroid.requestNotificationAccess();
      return true;
    }
  } catch {
    // Ignore
  }
  return false;
}

export async function hashLauncherSecret(secret) {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const salt = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  const data = new TextEncoder().encode(`${salt}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(digest), b =>
    b.toString(16).padStart(2, "0")
  ).join("");
  return { salt, hash: hashHex };
}

export async function verifyLauncherSecret(secret, stored) {
  if (!stored || !stored.salt || !stored.hash) return false;
  const data = new TextEncoder().encode(`${stored.salt}:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(digest), b =>
    b.toString(16).padStart(2, "0")
  ).join("");
  return hashHex === stored.hash;
}

export function getNativeMediaState() {
  try {
    if (
      window.AlexAndroid &&
      typeof window.AlexAndroid.getMediaState === "function"
    ) {
      const raw = window.AlexAndroid.getMediaState();
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (parsed && typeof parsed === "object" && (parsed.title || parsed.isPlaying)) {
        return { supported: true, state: parsed };
      }
      return { supported: true, state: null };
    }
  } catch {
    // Ignore native media bridge errors
  }
  return { supported: false, state: null };
}

export function sendNativeMediaAction(action, value = 0) {
  try {
    if (
      window.AlexAndroid &&
      typeof window.AlexAndroid.sendMediaAction === "function"
    ) {
      window.AlexAndroid.sendMediaAction(action, value);
      return true;
    }
  } catch {
    // Ignore native media action errors
  }
  return false;
}

export function getNativeInstalledApps() {
  try {
    if (
      window.AlexAndroid &&
      typeof window.AlexAndroid.getInstalledApps === "function"
    ) {
      const raw = window.AlexAndroid.getInstalledApps();
      const list = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(list) && list.length > 0) {
        return { source: "android-native", apps: list };
      }
    }
  } catch {
    // Fallback cleanly to built-in catalog when native bridge throws
  }
  return { source: "browser-preview", apps: null };
}

export function getNativeNotifications() {
  try {
    if (
      window.AlexAndroid &&
      typeof window.AlexAndroid.getNotifications === "function"
    ) {
      const raw = window.AlexAndroid.getNotifications();
      const list = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(list)) {
        return { supported: true, items: list };
      }
    }
  } catch {
    // Ignore native bridge parse failure
  }
  return {
    supported: false,
    items: [],
    reason:
      "System notifications require an Android NotificationListenerService bridge inside a native APK build."
  };
}

export function launchAndroidOrWebApp(entry, displayLabel) {
  // 1. Native Android Launcher Bridge (APK / WebView JavascriptInterface)
  if (
    window.AlexAndroid &&
    typeof window.AlexAndroid.launchApp === "function" &&
    entry &&
    entry.packageName
  ) {
    try {
      const launched = window.AlexAndroid.launchApp(entry.packageName);
      if (launched !== false) {
        return { mode: "native", message: `Opening ${displayLabel}` };
      }
    } catch {
      // Fall through to web intent
    }
  }

  // 2. Real protocol / web destinations where supported
  if (entry && entry.webUrl) {
    if (entry.webUrl.startsWith("./")) {
      window.location.href = entry.webUrl;
      return { mode: "internal", message: `Opening ${displayLabel}` };
    }
    if (entry.webUrl.startsWith("tel:") || entry.webUrl.startsWith("sms:") || entry.webUrl.startsWith("mailto:")) {
      window.location.href = entry.webUrl;
      return { mode: "protocol", message: `Opening ${displayLabel}` };
    }
    return {
      mode: "web-intent",
      url: entry.webUrl,
      message: `Opening ${displayLabel}`
    };
  }

  return {
    mode: "preview",
    message: `Opening ${displayLabel}`
  };
}

// WEATHER VIA REAL OPEN-METEO API
const WEATHER_CODE_LABELS = {
  0: { label: "Clear Sky", kind: "sun" },
  1: { label: "Mainly Clear", kind: "sun" },
  2: { label: "Partly Cloudy", kind: "partly" },
  3: { label: "Overcast", kind: "cloud" },
  45: { label: "Foggy", kind: "cloud" },
  48: { label: "Rime Fog", kind: "cloud" },
  51: { label: "Light Drizzle", kind: "rain" },
  53: { label: "Drizzle", kind: "rain" },
  55: { label: "Dense Drizzle", kind: "rain" },
  61: { label: "Light Rain", kind: "rain" },
  63: { label: "Rain", kind: "rain" },
  65: { label: "Heavy Rain", kind: "rain" },
  71: { label: "Light Snow", kind: "snow" },
  73: { label: "Snow", kind: "snow" },
  75: { label: "Heavy Snow", kind: "snow" },
  80: { label: "Rain Showers", kind: "rain" },
  81: { label: "Showers", kind: "rain" },
  82: { label: "Heavy Showers", kind: "rain" },
  95: { label: "Thunderstorm", kind: "storm" }
};

export async function fetchWeatherForCoordinates(lat, lon, locationLabel = "Current Location") {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
    lat
  )}&longitude=${encodeURIComponent(
    lon
  )}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Weather request failed");
  }
  const data = await response.json();
  const current = data.current || {};
  const meta = WEATHER_CODE_LABELS[current.weather_code] || {
    label: "Fair",
    kind: current.is_day === 0 ? "night" : "partly"
  };

  const payload = {
    location: locationLabel,
    lat,
    lon,
    tempC: Math.round(current.temperature_2m ?? 0),
    humidity: Math.round(current.relative_humidity_2m ?? 0),
    windKmh: Math.round(current.wind_speed_10m ?? 0),
    condition: meta.label,
    kind: current.is_day === 0 && meta.kind === "sun" ? "night" : meta.kind,
    updatedAt: Date.now()
  };

  localStorage.setItem("alex-weather-cache", JSON.stringify(payload));
  return payload;
}

export async function fetchWeatherForCity(cityQuery) {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    cityQuery.trim()
  )}&count=1&language=en&format=json`;
  const response = await fetch(geoUrl);
  if (!response.ok) {
    throw new Error("City lookup failed");
  }
  const data = await response.json();
  const match = data.results?.[0];
  if (!match) {
    throw new Error("City not found");
  }
  const label = match.admin1
    ? `${match.name}, ${match.country_code || match.country}`
    : `${match.name}, ${match.country}`;
  return fetchWeatherForCoordinates(match.latitude, match.longitude, label);
}

export function getCachedWeather() {
  try {
    const raw = localStorage.getItem("alex-weather-cache");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.tempC === "number") return parsed;
  } catch {
    // Ignore malformed weather cache
  }
  return null;
}

// ALBUM ARTWORK & PURE-JS ID3v2 TAG READER FOR LOCAL AUDIO FILES
export function createAlbumArtworkDataUrl(title = "Alex Audio", accentA = "#a100ff", accentB = "#3b0066") {
  const initial = (title || "A").trim().charAt(0).toUpperCase() || "A";
  const safeInitial = initial.replace(/[<>&"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${accentA}"/>
        <stop offset="55%" stop-color="${accentB}"/>
        <stop offset="100%" stop-color="#07000d"/>
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="22" fill="url(#g)"/>
    <circle cx="60" cy="60" r="42" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>
    <circle cx="60" cy="60" r="28" fill="rgba(5,0,12,0.52)" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
    <circle cx="60" cy="60" r="8" fill="#ffffff" opacity="0.9"/>
    <path d="M24 96 Q42 82 60 92 T96 86" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2.5" stroke-linecap="round"/>
    <text x="16" y="28" fill="rgba(255,255,255,0.75)" font-family="sans-serif" font-size="14" font-weight="700">${safeInitial}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function decodeId3Text(bytes, encoding) {
  try {
    if (encoding === 1 || encoding === 2) {
      return new TextDecoder(encoding === 1 ? "utf-16" : "utf-16be")
        .decode(bytes)
        .replace(/\0/g, "")
        .trim();
    }
    return new TextDecoder(encoding === 3 ? "utf-8" : "latin1")
      .decode(bytes)
      .replace(/\0/g, "")
      .trim();
  } catch {
    return "";
  }
}

export async function extractAudioMetadata(file) {
  const result = { title: "", artist: "", album: "", artworkUrl: "" };
  try {
    const slice = await file.slice(0, 393216).arrayBuffer();
    const bytes = new Uint8Array(slice);
    if (
      bytes.length < 10 ||
      bytes[0] !== 0x49 ||
      bytes[1] !== 0x44 ||
      bytes[2] !== 0x33
    ) {
      return result;
    }

    const version = bytes[3];
    if (version < 3 || version > 4) return result;
    const tagSize =
      ((bytes[6] & 0x7f) << 21) |
      ((bytes[7] & 0x7f) << 14) |
      ((bytes[8] & 0x7f) << 7) |
      (bytes[9] & 0x7f);
    const limit = Math.min(bytes.length, 10 + tagSize);
    let offset = 10;

    while (offset + 10 <= limit) {
      const frameId = String.fromCharCode(
        bytes[offset],
        bytes[offset + 1],
        bytes[offset + 2],
        bytes[offset + 3]
      );
      if (!/^[A-Z0-9]{4}$/.test(frameId)) break;

      const frameSize =
        version === 4
          ? ((bytes[offset + 4] & 0x7f) << 21) |
            ((bytes[offset + 5] & 0x7f) << 14) |
            ((bytes[offset + 6] & 0x7f) << 7) |
            (bytes[offset + 7] & 0x7f)
          : (bytes[offset + 4] << 24) |
            (bytes[offset + 5] << 16) |
            (bytes[offset + 6] << 8) |
            bytes[offset + 7];

      if (frameSize <= 0 || offset + 10 + frameSize > limit) break;
      const frameData = bytes.subarray(offset + 10, offset + 10 + frameSize);

      if (frameId === "TIT2" && frameData.length > 1) {
        result.title = decodeId3Text(frameData.subarray(1), frameData[0]);
      } else if (frameId === "TPE1" && frameData.length > 1) {
        result.artist = decodeId3Text(frameData.subarray(1), frameData[0]);
      } else if (frameId === "TALB" && frameData.length > 1) {
        result.album = decodeId3Text(frameData.subarray(1), frameData[0]);
      } else if (frameId === "APIC" && frameData.length > 10 && !result.artworkUrl) {
        const encoding = frameData[0];
        let pos = 1;
        while (pos < frameData.length && frameData[pos] !== 0) pos++;
        const mime = new TextDecoder("latin1")
          .decode(frameData.subarray(1, pos))
          .trim() || "image/jpeg";
        pos += 2; // Skip null terminator + picture type byte
        if (encoding === 1 || encoding === 2) {
          while (pos + 1 < frameData.length && (frameData[pos] !== 0 || frameData[pos + 1] !== 0)) {
            pos += 2;
          }
          pos += 2;
        } else {
          while (pos < frameData.length && frameData[pos] !== 0) pos++;
          pos += 1;
        }
        if (pos < frameData.length) {
          const imgBytes = frameData.subarray(pos);
          if (imgBytes.length > 64) {
            const blob = new Blob([imgBytes], {
              type: mime.startsWith("image/") ? mime : "image/jpeg"
            });
            result.artworkUrl = URL.createObjectURL(blob);
          }
        }
      }

      offset += 10 + frameSize;
    }
  } catch {
    // Cleanly ignore malformed ID3 headers
  }
  return result;
}

// AMBIENT WEB AUDIO + LOCAL FILE AUDIO + NATIVE ANDROID MEDIA BRIDGE
export class LauncherAudioEngine {
  constructor() {
    this.tracks = [
      {
        id: "synth-midnight",
        title: "Midnight AMOLED",
        artist: "Synth Preview · 84 BPM",
        album: "Alex Launcher Preview",
        duration: 180,
        freqs: [110, 164.81, 220, 261.63],
        artwork: createAlbumArtworkDataUrl("M", "#b400ff", "#2e0052"),
        type: "builtin"
      },
      {
        id: "synth-violet",
        title: "Violet Orbit",
        artist: "Synth Preview · 96 BPM",
        album: "Alex Launcher Preview",
        duration: 180,
        freqs: [130.81, 196.0, 246.94, 329.63],
        artwork: createAlbumArtworkDataUrl("V", "#00b8ff", "#1c004a"),
        type: "builtin"
      },
      {
        id: "synth-pulse",
        title: "Obsidian Pulse",
        artist: "Synth Preview · 108 BPM",
        album: "Alex Launcher Preview",
        duration: 180,
        freqs: [98.0, 146.83, 196.0, 293.66],
        artwork: createAlbumArtworkDataUrl("O", "#ff2a6d", "#24002b"),
        type: "builtin"
      }
    ];
    this.index = 0;
    this.isPlaying = false;
    this.hasInteracted = false;
    this.playbackSource = "preview-idle"; // "preview-idle" | "native-android" | "local-file" | "browser-synth"
    this.nativeTrack = null;
    this.elapsed = 0;
    this.audioCtx = null;
    this.masterGain = null;
    this.oscNodes = [];
    this.htmlAudio = null;
    this.timer = null;
    this.onUpdate = null;
  }

  get currentTrack() {
    if (this.playbackSource === "native-android" && this.nativeTrack) {
      return this.nativeTrack;
    }
    return this.tracks[this.index] || this.tracks[0];
  }

  syncNativeMedia() {
    const res = getNativeMediaState();
    if (!res.supported || !res.state) {
      if (this.playbackSource === "native-android") {
        this.nativeTrack = null;
        this.playbackSource = "preview-idle";
        this.isPlaying = false;
        this.onUpdate?.();
      }
      return false;
    }
    const s = res.state;
    this.playbackSource = "native-android";
    this.nativeTrack = {
      id: "android-media",
      title: s.title || "Android Media",
      artist: s.artist || "System MediaSession",
      album: s.album || "Android Audio",
      duration: Math.max(0, Math.floor((s.durationMs || 0) / 1000)),
      artwork: s.artwork || createAlbumArtworkDataUrl(s.title || "A", "#a100ff", "#1c0038"),
      type: "native"
    };
    this.isPlaying = Boolean(s.isPlaying);
    this.elapsed = Math.max(0, Math.floor((s.positionMs || 0) / 1000));
    this.onUpdate?.();
    return true;
  }

  addLocalFiles(fileList) {
    const added = [];
    Array.from(fileList || []).forEach(file => {
      if (!file.type.startsWith("audio/")) return;
      const url = URL.createObjectURL(file);
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
      const item = {
        id: "local-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        title: cleanTitle,
        artist: "Local Audio File",
        album: "Device Audio",
        duration: 0,
        url,
        artwork: createAlbumArtworkDataUrl(cleanTitle, "#d000ff", "#250045"),
        type: "local"
      };
      added.push(item);

      extractAudioMetadata(file).then(meta => {
        let changed = false;
        if (meta.title) {
          item.title = meta.title;
          changed = true;
        }
        if (meta.artist) {
          item.artist = meta.artist;
          changed = true;
        }
        if (meta.album) {
          item.album = meta.album;
          changed = true;
        }
        if (meta.artworkUrl) {
          item.artwork = meta.artworkUrl;
          changed = true;
        }
        if (changed) {
          if (this.currentTrack === item && this.isPlaying) {
            this._syncMediaSession(item);
          }
          this.onUpdate?.();
        }
      });
    });

    if (added.length > 0) {
      this.tracks = [...added, ...this.tracks];
      this.index = 0;
      this.stopPlayback(false);
      this.play();
    }
    return added.length;
  }

  togglePlay() {
    if (this.playbackSource === "native-android") {
      sendNativeMediaAction(this.isPlaying ? "pause" : "play");
      this.isPlaying = !this.isPlaying;
      this.onUpdate?.();
      return;
    }
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (this.playbackSource === "native-android") {
      sendNativeMediaAction("play");
      this.isPlaying = true;
      this.onUpdate?.();
      return;
    }

    const track = this.tracks[this.index] || this.tracks[0];
    if (!track) return;
    this.hasInteracted = true;

    if (track.type === "local") {
      this.playbackSource = "local-file";
      this._stopSynth();
      if (!this.htmlAudio) {
        this.htmlAudio = new Audio();
        this.htmlAudio.addEventListener("ended", () => this.next());
        this.htmlAudio.addEventListener("timeupdate", () => {
          this.elapsed = Math.floor(this.htmlAudio.currentTime || 0);
          if (Number.isFinite(this.htmlAudio.duration) && this.htmlAudio.duration > 0) {
            track.duration = Math.floor(this.htmlAudio.duration);
          }
          this.onUpdate?.();
        });
      }
      if (this.htmlAudio.src !== track.url) {
        this.htmlAudio.src = track.url;
      }
      this.htmlAudio.play().catch(() => {});
    } else {
      this.playbackSource = "browser-synth";
      this._stopHtmlAudio();
      this._startSynth(track.freqs);
      if (!this.timer) {
        this.timer = setInterval(() => {
          if (!this.isPlaying) return;
          this.elapsed += 1;
          if (this.elapsed >= track.duration) {
            this.next();
            return;
          }
          this.onUpdate?.();
        }, 1000);
      }
    }

    this.isPlaying = true;
    this._syncMediaSession(track);
    this.onUpdate?.();
  }

  pause() {
    if (this.playbackSource === "native-android") {
      sendNativeMediaAction("pause");
      this.isPlaying = false;
      this.onUpdate?.();
      return;
    }
    this.isPlaying = false;
    this._stopSynth();
    if (this.htmlAudio && !this.htmlAudio.paused) {
      this.htmlAudio.pause();
    }
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "paused";
    }
    this.onUpdate?.();
  }

  seek(seconds) {
    const track = this.currentTrack;
    if (!track || track.duration <= 0) return;
    const clamped = Math.max(0, Math.min(track.duration, Math.floor(seconds)));
    if (this.playbackSource === "native-android") {
      sendNativeMediaAction("seek", clamped * 1000);
      this.elapsed = clamped;
      this.onUpdate?.();
      return;
    }
    this.elapsed = clamped;
    if (track.type === "local" && this.htmlAudio) {
      this.htmlAudio.currentTime = clamped;
    }
    this.onUpdate?.();
  }

  stopPlayback(notify = true) {
    this.isPlaying = false;
    this.elapsed = 0;
    this._stopSynth();
    this._stopHtmlAudio();
    if (notify) this.onUpdate?.();
  }

  next() {
    if (this.playbackSource === "native-android") {
      sendNativeMediaAction("next");
      this.elapsed = 0;
      this.onUpdate?.();
      return;
    }
    this.index = (this.index + 1) % this.tracks.length;
    this.elapsed = 0;
    if (this.isPlaying) {
      this.play();
    } else {
      this.onUpdate?.();
    }
  }

  prev() {
    if (this.playbackSource === "native-android") {
      sendNativeMediaAction("previous");
      this.elapsed = 0;
      this.onUpdate?.();
      return;
    }
    this.index = (this.index - 1 + this.tracks.length) % this.tracks.length;
    this.elapsed = 0;
    if (this.isPlaying) {
      this.play();
    } else {
      this.onUpdate?.();
    }
  }

  _startSynth(freqs) {
    this._stopSynth();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!this.audioCtx) {
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 540;

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, this.audioCtx.currentTime + 0.4);

    filter.connect(gain);
    gain.connect(this.audioCtx.destination);
    this.masterGain = gain;

    this.oscNodes = freqs.map((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      osc.type = idx === 0 ? "sine" : "triangle";
      osc.frequency.value = freq;
      osc.detune.value = (idx - 1.5) * 4;
      osc.connect(filter);
      osc.start();
      return osc;
    });
  }

  _stopSynth() {
    this.oscNodes.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore already stopped oscillators
      }
    });
    this.oscNodes = [];
    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {
        // Ignore disconnect error
      }
      this.masterGain = null;
    }
  }

  _stopHtmlAudio() {
    if (this.htmlAudio) {
      this.htmlAudio.pause();
      this.htmlAudio.currentTime = 0;
    }
  }

  _syncMediaSession(track) {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || "Alex Launcher Audio",
        artwork: track.artwork
          ? [{ src: track.artwork, sizes: "120x120", type: "image/svg+xml" }]
          : []
      });
      navigator.mediaSession.playbackState = "playing";
      navigator.mediaSession.setActionHandler("play", () => this.play());
      navigator.mediaSession.setActionHandler("pause", () => this.pause());
      navigator.mediaSession.setActionHandler("nexttrack", () => this.next());
      navigator.mediaSession.setActionHandler("previoustrack", () => this.prev());
    } catch {
      // Ignore MediaMetadata errors on older browsers
    }
  }
}
