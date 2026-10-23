import JekyllGraph from './jekyll-graph.js';

const GRAPH_DATA_URL = '/assets/graph-net-web.json';

class GraphNav extends JekyllGraph {
  constructor() {
    super();
    if (!this.graphDiv) {
      return; // page has no #jekyll-graph container
    }
    // jekyll-graph's generated drawNetWeb() fetches without error handling,
    // so check the data first and only draw when it is actually available.
    fetch(GRAPH_DATA_URL)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} loading ${GRAPH_DATA_URL}`);
        }
        return res.json();
      })
      .then(data => {
        if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.links)) {
          throw new Error('graph data has no nodes/links');
        }
        this.drawNetWeb();
      })
      .catch(err => {
        console.error('graph:', err);
        const msg = document.createElement('p');
        msg.textContent = 'The graph could not be loaded.';
        this.graphDiv.appendChild(msg);
      });
  }
}

new GraphNav();
