let lastNodeId = null;
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
//this checks for tabs opened by the user 
chrome.tabs.onCreated.addListener(tab => {
  // get the actual URL (pendingUrl for navigations in flight, otherwise url)
  const url = tab.pendingUrl || tab.url;
  if (!url) return;

  // only count “real” user-opened tabs:
  // 1) tab.active === true  → it’s immediately shown to the user  
  // 2) tab.openerTabId === undefined → it wasn’t spawned in the background by another tab
  if (tab.active && tab.openerTabId === undefined) {
    chrome.runtime.sendMessage({ type: "NEW_TAB", url });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.startsWith('http')) {
    const site = {
      id: Date.now().toString(), // unique ID
      title: tab.title,
      url: tab.url,
      icon: tab.favIconUrl || '',
      parent: lastNodeId
    };

    chrome.storage.local.get({ nodes: [], edges: [] }, ({ nodes, edges }) => {
      nodes.push(site);
      if (lastNodeId) {
        edges.push({ id: `e${lastNodeId}-${site.id}`, source: lastNodeId, target: site.id });
      }

      chrome.storage.local.set({ nodes, edges });
      lastNodeId = site.id;
    });
  }
});
//this checks for background tabs opened by the user 
let userCreatedTabs = [];

// Filter tabs the user opens (not scripts/popups/etc.)
chrome.tabs.onCreated.addListener((tab) => {
  // Only proceed if it's not active (i.e., opened in background)
  if (!tab.active && !tab.openerTabId && tab.pendingUrl) {
    // Defer briefly to allow URL to load
    setTimeout(() => {
      chrome.tabs.get(tab.id, (updatedTab) => {
        if (
          updatedTab &&
          updatedTab.url &&
          updatedTab.url.startsWith("http") && // Only web URLs
          !updatedTab.url.startsWith("chrome://") &&
          !updatedTab.url.startsWith("chrome-extension://")
        ) {
          // Check for duplicates
          const alreadyTracked = userCreatedTabs.some(t => t.id === updatedTab.id);
          if (!alreadyTracked) {
            userCreatedTabs.push({
              id: updatedTab.id,
              url: updatedTab.url,
              title: updatedTab.title || ''
            });
            console.log("User-created background tab added:", updatedTab.url);
          }
        }
      });
    }, 500); // Allow Chrome to set the URL
  }
});