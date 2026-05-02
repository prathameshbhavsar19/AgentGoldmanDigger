// Accessibility: skip to main content link for keyboard/screen-reader users
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand focus:text-white focus:rounded focus:text-sm focus:font-medium"
    >
      Skip to main content
    </a>
  )
}
