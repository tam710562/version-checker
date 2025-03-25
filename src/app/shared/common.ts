export function encodeRegex(str: string): string {
  return !str ? str : str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function isNewerVersion(oldVer: string, newVer: string): boolean {
  if (!oldVer || !newVer) {
    return false;
  }
  const oldParts = oldVer.split('.');
  const newParts = newVer.split('.');
  for (let i = 0; i < newParts.length; i++) {
    const a = +newParts[i];
    const b = +oldParts[i];
    if (a > b) {
      return true;
    }
    if (a < b) {
      return false;
    }
  }
  return false;
}

export function createElementFromHTML(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;

  return template.content;
}

export function getKeyByValue<T = any>(
  object: { [key: string]: T },
  value: T
): string | undefined {
  return Object.keys(object).find((key) => object[key] === value);
}
