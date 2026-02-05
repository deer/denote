---
title: Styling
description: CSS and Tailwind styling options for your documentation
---

# Styling

Denote uses Tailwind CSS for styling, giving you full control over your
documentation's appearance.

## Tailwind CSS

Tailwind is included by default. You can use any Tailwind utility classes in
your custom components:

```typescript
function Card({ title, children }) {
  return (
    <div class="p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p class="text-gray-600 dark:text-gray-400">
        {children}
      </p>
    </div>
  );
}
```

## Prose Styles

Documentation content uses Tailwind's Typography plugin for beautiful prose
styling:

```css
.doc-content {
  @apply prose prose-gray dark:prose-invert max-w-none;
}
```

## Code Block Styling

Code blocks are styled with syntax highlighting:

```css
.code-block {
  @apply bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto;
}

.code-block code {
  @apply text-sm text-gray-100 font-mono;
}
```

## Responsive Design

Denote is fully responsive. The layout adapts to different screen sizes:

- **Desktop (lg+)**: Sidebar visible, table of contents on right
- **Tablet (md-lg)**: Sidebar visible, no table of contents
- **Mobile (< md)**: Collapsible sidebar, mobile menu

### Breakpoints

```css
/* Tailwind default breakpoints */
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

## Dark Mode Classes

Use Tailwind's `dark:` prefix for dark mode styles:

```typescript
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  This adapts to dark mode!
</div>;
```

## Custom Components

Create styled components for reuse:

```typescript
// components/Button.tsx
interface ButtonProps {
  variant?: "primary" | "secondary";
  children: ComponentChildren;
}

export function Button({ variant = "primary", children }: ButtonProps) {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors";
  const variantClasses = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
    secondary:
      "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white",
  };

  return (
    <button class={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </button>
  );
}
```

## Animation

Add subtle animations for better UX:

```css
/* Smooth transitions */
.sidebar-link {
  @apply transition-colors duration-150;
}

/* Hover effects */
.card:hover {
  @apply -translate-y-0.5 shadow-lg;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
```

## Best Practices

1. **Use Tailwind utilities** - Avoid custom CSS when possible
2. **Support dark mode** - Always test both themes
3. **Keep it consistent** - Reuse component styles
4. **Optimize for readability** - Use appropriate contrast ratios
5. **Test responsively** - Check all breakpoints
