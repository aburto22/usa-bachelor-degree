const w = 1300;
const h = 565;
const paddingX = 150;
const paddingTop = 25;

const svg = d3
  .select("main")
  .append("svg")
  .attr("width", w)
  .attr("height", h)
  .attr("viewBox", `0 0 ${w} ${h * 1.2}`);

const fetchTopo = fetch(
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"
)
  .then((res) => res.json())
  .catch((err) => console.warn(err));

const fetchBac = fetch(
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"
)
  .then((res) => res.json())
  .catch((err) => console.warn(err));

Promise.all([fetchTopo, fetchBac])
  .then(([dataTopo, dataBac]) => {
    const path = d3.geoPath();

    const bac = dataBac.map((val) => Number(val.bachelorsOrHigher));
    const [minBac, maxBac] = d3.extent(bac);

    const colorScale = d3
      .scaleLinear()
      .domain([minBac, maxBac])
      .range(["#233555", "white"]);

    const colorData = Array(5)
      .fill(1)
      .map((val, i) => Math.round(minBac + (i * (maxBac - minBac)) / 4));

    function getColor(ele) {
      const bacVal = Number(d3.select(ele).attr("data-education"));
      let approxBac = 0;

      colorData.forEach((val) => {
        if (bacVal > val) approxBac = bacVal;
      });

      return colorScale(approxBac);
    }

    svg
      .append("g")
      .attr("id", "graph")
      .attr("transform", `translate(${paddingX}, ${paddingTop})`)
      .append("g")
      .selectAll("path")
      .data(topojson.feature(dataTopo, dataTopo.objects.counties).features)
      .join("path")
      .attr("d", path)
      .attr("class", "county")
      .attr("data-fips", (d) => d.id)
      .attr("data-education", (d) => {
        const data = dataBac.find((val) => val.fips === d.id);
        return data.bachelorsOrHigher;
      })
      .attr("data-state", (d) => {
        const data = dataBac.find((val) => val.fips === d.id);
        return data.state;
      })
      .attr("data-county", (d) => {
        const data = dataBac.find((val) => val.fips === d.id);
        return data.area_name;
      })
      .attr("fill", function (d) {
        return getColor(this);
      })
      .on("mouseover", (e, d) => {
        const self = d3.select(e.target);
        const localData = [
          `State: ${self.attr("data-state")}`,
          `County: ${self.attr("data-county")}`,
          `Bachelors: ${self.attr("data-education")}%`,
        ];

        self.attr("fill", "white");

        tooltip
          .style("display", "block")
          .selectAll("text")
          .data(localData)
          .enter()
          .append("text")
          .text((val) => val)
          .attr("id", (d, i) => "tooltip-" + i)
          .attr("x", 10)
          .attr("y", (val, i) => 22 + i * 17);

        const tooltipTextWidth = d3.max(
          localData.map((val, i) =>
            Math.ceil(
              Number(document.querySelector("#tooltip-" + i).getBBox().width)
            )
          )
        );

        tooltip.select("rect").attr("width", tooltipTextWidth + 25);
      })
      .on("mouseout", (e, d) => {
        d3.select(e.target).attr("fill", function () {
          return getColor(this);
        });
        tooltip
          .attr("data-education", "")
          .style("display", "none")
          .selectAll("text")
          .remove();
      });

    d3.select("#graph")
      .append("path")
      .datum(
        topojson.mesh(dataTopo, dataTopo.objects.states, (a, b) => a !== b)
      )
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("d", path);

    d3.select("#graph")
      .append("path")
      .datum(topojson.mesh(dataTopo, dataTopo.objects.nation))
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("d", path);

    const legend = svg
      .append("g")
      .attr("id", "legend")
      .attr("transform", `translate(${w * 0.8}, ${h * 0.6})`);

    legend
      .selectAll("colors")
      .data(colorData.slice(0, colorData.length - 1))
      .enter()
      .append("rect")
      .attr("width", 10)
      .attr("height", 40)
      .attr("y", (d, i) => i * 40)
      .attr("fill", (d) => colorScale(d));

    legend
      .selectAll("legendText")
      .data(colorData)
      .enter()
      .append("text")
      .attr("x", 20)
      .attr("y", (d, i) => 6 + i * 40)
      .text((d) => `${d}%`)
      .attr("fill", "black");

    legend
      .selectAll("lines")
      .data(colorData)
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", 15)
      .attr("y1", (d, i) => i * 40)
      .attr("y2", (d, i) => i * 40)
      .attr("stroke", "black");

    const tooltip = svg
      .append("g")
      .attr("id", "tooltip")
      .style("display", "none");

    tooltip
      .append("rect")
      .attr("width", 275)
      .attr("height", 70)
      .attr("fill", "rgba(255, 255, 255, 0.9)")
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("stroke", "#dde6f5");

    svg.on("mousemove", (e) => {
      const mouse = d3.pointer(e);

      tooltip.attr(
        "transform",
        `translate(${mouse[0] + 20}, ${mouse[1] - 20})`
      );
    });
  })
  .catch((err) => console.warn(err));
