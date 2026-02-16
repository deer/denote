export function EditLink(
  { editUrl, slug }: { editUrl?: string; slug: string },
) {
  if (!editUrl) return null;
  return (
    <div class="mt-12 pt-6 border-t border-[var(--denote-border)]">
      <a
        href={`${editUrl}/${slug}.md`}
        target="_blank"
        rel="noopener noreferrer"
        class="text-sm text-[var(--denote-text-muted)] hover:text-[var(--denote-primary-text)] transition-colors"
      >
        Edit this page →
      </a>
    </div>
  );
}
