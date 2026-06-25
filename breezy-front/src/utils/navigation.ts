function currentPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function forceNavigate(path: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (currentPath() === path) {
    window.dispatchEvent(new CustomEvent("breezy:refresh-current-tab"));
    return;
  }

  window.location.assign(path);
}
