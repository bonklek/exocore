const distance = 100;
//===============================================================//
// Function for linebreaking longer titles: 
//===============================================================//
const checkLineBreak = (text, words, symbol) => {
  let resultText = text.split(" ");
  if (!words) {
    words = 3;
  }
  if (!symbol) {
    symbol = "\n";
  }
  if (resultText.length > words) {
    for (let i = 1; i < resultText.length; i++) {
      if (i % words == 0) {
        resultText.splice(i, 0, symbol);
      } else {
        continue;
      }
    }
  }
  resultText = resultText.join(" ");
  return resultText;
};

//===============================================================//
// FILTER OUT NODEW WITH NO NEIGHBOURS
//===============================================================//
// const words = ['spray', 'limit', 'elite', 'exuberant', 'destruction', 'present'];

// const result = words.filter(word => word.length > 6);

const links = [];


//===============================================================//
// INITIALISE GRAPH, DEFINE SOURCE JSON, SET SIZE
//===============================================================//
const Graph = ForceGraph3D()

    (document.getElementById('3d-graph'))
      .height(850)
      .width(1700)
      .cameraPosition({ z: distance })
      .nodeId('id')
//===============================================================//
// SETTINGS AND VARIABLES
//===============================================================//
      // .enableNodeDrag(true)
      .linkWidth(0.1)
      .backgroundColor('black')	
      // .linkCurvature(0.1)
      .linkOpacity(1)
      .nodeOpacity(0.75)
      .linkDirectionalParticles(2)
      .linkDirectionalParticleSpeed(0.002)
      // .nodeLabel('label')
      // .enableNavigationControls(true)
      .showNavInfo(false)
      .nodeVal(0.03)
      .nodeColor('red')
      // .nodeAutoColorBy('label')
      // .nodeVisibility('neighbours')
      // .nodeVisibility((node) => node.neighbours > Number("0") ? false : true)
      // .linkHoverPrecision(10)
      // .enablePointerInteraction(true)

      .nodeThreeObjectExtend(true)
      .nodeThreeObject(node => {
        const sprite = new SpriteText(checkLineBreak(node.label), 5);
        sprite.material.depthWrite = false; // make sprite background transparent
        sprite.color = 'white';
        sprite.textHeight = 2;
        // sprite.borderWidth = 0.5;
        // sprite.backgroundColor = 'black';
        // sprite.padding = 2;
        // sprite.borderRadius = 10;
        return sprite;
      });



//===============================================================//
// FORCES:
//===============================================================//
      // Graph.d3force('charge').forceManyBody();
      // Graph.d3force('link').forceLink(links);
      // Graph.d3force('center').strength(1000);
      Graph.d3Force('charge').strength(-20);

      
//===============================================================//
// LOAD GRAPH DATA
// (fetched explicitly instead of .jsonUrl() so a missing or broken
// graph-net-web.json shows a message rather than an uncaught error)
//===============================================================//
fetch('/assets/graph-net-web.json')
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} loading graph data`);
    }
    return res.json();
  })
  .then(data => {
    if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.links)) {
      throw new Error('graph data has no nodes/links');
    }
    Graph.graphData(data);
  })
  .catch(err => {
    console.error('3d-graph:', err);
    const container = document.getElementById('3d-graph');
    if (container) {
      const msg = document.createElement('p');
      msg.textContent = 'The graph could not be loaded.';
      container.appendChild(msg);
    }
  });

//===============================================================//
// ZOOM ON NODE CLICK
//===============================================================//
Graph.onNodeClick(node => {
  // Aim at node from outside it
  const distance = 100;
  const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);

  const newPos = node.x || node.y || node.z
    ? { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }
    : { x: 0, y: 0, z: distance }; // special case if node is in (0,0,0)

  Graph.cameraPosition(
    newPos, // new position
    node, // lookAt ({ x, y, z })
    2000  // ms transition duration
  );
})

//===============================================================//
// AUTOMATIC ORBIT
//===============================================================//

let isRotationActive = false;
let angle = 0;
  setInterval(() => {
    if (isRotationActive) {
      Graph.cameraPosition({
        x: distance * Math.sin(angle),
        z: distance * Math.cos(angle)
     });
      angle += Math.PI / 1000;
    }
   }, 10);



//===============================================================//
// PAUSE ROTATION BUTTON
//===============================================================//
document.getElementById('rotationToggle').addEventListener('click', event => {
  isRotationActive = !isRotationActive;
  event.target.innerHTML = `${(isRotationActive ? 'Pause' : 'Orbit')}`;
}); 


