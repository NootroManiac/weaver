import React, { useEffect, useState } from 'react';
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';

function FlowPanel() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

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

  return (
    <div style={{ height: '100vh', width: '100vw' }}> {/* ✅ Fix: full-screen container */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      />
    </div>
  );
}
