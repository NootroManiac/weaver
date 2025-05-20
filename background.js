let lastNodeId = null;
let userCreatedTabs = [];
let num_of_nodes = 1; //index 
let current_selected = 1; 
let parentIndex = 1; //parent index is not parent index its parent id (i forgot to change the name)
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
    };
  }
}

let programmaticallyCreatedTabs = new Set(); 

//each window has their own nodes list
//maybe implement a window data type 
//add image, clickable url to data, and title 
// Save windowData to local storage
function saveWindowDataToStorage() {
  chrome.storage.local.set({ windowData }, () => {
    console.log("Window data saved to local storage:", windowData);
  });
}

// Load windowData from local storage
function loadWindowDataFromStorageAsync() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["windowData"], (result) => {
      if (result.windowData && Object.keys(result.windowData).length > 0) {
        windowData = result.windowData;
        console.log("Window data loaded from local storage:", windowData);
      } else {
        console.log("No window data found in local storage. Returning without loading.");
      }
      resolve();
    });
  });
}

// Initialize data on extension startup
chrome.runtime.onStartup.addListener(() => {
  /*
  chrome.storage.local.clear(() => {
    console.log("Local storage cleared on startup.");
  });
  loadWindowDataFromStorage();
  */
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.clear(() => {
    console.log("Local storage cleared on startup.");
  });
  loadWindowDataFromStorage(); //
});

// Example: Clear data when a window is closed
chrome.windows.onRemoved.addListener((windowId) => {
  console.log(`Window ${windowId} closed. Cleaning up data.`);
  delete windowData[windowId];
  saveWindowDataToStorage(); // Save updated data after deletion
});


function broadcastGraphUpdate(windowId) {
  if (!windowData[windowId]) return;
  

  const { nodeslist, edgeslist } = windowData[windowId];
  chrome.runtime.sendMessage({
    type: 'UPDATE_GRAPH',
    payload: { nodes: nodeslist, edges: edgeslist },
  });

  console.log(`[broadcastGraphUpdate] Window ${windowId} - Nodes (%d):`, nodeslist.length, nodeslist);
  console.log(`[broadcastGraphUpdate] Window ${windowId} - Edges (%d):`, edgeslist.length, edgeslist);

  saveWindowDataToStorage();
}
//im going to crash out were are switching parentindex to the actual id of the parent not a index
// adds nodes and connection to the global list
async function AnAc(tab, windowId) {
    initializeWindowData(windowId);
    if (windowData[windowId].nodeslist.length === 0) {
    await loadWindowDataFromStorageAsync();
  }
    const { nodeslist, edgeslist } = windowData[windowId];
    const tabTitle = tab.title || 'Untitled';
    const tabUrl = tab.url || 'about:blank';
    const tabIcon = tab.favIconUrl || '';
  
    //console.log(`Window ${windowId} - Before adding node`, nodeslist, edgeslist);
    
    let newNodeId = nodeslist.length + 1; //fix repeats
    if (nodeslist.some((node) => node.id === String(newNodeId))){
      console.log("message");
      do{
        newNodeId++;
      } while(nodeslist.some((node) => node.id === String(newNodeId)));
    }
    
    nodeslist.push({
      id: String(newNodeId),
      position: { x: 0, y: 0 },
      data: {
        label: tabTitle,
        url: tabUrl,
        icon: tabIcon,
        parentid: parentIndex, //this is a id 
        tabid: tab.id,
        connections: [],
      },
    });
    //nodeslist.findIndex((nodes)); //its opposite day
    //parentID IS not the Parents ID value It is is index value 
    //parentindex is the parent ID 
    let parentId = nodeslist.findIndex((node) => parentIndex === node.id);
    const currentEdges = new Set(edgeslist.map((edge) => edge.id));
    if (nodeslist[parentId]) {
      nodeslist[parentId].data.connections.push(String(newNodeId));
      let new_node_index  = nodeslist[parentId].data.connections.length - 1; // gets the newly added node
      let target_index = nodeslist.findIndex((nodes) => nodes.id === nodeslist[parentId].data.connections[new_node_index]);
      let targetNode = nodeslist[target_index];
      let parent_id = nodeslist[parentId].id;

      const edgeId = `e${parent_id}-${targetNode.id}`;
      if (!currentEdges.has(edgeId)) {
        currentEdges.add(edgeId);

        edgeslist.push({
          id: edgeId,
          source: parent_id,
          target: targetNode.id,
          type: 'smoothstep',
          animated: true,
        });
      }
      /*
      nodeslist[parentId].data.connections.forEach((targetIndex) => {
        let target_index = nodeslist.findIndex((nodeId) => nodeslist[parentId].data.connection.findIndex((connections) => connections === nodeId.id));
        
        const targetNode = nodeslist[target_index];
        let parent_id = nodeslist[parentId].id; 
        console.log("current target node", targetNode);
        if (!targetNode) return;

        const edgeId = `e${parent_id}-${targetNode.id}`;

        if (!currentEdges.has(edgeId)) {
          currentEdges.add(edgeId);

          edgeslist.push({
            id: edgeId,
            source: parent_id,
            target: targetNode.id,
            type: 'smoothstep',
            animated: true,
          });
        }

      });
      */
      //console.log("current", nodeslist, edgeslist);
    }
  
    const edgeIds = new Set(edgeslist.map((edge) => edge.id));

    console.log(`Window ${windowId} - After adding node`, nodeslist, edgeslist);
  }

//This is the thing that opens the side bar
chrome.runtime.onInstalled.addListener((tab) => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  
});
/*
chrome.tabs.onRemoved.addListener( (tab) => {
  if(!windowData[tab.windowId]){
    return;
  }
  const {nodeslist} = windowData[tab.windowId];
  for (let i = 0; i < nodeslist.length; i++){
  if (nodeslist[i].data.tabId == tab.id)
  {
    for (let i = 0; i < nodeslist.length; i++){
      if (nodeslist[i].data.tabId == tab.id)
      {
        windowData[tab.windowId].nodeslist.splice(i, 1); 
      }
    }
    windowData[tab.windowId].nodeslist.splice(i, 1); 
  }
}
});
*/
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {

  const windowId = removeInfo.windowId;
  initializeWindowData(windowId);
  if (!windowData[windowId]) {
    return;
  }
  
  if (windowData[windowId].nodeslist.length === 0){
    await loadWindowDataFromStorage(); //check
  }
  const { nodeslist, edgeslist} = windowData[windowId];

  // Find the index of the node corresponding to the removed tab
  const nodeIndex = nodeslist.findIndex((node) => node.data.tabid === tabId);

  if (nodeIndex === -1) {
    console.warn(`Node for tabId ${tabId} not found in window ${windowId}`);
    return;
  }
  let parentnodeId = nodeslist.findIndex((node) => node.id === nodeslist[nodeIndex].data.parentid);
  const removedNode = nodeslist[nodeIndex];
  const parentNode = nodeslist[parentnodeId];
  if (typeof parentnodeId == "undefined"){
    console.log("what? I dont know if this is possible"); 
    return; 
  }
  
  //console.log(`Removing node for tabId ${tabId} in window ${windowId}:`, removedNode);

  // Reassign connections to the parent node or the node aboves
  //removed node in parent connection 
    let removed_node_pcindx = parentNode.data.connections.findIndex((connection) => removedNode.id === String(connection)); //this can be avoided if it allow the program to intentionally runtime error and then have error handling code 
    if (removed_node_pcindx !== -1){
      parentNode.data.connections.splice(removed_node_pcindx, 1); //removal
    }
    if (parentNode) {
      // Move connections from the removed node to its parent node
      removedNode.data.connections.forEach((connectionId) => {
        if (!parentNode.data.connections.includes(connectionId)) {
          windowData[windowId].nodeslist[parentnodeId].data.connections.push(connectionId);

          console.log("Before", windowData[windowId].nodeslist);

          let connections_index = nodeslist.findIndex((node) => connectionId === node.id);
          windowData[windowId].nodeslist[connections_index].data.parentid = windowData[windowId].nodeslist[parentnodeId].id;
          console.log("Before", windowData[windowId].nodeslist);
        }
      });
  } else if (nodeIndex > 0) {
    // If no parent node, assign connections to the node above
    const nodeAbove = nodeslist[nodeIndex - 1];
    removedNode.data.connections.forEach((connectionId) => {
      if (!nodeAbove.data.connections.includes(connectionId)) {
        nodeAbove.data.connections.push(connectionId);
      }
    });
  }

  // Remove the edges of the recently deleted node from the edgeslist
  windowData[windowId].edgeslist = edgeslist.filter(
    (edge) => edge.source !== removedNode.id && edge.target !== removedNode.id
  );

  console.log(`Node for tabId ${tabId} removed. Updated nodeslist:`, nodeslist);
  const currentEdges = new Set(edgeslist.map((edge) => edge.id));

  //make new edges with the updated connections list 
  nodeslist[nodeIndex].data.connections.forEach((targetIndex) => {
    let target_index = nodeslist.findIndex((nodeId) => String(targetIndex) === nodeId.id);

    const targetNode = nodeslist[target_index];


    let parent_id = nodeslist[parentnodeId].id; 
    console.log("current target node", targetNode);
    if (!targetNode) return;

    const edgeId = `e${parent_id}-${targetNode.id}`;
    console.log("current edge id:", edgeId );
    if (!currentEdges.has(edgeId)) {
      console.log
      currentEdges.add(edgeId);

      windowData[windowId].edgeslist.push({
        id: edgeId,
        source: parent_id,
        target: targetNode.id,
        type: 'smoothstep',
        animated: true,
      });
    }
    console.log("current edges list", edgeslist);
  });
  // Broadcast the updated graph
  nodeslist.splice(nodeIndex, 1);
  broadcastGraphUpdate(windowId);

  //remove connections from connection list 
});

//WARNING: THIS MIGHT BRE
// AK BECAUSE THESE MIGHT NOT BE MUTALLY EXCLUSIVE 
//this checks for new tabs opened by the user 
chrome.tabs.onCreated.addListener(async (tab) => {
  
  //settimeOut()
  const url = tab.pendingUrl || tab.url;
  if (!url) return;
  

  const windowId = tab.windowId;
  console.log(`Tab created in window ${windowId}`, tab);
  //initializeWindowData(windowId);
  //if (windowData[windowId].nodeslist.length === 0){
    //loadWindowDataFromStorage(); //check
//}
  if (programmaticallyCreatedTabs.has(tab.id)) {
    console.log(`Skipping programmatically created tab in window ${windowId}:`, tab.id);
    programmaticallyCreatedTabs.delete(tab.id);
    return;
  }

  if (tab.url !== 'about:blank' && tab.url !== undefined) {
    await AnAc(tab, windowId);
    broadcastGraphUpdate(windowId);
    
    const { nodeslist } = windowData[windowId];
    //console.log("current node list", nodeslist); 
    //console.log("current tabID", tab.id);
    parentIndex = nodeslist[nodeslist.findIndex((node) => node.data.tabid === tab.id)].id;
    //console.log("current parent tab index", parentId);
  }
  if (!windowData[windowId]) {
    return;
  } 
  //not window specific

  /*
  for (let i = 0; i < nodeslist.length; i++) {
    const node = nodeslist[i];
    if (node.data.tabid === tabId) {
      console.log(`Found a Smatch at index ${i}:`, node);
      parentId = i;
    }
  }
    */
});

chrome.windows.onRemoved.addListener((windowId) => {
  console.log(`Window ${windowId} closed. Cleaning up data.`);
  delete windowData[windowId];// might want to change this its just creating empty space 
});

//this checks for background tabs opened by the user 
// Filter tabs the user opens (not scripts/popups/etc.)
chrome.tabs.onCreated.addListener((tab) => {
  // Only proceed if it's not active (i.e., opened in background)
  const windowId = tab.windowId;
  const {nodeslist, edgeslist} = windowData[windowId];
  //initializeWindowData(windowId);
    //if (windowData[windowId].nodeslist.length === 0){
    //loadWindowDataFromStorage(); //check
  //}
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
            console.log("already tracked condition met" ,updatedTab.url);
            
          }
          AnAc(tab,windowId);
          broadcastGraphUpdate(windowId);  
        }
      );

    }, 500); // Allow Chrome to set the URL
  
  }
});
//On command create new tab 
function openNewTab() { // load from current 
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
    //console.log("working", nodeslist, edgeslist);
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
  console.log("window change detection?");
  //setTimeout(() => {
    initializeWindowData(windowId);
    if (!windowData[windowId]) return; 
  
    const { nodeslist } = windowData[windowId];

    for (let i = 0; i < nodeslist.length; i++) {
      const node = nodeslist[i];
      if (node.data.tabid === tabId) {
        console.log(`Found a match at index ${i}:`, node);
        parentIndex = nodeslist[i].id;
      }
    }
  //}, 100); // ← adjust delay 
  
  chrome.tabs.get(tabId, (tab) => {
    //console.log('Switched to tab:', tabId);
    //console.log('URL is now:', tab.url);
    //console.log('Title:', tab.title);
    // …do whatever you need with the new active tab
  });

});
//implement tab removal 
//logic if the current focus tab is equal to the saved tab id, then that is the current tabs index in the array 
//implement tab history manager
//implement
// Listen for messages from index.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "FOCUS_TAB") {
    chrome.tabs.update(msg.tabId, { active: true }, (tab) => {
      if (chrome.runtime.lastError) {
        console.error("Error focusing tab:", chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log(`Focused tab with ID: ${msg.tabId}`);
        sendResponse({ success: true });
      }
    });
    return true; // Indicate that the response will be sent asynchronously
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const windowId = tab.windowId;
  initializeWindowData(windowId);

  if (!windowData[windowId]) return;

  const { nodeslist } = windowData[windowId];

  // Find the node corresponding to the updated tab
  const nodeIndex = nodeslist.findIndex((node) => node.data.tabid === tabId);

  if (nodeIndex === -1) {
    console.warn(`Node for tabId ${tabId} not found in window ${windowId}`);
    return;
  }

  const node = nodeslist[nodeIndex];

  // Update the node's label if the title or URL has changed
  if (changeInfo.title || changeInfo.url) {
    const updatedLabel = changeInfo.title || tab.title || 'Untitled';
    const updatedUrl = changeInfo.url || tab.url || 'about:blank';

    windowData[windowId].nodeslist[nodeIndex].data.label = `${updatedLabel}`;

    console.log(`Node updated for tabId ${tabId}:`, node);

    // Broadcast the updated graph to the front-end
    broadcastGraphUpdate(windowId);
  }
});
//add node tree update when window changed
/*
chrome.windows.onFocusedChanged.addListener((windowId) =>{
  if (!windowData[windowId]) {
    
  };
//

});
*/
