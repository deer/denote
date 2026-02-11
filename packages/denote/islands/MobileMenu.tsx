/**
 * Mobile Menu Island
 * Signal-driven sidebar toggle with portal rendering to escape header stacking context
 */
import { effect, signal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { render } from "preact";
import type { NavItem } from "../docs.config.ts";

const isOpen = signal(false);

// Lock body scroll when sidebar is open
effect(() => {
  if (typeof document === "undefined") return;
  document.body.style.overflow = isOpen.value ? "hidden" : "";
});

interface MobileMenuProps {
  currentPath?: string;
  siteName: string;
  navigation: NavItem[];
  topNav?: { title: string; href: string }[];
}

export function MobileMenu(
  { currentPath, siteName, navigation, topNav }: MobileMenuProps,
) {
  const portalRef = useRef<HTMLDivElement | null>(null);

  // Create and manage portal container
  useEffect(() => {
    let portal = document.getElementById(
      "mobile-menu-portal",
    ) as HTMLDivElement | null;
    if (!portal) {
      portal = document.createElement("div");
      portal.id = "mobile-menu-portal";
      document.body.appendChild(portal);
    }
    portalRef.current = portal;

    // Render overlay into portal reactively
    const dispose = effect(() => {
      if (portalRef.current) {
        if (isOpen.value) {
          render(
            <MobileOverlay
              currentPath={currentPath}
              siteName={siteName}
              navigation={navigation}
              topNav={topNav}
            />,
            portalRef.current,
          );
        } else {
          render(null, portalRef.current);
        }
      }
    });

    return () => {
      dispose();
      if (portalRef.current) {
        render(null, portalRef.current);
      }
    };
  }, [currentPath]);

  return (
    <div class="lg:hidden">
      {/* Hamburger button */}
      <button
        type="button"
        class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        onClick={() => (isOpen.value = !isOpen.value)}
        aria-label="Toggle menu"
        aria-expanded={isOpen.value}
      >
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen.value
            ? (
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            )
            : (
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
        </svg>
      </button>
    </div>
  );
}

/** Overlay rendered via portal — lives outside header stacking context */
function MobileOverlay(
  { currentPath, siteName, navigation, topNav }: {
    currentPath?: string;
    siteName: string;
    navigation: NavItem[];
    topNav?: { title: string; href: string }[];
  },
) {
  return (
    <div class="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        class="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => (isOpen.value = false)}
      />

      {/* Sidebar panel */}
      <aside class="fixed top-0 left-0 z-50 w-72 h-full overflow-y-auto bg-white dark:bg-gray-950 shadow-2xl">
        {/* Header */}
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <a href="/" class="flex items-center gap-2 font-semibold">
            <span class="text-2xl">🦕</span>
            <span>{siteName}</span>
          </a>
          <button
            type="button"
            class="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
            onClick={() => (isOpen.value = false)}
            aria-label="Close menu"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Top nav links (Documentation, Blog, GitHub etc.) */}
        {topNav && topNav.length > 0 && (
          <div class="px-4 pt-4 pb-2 border-b border-gray-200 dark:border-gray-800">
            <div class="space-y-1">
              {topNav.map((item) => (
                <a
                  href={item.href}
                  onClick={() => (isOpen.value = false)}
                  class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  {item.title}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Sidebar navigation */}
        <nav class="p-4 space-y-6">
          {navigation.map((section) => (
            <NavSection section={section} currentPath={currentPath} />
          ))}
        </nav>
      </aside>
    </div>
  );
}

function NavSection(
  { section, currentPath }: { section: NavItem; currentPath?: string },
) {
  if (section.children?.length) {
    return (
      <div class="space-y-2">
        <div class="flex items-center gap-2 px-2 py-1 text-sm font-semibold text-gray-900 dark:text-white">
          {section.icon && <span>{section.icon}</span>}
          <span>{section.title}</span>
        </div>
        <ul class="space-y-1 ml-2 border-l border-gray-200 dark:border-gray-800">
          {section.children.map((child) => (
            <li>
              <NavSection section={child} currentPath={currentPath} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const isActive = section.href === currentPath;
  return (
    <a
      href={section.href}
      onClick={() => (isOpen.value = false)}
      class={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
        isActive
          ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-medium"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      {section.icon && <span>{section.icon}</span>}
      <span>{section.title}</span>
    </a>
  );
}
