class Bubbleplot {
    margin = {
        top: 10, right: 130, bottom: 40, left: 40
    }

    constructor(svg, tooltip, data, width = 650, height = 320) {
        this.svg = svg;
        this.tooltip = tooltip;
        this.data = data;
        this.width = width;
        this.height = height;
        this.handlers = {};
        this.currentYear = 0;
    }

    initialize() {
        this.svg = d3.select(this.svg);
        this.tooltip = d3.select(this.tooltip);
        this.container = this.svg.append("g");
        this.xAxis = this.svg.append("g");
        this.yAxis = this.svg.append("g");
        this.legend = this.svg.append("g");

        this.xScale = d3.scaleLog();
        this.yScale = d3.scaleLinear();
        this.zScale = d3.scaleOrdinal().range(d3.schemeTableau10);
        this.radiusScale = d3.scaleSqrt();

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        this.brush = d3.brush()
            .extent([[0, 0], [this.width, this.height]])
            .on("start brush", (event) => {
                this.brushCircles(event);
            });
    }

    update(xVar, yVar, colorVar, radiusVar, currentYear, country) {
        this.xVar = xVar;
        this.yVar = yVar;
        this.colorVar = colorVar;
        this.radiusVar = radiusVar;
        this.currentYear = currentYear;
        this.country = country;

        this.data.sort((a, b) => b[radiusVar] - a[radiusVar]); // sort so that smaller circles are on top
        const filteredData = this.data.filter(d => d["Year"] == currentYear);

        const xExtent = d3.extent(filteredData, d => d[this.xVar]);
        this.xScale.domain([xExtent[0] * 0.9, xExtent[1]]).range([0, this.width]);

        const yExtent = d3.extent(filteredData, d => d[this.yVar]);
        const yOffset = (yExtent[1] - yExtent[0]) * 0.05;
        this.yScale.domain([yExtent[0] - yOffset, yExtent[1]]).range([this.height, 0]);

        this.zScale.domain([...new Set(this.data.map(d => d[this.colorVar]))]).range(d3.schemeTableau10);

        this.radiusScale.domain(d3.extent(this.data, d => d[this.radiusVar])).range([6, 27]);

        this.container.call(this.brush);

        this.circles = this.container.selectAll("circle")
            .data(data)
            .join("circle")
            .on("mouseover", (e, d) => {
                d3.select(e.currentTarget).attr("r", parseFloat(d3.select(e.currentTarget).attr("r")) + 2).style("opacity", 1);

                this.tooltip.select(".tooltip-inner")
                    .html(`${d[this.country]}<br />${this.xVar}: ${d[this.xVar]}<br />${this.yVar}: ${d[this.yVar]}`);

                Popper.createPopper(e.target, this.tooltip.node(), {
                    placement: 'top',
                    modifiers: [
                        {
                            name: 'arrow',
                            options: {
                                element: this.tooltip.select(".tooltip-arrow").node(),
                            },
                        },
                        {
                            name: 'offset',
                            options: {
                                offset: [0, 10],
                            },
                        },
                    ],
                });

                this.tooltip.style("display", "block");
            })
            .on("mouseout", (e, d) => {
                d3.select(e.currentTarget).attr("r", parseFloat(d3.select(e.currentTarget).attr("r")) - 2).style("opacity", 0.9);
                this.tooltip.style("display", "none");
            });

        this.circles = this.container.selectAll("circle")
            .data(filteredData)
            .join("circle")

        this.circles
            .transition()
            .attr("cx", d => this.xScale(d[this.xVar]))
            .attr("cy", d => this.yScale(d[this.yVar]))
            .attr("fill", d => this.zScale(d[this.colorVar]))
            .attr("opacity", 0.9)
            .attr("r", d => this.radiusScale(d[this.radiusVar]));

        this.xAxis
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.height})`)
            .transition()
            .call(d3.axisBottom(this.xScale));

        this.svg.select("#bubbleplot.x-axis-label").remove();
        this.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", this.margin.left + this.width / 2)
            .attr("y", this.margin.top + this.height + this.margin.bottom)
            .style("fill", "dimgray")
            .style("font-size", "0.8em")
            .text(this.xVar);

        this.yAxis
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
            .transition()
            .call(d3.axisLeft(this.yScale));

        this.svg.select("#bubbleplot.y-axis-label").remove();
        this.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", -this.margin.top - this.height / 2)
            .attr("y", this.margin.left * 0.25)
            .style("fill", "dimgray")
            .style("font-size", "0.8em")
            .attr("transform", "rotate(-90)")
            .text(this.yVar);

        this.legend
            .style("font-size", ".7em")
            .attr("transform", `translate(${this.width + this.margin.left + 20}, ${this.height * 0.25})`)
            .call(d3.legendColor().scale(this.zScale))
    }

    getBrushedData(currentYear) {
        this.currentYear = currentYear;
        let selection = d3.brushSelection(this.container.node());
        if (!selection) return [];

        this.brushedData = this.data.filter(d => this.isBrushed(d, selection));
        this.circles.classed("brushed", d => this.isBrushed(d, selection));

        return this.brushedData;
    }

    isBrushed(d, selection) {
        if (d["Year"] != this.currentYear) return false;
        let [[x0, y0], [x1, y1]] = selection;
        let x = this.xScale(d[this.xVar]);
        let y = this.yScale(d[this.yVar]);

        return x0 <= x && x <= x1 && y0 <= y && y <= y1;
    }

    brushCircles(event) {
        let selection = event.selection;

        this.brushedData = this.data.filter(d => this.isBrushed(d, selection));
        this.circles.classed("brushed", d => this.isBrushed(d, selection));

        if (this.handlers.brush)
            this.handlers.brush(this.data.filter(d => this.isBrushed(d, selection)));
    }

    on(eventType, handler) {
        this.handlers[eventType] = handler;
    }
}