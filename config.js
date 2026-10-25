// Settings for the Quran reader. Edit only if the original site changes its URLs.
window.QURAN_CONFIG = {
  // Total pages in the original 13-line book ("1 / 854" on the original site).
  totalPages: 854,

  // Page image addresses, tried in order. {nnnn} = page number padded to 4 digits (0001), {n} = plain number.
  // The original site uses .jpg for the first few pages and .png from page 4 on, so both are listed.
  imageUrls: [
    "https://ebooks.qamarapps.com/ebooks/quran-13-line/HTML/files/assets/common/page-substrates/page{nnnn}.png",
    "https://ebooks.qamarapps.com/ebooks/quran-13-line/HTML/files/assets/common/page-substrates/page{nnnn}.jpg"
  ],

  // The original site's own simple viewer page (used by the "Original viewer" fallback).
  viewerUrl:
    "https://ebooks.qamarapps.com/ebooks/quran-13-line/HTML/files/assets/basic-html/page-{n}.html",

  // How long to wait for a page before showing an error (milliseconds).
  loadTimeoutMs: 25000
};
