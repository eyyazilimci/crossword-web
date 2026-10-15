/**
 * Scrolls only `container` (never the page) so that `el` is visible.
 * Element.scrollIntoView would also move the window, which on phones pushes the grid off screen.
 */
export function revealInContainer(el: HTMLElement | null, container: HTMLElement | null, margin = 8) {
  if (!el || !container) return
  const box = container.getBoundingClientRect()
  const r = el.getBoundingClientRect()

  if (r.top < box.top + margin) container.scrollTop -= box.top + margin - r.top
  else if (r.bottom > box.bottom - margin) container.scrollTop += r.bottom - box.bottom + margin

  if (r.left < box.left + margin) container.scrollLeft -= box.left + margin - r.left
  else if (r.right > box.right - margin) container.scrollLeft += r.right - box.right + margin
}
