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
let nodeslist = [ // source of truth for the tabs 

    {
    id: '1', //is this the tabid 
    position: { x: 0, y: 0 },
    data: { 
      tab_title: 'Hello', 
      url: '',
      icon: '' || '',
      parentid: 1,
      tabid: 1, //or is this the tabid
      index: 1, 
      connections: [] //array of node indexes 
     },
  },

];
//each window has their own nodes list
//maybe implement a window data type 
let edgesList = []; 
//add image, clickable url to data, and title 

function broadcastGraphUpdate() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    for (let tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'UPDATE_GRAPH',
        payload: { nodes: nodesList, edges: edgesList },
      });
    }
  });
}

//This is the thing that opens the side bar
chrome.runtime.onInstalled.addListener((tab) => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

});


//WARNING: THIS MIGHT BREAK BECAUSE THESE MIGHT NOT BE MUTALLY EXCLUSIVE 
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
    //create a node instance 
    //edit the connections of the node to the current node 
    num_of_nodes++;
    nodeslist.push({
      id: String(num_of_nodes),
      position: { x: 0, y: 0 },  //create editing system 
      data: { 
        tab_title: tab.title, 
        url: tab.url,
        icon: tab.favIconUrl || '',
        parentid: parentId,
        tabid: tabid, 
        connections: [] //array of node indexes 
       },
    },)
    nodeslist[parentId].data.connections.push(String(num_of_nodes))
    //edit the connections of the node to the current node 
    //MAKJOEAJFD window specific later
    const edgeIds = new Set();
    
    nodeslist.forEach((node) => {
      nodeslist.data.connections.forEach(targetIndex => {
        const targetNode = nodes[targetIndex];
        if (!targetNode) return;
    
        // build a unique edge id
        const edgeId = `e${node.id}-${targetNode.id}`;
    
        // only add if we haven't seen it before
        if (!edgeIds.has(edgeId)) {
          edgeIds.add(edgeId);
          edgesList.push({
            id: edgeId,
            source: node.id,
            target: targetNode.id,
            type: 'smoothstep',   // optional style
            animated: true        // optional animation
          });
        }
      });
    });
    broadcastGraphUpdate();  
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
          num_of_nodes++;
          nodeslist.push({
            id: String(num_of_nodes),
            position: { x: 0, y: 0 },  //create editing system 
            data: { 
              tab_title: tab.title, 
              url: tab.url,
              icon: tab.favIconUrl || '',
              parentid: parentId,
              tabid: tabid, 
              connections: [] //array of node indexes 
             },
          },)


          nodeslist[parentId].data.connections.push(String(num_of_nodes))
          //edit the connections of the node to the current node 
          //MAKJOEAJFD window specific later
          const edgeIds = new Set();
          
          nodeslist.forEach((node) => {
            nodeslist.data.connections.forEach(targetIndex => {
              const targetNode = nodes[targetIndex];
              if (!targetNode) return;
          
              // build a unique edge id
              const edgeId = `e${node.id}-${targetNode.id}`;
          
              // only add if we haven't seen it before
              if (!edgeIds.has(edgeId)) {
                edgeIds.add(edgeId);
                edgesList.push({
                  id: edgeId,
                  source: node.id,
                  target: targetNode.id,
                  type: 'smoothstep',   // optional style
                  animated: true        // optional animation
                });
              }
            });
          });
          broadcastGraphUpdate();  


        }
      });

    }, 500); // Allow Chrome to set the URL

  }
});
//On command create new tab 
function openNewTab() {
  chrome.tabs.create({}, (tab) => {
    console.log("Opened new tab:", tab);
    //push a node 
    num_of_nodes++;
    nodeslist.push({
      id: String(num_of_nodes),
      position: { x: 0, y: 0 },  //create editing system 
      data: { 
        tab_title: tab.title, 
        url: tab.url,
        icon: tab.favIconUrl || '',
        parentid: parentId,
        tabid: tabid, 
        connections: [] //array of node indexes 
       },
    },)
    nodeslist[parentId].data.connections.push(String(num_of_nodes))
    //edit the connections of the node to the current node 
    //MAKJOEAJFD window specific later
    const edgeIds = new Set();
    
    nodeslist.forEach((node) => {
      nodeslist.data.connections.forEach(targetIndex => {
        const targetNode = nodes[targetIndex];
        if (!targetNode) return;
    
        // build a unique edge id
        const edgeId = `e${node.id}-${targetNode.id}`;
    
        // only add if we haven't seen it before
        if (!edgeIds.has(edgeId)) {
          edgeIds.add(edgeId);
          edgesList.push({
            id: edgeId,
            source: node.id,
            target: targetNode.id,
            type: 'smoothstep',   // optional style
            animated: true        // optional animation
          });
        }
      });
    });
    broadcastGraphUpdate();  
    isCommandPressed = false; 
  });
}

// Listen for the keyboard command defined in manifest.json//
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-new-tab") {
    isCommandPressed = true; 
    openNewTab();
    broadcastGraphUpdate();  
  }
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
    for (let i = 0; i < nodeslist.length; i++) {
      const node = nodeslist[i];
      if (node.data.tabid === tabId) {
        console.log(`Found a match at index ${i}:`, node);
        parentId = i;
      }
    }
  }, 100); // ← adjust delay here
});

//logic if the current focus tab is equal to the saved tab id, then that is the current tabs index in the array 
//implement tab history manager