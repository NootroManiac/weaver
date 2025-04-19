import React from 'react';
import ReactDOM from 'react-dom/client';
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' }, type: 'default' },
  { id: '2', position: { x: 100, y: 100 }, data: { label: 'Node 2' }, type: 'default' }
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' }
];

function FlowPanel() {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <ReactFlow nodes={initialNodes} edges={initialEdges} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<FlowPanel />);

/* ===== File: webpack.config.js ===== */
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  mode: 'development'
};