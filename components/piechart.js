// vaccination
class Piechart {
    margin = {
        top: 50, right: 30, bottom: 40, left: 40
    }

    constructor(svg, right = 0, width = 150, height = 150) {
        this.svg = d3.select(svg);
        this.margin.right += right;
        this.width = width;
        this.height = height;
        this.radius = Math.min(this.width, this.height) / 2;
    }

    initialize() {
        this.arc = d3.arc()
            .innerRadius(0)
            .outerRadius(this.radius);

        this.pie = d3.pie()
            .value(d => d.value)
            .sort(null);

        this.container = this.svg.append("g")
            .attr("transform", `translate(${this.width / 2 + this.margin.left}, ${this.height / 2 + this.margin.top})`);

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.title = this.svg.append("text")
            .attr("class", "title")
            .attr("text-anchor", "middle")
            .attr("x", this.width / 2 + this.margin.left)
            .attr("y", this.margin.top / 2)
            .style("fill", "black");

        this.legend = this.svg.append("g");
    }

    update(data, variable) {
        const totalAvg = d3.mean(data, d => d[variable]);

        this.svg.selectAll(".no-data").remove();
        if (isNaN(totalAvg)) {
            this.title.text(variable + " Vaccination Rate");
            this.container.selectAll(".arc").remove();
            this.legend.selectAll("*").remove();

            this.svg.append("text")
                .attr("class", "no-data")
                .attr("text-anchor", "middle")
                .attr("x", this.width / 2 + this.margin.left)
                .attr("y", this.height / 2 + this.margin.top)
                .style("fill", "black")
                .text("No Data Available");
            return;
        }

        const vaccinatedAvg = totalAvg;
        const notVaccinatedAvg = 100 - totalAvg;

        const pieData = [
            { label: "Vaccinated", value: vaccinatedAvg, color: "#70db70" },
            { label: "Not Vaccinated", value: notVaccinatedAvg, color: "#ff704c" }
        ];

        this.title.text(variable + " Vaccination Rate");

        const arcs = this.container.selectAll(".arc")
            .data(this.pie(pieData));

        arcs.select("path")
            .attr("d", this.arc)
            .attr('fill', function (d) { return d.data.color })
            .attr("stroke", "white")
            .attr("stroke-width", 2);

        arcs.select("text")
            .attr("transform", d => `translate(${this.arc.centroid(d)})`)
            .attr("dy", "0.5em")
            .style("text-anchor", "middle")
            .style("fill", "black")
            .text(d => `${Math.round(d.data.value * 100) / 100}%`);

        const newArcs = arcs.enter().append("g")
            .attr("class", "arc");

        newArcs.append("path")
            .attr("d", this.arc)
            .attr('fill', function (d) { return d.data.color })
            .attr("stroke", "white")
            .attr("stroke-width", 2);

        newArcs.append("text")
            .attr("transform", d => `translate(${this.arc.centroid(d)})`)
            .attr("dy", "0.5em")
            .style("text-anchor", "middle")
            .text(d => `${Math.round(d.data.value * 100) / 100}%`);

        arcs.exit().remove();

        if (variable === "Polio") {
            this.legend
                .style("font-size", ".7em")
                .attr("transform", `translate(${this.width + this.margin.left + 20}, ${this.height * 0.25})`)
                .call(d3.legendColor().scale(d3.scaleOrdinal().domain(pieData.map(d => d.label)).range(pieData.map(d => d.color))));
        } else {
            this.legend.selectAll("*").remove();
        }
    }
}