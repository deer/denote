import type { NavItem } from "../denote.config.ts";

export interface NavLink {
  title: string;
  href: string;
}

/** Walk the navigation tree and return the first item with an href. */
export function findFirstHref(items: NavItem[]): string | null {
  for (const item of items) {
    if (item.href) return item.href;
    if (item.children) {
      const found = findFirstHref(item.children);
      if (found) return found;
    }
  }
  return null;
}

/** Flatten navigation tree into an ordered list of page links. */
export function flattenNav(items: NavItem[]): NavLink[] {
  const result: NavLink[] = [];
  for (const item of items) {
    if (item.href) result.push({ title: item.title, href: item.href });
    if (item.children) result.push(...flattenNav(item.children));
  }
  return result;
}
