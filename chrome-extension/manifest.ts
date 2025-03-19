import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

/**
 * @prop default_locale
 * if you want to support multiple languages, you can use the following reference
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
 *
 * @prop browser_specific_settings
 * Must be unique to your extension to upload to addons.mozilla.org
 * (you can delete if you only want a chrome extension)
 *
 * @prop permissions
 * Firefox doesn't support sidePanel (It will be deleted in manifest parser)
 *
 * @prop content_scripts
 * css: ['content.css'], // public folder
 */
const manifest = {
  manifest_version: 3,
  default_locale: 'en',
  name: 'Storage Explorer',
  browser_specific_settings: {
    gecko: {
      id: 'localstorageexplorer@example.com',
      strict_min_version: '109.0',
    },
  },
  version: packageJson.version,
  description: 'Easily view, copy or search local storage content from any webpage by clicking on the extension icon.',
  optional_host_permissions: ['https://*/*', 'http://*/*'],
  permissions: ['storage', 'scripting', 'tabs', 'activeTab'],
  action: {
    default_popup: 'popup/index.html',
    default_icon: 'icon32.png',
    default_title: 'Storage Explorer',
  },
  chrome_url_overrides: {},
  icons: {
    '48': 'icon48.png',
    '128': 'icon128.png',
  },
  // content_scripts: [
  //   {
  //     matches: ['http://*/*', 'https://*/*', '<all_urls>'],
  //     css: ['content.css'],
  //   },
  // ],
  web_accessible_resources: [
    {
      resources: ['*.js', '*.css', '*.svg', 'icon-128.png', 'icon32.png'],
      matches: ['*://*/*'],
    },
  ],
} satisfies chrome.runtime.ManifestV3;

export default manifest;
