const mode = import.meta.env?.MODE;
export const hostedSite = mode === "pages" || mode === "site";
