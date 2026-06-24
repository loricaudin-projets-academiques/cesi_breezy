function currentPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function forceNavigate(path: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (currentPath() === path) {
    window.location.reload();
    return;
  }

  window.location.assign(path);
}
