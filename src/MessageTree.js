import React, { useRef, useEffect, useState} from 'react';
import * as d3 from 'd3';

function MessageNode({ parent = null, message = '', sender = 'root', row = 0, col = 0 } = {}) {
    return { 
        message, 
        sender, 
        row,
        col,
        children: [],
        parent
    };
}

const createSampleTree = () => {
    const root = MessageNode({ message: "Root Message", sender: "root" });

    const child1 = MessageNode({ parent: root, message: "Message 1", sender: "user" });
    root.children.push(child1);

    const child1_1 = MessageNode({ parent: child1, message: "Message 1.1", sender: "bot" });
    const child1_2 = MessageNode({ parent: child1, message: "Message 1.2", sender: "user" });
    child1.children.push(child1_1, child1_2);

    const child1_1_1 = MessageNode({ parent: child1_1, message: "Message 1.1.1", sender: "bot" });
    child1_1.children.push(child1_1_1);

    return root;
};

const sampleTreeData = createSampleTree();

function MessageTree() {
    const ref = useRef();
    const svgRef = useRef();
    const gRef = useRef();
    const [computedNodes, setComputedNodes] = useState([]);
    const zoom = d3.zoom()
        .scaleExtent([0.1, 3])
        .on("zoom", (event) => {
            const g = d3.select(gRef.current);
            g.attr('transform', event.transform);
        });

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const g = d3.select(gRef.current);

        const root = d3.hierarchy(sampleTreeData);
        const nodes = root.descendants();
        const links = root.links();


        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).distance(50).strength(1))
            .force("charge", d3.forceManyBody().strength(-100))
            .force("center", d3.forceCenter(400, 300))
            .on("tick", ticked);

        function ticked() {
            g.selectAll(".link")
                .data(links)
                .attr("d", d => `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`);

            g.selectAll(".node")
                .data(nodes)
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            g.selectAll(".label")
                .data(nodes)
                .attr("x", d => d.x + 10)
                .attr("y", d => d.y);
        }

        g.selectAll(".link")
            .data(links)
            .enter().append("path")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke", "#555")
            .attr("stroke-opacity", 0.4)
            .attr("stroke-width", 1.5);

        g.selectAll(".node")
            .data(nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", 5)
            .attr("fill", "#999");

        g.selectAll(".label")
            .data(nodes)
            .enter().append("text")
            .attr("class", "label")
            .text(d => d.data.message.substring(0, 10) + "...");
        
        setComputedNodes(nodes);

        const zoom = d3.zoom()
            .scaleExtent([0.1, 3])
            .on("zoom", (event) => {
                g.attr('transform', event.transform);
            });

            svg.call(zoom);

        }, []);
    
        const handleFocusClick = () => {
            const svg = d3.select(svgRef.current);
        
        // Use computedNodes state here
        const xMin = d3.min(computedNodes, d => d.x);
        const xMax = d3.max(computedNodes, d => d.x);
        const yMin = d3.min(computedNodes, d => d.y);
        const yMax = d3.max(computedNodes, d => d.y);
    
            const dx = xMax - xMin;
            const dy = yMax - yMin;
            const xCenter = (xMax + xMin) / 2;
            const yCenter = (yMax + yMin) / 2;
    
            const scale = Math.min(0.9 / Math.max(dx / 800, dy / 600), 3);
            const translate = [800 / 2 - scale * xCenter, 600 / 2 - scale * yCenter];
    
            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
        };
    
        return (
            <div ref={ref} tabIndex={0} style={{outline: "none"}}>
                <svg ref={svgRef} width={800} height={600}>
                    <g ref={gRef}></g>
                </svg>
                <button onClick={handleFocusClick}>Focus</button>
            </div>
        );
    }

export default MessageTree;