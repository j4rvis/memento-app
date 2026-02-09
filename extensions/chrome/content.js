// Content script — injected on demand to extract page HTML + meta tags
(() => {
  function getMeta(name) {
    const el =
      document.querySelector(`meta[property="${name}"]`) ||
      document.querySelector(`meta[name="${name}"]`);
    return el ? el.getAttribute("content") : null;
  }

  return {
    html: document.documentElement.outerHTML,
    meta: {
      title: document.title,
      ogTitle: getMeta("og:title"),
      ogDescription: getMeta("og:description"),
      ogImage: getMeta("og:image"),
      ogSiteName: getMeta("og:site_name"),
      author: getMeta("author"),
    },
  };
})();
