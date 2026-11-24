export const pagesAddress = "https://whitewolf06.github.io/legato-ui/";
export const primaryAddress = "https://legato-ui.ru/";

export function siteAddress(mode: string, override?: string, excludeMirror = false): string {
  const address = new URL(override || (mode === "site" || (mode === "pages" && excludeMirror) ? primaryAddress : pagesAddress));
  if (address.protocol !== "https:" || address.username || address.password || address.search || address.hash
    || !/^\/(?:[\w-]+\/)*$/.test(address.pathname)) throw new Error("Expected an HTTPS site URL ending in /");
  return address.href;
}
