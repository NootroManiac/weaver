import React, { useEffect, useState, useRef, useCallback  } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useReactFlow, 
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowInstance,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  OnConnectParams,
  Node,
  Edge,
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
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const instanceRef = useRef(null);

  const onInit = useCallback((instance) => {
    instanceRef.current = instance;
  }, []);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
  }, []);

  const updateFlow = useCallback(({ nodes: newNodes, edges: newEdges }) => {
    if (instanceRef.current) {
      instanceRef.current.setNodes(newNodes);
      instanceRef.current.setEdges(newEdges);
      instanceRef.current.fitView({ padding: 0.2 });
    }
    setNodes(newNodes);
    setEdges(newEdges);
  }, []);

  useEffect(() => {
    const listener = (message) => {
      if (message.type === 'UPDATE_GRAPH') {
        const { nodes: newNodes, edges: newEdges } = message.payload;
        updateFlow({ nodes: newNodes, edges: newEdges });
        console.group('[LayoutFlow] Incoming UPDATE_GRAPH');
        console.log('message received');        
        console.log('Nodes (%d):', newNodes.length, newNodes);
        console.log('Edges (%d):', newEdges.length, newEdges);
        console.groupEnd();
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [updateFlow]);

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
        onInit={onInit}
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