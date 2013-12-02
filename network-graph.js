"use strict";


function networkGraph() {
  var width = 400,
      height = 500,
      pannable = true,
      zoomable = true,
      configurable = true,
      nodes = [],
      links = [],
      nodeLabeller = function (n) { return ""; },
      linkLabeller = function (n1, n2) { return ""; };

  // Can I make a function to construct these? I don't think so

  doItUp.nodes = function(value) {
    if (!arguments.length) return nodes;
    nodes = value;
    return doItUp;
  }

  doItUp.links = function(value) {
    if (!arguments.length) return links;
    links = value;
    return doItUp;
  }

  doItUp.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    return doItUp;
  }

  doItUp.height = function(value) {
    if (!arguments.length) return height;
    height = value;
    return doItUp;
  }

  doItUp.pannable = function(value) {
    if (!arguments.length) return pannable;
    pannable = value;
    return doItUp;
  }

  doItUp.zoomable = function(value) {
    if (!arguments.length) return zoomable;
    zoomable = value;
    return doItUp;
  }

  doItUp.nodeLabeller = function(value) {
    if (!arguments.length) return nodeLabeller;
    nodeLabeller = value;
    return doItUp;
  }

  doItUp.linkLabeller = function(value) {
    if (!arguments.length) return linkLabeller;
    linkLabeller = value;
    return doItUp;
  }

  // Closures like a boss
  function doItUp(selection) {
    var trans = null,
        scale = null;

    var selectedNode = null,
        selectedLink = null,
        mousedownLink = null,
        mousedownNode = null,
        mouseupNode = null;

    // add keyboard callback
    selection.on("keydown", keydown);

    var outer = selection.append("svg:svg")
      .attr("width", width)
      .attr("height", height)
      .attr("pointer-events", "all");

    var vis = outer
      .append("svg:g")
        .call(d3.behavior.zoom().on("zoom", rescale))
        .on("dblclick.zoom", null)
      .append("svg:g")
        .on("mousemove", mousemove)
        .on("mousedown", mousedown)
        .on("mouseup", mouseup);

    // WHY?
    vis.append("svg:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "white");

    // init force layout
    var force = d3.layout.force()
        .size([width, height])
        .nodes(nodes) // initialize with a single node
        .linkDistance(400)
        .charge(-300)
        .on("tick", tick);

    // line displayed when dragging new nodes
    var dragLine = vis.append("line")
        .attr("class", "dragLine");

    // get layout properties
    var node = vis.selectAll(".node"),
        link = vis.selectAll(".link");

    redraw();

    function linkNodes(node1, node2) {
      var link = {source: node1, target: node2};
      link.label = linkLabeller(node1, node2);
      links.push(link);
    }

    function mousedown() {
      if (!mousedownNode && !mousedownLink) {
        // allow panning if nothing is selected
        vis.call(d3.behavior.zoom().on("zoom"), rescale);
        return;
      }
    }

    function mousemove() {
      if (!mousedownNode) return;

      // update drag line
      dragLine
          .attr("x1", mousedownNode.x)
          .attr("y1", mousedownNode.y)
          .attr("x2", d3.svg.mouse(this)[0])
          .attr("y2", d3.svg.mouse(this)[1]);
    }

    function mouseup() {
      if (mousedownNode) {
        // hide drag line
        dragLine.attr("class", "dragLine_hidden")

        if (!mouseupNode) {
          // add node
          var point = d3.mouse(this);
          var node = {x: point[0], y: point[1]};
          node.label = nodeLabeller(mousedownNode);
          nodes.push(node);

          // select new node
          selectedNode = node;
          selectedLink = null;
          linkNodes(mousedownNode, node)
        }

        redraw();
      }
      // clear mouse event vars
      resetMouseVars();
    }

    function resetMouseVars() {
      mousedownNode = null;
      mouseupNode = null;
      mousedownLink = null;
    }

    function tick() {
      link.attr("transform", function(d) {
        return "translate(" + [Math.min(d.source.x, d.target.x),
                               Math.min(d.source.y, d.target.y)] + ")";
      });

      var moveX = function(d, node) {
        var baseX = Math.min(d.source.x, d.target.x);
        return node.x - baseX;
      }

      var moveY = function(d, node) {
        var baseY = Math.min(d.source.y, d.target.y);
        return node.y - baseY;
      }

      link.select("line")
        .attr("x1", function(d) { return moveX(d, d.source); })
        .attr("y1", function(d) { return moveY(d, d.source); })
        .attr("x2", function(d) { return moveX(d, d.target); })
        .attr("y2", function(d) { return moveY(d, d.target); });

      link.select("g")
        .attr("transform", function(d) {
          return "translate(" + [(moveX(d, d.source) + moveX(d, d.target)) / 2,
                                 (moveY(d, d.source) + moveY(d, d.target)) / 2] + ")";
        })

      node.attr("transform", function(d) {
        return "translate(" + [d.x, d.y] + ")";
      });
    }

    function rescale() {
      trans = d3.event.translate;
      scale = d3.event.scale;

      vis.attr("transform",
          "translate(" + trans + ")"
          + " scale(" + scale + ")");
    }

    // redraw force layout
    function redraw() {
      link = link.data(links);

      var linkGroup = link.enter().insert("g", ".node");

      linkGroup.append("line")
          .attr("class", "link")
          .on("mousedown",
            function(d) {
              mousedownLink = d;
              if (mousedownLink == selectedLink) selectedLink = null;
              else selectedLink = mousedownLink;
              selectedNode = null;
              redraw();
            });

      var costGroup = linkGroup.append("g");
      costGroup.append("rect")
        .attr("class", "cost-rect")
        .attr("width", "16")
        .attr("height", "16")
        .attr("x", "-8")
        .attr("y", "-8")

      costGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("class", "name")
        .text(function (d) { return d.label; });

      link.exit().remove();

      link.select("line")
        .classed("link_selected", function(d) { return d === selectedLink; });

      node = node.data(nodes);

      var g = node.enter().append("g").attr("class", "node");
      g.on("mousedown", function(d) {
        // disable zoom
        vis.call(d3.behavior.zoom().on("zoom"), null);

        mousedownNode = d;
        if (mousedownNode == selectedNode) selectedNode = null;
        else selectedNode = mousedownNode;
        selectedLink = null;

        // reposition drag line
        dragLine
            .attr("class", "link")
            .attr("x1", mousedownNode.x)
            .attr("y1", mousedownNode.y)
            .attr("x2", mousedownNode.x)
            .attr("y2", mousedownNode.y);

        redraw();
      }).on("mouseup", function(d) {
        if (mousedownNode) {
          mouseupNode = d;
          if (mouseupNode == mousedownNode) { resetMouseVars(); return; }
          linkNodes(mousedownNode, mouseupNode);

          // select new link
          selectedLink = link;
          selectedNode = null;

          // enable zoom
          vis.call(d3.behavior.zoom().on("zoom"), rescale);
          redraw();
        }
      });

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

      node
        .classed("node_selected", function(d) { return d === selectedNode; });

      if (d3.event) {
        // prevent browser's default behavior
        d3.event.preventDefault();
      }

      force.start();
    }

    function spliceLinksForNode(node) {
      var toSplice = links.filter(
        function(l) {
          return (l.source === node) || (l.target === node); });
      toSplice.map(
        function(l) {
          links.splice(links.indexOf(l), 1); });
    }

    function keydown() {
      if (!selectedNode && !selectedLink) return;
      switch (d3.event.keyCode) {
        case 8: // backspace
        case 46: { // delete
          if (selectedNode) {
            nodes.splice(nodes.indexOf(selectedNode), 1);
            spliceLinksForNode(selectedNode);
          }
          else if (selectedLink) {
            links.splice(links.indexOf(selectedLink), 1);
          }
          selectedLink = null;
          selectedNode = null;
          redraw();
          break;
        }
      }
    }
  }

  return doItUp;
}

