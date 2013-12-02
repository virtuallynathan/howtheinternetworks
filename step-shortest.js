"use strict";


var shortestPather = null;


function stepPath() {
  if (shortestPather) {
    shortestPather();
  } else {
    shortestPather = shortestWrapper();
  }
}


function shortestWrapper() {
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

  // States: 0 - getting min
  //         1 - looping thru adjacent
  //         2 - pushing to Q
  var state = 0;
  var ui = 0;

  var u;
  var adj;
  var alt;

  function shortestPath() {
    console.log(state);
    console.log(Q.length);
    console.log(u);
    // Coroutines are for hipsters
    switch (state) {
      case 0:
        if (Q.length <= 0) {
          state = 3;
          break;
        }

        u = getMin(Q);
        u.visited = true;

        state = 1;
        ui = 0;
        break;
      case 1:
        if (ui >= u.adjacent.length) {
          state = 0;
          ui = 0;
          break;
        }

        adj = u.adjacent[ui].node;
        var cost = u.adjacent[ui].cost;
        alt = u.distance + cost;

        if (!adj.visited && (adj.distance === null || alt < adj.distance)) {
          state = 2;
        } else {
          state = 1;
          ui += 1;
        }
        break;
      case 2:    
        adj.distance = alt;
        adj.previous = u;
        Q.push(adj);
        ui += 1;
        state = 1;
        break;
      case 3:
        alert("lets get this shit done");
        resultGraph();
        break;
    }
  }

  return shortestPath;
}

function showNodes() {
  var nodeInfo = d3.select("#chart3").selectAll("svg").data(networkNodes);
  var g = nodeInfo.enter().append("svg").append("g");

  g.append("circle")
      .attr("r", 5)
    .transition()
      .duration(750)
      .ease("elastic")
      .attr("r", 14);

  g.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("class", "name")
    .text(function (d) { return d.label; });

  node.exit().transition()
      .attr("r", 0)
    .remove();
}