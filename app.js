"use strict";

var networkNodes = [{label: "A"}];

var lastName = "A";

function nodeLabel(prev) {
  lastName = String.fromCharCode(lastName.charCodeAt(0) + 1);
  return lastName;
}

function linkLabel(node1, node2) {
  var cost = parseInt(prompt("Enter link cost", "1"));
  return cost;
}

var graph = networkGraph()
  .nodes(networkNodes)
  .nodeLabeller(nodeLabel)
  .linkLabeller(linkLabel);

var networkLinks = graph.links();

var container = d3.select('#chart')
  .call(graph);


function findByName(name) {
  for (var index in networkNodes) {
    var node = networkNodes[index];
    if (node.name == name) {
      return node;
    }
  }
  return null;
}

function getAdjacent(node) {
  var adjacent = []
  for (var index in networkLinks) {
    var link = networkLinks[index];
    if (link.source == node) {
      adjacent.push({node: link.target, cost: parseInt(link.label)});
    } else if (link.target == node) {
      adjacent.push({node: link.source, cost: parseInt(link.label)});
    }
  }
  return adjacent;
}

function getMin(q) {
  var minIndex = -1;
  var min = null;
  for (var i = 0; i < q.length; i++) {
    var node = q[i];
    if (!node.visited && (min === null || node.distance < min)) {
      minIndex = i;
      min = node.distance;
    }
  }
  var node = q.splice(minIndex, 1);
  return node[0];
}

function shortestPath() {
  var source = document.getElementById("from-node").value;
  var Q = []
  for (var index in networkNodes) {
    var node = networkNodes[index];
    node.visited = false;
    node.distance = null;
    node.previous = null;
    node.adjacent = getAdjacent(node);
    if (node.label == source) {
      node.distance = 0;
      Q.push(node);
    }
  }

  while (Q.length > 0) {
    var u = getMin(Q);
    u.visited = true;
    for (var i = 0; i < u.adjacent.length; i++) {
      var adj = u.adjacent[i].node;
      var cost = u.adjacent[i].cost;
      var alt = u.distance + cost;
      if (!adj.visited && (adj.distance === null || alt < adj.distance)) {
        adj.distance = alt;
        adj.previous = u;
        Q.push(adj);
      }
    }
  }

  for (var index in networkNodes) {
    console.log(networkNodes[index]);
  }
  resultGraph();
}

function resultGraph() {
  var roots = [];
  var existing = d3.map();

  function linkedOrNew(node) {
    if (node.previous !== null && existing.has(node.label)) {
      return existing.get(node.label);
    } else {
      var newNode = {label: node.label, linked: []};
      existing.set(node.label, newNode);
      if (node.previous === null) {
        console.log("Pushing " + node.label);
        roots.push(newNode);
      }
      return newNode;
    }
  }

  for (var index in networkLinks) {
    var link = networkLinks[index];
    var source = link.source;
    var target = link.target;

    var newSource = linkedOrNew(source);
    var newTarget = linkedOrNew(target);

    if (source.previous === target) {
      newTarget.linked.push({source: newTarget, target: newSource, label: link.label})
    } else if (target.previous === source) {
      newSource.linked.push({source: newSource, target: newTarget, label: link.label})
    } else {
      console.log("Not linking " + source.label + " and " + target.label);
    }
  }

  var graphs = [];

  for (var index in roots) {
    var linkBuilder = function(node) {
      graph.nodes.push(node);
      for (var index in node.linked) {
        var link = node.linked[index];
        link.source = node;
        graph.links.push(link);
        linkBuilder(link.target);
      }
    }

    var root = roots[index];
    var graph = {nodes: [], links: []};
    linkBuilder(root);

    graphs.push(graph);
  }
  console.log(networkNodes);
  console.log(graphs);
  d3.select('#chart2').selectAll("div").data(graphs)
    .enter().append('div')
      .each(function (d) {
        console.log("hi!");
        var graph = networkGraph()
          .height(200)
          .nodes(d.nodes)
          .links(d.links);
        d3.select(this).call(graph);
      });
}
