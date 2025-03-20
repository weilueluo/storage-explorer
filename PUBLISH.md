

# Publish

1. run `pnpm zip` and `pnpm zip:firefox` to create zip ready for publish at `dist-zip` directory
2. open https://chrome.google.com/webstore/devconsole/5e4c2202-6385-4542-9446-bc9611a201b6 in chrome
3. open storage explorer > packaging > upload new version > select zip file when requested
4. open https://addons.mozilla.org/en-US/developers/addons
5. open storage explorer > upload new version > select xpi file when requested > create new release in github and download zip file and upload for source code review