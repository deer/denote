/**
 * Copy Button Island
 * Adds a header bar with language label and copy button to code blocks.
 * Mounts once and attaches to all code blocks on the page.
 */
import { useEffect } from "preact/hooks";
import { signal } from "@preact/signals";

const COPY_ICON =
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;
const CHECK_ICON =
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

// Track which button was just copied (by index) and clear after timeout
const copiedIndex = signal(-1);

export function CopyButton() {
  useEffect(() => {
    // @deer/gfm wraps code blocks in: .highlight > .code-header + pre > code
    const headers = document.querySelectorAll(".code-header");

    headers.forEach((header, index) => {
      // Skip if already processed
      if (header.querySelector(".copy-btn")) return;

      const pre = header.nextElementSibling;
      const code = pre?.querySelector("code");
      if (!code) return;

      // Copy button
      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.type = "button";
      btn.setAttribute("aria-label", "Copy code");
      btn.innerHTML = COPY_ICON;

      btn.addEventListener("click", async () => {
        const text = code.textContent || "";
        try {
          await navigator.clipboard.writeText(text);
          copiedIndex.value = index;
          btn.innerHTML = CHECK_ICON;
          btn.style.color = "#22c55e";

          setTimeout(() => {
            copiedIndex.value = -1;
            btn.innerHTML = COPY_ICON;
            btn.style.color = "";
          }, 2000);
        } catch {
          // Clipboard API not available
        }
      });

      header.appendChild(btn);
    });
  }, []);

  // This island renders nothing visible — it just attaches to code blocks
  return null;
}
