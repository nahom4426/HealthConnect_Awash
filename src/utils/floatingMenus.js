/*
 * Row action menus (`.dropdown-menu`) live inside table scroll boxes, so an
 * absolutely positioned menu gets clipped by the table. After every click this
 * pins open menus that sit inside a clipping box to the viewport (position: fixed)
 * next to their trigger button, opening upwards when there isn't room below,
 * and keeps them there while the page scrolls or resizes.
 */
const SELECTOR = ".dropdown-menu";
const GAP = 4;
const MARGIN = 8;

function isOpen(menu) {
  return menu.isConnected && getComputedStyle(menu).display !== "none";
}

function insideClippingBox(el) {
  let node = el.parentElement;
  while (node && node !== document.body && node.tagName !== "MAIN") {
    const cs = getComputedStyle(node);
    if (/(auto|scroll|hidden|clip)/.test(cs.overflowY + cs.overflowX)) return true;
    node = node.parentElement;
  }
  return false;
}

// The button that opens the menu: a button next to it that isn't part of the menu
function triggerOf(menu) {
  const host = menu.parentElement;
  if (!host) return null;
  return [...host.querySelectorAll("button, [role='button']")].find((b) => !menu.contains(b)) || host;
}

function place(menu) {
  const trigger = triggerOf(menu);
  if (!trigger) return;
  const rect = trigger.getBoundingClientRect();
  const w = menu.offsetWidth;
  const h = menu.offsetHeight;

  let top = rect.bottom + GAP;
  if (top + h > window.innerHeight - MARGIN && rect.top - h - GAP > MARGIN) top = rect.top - h - GAP;
  let left = rect.right - w;
  left = Math.max(MARGIN, Math.min(left, window.innerWidth - w - MARGIN));

  menu.dataset.floating = "1";
  Object.assign(menu.style, {
    position: "fixed",
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    right: "auto",
    bottom: "auto",
    marginTop: "0",
    zIndex: "60",
  });
}

function reset(menu) {
  delete menu.dataset.floating;
  ["position", "top", "left", "right", "bottom", "margin-top", "z-index"].forEach((k) => menu.style.removeProperty(k));
}

function update() {
  document.querySelectorAll(SELECTOR).forEach((menu) => {
    if (isOpen(menu)) {
      if (menu.dataset.floating || insideClippingBox(menu)) place(menu);
    } else if (menu.dataset.floating) {
      reset(menu);
    }
  });
}

function reposition() {
  document.querySelectorAll(`${SELECTOR}[data-floating]`).forEach((menu) => {
    if (isOpen(menu)) place(menu);
    else reset(menu);
  });
}

let installed = false;
export function installFloatingMenus() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  // Capture phase: row buttons often stop propagation. The update waits a frame,
  // so the row's own click handler (and Vue's re-render) still runs first.
  document.addEventListener("click", () => requestAnimationFrame(update), true);
  window.addEventListener("scroll", reposition, true);
  window.addEventListener("resize", reposition);
}
