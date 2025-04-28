import React, { useEffect, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from '@dagrejs/dagre';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
const root = createRoot(container);
 root.render(
   <div style={{ width: '100%', height: '100%' }}>
   <LayoutFlow />
   </div>
  );

 
const nodeWidth = 172;
const nodeHeight = 36;
 
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



export function getLayoutedElements(origNodes, origEdges, direction = 'TB') {
  // 1) Build a fresh Dagre graph each time
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction });

  // 2) Tell Dagre about each node/edge
  origNodes.forEach((n) => {
    g.setNode(n.id, { width: nodeWidth, height: nodeHeight });
  });
  origEdges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  // 3) Run the layout algorithm
  dagre.layout(g);

  const isHorizontal = direction === 'LR';

  // 4) Map to brand-new node objects (no in-place mutation)
  const layoutedNodes = origNodes.map((n) => {
    const { x, y } = g.node(n.id);
    return {
      ...n,
      position: {
        x: x - nodeWidth / 2,
        y: y - nodeHeight / 2,
      },
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      targetPosition: isHorizontal ? 'left' : 'top',
    };
  });

  // 5) You can return a tuple for clarity
  return [layoutedNodes, origEdges];
}

//todo 
//implement a initial edges constructor using the data from the nodes 



export default function LayoutFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(2);
  const [layoutDir, setLayoutDir] = useState('TB');

  useEffect(() => {
    const [layoutedNodes, layoutedEdges] = getLayoutedElements(
      nodes,
      edges,
      layoutDir
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, []);


  useEffect(() => {
    function handleMessage(message, sender, sendResponse) {
      if (message.action === 'UPDATE_GRAPH') {
        const { nodes: newNodes, edges: newEdges } = message.payload;
        const [layoutedNodes, layoutedEdges] = getLayoutedElements(
          newNodes,
          newEdges,
          layoutDir
        );
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        sendResponse({ status: 'OK' });
      }
      //  Return true if you’ll call sendResponse asynchronously:
      return true;
    }

  chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [layoutDir, setNodes, setEdges]);

  const onConnect = (params) => {
    setEdges((eds) => addEdge(params, eds));
  };
  
/*
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onLayout = useCallback(
    (direction) => {
      setLayoutDir(direction);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, direction);
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    },
    [nodes, edges, setNodes, setEdges]
  );

  const addRootNode = useCallback(() => {
    const newNode = { id: `${nodeId}`, data: { label: `Node ${nodeId}` }, position: { x: 0, y: 0 }, type: 'default' };
    const newNodes = [...nodes, newNode];
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, edges, layoutDir);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setNodeId((id) => id + 1);
  }, [nodes, edges, nodeId, layoutDir]);

  const addChildNode = useCallback(() => {
    if (!nodes.length) return;
    const parent = nodes[Math.floor(Math.random() * nodes.length)];
    const newNode = {
      id: `${nodeId}`,
      data: { label: `Node ${nodeId}` },
      position: { x: 0, y: 0 }, // initial pos overridden by layout
      type: 'default',
    };
    const newEdge = { id: `e${parent.id}-${nodeId}`, source: parent.id, target: `${nodeId}` };

    const newNodes = [...nodes, newNode];
    const newEdges = [...edges, newEdge];
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges, layoutDir);

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setNodeId((id) => id + 1);
  }, [nodes, edges, nodeId, layoutDir]);
  */
  // Message listener omitted for brevity
  return (
       <div
          className="reactflow-wrapper"
          style={{ width: '100%', height: '100%' }}
       >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}