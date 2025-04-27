import React, { useEffect, useState, MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge, } from 'react';
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

//edit the initialNodes with the data from the nodes list 
//so either make a constructor and add node data types to this list 
//listen from messages from background.js about updates to the tab list 
const initialNodes = [
  {
    id: '1',
    data: { label: 'Hello' },
    position: { x: 0, y: 0 },
    type: 'input',
  },
];
 
const initialEdges = [
  //{ id: '1-2', source: '1', target: '2', label: 'to the', type: 'step' },
];

//todo 
//implement a initial edges constructor using the data from the nodes 
chrome.runtime.sendMessage({ type: "GET_TABS" }, (response) => {
  console.log("Tab list:", response.tabList);
  initialNodes = response.tabList; 
  initialEdges
});
function FlowPanel() {
  console.log("User-created background tab added:", updatedTab.url);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  
  /*
  useEffect(() => {
    const interval = setInterval(() => {
      chrome.storage.local.get(['nodes', 'edges'], (data) => {
        if (data.nodes && data.edges) {
          const processedNodes = data.nodes.map((n) => ({
            id: n.id,
            position: { x: Math.random() * 500, y: Math.random() * 500 },
            data: {
              label: (
                <div>
                  {n.icon && <img src={n.icon} alt="icon" style={{ width: '16px', verticalAlign: 'middle', marginRight: 4 }} />}
                  {n.title}
                </div>
              )
            }
          }));
          setNodes(processedNodes);
          setEdges(data.edges);
        }
      });
    }, 1000); // refresh every second

    return () => clearInterval(interval);
  }, []);
 */
  const addNode = useCallback(() => {
    setNodes((nds) => [
      ...nds,
      {
        id: `${nds.length + 1}`,
        position: { x: 200, y: 100 },
        data: { label: `Node ${nds.length + 1}` },
      },
    ]);
  }, []);

  const removeNode = useCallback((id) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
  }, []);


  return (
    <div style={{ height: '100vh', width: '100vw' }}> {/* ✅ Fix: full-screen container */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      />
    </div>
  );
  //implem
}
