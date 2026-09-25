export function isPdfFile(filename = "") {
  return /\.pdf$/i.test(filename);
}

export async function openPdfInNewTab(
  storageFilename,
  fetchFile,
  browser = window
) {
  if (!storageFilename) return false;

  const tab = browser.open("about:blank", "_blank");
  if (!tab) return false;
  tab.opener = null;

  try {
    const blob = await fetchFile(storageFilename);
    if (!blob) throw new Error("Failed to load PDF");

    const objectUrl = browser.URL.createObjectURL(blob);
    tab.location.href = objectUrl;
    browser.setTimeout(() => browser.URL.revokeObjectURL(objectUrl), 60_000);
    return true;
  } catch (error) {
    tab.close();
    throw error;
  }
}
