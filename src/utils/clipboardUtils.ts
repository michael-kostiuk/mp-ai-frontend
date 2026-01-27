export async function copyTextToClipboard(text: string): Promise<boolean> {
  // Prefer modern async clipboard API when available.
  try {
    if (window.isSecureContext && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back below.
  }

  // Fallback for mobile browsers that don't allow async clipboard writes
  // after an awaited async operation. This works more reliably when invoked
  // directly from a user gesture (e.g. a "Copy" button).
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.style.opacity = '0';

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
