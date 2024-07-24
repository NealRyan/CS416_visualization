let currentScene = 1;
let makes = [];

const makeToCountry = {
  'Honda': 'Japan', 'Acura': 'Japan', 'Toyota': 'Japan', 'Lexus': 'Japan', 'Nissan': 'Japan', 'Infiniti': 'Japan',
  'Mazda': 'Japan', 'Subaru': 'Japan', 'Mitsubishi': 'Japan',
  'Ford': 'USA', 'Chevrolet': 'USA', 'Dodge': 'USA', 'Chrysler': 'USA', 'Jeep': 'USA', 'Cadillac': 'USA',
  'Buick': 'USA', 'GMC': 'USA', 'Lincoln': 'USA', 'Ram': 'USA', 'Tesla': 'USA',
  'BMW': 'Germany', 'Mercedes-Benz': 'Germany', 'Audi': 'Germany', 'Volkswagen': 'Germany', 'Porsche': 'Germany', 'Lamborghini': 'Germany',
  'Volvo': 'Sweden', 'Jaguar': 'UK', 'Land Rover': 'UK', 'Mini': 'UK', 'Rolls-Royce': 'UK',
  'Fiat': 'Italy', 'Alfa Romeo': 'Italy', 'Maserati': 'Italy', 'Ferrari': 'Italy',
  'Hyundai': 'South Korea', 'Kia': 'South Korea', 'Genesis': 'South Korea'
};

//update title/message
function setTitleAndMessage(title, message) {
  document.getElementById('title').textContent = title;
  document.getElementById('message').textContent = message;
}

//set dimensions
const margin = {top: 20, right: 30, bottom: 40, left: 60},
  width = 700 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

//add svg to page
const svg = d3.select("#chart")
  .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

const colorScale = d3.scaleOrdinal()
  .domain(['Japan', 'USA', 'Germany', 'Sweden', 'UK', 'Italy', 'South Korea'])
  .range(d3.schemeCategory10);

//update the chart
function updateChart(fuelType, make, yAxis, newTitle, newMessage) {
  d3.csv("cars2017.csv").then(data => {
    let filteredCars = data.filter(d => d.Fuel === fuelType);
    if (make && make !== "All") {
      filteredCars = filteredCars.filter(d => d.Make === make);
    }

    filteredCars.forEach(d => {
      d.EngineCylinders = +d.EngineCylinders;
      d[yAxis] = +d[yAxis];
    });

    setTitleAndMessage(newTitle, newMessage);
    svg.selectAll("*").remove();

    //X axis
    const x = d3.scaleLinear()
      .domain([0, d3.max(filteredCars, d => d.EngineCylinders)])
      .range([0, width]);
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .style("font-size", "14px");

    //Y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(filteredCars, d => d[yAxis])])
      .range([height, 0]);
    svg.append("g")
      .call(d3.axisLeft(y))
      .style("font-size", "14px");;

    //add points
    const dots = svg.append('g')
      .selectAll("dot")
      .data(filteredCars)
      .enter()
      .append("circle")
        .attr("cx", d => x(d.EngineCylinders))
        .attr("cy", d => y(d[yAxis]))
        .attr("r", 5)
        .attr("class", "dot")
        .style("fill", d => colorScale(makeToCountry[d.Make] || 'Other'))
        .style("stroke", "black")
        .style("stroke-width", 1);

    //hover effect - tooltip
    dots.on("mouseover", function(event, d) {
        d3.select(this).attr("r", 8);
        d3.select("#tooltip")
          .style("visibility", "visible")
          .html(`Make: ${d.Make}<br/>
                Fuel: ${d.Fuel}<br/>
                Cylinders: ${d.EngineCylinders}<br/>
                ${yAxis === "AverageHighwayMPG" ? "Highway" : "City"} MPG: ${d[yAxis]}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("r", 5);
        d3.select("#tooltip").style("visibility", "hidden");
      });

    //calc best fit line
    const xMean = d3.mean(filteredCars, d => d.EngineCylinders);
    const yMean = d3.mean(filteredCars, d => d[yAxis]);
    const numerator = d3.sum(filteredCars, d => (d.EngineCylinders - xMean) * (d[yAxis] - yMean));
    const denominator = d3.sum(filteredCars, d => Math.pow(d.EngineCylinders - xMean, 2));
    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;

    //display best fit line
    svg.append("line")
      .attr("x1", x(d3.min(filteredCars, d => d.EngineCylinders)))
      .attr("y1", y(slope * d3.min(filteredCars, d => d.EngineCylinders) + intercept))
      .attr("x2", x(d3.max(filteredCars, d => d.EngineCylinders)))
      .attr("y2", y(slope * d3.max(filteredCars, d => d.EngineCylinders) + intercept))
      .attr("stroke", "red")
      .attr("stroke-width", 2);

    //find R2 value
    const ssTotal = d3.sum(filteredCars, d => Math.pow(d[yAxis] - yMean, 2));
    const ssResidual = d3.sum(filteredCars, d => Math.pow(d[yAxis] - (slope * d.EngineCylinders + intercept), 2));
    const rSquared = 1 - (ssResidual / ssTotal);

    //display R2 value
    svg.append("text")
      .attr("x", width - 10)
      .attr("y", height - 10)
      .attr("text-anchor", "end")
      .style("font-size", "12px")
      .style("fill", "black")
      .text(`R²: ${rSquared.toFixed(2)}`);

    //best fit line
    svg.append("text")
      .attr("x", width - 10)
      .attr("y", height - 30)
      .attr("text-anchor", "end")
      .style("font-size", "12px")
      .style("fill", "black")
      .text(`y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`);

    //labels
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.top + 20)
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .text("Engine Cylinders");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .text(yAxis === "AverageHighwayMPG" ? "Average Highway MPG" : "Average City MPG");

    //legend
    createLegend();
  });
}

//legend
function createLegend() {
  const legendContainer = d3.select("#legend");
  legendContainer.selectAll("*").remove();

  const legendItems = legendContainer.selectAll(".legend-item")
    .data(colorScale.domain())
    .enter().append("div")
      .attr("class", "legend-item");

  legendItems.append("div")
    .attr("class", "legend-color")
    .style("background-color", d => colorScale(d));

  legendItems.append("span")
    .text(d => d);
}

//populate dropdown
function populateMakeDropdown(fuelType) {
  d3.csv("cars2017.csv").then(data => {
    const fuelMakes = [...new Set(data.filter(d => d.Fuel === fuelType).map(d => d.Make))];
    makes = ["All", ...fuelMakes.sort()];
    const makeSelect = d3.select("#make-select");
    makeSelect.selectAll("option").remove();
    makeSelect.selectAll("option")
      .data(makes)
      .enter()
      .append("option")
      .text(d => d)
      .attr("value", d => d);
  });
}

//scene transitions
function handleSceneTransition() {
  currentScene++;
  if (currentScene === 2) {
    updateChart(
      "Diesel",
      null,
      "AverageHighwayMPG",
      "Diesel cars: Highway MPG vs. Number of Engine Cylinders",
      `For diesel powered engines, the average MPG seems to start higher, but fall faster, though the correlation between the number of cylinders and average highway MPG is much less straightforward than with gasoline.
      
      The data still suggests the each additional cylinder loses a car about 3 MPG on average, but this relationship only explains about 28% of the variability in the MPG data, making this a much less trustworthy indicator of the true MPG variability of diesel cars.`
    );
  } else if (currentScene === 3) {
    d3.select("#fuel-select").style("display", "inline");
    d3.select("#make-select").style("display", "inline");
    d3.select("#y-axis-select").style("display", "inline");
    d3.select("#next-button").style("display", "none");
    d3.select("#reset-button").style("display", "inline");
    populateMakeDropdown("Gasoline");
    updateChart(
      "Gasoline",
      "All",
      "AverageHighwayMPG",
      "Custom View: Highway MPG vs. Number of Engine Cylinders",
      `Select a fuel type, make, and MPG type to explore the relationship between engine cylinders and MPG for specific vehicle categories. 
      
      Consider exploring within makes, as these groups tend to have larger R2 values and can give a better understand of the true relationship of MPG vs. cylinders (corresponding to the idea that engines made by the same company share more in common, making the comparisons more apples-apples).
      
      Keep in mind that while the R squared value is a good predictor of the strength of a relationship, it is only valid on 3+ pieces of data (as 2 points will always form a perfect line with R2=1).`
    );
  }
}

//chart for gas cars
updateChart(
  "Gasoline",
  null,
  "AverageHighwayMPG",
  "Gasoline cars: Highway MPG vs. Number of Engine Cylinders",
  `We can see from the data that gasoline powered cars have a fairly strong trend of decreasing average MPG with increasing engine cylinders. On average, each extra cylinder loses the car about 1.9 MPG, a relationship which explains 68% of the variability of Highway MPG in the data. 
  
  As the relationship shows a fairly high R squared value, we can feel pretty confident that the number of engine cylinders is a good predictor of that car's average highway MPG (though not the only factor - as the r squared value is not 1).
  
  Anecdotally, we can also see some interesting trends between points and the country or origin of the cars. Japanese cars tend toward lower engine cylinder count, American cars toward higher cylinder count, and German cars seems to run the gamut.
  
  Another point to note thats made more obvious through the use of a scatter plot: most engines have an even number of cylinders. This is because the combustion mechanism is very violent and causes fairly considerable forces in a particular vector. By using even numbers of cylinders that oppose eachother in direction, one of the dimensions of the force vector is signficantly reduced (simply put: the engine vibrates considerably less).`
);

//event listener for next button
d3.select('#next-button').on('click', handleSceneTransition);

//event listener for reset button
d3.select('#reset-button').on('click', () => {
  currentScene = 1;
  d3.select("#fuel-select").style("display", "none");
  d3.select("#make-select").style("display", "none");
  d3.select("#y-axis-select").style("display", "none");
  d3.select("#next-button").style("display", "inline");
  d3.select("#reset-button").style("display", "none");
  updateChart(
    "Gasoline",
    null,
    "AverageHighwayMPG",
    "Gasoline cars: Highway MPG vs. Number of Engine Cylinders",
    `We can see from the data that gasoline powered cars have a fairly strong trend of decreasing average MPG with increasing engine cylinders. On average, each extra cylinder loses the car about 1.9 MPG, a relationship which explains 68% of the variability of Highway MPG in the data. 
    
    As the relationship shows a fairly high R squared value, we can feel pretty confident that the number of engine cylinders is a good predictor of that car's average highway MPG (though not the only factor - as the r squared value is not 1).
      
    Anecdotally, we can also see some interesting trends between points and the country or origin of the cars. Japanese cars tend toward lower engine cylinder count, American cars toward higher cylinder count, and German cars seems to run the gamut.
    
    Another point to note thats made more obvious through the use of a scatter plot: most engines have an even number of cylinders. This is because the combustion mechanism is very violent and causes fairly considerable forces in a particular vector. By using even numbers of cylinders that oppose eachother in direction, one of the dimensions of the force vector is signficantly reduced (simply put: the engine vibrates considerably less).`
  );
  createLegend();
});

//event listeners for the dropdowns
d3.select('#fuel-select').on('change', function() {
  const selectedFuel = this.value;
  const selectedYAxis = d3.select('#y-axis-select').property('value');
  const mpgType = selectedYAxis === "AverageHighwayMPG" ? "Highway" : "City";
  populateMakeDropdown(selectedFuel);
  updateChart(
    selectedFuel,
    "All",
    selectedYAxis,
    `Custom View: ${mpgType} MPG vs. Number of Engine Cylinders`,
    `Showing the relationship between engine cylinders and ${mpgType.toLowerCase()} MPG for ${selectedMake} ${selectedFuel} cars. `
  );
  createLegend();
});

d3.select('#make-select').on('change', function() {
  const selectedMake = this.value;
  const selectedFuel = d3.select('#fuel-select').property('value');
  const selectedYAxis = d3.select('#y-axis-select').property('value');
  const mpgType = selectedYAxis === "AverageHighwayMPG" ? "Highway" : "City";
  updateChart(
    selectedFuel,
    selectedMake,
    selectedYAxis,
    `Custom View: ${selectedMake} ${selectedFuel} cars - ${mpgType} MPG vs. Number of Engine Cylinders`,
    `Showing the relationship between engine cylinders and ${mpgType.toLowerCase()} MPG for ${selectedMake} ${selectedFuel} cars. `
  );
});

d3.select('#y-axis-select').on('change', function() {
  const selectedYAxis = this.value;
  const selectedFuel = d3.select('#fuel-select').property('value');
  const selectedMake = d3.select('#make-select').property('value');
  const mpgType = selectedYAxis === "AverageHighwayMPG" ? "Highway" : "City";
  updateChart(
    selectedFuel,
    selectedMake,
    selectedYAxis,
    `Custom View: ${mpgType} MPG vs. Number of Engine Cylinders`,
    `Showing the relationship between engine cylinders and ${mpgType.toLowerCase()} MPG for ${selectedMake} ${selectedFuel} cars.`
  );
  createLegend();
});