let lastNodeId = null;
let userCreatedTabs = [];
let num_of_nodes = 1; //index 
let current_selected = 1; 
let parentId = 1; 
let root_node = 1; 
let tab_id_list = [];
let isCommandPressed = false; 
//define a boxes class 
//find out a way to edit the connections part of the thing and also have it integrate with the react flow if possible
let windowData = {};
function initializeWindowData(windowId) {
  if (!windowData[windowId]) {
    windowData[windowId] = {
      nodeslist: [],
      edgeslist: [],
      windowId: windowId
    };
  }
}

let programmaticallyCreatedTabs = new Set(); 

//each window has their own nodes list
//maybe implement a window data type 
//add image, clickable url to data, and title 

function broadcastGraphUpdate(windowId) {
  if (!windowData[windowId]) return;

  const { nodeslist, edgeslist } = windowData[windowId];
  chrome.runtime.sendMessage({
    type: 'UPDATE_GRAPH',
    payload: { nodes: nodeslist, edges: edgeslist },
  });

  console.log(`[broadcastGraphUpdate] Window ${windowId} - Nodes (%d):`, nodeslist.length, nodeslist);
  console.log(`[broadcastGraphUpdate] Window ${windowId} - Edges (%d):`, edgeslist.length, edgeslist);


}
// adds nodes and connection to the global list
function AnAc(tab, windowId) {
    initializeWindowData(windowId);
  
    const { nodeslist, edgeslist } = windowData[windowId];
    const tabTitle = tab.title || 'Untitled';
    const tabUrl = tab.url || 'about:blank';
    const tabIcon = tab.favIconUrl || '';
  
    console.log(`Window ${windowId} - Before adding node`, nodeslist, edgeslist);
  
    const newNodeId = nodeslist.length + 1;
    nodeslist.push({
      id: String(newNodeId),
      position: { x: 0, y: 0 },
      data: {
        label: tabTitle,
        url: tabUrl,
        icon: tabIcon,
        parentid: parentId,
        tabid: tab.id,
        connections: [],
      },
    });
  
    if (nodeslist[parentId]) {
      nodeslist[parentId].data.connections.push(String(newNodeId));
    }
  
    const edgeIds = new Set(edgeslist.map((edge) => edge.id));
    nodeslist.forEach((node) => {
      node.data.connections.forEach((targetIndex) => {
        const targetNode = nodeslist[targetIndex];
        if (!targetNode) return;
  
        const edgeId = `e${node.id}-${targetNode.id}`;
        if (!edgeIds.has(edgeId)) {
          edgeIds.add(edgeId);
          edgeslist.push({
            id: edgeId,
            source: node.id,
            target: targetNode.id,
            type: 'smoothstep',
            animated: true,
          });
        }
      });
    });
  
    console.log(`Window ${windowId} - After adding node`, nodeslist, edgeslist);
  }

//This is the thing that opens the side bar
chrome.runtime.onInstalled.addListener((tab) => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  
});


//WARNING: THIS MIGHT BREAK BECAUSE THESE MIGHT NOT BE MUTALLY EXCLUSIVE 
//this checks for new tabs opened by the user 
chrome.tabs.onCreated.addListener((tab) => {
  const url = tab.pendingUrl || tab.url;
  if (!url) return;

  const windowId = tab.windowId;
  console.log(`Tab created in window ${windowId}`, tab);

  if (programmaticallyCreatedTabs.has(tab.id)) {
    console.log(`Skipping programmatically created tab in window ${windowId}:`, tab.id);
    programmaticallyCreatedTabs.delete(tab.id);
    return;
  }

  if (tab.url !== 'about:blank' && tab.url !== undefined) {
    AnAc(tab, windowId);
    broadcastGraphUpdate(windowId);
  }
});

chrome.windows.onRemoved.addListener((windowId) => {
  console.log(`Window ${windowId} closed. Cleaning up data.`);
  delete windowData[windowId];// might want to change this its just creating empty space 
});

//this checks for background tabs opened by the user 
// Filter tabs the user opens (not scripts/popups/etc.)
chrome.tabs.onCreated.addListener((tab) => {
  // Only proceed if it's not active (i.e., opened in background)
  console.log("initial ", nodeslist, edgeslist);
  if (!tab.active && !tab.openerTabId && tab.pendingUrl && tab.url !== 'about:blank') {
    // Defer briefly to allow URL to load
    console.log("pass first check for pending ", nodeslist, edgeslist);
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
            console.log("already tracked condition met" ,updatedTab.url);
            
          }
          AnAc(tab,wind);
          broadcastGraphUpdate();  
        }
      });

    }, 500); // Allow Chrome to set the URL

  }
});
//On command create new tab 
function openNewTab() {
  chrome.windows.getCurrent((currentWindow) => {
  chrome.tabs.create({}, (tab) => {
    if (tab.openerTabId !== undefined || tab.url === 'about:blank') {
      console.log("Filtered out non-user-created or default tab:", tab);
      return;
    }
    if (tab.id) {
        programmaticallyCreatedTabs.add(tab.id); // Track the tab ID
    }
    console.log("Opened new tab:", tab);
    //edit the connections of the node to the current node 
    //MAKJOEAJFD window specific later
    AnAc(tab, currentWindow.id);
    broadcastGraphUpdate(currentWindow.id);  
  });
});
}

// Listen for the keyboard command defined in manifest.json//
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-new-tab") {
    isCommandPressed = true; 
    openNewTab();
    broadcastGraphUpdate();  
    console.log("working", nodeslist, edgeslist);
  }
  isCommandPressed = false; 
});
// This is how the index.js gets the tabs
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_TABS") {
    sendResponse({ tabList });
  }
});

//implement current tab tracker
chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  // tabId = ID of the newly active tab
  // windowId = ID of the window containing that tab
  // windowspecific 
  // wait 
  chrome.tabs.get(tabId, (tab) => {
    console.log('Switched to tab:', tabId);
    console.log('URL is now:', tab.url);
    console.log('Title:', tab.title);
    // …do whatever you need with the new active tab
  });

  setTimeout(() => {
    if (!windowData[windowId]) return; 
    const { nodeslist } = windowData[windowId];
    for (let i = 0; i < nodeslist.length; i++) {
      const node = nodeslist[i];
      if (node.data.tabid === tabId) {
        console.log(`Found a match at index ${i}:`, node);
        parentId = i;
      }
    }
  }, 25); // ← adjust delay 
});
//implement tab removal 
//logic if the current focus tab is equal to the saved tab id, then that is the current tabs index in the array 
//implement tab history manager