chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.windows.create({
    url: chrome.runtime.getURL("index.html"),
    type: "popup"
  }, function(win) {
    // win represents the Window object from windows API
    // Do something after opening
  });
});
