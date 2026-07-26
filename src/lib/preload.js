/**
 * Fetches every URL as a Blob and reports aggregate progress 0–100.
 * Replaces `preload-it` (unmaintained since 2020) with ~30 lines.
 *
 * XHR rather than fetch() because `xhr.upload`-style progress on downloads is
 * still the least fiddly way to get `loaded / total` without manually draining
 * a ReadableStream.
 *
 * @returns {{ promise: Promise<string[]>, cancel: () => void }}
 */
export function preloadWithProgress(urls, onProgress) {
  const requests = [];
  const ratios = new Array(urls.length).fill(0);

  const report = () => {
    const total = ratios.reduce((sum, r) => sum + r, 0) / urls.length;
    onProgress?.(Math.round(total * 100));
  };

  const promise = Promise.all(
    urls.map(
      (url, i) =>
        new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          requests.push(xhr);

          xhr.open("GET", url, true);
          xhr.responseType = "blob";

          xhr.onprogress = (event) => {
            if (!event.lengthComputable) return;
            ratios[i] = event.loaded / event.total;
            report();
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              ratios[i] = 1;
              report();
              resolve(URL.createObjectURL(xhr.response));
            } else {
              reject(new Error(`${url} responded ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error(`Failed to load ${url}`));
          xhr.send();
        })
    )
  );

  return {
    promise,
    cancel: () => requests.forEach((xhr) => xhr.abort()),
  };
}

/**
 * Feature-detects muted autoplay by actually trying it, which is what
 * `can-autoplay` did under the hood. No dependency needed.
 */
export async function canAutoplay(video) {
  try {
    await video.play();
    return true;
  } catch {
    return false;
  }
}
