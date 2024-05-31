class Spiderchart {
    margin = {
        top: 100, right: 100, bottom: 100, left: 200
    };

    constructor(svg, data, width = 300, height = 300) {
        this.svg = d3.select(svg);
        this.data = data;
        this.width = width;
        this.height = height;
        this.radius = Math.min(width, height) / 2;
        this.legend = this.svg.append("g");
        this.variables = [
            "Adult_Mortality",
            "infant_deaths",
            "Alcohol",
            "Total_expenditure",
            " BMI ",
            "Income_composition_of_resources"
        ];
        this.calculateMinMaxValues();
    }

    initialize() {
        this.svg.attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.g = this.svg.append("g")
            .attr("transform", `translate(${this.width / 2 + this.margin.left}, ${this.height / 2 + this.margin.top})`);

        this.angleSlice = Math.PI * 2 / this.variables.length;

        this.createAxes();
    }

    createAxes() {
        // 보조선 그리기
        const levels = 5;
        const radiusScale = d3.scaleLinear().range([0, this.radius]).domain([0, 1]);

        for (let level = 0; level <= levels; level++) {
            const levelFactor = this.radius * (level / levels);
            this.g.selectAll(".grid-circle")
                .data(this.variables)
                .enter()
                .append("line")
                .attr("x1", (d, i) => levelFactor * Math.cos(this.angleSlice * i - Math.PI / 2))
                .attr("y1", (d, i) => levelFactor * Math.sin(this.angleSlice * i - Math.PI / 2))
                .attr("x2", (d, i) => levelFactor * Math.cos(this.angleSlice * (i + 1) - Math.PI / 2))
                .attr("y2", (d, i) => levelFactor * Math.sin(this.angleSlice * (i + 1) - Math.PI / 2))
                .attr("class", "line")
                .style("stroke", "grey")
                .style("stroke-opacity", "0.75")
                .style("stroke-width", "0.3px");

            this.g.selectAll(".grid-label")
                .data([1])
                .enter()
                .append("text")
                .attr("x", () => levelFactor * Math.cos(0 - Math.PI / 2) + 4)
                .attr("y", () => levelFactor * Math.sin(0 - Math.PI / 2) - 6)
                .attr("class", "grid-label")
                .style("font-size", "10px")
                .attr("fill", "#737373")
                .text((level / levels) * 100);
        }

        // 축을 그리기
        this.g.selectAll(".axis")
            .data(this.variables)
            .enter().append("line")
            .attr("class", "axis")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", (d, i) => this.radius * Math.cos(this.angleSlice * i - Math.PI / 2))
            .attr("y2", (d, i) => this.radius * Math.sin(this.angleSlice * i - Math.PI / 2))
            .style("stroke", "grey")
            .style("stroke-width", "2px");

        this.g.selectAll(".axis-label")
            .data(this.variables)
            .enter().append("text")
            .attr("class", "axis-label")
            .attr("x", (d, i) => (this.radius + 10) * Math.cos(this.angleSlice * i - Math.PI / 2))
            .attr("y", (d, i) => (this.radius + 10) * Math.sin(this.angleSlice * i - Math.PI / 2))
            .attr("text-anchor", (d, i) => {
                if (this.angleSlice * i === 0 || this.angleSlice * i === Math.PI) {
                    return "middle";
                } else if (this.angleSlice * i < Math.PI) {
                    return "start";
                } else {
                    return "end";
                }
            })
            .attr("dy", (d, i) => {
                if (this.angleSlice * i === 0) {
                    return "-0.5em";
                } else if (this.angleSlice * i === Math.PI) {
                    return "1.5em";
                } else if (this.angleSlice * i < Math.PI) {
                    return "0.35em";
                } else {
                    return "0.35em";
                }
            })
            .text(d => d)
            .style("font-size", "12px");
    }

    calculateMinMaxValues() {
        this.minValues = {};
        this.maxValues = {};

        this.variables.forEach(v => {
            const values = this.data.map(d => d[v]);
            this.minValues[v] = d3.min(values);
            this.maxValues[v] = d3.max(values);
        });
    }

    normalizeValue(value, min, max) {
        if (max === min) {
            return 0.5;
        }
        return Math.abs(value - min) / (max - min);
    }

    update(data, brushedData) {
        let averageData, brushedAvgData;

        averageData = this.variables.map(v => {
            const meanValue = d3.mean(data, d => d[v]);
            return {
                variable: v,
                value: this.normalizeValue(meanValue, this.minValues[v], this.maxValues[v])
            };
        });

        if (brushedData) {
            brushedAvgData = this.variables.map(v => {
                const temp = d3.mean(brushedData, d => d[v]);
                return {
                    variable: v,
                    value: this.normalizeValue(temp, this.minValues[v], this.maxValues[v])
                }
            });
        }

        const radarLine = d3.lineRadial()
            .angle((d, i) => i * this.angleSlice)
            .radius(d => this.radius * d.value)
            .curve(d3.curveLinearClosed);

        const averagePath = this.g.selectAll(".average-path")
            .data([averageData]);

        averagePath.enter().append("path")
            .attr("class", "average-path")
            .merge(averagePath)
            .attr("d", radarLine)
            .style("fill", "rgba(150, 150, 150, 0.3)")
            .style("stroke", "grey")
            .style("stroke-width", 1);

        averagePath.exit().remove();

        if (brushedAvgData) {
            const countryPath = this.g.selectAll(".country-path")
                .data([brushedAvgData]);

            countryPath.enter().append("path")
                .attr("class", "country-path")
                .merge(countryPath)
                .attr("d", radarLine)
                .style("fill", "rgba(0, 150, 240, 0.5)")
                .style("stroke", "#3399ff")
                .style("stroke-width", 1.5);

            countryPath.exit().remove();
        }

        this.legend
            .style("font-size", ".7em")
            .attr("transform", `translate(${this.width + this.margin.left + 20}, ${this.height * 0.25})`)
            .call(d3.legendColor().scale(d3.scaleOrdinal().domain(["Average", "Brushed"]).range(["rgba(150, 150, 150, 0.3)", "rgba(0, 150, 240, 0.5)"])));
    }
}
