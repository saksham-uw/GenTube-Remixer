// Minimal inline "Remix" pill overlay for images
(function () {
  const PILL_ID = "gentube-inline-remix-pill";
  let currentImg = null;

  function ensurePill() {
    let pill = document.getElementById(PILL_ID);
    if (pill) return pill;

    pill = document.createElement("button");
    pill.id = PILL_ID;
    pill.textContent = "Remix";
    pill.innerHTML = `<img src="${chrome.runtime.getURL(
      "gentube.svg"
    )}" alt="Remix"
  style="width:14px;height:14px;vertical-align:middle;margin-right:6px"/> Remix`;

    Object.assign(pill.style, {
      position: "absolute",
      padding: "6px 10px",
      fontSize: "12px",
      fontWeight: "600",
      borderRadius: "9999px",
      border: "1px solid rgba(0,0,0,.1)",
      background: "rgba(255,255,255,.95)",
      boxShadow: "0 2px 8px rgba(0,0,0,.15)",
      cursor: "pointer",
      zIndex: "2147483647",
      transform: "translate(-50%, -50%)",
      pointerEvents: "auto",
    });

    pill.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (!currentImg?.src) return;
      chrome.runtime.sendMessage({
        action: "openRemix",
        imageUrl: currentImg.src,
      });
      hidePill();
    });

    document.body.appendChild(pill);
    return pill;
  }

  function positionPill(pill, rect) {
    pill.style.left = `${rect.left + rect.width - 20 + window.scrollX}px`;
    pill.style.top = `${rect.top + 20 + window.scrollY}px`;
    pill.style.display = "block";
  }

  function hidePill() {
    const pill = document.getElementById(PILL_ID);
    if (pill) pill.style.display = "none";
    currentImg = null;
  }

  document.addEventListener("mouseover", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLImageElement)) {
      hidePill();
      return;
    }
    // only show on sufficiently large images
    if (target.width < 120 || target.height < 80) {
      hidePill();
      return;
    }
    currentImg = target;
    const rect = target.getBoundingClientRect();
    const pill = ensurePill();
    positionPill(pill, rect);
  });

  document.addEventListener(
    "scroll",
    () => {
      if (!currentImg) return;
      const rect = currentImg.getBoundingClientRect();
      const pill = document.getElementById(PILL_ID);
      if (!pill) return;
      positionPill(pill, rect);
    },
    { passive: true }
  );

  document.addEventListener("mouseout", (e) => {
    const to = e.relatedTarget;
    if (to && (to.id === PILL_ID || to === currentImg)) return;
    // if mouse leaves the image, pill will remain until the next hover/scroll updates position;
    // we explicitly hide when moving off the image and not onto the pill
    if (!(to instanceof HTMLElement) || to.id !== PILL_ID) hidePill();
  });

  // Hide if user clicks anywhere else
  document.addEventListener("click", (e) => {
    const tgt = e.target;
    if (!(tgt instanceof HTMLElement) || tgt.id !== PILL_ID) hidePill();
  });
})();
