/**
 * Copy Button Island
 * Adds a clipboard copy button to code blocks.
 * Mounts once and attaches to all code blocks on the page.
 */
import { useEffect } from "preact/hooks";
import { signal } from "@preact/signals";

// Track which button was just copied (by index) and clear after timeout
const copiedIndex = signal(-1);

export function CopyButton() {
  useEffect(() => {
    const blocks = document.querySelectorAll(
      "pre:has(> code[class*='language-'])",
    );

    blocks.forEach((block, index) => {
      // Skip if already has a copy button
      if (block.querySelector(".copy-btn")) return;

      // Make relative for absolute positioning of button
      const el = block as HTMLElement;
      el.style.position = "relative";

      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.type = "button";
      btn.setAttribute("aria-label", "Copy code");
      btn.innerHTML =
        `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;

      // Style the button
      Object.assign(btn.style, {
        position: "absolute",
        top: "0.5rem",
        right: "3.5rem",
        padding: "4px",
        borderRadius: "4px",
        border: "1px solid rgba(128,128,128,0.3)",
        background: "rgba(128,128,128,0.1)",
        cursor: "pointer",
        opacity: "0",
        transition: "opacity 0.2s",
        color: "inherit",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "10",
      });

      // Show on hover
      el.addEventListener("mouseenter", () => {
        btn.style.opacity = "1";
      });
      el.addEventListener("mouseleave", () => {
        if (copiedIndex.value !== index) {
          btn.style.opacity = "0";
        }
      });

      btn.addEventListener("click", async () => {
        // Extract text content from the code block
        const code = block.querySelector("code");
        const text = code ? code.textContent || "" : block.textContent || "";

        try {
          await navigator.clipboard.writeText(text);
          copiedIndex.value = index;
          btn.innerHTML =
            `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
          btn.style.color = "#22c55e";

          setTimeout(() => {
            copiedIndex.value = -1;
            btn.innerHTML =
              `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;
            btn.style.color = "inherit";
            btn.style.opacity = "0";
          }, 2000);
        } catch {
          // Clipboard API not available
        }
      });

      el.appendChild(btn);
    });
  }, []);

  // This island renders nothing visible — it just attaches buttons to code blocks
  return null;
}
