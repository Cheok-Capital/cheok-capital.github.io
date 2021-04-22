const responsivefy = svg => {
    // get container + svg aspect ratio
    const container = d3.select(svg.node().parentNode),
        width = parseInt(svg.style('width')),
        height = parseInt(svg.style('height')),
        aspect = width / height;

    // get width of container and resize svg to fit it
    const resize = () => {
        const targetWidth = parseInt(container.style('width'));
        svg.attr('width', targetWidth);
        svg.attr('height', Math.round(targetWidth / aspect));
    };

    // add viewBox and preserveAspectRatio properties,
    // and call resize so that svg resizes on inital page load
    svg
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .attr('perserveAspectRatio', 'xMinYMid')
        .call(resize);

    // to register multiple listeners for same event type,
    // you need to add namespace, i.e., 'click.foo'
    // necessary if you call invoke this function for multiple svgs
    // api docs: https://github.com/mbostock/d3/wiki/Selections#on
    d3.select(window).on('resize.' + container.attr('id'), resize);
};

const normalize = (data, base, key) => {
    const earliestPoint = d3.least(data, (a) => a.timestamp);
    const normalized = [];

    for (let i = 0; i < data.length; i++) {
        const current = {...data[i] };
        const normValue = base * current[key] / earliestPoint[key];
        current.normalized = normValue;
        normalized.push(current);
    }

    return normalized;
}

const GROWTH_BASE_AMOUNT = 10000;

d3.json('data/spy.json').then(spy => {
    d3.json('data/cheok.json').then(cheok => {
        const normalizedSpy = normalize(spy.data, GROWTH_BASE_AMOUNT, 'close');
        const normalizedCheok = normalize(cheok.data, GROWTH_BASE_AMOUNT, 'liquidationValue');

        const margin = { top: 50, right: 80, bottom: 50, left: 80 };
        const width = document.getElementById('chart').clientWidth - margin.left - margin.right; // Use the window's width
        const height = (window.innerHeight * 0.7) - margin.top - margin.bottom; // Use the window's height

        // add chart SVG to the page
        const svg = d3
            .select('#chart')
            .append('svg')
            .attr('width', width + margin['left'] + margin['right'])
            .attr('height', height + margin['top'] + margin['bottom'])
            .call(responsivefy)
            .append('g')
            .attr('transform', `translate(${margin['left']}, ${margin['top']})`);

        // create the axes component

        // find data range
        const combined = [...normalizedCheok, ...normalizedSpy]
        const xMin = d3.min(combined, d => d.timestamp);
        const xMax = d3.max(combined, d => d.timestamp);
        const yMin = d3.min(combined, d => d.normalized);
        const yMax = d3.max(combined, d => d.normalized);

        // scale using range
        const xScale = d3
            .scaleTime()
            .domain([xMin, xMax])
            .range([0, width]);

        const yScale = d3
            .scaleLinear()
            .domain([yMin * 0.99, yMax])
            .range([height, 0]);

        svg
            .append('g')
            .attr('id', 'xAxis')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));

        svg
            .append('g')
            .attr('id', 'yAxis')
            .call(d3.axisLeft(yScale));

        svg.append("text")
            .attr("text-anchor", "end")
            .attr("y", 6)
            .attr("dy", ".75em")
            .attr("transform", "rotate(-90)")
            .text("USD");

        const line = d3
            .line()
            .x(d => xScale(d.timestamp))
            .y(d => yScale(d.normalized));

        svg
            .append('path')
            .data([normalizedSpy])
            .style('fill', 'none')
            .attr('d', line)
            .attr('id', 'spyChart')
            .attr('stroke', '#00d1b2')
            .attr('stroke-width', '2')
            .attr('opacity', '0.3');

        svg
            .append("text")
            .data([normalizedSpy[normalizedSpy.length - 1]])
            .attr("transform", d => {
                return `translate(${ xScale(d.timestamp)}, ${ yScale(d.normalized)})`;
            })
            .attr("x", 5)
            .attr("dy", "0.35em")
            .style("fill", "#00d1b2")
            .style("font-size", "14px")
            .text("SPY");

        svg
            .append('path')
            .data([normalizedCheok])
            .style('fill', 'none')
            .attr('d', line)
            .attr('id', 'cheokChart')
            .attr('stroke-width', '2');

        const cheokCapitalLabel = svg.append("text")
            .data([normalizedCheok[normalizedCheok.length - 1]])
            .attr("transform", d => {
                return `translate(${ xScale(d.timestamp)}, ${ yScale(d.normalized)})`;
            })
            .attr("x", 5)
            .attr("dy", "0.35em")
            // .style("fill", "#00d1b2")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("The Dream");

        d3.timer((elapsed) => {
            const hue = `hsl(${(elapsed / 6) % 360}, 100%, 50%)`;

            d3.select("#cheokChart").attr("stroke", hue);

            cheokCapitalLabel.style("fill", hue)
        });
    });
});