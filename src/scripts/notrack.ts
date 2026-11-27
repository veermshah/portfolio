// Who the first-party tracker leaves out. Shared by the tracker and the blog admin.

const COOKIE_DOMAIN = () => (location.hostname.endsWith('veermickey.com') ? '; domain=.veermickey.com' : '');

/** Marks this browser as opted out for a year: a localStorage flag plus a .veermickey.com cookie so it covers the blog too. */
export function setOptOut() {
  try {
    localStorage.setItem('notrack', '1');
    document.cookie = `notrack=1${COOKIE_DOMAIN()}; path=/; max-age=31536000; samesite=lax; secure`;
  } catch {}
}

export function clearOptOut() {
  try {
    localStorage.removeItem('notrack');
    document.cookie = `notrack=${COOKIE_DOMAIN()}; path=/; max-age=0`;
  } catch {}
}

/** Automated browsers: agents' browsers, Lighthouse and PageSpeed, test runners and crawlers. They never count. */
const AUTOMATED_UA = /headless|lighthouse|pagespeed|speed insights|playwright|puppeteer|selenium|webdriver|phantomjs|electron|bot\b|bot\/|crawler|spider|slurp|gtmetrix|pingdom|vercel/i;

export function isAutomated() {
  try {
    if (navigator.webdriver) return true;
    if (AUTOMATED_UA.test(navigator.userAgent)) return true;
    // Headless Chrome reports no plugins and no languages more often than real browsers do.
    if (!navigator.languages || navigator.languages.length === 0) return true;
  } catch {}
  return false;
}
