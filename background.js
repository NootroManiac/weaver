let lastNodeId = null;
let userCreatedTabs = [];
let tabslist = []; // source of truth for the tabs 
let num_of_nodes = 1; //index 
let current_selected = 1; 
let root_node = 1; 
//define a boxes class 
//find out a way to edit the connections part of the thing and also have it integrate with the react flow if possible 
const nodes = [
  {
    id: '1',
    position: { x: 0, y: 0 },
    data: { 
      tab_title: 'Hello', 
      title: '',
      url: '',
      icon: '' || '',
      parentid: 1,
      connections: []
     },
  },
];
//add image, clickable url to data, and title 


//This is the thing that opens the side bar
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

//this checks for new tabs opened by the user 
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
/*
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
*/


//this checks for background tabs opened by the user 
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
//On command create new tab 
function openNewTab() {
  chrome.tabs.create({}, (tab) => {
    console.log("Opened new tab:", tab);
  });
}

// Listen for the keyboard command defined in manifest.json
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-new-tab") {
    openNewTab();
  }
});
// This is how the index.js gets the tabs
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_TABS") {
    sendResponse({ tabList });
  }
});
//implement bfs/ position editor 
//implement current tab tracker 