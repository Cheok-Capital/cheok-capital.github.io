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

const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

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
        const combined = [normalizedCheok, normalizedSpy]

        // Performing clamps for time x-axis, i.e. taking max of mins, and mins of maxes
        const xMin = d3.max(combined.map((data) => d3.min(data, d => d.timestamp)));
        const xMax = d3.min(combined.map((data) => d3.max(data, d => d.timestamp)));

        const yMin = d3.min(combined.map((data) => d3.min(data, d => d.normalized)));
        const yMax = d3.max(combined.map((data) => d3.max(data, d => d.normalized)));

        // scale using range
        const xScale = d3
            .scaleTime()
            .domain([xMin, xMax])
            .range([0, width]);

        const yScale = d3
            .scaleLinear()
            .domain([yMin * 0.90, yMax])
            .range([height, 0]);


        // Drawing bottom axis
        svg.append("line")
            .style("stroke", "grey")
            .attr('transform', `translate(0, ${height})`)
            .attr("x2", d => {
                return xScale(xMax);
            });

        svg.append("text")
            .attr('transform', `translate(${xScale(xMin)}, ${height})`)
            .attr('dy', '1em')
            .style("opacity", "0.5")
            .text(moment(xMin).format("DD/MM/YYYY"));

        svg.append("text")
            .attr('transform', `translate(${xScale(xMax)}, ${height})`)
            .attr('dy', '1em')
            .style("opacity", "0.5")
            .attr("text-anchor", "end")
            .text(moment(xMax).format("DD/MM/YYYY"));

        const line = d3
            .line()
            .x(d => xScale(d.timestamp))
            .y(d => yScale(d.normalized));

        // "SPY" path
        svg
            .append('path')
            .data([normalizedSpy])
            .style('fill', 'none')
            .attr('d', line)
            .attr('id', 'spyChart')
            .attr('stroke', '#00d1b2')
            .attr('stroke-width', '2')
            .attr('opacity', '0.4');

        // "SPY" line label
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

        // Cheok path
        svg
            .append('path')
            .data([normalizedCheok])
            .style('fill', 'none')
            .attr('d', line)
            .attr('id', 'cheokChart')
            .attr('stroke-width', '2');

        // Base value
        svg.append("text")
            .data([normalizedCheok[0]])
            .attr("transform", d => {
                return `translate(${ xScale(xMin)}, ${ yScale(d.normalized)})`;
            })
            .attr("x", -60)
            .attr("dy", "0.35em")
            .style("font-size", "14px")
            .text(`$${numberWithCommas(GROWTH_BASE_AMOUNT)}`);

        // Base line
        svg.append("line")
            .style("stroke", "grey")
            .style("stroke-dasharray", ("2, 2"))
            .style("opacity", 0.4)
            .attr("transform", d => {
                return `translate(${ xScale(xMin)}, ${yScale(GROWTH_BASE_AMOUNT)})`;
            })
            .attr("x2", d => {
                return xScale(xMax);
            });

        const cheokG = svg.append("g").data([{
            first: normalizedCheok[0],
            last: normalizedCheok[normalizedCheok.length - 1]
        }]);

        const cheokLatestLiquidation = cheokG.append("text")
            .attr("transform", d => {
                return `translate(${ xScale(xMin)}, ${ yScale(d.last.normalized)})`;
            })
            .attr("x", -60)
            .attr("dy", "0.35em")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(d => {
                return `$${numberWithCommas(Math.floor(d.last.normalized))}`;
            });

        cheokG.append("line")
            .style("stroke", "grey")
            .style("stroke-dasharray", ("2, 2"))
            .style("opacity", 0.4)
            .attr("transform", d => {
                return `translate(${ xScale(xMin)}, ${ yScale(d.last.normalized)})`;
            })
            .attr("x2", d => {
                return xScale(d.last.timestamp);
            })

        const spyG = svg.append("g").data([{
            first: normalizedSpy[0],
            last: normalizedSpy[normalizedSpy.length - 1]
        }]);

        spyG.append("text")
            .attr("transform", d => {
                return `translate(${ xScale(d.first.timestamp)}, ${ yScale(d.last.normalized)})`;
            })
            .attr("x", -60)
            .attr("dy", "0.35em")
            .style("font-size", "14px")
            .text(d => {
                return `$${numberWithCommas(Math.floor(d.last.normalized))}`;
            });

        spyG.append("line")
            .style("stroke", "grey")
            .style("stroke-dasharray", ("2, 2"))
            .style("opacity", 0.4)
            .attr("transform", d => {
                return `translate(${ xScale(d.first.timestamp)}, ${ yScale(d.last.normalized)})`;
            })
            .attr("x2", d => {
                return xScale(d.last.timestamp);
            })

        // Chart floor line
        svg.append("line")
            .style("stroke", "grey")
            .style("stroke-dasharray", ("2, 2"))
            .style("opacity", 0.4)
            .attr("transform", d => {
                return `translate(${ xScale(xMin)}, ${yScale(yMin)})`;
            })
            .attr("x2", d => {
                return xScale(xMax);
            })

        // Chart floor label
        spyG.append("text")
            .attr("transform", d => {
                return `translate(${ xScale(xMin)}, ${yScale(yMin)})`;
            })
            .attr("x", -60)
            .attr("dy", "0.35em")
            .style("font-size", "14px")
            .text(`$${numberWithCommas(Math.floor(yMin))}`);

        // Chart ceiling line
        svg.append("line")
            .style("stroke", "grey")
            .style("stroke-dasharray", ("2, 2"))
            .style("opacity", 0.4)
            .attr("transform", d => {
                return `translate(${ xScale(xMin)}, ${yScale(yMax)})`;
            })
            .attr("x2", d => {
                return xScale(xMax);
            });

        // Chart ceiling label
        spyG.append("text")
            .attr("transform", d => {
                return `translate(${ xScale(xMin)}, ${yScale(yMax)})`;
            })
            .attr("x", -60)
            .attr("dy", "0.35em")
            .style("font-size", "14px")
            .text(`$${numberWithCommas(Math.floor(yMax))}`);

        let i = 0;
        d3.timer(() => {
            const hue = `hsl(${i % 360}, 100%, 50%)`;
            d3.select("#cheokChart").attr("stroke", hue);
            cheokLatestLiquidation.style("fill", hue);
            i += 1;
        });
    });
});