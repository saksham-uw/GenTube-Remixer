// Optional: point to a mock endpoint later (Next.js/Express).
// If null, we do local preview-only “remix”.
const REMIX_ENDPOINT = "http://localhost:3000/api/gentube-remixer";

const qs = new URLSearchParams(location.search);
const imageUrl = qs.get("imageUrl");

const inputImg = document.getElementById("inputImg");
const previewImg = document.getElementById("previewImg");
const imgMeta = document.getElementById("imgMeta");
const styleTag = document.getElementById("styleTag");
const statusEl = document.getElementById("status");
const stylesEl = document.getElementById("styles");
const intensityEl = document.getElementById("intensity");
const generateBtn = document.getElementById("generate");
const downloadBtn = document.getElementById("download");
const shareBtn = document.getElementById("share");

// MVP style presets (CSS filters for preview) + imaginary prompt tags
const PRESETS = [
  { id: "none", name: "None", filter: "none", prompt: "clean" },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    filter: "contrast(1.2) saturate(1.4) hue-rotate(300deg)",
    prompt: "neon cyberpunk",
  },
  {
    id: "filmnoir",
    name: "Film Noir",
    filter: "grayscale(1) contrast(1.1)",
    prompt: "film noir b&w",
  },
  {
    id: "clay",
    name: "Claymation",
    filter: "saturate(1.6) brightness(1.05) sepia(.3)",
    prompt: "clay render, soft shadows",
  },
  {
    id: "anime",
    name: "Anime",
    filter: "saturate(1.3) contrast(1.15)",
    prompt: "anime style, crisp lines",
  },
  {
    id: "watercolor",
    name: "Watercolor",
    filter: "brightness(1.1) saturate(1.2) sepia(.2)",
    prompt: "watercolor wash",
  },
];

let selected = PRESETS[0];

function byId(id) {
  return document.getElementById(id);
}

function setActive(id) {
  for (const b of stylesEl.querySelectorAll(".style-btn")) {
    b.classList.toggle("active", b.dataset.id === id);
  }
}

function buildFilter(baseFilter, intensity) {
  if (baseFilter === "none") return "none";
  // Add a subtle blur based on intensity for “remixy” feel
  const blurPx = Math.round((intensity / 100) * 2);
  return `${baseFilter} blur(${blurPx}px)`;
}

function toast(msg) {
  statusEl.textContent = msg;
  if (!msg) return;
  setTimeout(() => {
    if (statusEl.textContent === msg) statusEl.textContent = "";
  }, 2000);
}

function init() {
  if (!imageUrl) {
    inputImg.alt = "No image URL provided";
    toast("No image URL found.");
    return;
  }

  inputImg.src = imageUrl;
  previewImg.src = imageUrl;
  imgMeta.textContent = decodeURIComponent(imageUrl);

  // Build preset buttons
  PRESETS.forEach((p) => {
    const btn = document.createElement("button");
    btn.className = "style-btn" + (p.id === "none" ? " active" : "");
    btn.dataset.id = p.id;
    btn.textContent = p.name;
    btn.addEventListener("click", () => {
      selected = p;
      setActive(p.id);
      applyPreview();
    });
    stylesEl.appendChild(btn);
  });

  intensityEl.addEventListener("input", applyPreview);

  generateBtn.addEventListener("click", onGenerate);
  downloadBtn.addEventListener("click", onDownload);
  shareBtn.addEventListener("click", onShare);

  applyPreview();
}

function applyPreview() {
  const intensity = Number(intensityEl.value);
  const filter = buildFilter(selected.filter, intensity);
  previewImg.style.filter = filter;
  styleTag.textContent = selected.name;
}

async function onGenerate() {
  // If you wire an endpoint, we POST image + style. Otherwise it’s a local preview.
  if (!REMIX_ENDPOINT) {
    toast("Preview updated (no backend).");
    return;
  }
  try {
    toast("Remixing…");
    const res = await fetch(REMIX_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl,
        style: selected.id,
        intensity: Number(intensityEl.value),
      }),
    });
    const data = await res.json();
    if (data.remixUrl) {
      previewImg.src = data.remixUrl;
      toast("Remix ready.");
    } else {
      toast("Endpoint returned no remixUrl.");
    }
  } catch (e) {
    console.error(e);
    toast("Remix failed (endpoint).");
  }
}

async function onDownload() {
  // Note: without a proxy, we can reliably download the original file.
  // True composited downloads (with filters baked in) require drawing to canvas with CORS-friendly proxy.
  chrome.downloads.download(
    {
      url: imageUrl,
      filename: `gentube-remix/${selected.id}-${Date.now()}.jpg`,
      saveAs: true,
    },
    () => toast("Download initiated.")
  );
}

async function onShare() {
  const text = `Remix: ${selected.name}\n${imageUrl}`;
  try {
    await navigator.clipboard.writeText(text);
    toast("Copied share text to clipboard.");
  } catch {
    toast("Copy failed.");
  }
}

init();
