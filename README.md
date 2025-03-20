# Storage Explorer
Easily view, copy or search local storage content from any webpage by clicking on the extension icon. It also supports automatically deserialize json string.

## Install
### Chrome
https://chromewebstore.google.com/detail/local-storage-explorer/ihbcgmgbibicnkinndgpnmphahijahio

### Firefox
[https://addons.mozilla.org/firefox/addon/localstorage-explorer/](https://addons.mozilla.org/en-GB/firefox/addon/storage-explorer/)


## Usage
Local storage maintains a separate storage area for each given origin, data persists even when the browser is closed and reopened. It gets cleared only through JavaScript, or clearing the Browser cache / Locally Stored Data. It is a JSON object. For more information about local storage, see https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

This extension allow you to visualize, copy or search the content of the local storage easily. After clicking on the extension icon, you will see a popup, the extension will fetch the local storage content live which will be loaded into the popup shortly. On the left is a tree structure displaying the keys of the current active tab's local storage, on the right is the viewer of the current select node from the tree.

### Tree Explorer
The tree structure explorer contains metadata about the value associated with this key (type, key name, has children etc...). You can collapse and expand each node by click on individual item; or collapse/expand all by clicking on the button at the top of the tree explorer.

### Viewer
The viewer contains the full view on the current select node, you can have a look, and copy and content using the button at the top of this section.
