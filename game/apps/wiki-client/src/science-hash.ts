/** Open in-game science when the hub Science button used `#science`. */

export function consumeScienceHash(open: () => void): () => void {
  const run = () => {
    if (location.hash === '#science') open();
  };
  run();
  window.addEventListener('hashchange', run);
  return () => window.removeEventListener('hashchange', run);
}
