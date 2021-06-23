d3.json('data/xirr.json').then((cheok) => {
	const xirrCheok = arrayer(cheok.data, 'xirr');

	var n;
	for (n = 0; n < xirrCheok.length; n++) {
		xirrCheok[n].arrayed = Number(parseFloat(xirrCheok[n].xirr * 100).toFixed(2));
	}

	const docWidth = document.getElementById('chart3').clientWidth;

	const margin = {
		top: docWidth * 0.1 * 0.6,
		right: docWidth * 2 / 30 + 10,
		bottom: docWidth * 0.1 * 0.6,
		left: docWidth * 2 / 30 + 30
	};
	const width = docWidth - margin.left - margin.right; // Use the window's width
	const height = (docWidth - margin.left - margin.right) * 0.6; // use set width to maintain ratio

	// add chart SVG to the page
	const svg = d3
		.select('#chart3')
		.append('svg')
		.classed('svg-container', true)
		.attr('viewBox', `0 0 ${width + margin['left'] + margin['right']} ${height + margin['top'] + margin['bottom']}`)
		.call(responsivefy)
		.append('g')
		.attr('transform', `translate(${margin['left']}, ${margin['top']})`);

	const responsiveFontSize = (d) => `${9 + width / 120}px`;

	// create the axes component

	// find data range

	// Performing clamps for time x-axis, i.e. taking max of mins, and mins of maxes
	const xMin = d3.min(xirrCheok, (d) => d.timestamp);
	const xMax = d3.max(xirrCheok, (d) => d.timestamp);

	const yMin = d3.min(xirrCheok, (d) => d.arrayed);
	const yMax = d3.max(xirrCheok, (d) => d.arrayed);

	// scale using range
	const xScale = d3.scaleTime().domain([ xMin, xMax ]).range([ 0, width ]);

	const yScale = d3.scaleLinear().domain([ yMin, yMax ]).range([ height * 0.9, 0 ]);

	// Drawing bottom axis
	svg.append('line').style('stroke', 'grey').attr('transform', `translate(0, ${height})`).attr('x2', (d) => {
		return xScale(xMax);
	});

	svg
		.append('text')
		.attr('transform', `translate(${xScale(xMin)}, ${height})`)
		.attr('dy', '1em')
		.style('opacity', '0.5')
		.style('font-size', responsiveFontSize)
		.text(moment(xMin).format('DD/MM/YYYY'));

	svg
		.append('text')
		.attr('transform', `translate(${xScale(xMax)}, ${height})`)
		.attr('dy', '1em')
		.style('opacity', '0.5')
		.attr('text-anchor', 'end')
		.style('font-size', responsiveFontSize)
		.text(moment(xMax).format('DD/MM/YYYY'));

	const xirrLine = d3.line().x((d) => xScale(d.timestamp)).y((d) => yScale(d.arrayed));

	// Cheok path
	svg
		.append('path')
		.data([ xirrCheok ])
		.style('fill', 'none')
		.attr('d', xirrLine)
		.attr('id', 'cheokChart')
		.attr('stroke', '#00d1b2')
		.attr('stroke-width', '2')
		.attr('opacity', '0.4');

	// Base value
	svg
		.append('text')
		.data([ xirrCheok[0] ])
		.attr('transform', (d) => {
			return `translate(${xScale(xMin)}, ${yScale(d.arrayed)})`;
		})
		.attr('text-anchor', 'end')
		.attr('x', -10)
		.attr('dy', '0.35em')
		.style('font-size', responsiveFontSize)
		.text(`${numberWithCommas(xirrCheok[0].arrayed)}%`);

	// Base line
	svg
		.append('line')
		.style('stroke', 'grey')
		.style('stroke-dasharray', '2, 2')
		.style('opacity', 0.4)
		.attr('transform', `translate(${xScale(xMin)}, ${yScale(xirrCheok[0].arrayed)})`)
		.attr('x2', (d) => {
			return xScale(xMax);
		});

	const cheokG = svg.append('g').data([
		{
			first: xirrCheok[0],
			last: xirrCheok[xirrCheok.length - 1]
		}
	]);

	const cheokLatestLiquidation = cheokG
		.append('text')
		.attr('transform', (d) => {
			return `translate(${xScale(xMin)}, ${yScale(d.last.arrayed)})`;
		})
		.attr('x', -10)
		.attr('text-anchor', 'end')
		.attr('dy', '0.35em')
		.style('font-size', responsiveFontSize)
		.style('font-weight', 'bold')
		.text((d) => {
			return `${numberWithCommas(d.last.arrayed)}%`;
		});

	cheokG
		.append('line')
		.style('stroke', 'grey')
		.style('stroke-dasharray', '2, 2')
		.style('opacity', 0.4)
		.attr('transform', (d) => {
			return `translate(${xScale(xMin)}, ${yScale(d.last.arrayed)})`;
		})
		.attr('x2', (d) => {
			return xScale(d.last.timestamp);
		});

	// Chart floor line
	svg
		.append('line')
		.style('stroke', 'grey')
		.style('stroke-dasharray', '2, 2')
		.style('opacity', 0.4)
		.attr('transform', `translate(${xScale(xMin)}, ${yScale(yMin)})`)
		.attr('x2', (d) => {
			return xScale(xMax);
		});

	// Chart floor label
	svg
		.append('text')
		.attr('transform', `translate(${xScale(xMin)}, ${yScale(yMin)})`)
		.attr('x', -10)
		.attr('text-anchor', 'end')
		.attr('dy', '0.35em')
		.style('font-size', responsiveFontSize)
		.text(`${numberWithCommas(yMin)}%`);

	// Chart ceiling line
	svg
		.append('line')
		.style('stroke', 'grey')
		.style('stroke-dasharray', '2, 2')
		.style('opacity', 0.4)
		.attr('transform', `translate(${xScale(xMin)}, ${yScale(yMax)})`)
		.attr('x2', (d) => {
			return xScale(xMax);
		});

	// Chart ceiling label
	svg
		.append('text')
		.attr('transform', `translate(${xScale(xMin)}, ${yScale(yMax)})`)
		.attr('x', -10)
		.attr('text-anchor', 'end')
		.attr('dy', '0.35em')
		.style('font-size', responsiveFontSize)
		.text(`${numberWithCommas(yMax)}%`);

	let i = 0;
	d3.timer(() => {
		const hue = `hsl(${i % 360}, 100%, 50%)`;
		d3.select('#cheokChart').attr('stroke', hue);
		cheokLatestLiquidation.style('fill', hue);
		i += 1;
	});
});
