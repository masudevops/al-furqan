const callbacks = new Map<Element, () => void>();
let observer: IntersectionObserver | null = null;

// One shared observer for every Ayah, firing once when an element comes within ~one screen of the viewport.
export const whenNearViewport = (element: Element, callback: () => void) => {
  if (typeof IntersectionObserver === "undefined") { callback(); return () => {}; }
  observer ??= new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const run = callbacks.get(entry.target);
      callbacks.delete(entry.target);
      observer?.unobserve(entry.target);
      run?.();
    }
  }, { rootMargin: "1200px 0px" });
  callbacks.set(element, callback);
  observer.observe(element);
  return () => { callbacks.delete(element); observer?.unobserve(element); };
};
