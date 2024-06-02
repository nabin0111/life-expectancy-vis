class Lineplot {
    margin = {
        top: 40, right: 30, bottom: 50, left: 50
    };

    constructor(svg, tooltip, data, width = 400, height = 300) {
        this.svg = svg;
        this.tooltip = tooltip;
        this.data = data;
        this.width = width;
        this.height = height;
        this.handlers = {};
    }

    initialize() {
        this.svg = d3.select(this.svg);
        this.tooltip = d3.select(this.tooltip);
        this.width -= this.margin.left + this.margin.right;
        this.height -= this.margin.top + this.margin.bottom;

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.g = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        this.xScale = d3.scaleLinear().range([0, this.width]);
        this.yScale = d3.scaleLinear().range([this.height, 0]);

        this.xAxis = this.g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${this.height})`);

        this.yAxis = this.g.append("g")
            .attr("class", "y-axis");

        this.line = d3.line()
            .x(d => this.xScale(d.year))
            .y(d => this.yScale(d.lifeExpectancy))

        this.path = this.g.append("path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2);

        this.title = this.svg.append("text")
            .attr("class", "title")
            .attr("text-anchor", "middle")
            .attr("x", (this.width + this.margin.left + this.margin.right) / 2)
            .attr("y", this.margin.top / 2)
            .style("fill", "black");
    }

    update(data, xVar, yVar) {
        let inputCountries = new Set(data.map(d => d["Country"]));
        let filteredData = this.data.filter(d => inputCountries.has(d["Country"]));

        const transformedData = filteredData.map(d => ({
            ...d,
            [xVar]: parseInt(d[xVar], 10)
        }));

        const groupedData = d3.groups(transformedData, d => d[xVar])
            .map(([key, values]) => ({
                [xVar]: key,
                [yVar]: d3.mean(values, d => d[yVar])
            }));
        groupedData.sort((a, b) => a[xVar] - b[xVar]);

        this.xScale.domain(d3.extent(groupedData, d => d[xVar]));
        this.yScale.domain([d3.min(groupedData, d => d[yVar]), d3.max(groupedData, d => d[yVar])]);

        this.xAxis.transition().call(d3.axisBottom(this.xScale).tickFormat(d3.format("d")));
        this.yAxis.transition().call(d3.axisLeft(this.yScale));

        this.path.datum(groupedData)
            .transition()
            .attr("d", d3.line()
                .x(d => this.xScale(d[xVar]))
                .y(d => this.yScale(d[yVar]))
            );

        this.g.selectAll(".data-point").remove();
        this.g.selectAll(".data-point")
            .data(groupedData)
            .enter()
            .append("circle")
            .attr("class", "data-point")
            .attr("r", 3)
            .attr("cx", d => this.xScale(d[xVar]))
            .attr("cy", d => this.yScale(d[yVar]))
            .style("fill", "steelblue")
            .on("mouseover", (e, d) => {
                d3.select(e.currentTarget)
                    .transition()
                    .duration(200)
                    .attr("r", 5)
                    .style("fill", "red");

                this.tooltip.select(".tooltip-inner")
                    .html(`[${d[xVar]}]<br />${d[yVar]}`);

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
            .on("mouseout", (event, d) => {
                d3.select(event.currentTarget)
                    .transition()
                    .duration(200)
                    .attr("r", 3)
                    .style("fill", "steelblue");

                this.tooltip.style("display", "None");
            });

        this.title.text(`${yVar} Over Time`);

        this.svg.selectAll(".x-axis-label").remove();
        this.svg.append("text")
            .attr("class", "x-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", this.margin.left + this.width / 2)
            .attr("y", this.margin.top + this.height + this.margin.bottom)
            .style("fill", "dimgray")
            .style("font-size", "0.8em")
            .text(xVar);

        this.svg.selectAll(".y-axis-label").remove();
        this.svg.append("text")
            .attr("class", "y-axis-label")
            .attr("text-anchor", "middle")
            .attr("x", -this.margin.top - this.height / 2)
            .attr("y", this.margin.left * 0.25)
            .style("fill", "dimgray")
            .style("font-size", "0.8em")
            .attr("transform", "rotate(-90)")
            .text(yVar);
    }
}
