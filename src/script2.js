const arrayer = (data, key) => {
	const arrayed = [];

	for (let i = 0; i < data.length; i++) {
		const current = { ...data[i] };
		const arrayEle = current[key];
		current.arrayed = arrayEle;
		arrayed.push(current);
	}

	return arrayed;
};

d3.json('data/cheok.json').then((cheok) => {
	const arrayedCheok = arrayer(cheok.data, 'liquidationValue');
	const docWidth = document.getElementById('chart2').clientWidth;

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
		.select('#chart2')
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
	const xMin = d3.min(arrayedCheok, (d) => d.timestamp);
	const xMax = d3.max(arrayedCheok, (d) => d.timestamp);

	const yMin = d3.min(arrayedCheok, (d) => d.arrayed);
	const yMax = d3.max(arrayedCheok, (d) => d.arrayed);

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

	const line = d3.line().x((d) => xScale(d.timestamp)).y((d) => yScale(d.arrayed));

	// Cheok path
	svg
		.append('path')
		.data([ arrayedCheok ])
		.style('fill', 'none')
		.attr('d', line)
		.attr('id', 'cheokChart')
		.attr('stroke-width', '2');

	// Base value
	svg
		.append('text')
		.data([ arrayedCheok[0] ])
		.attr('transform', (d) => {
			return `translate(${xScale(xMin)}, ${yScale(d.arrayed)})`;
		})
		.attr('text-anchor', 'end')
		.attr('x', -10)
		.attr('dy', '0.35em')
		.style('font-size', responsiveFontSize)
		.text(`$${numberWithCommas(arrayedCheok[0].arrayed)}`);

	// Base line
	svg
		.append('line')
		.style('stroke', 'grey')
		.style('stroke-dasharray', '2, 2')
		.style('opacity', 0.4)
		.attr('transform', `translate(${xScale(xMin)}, ${yScale(arrayedCheok[0].arrayed)})`)
		.attr('x2', (d) => {
			return xScale(xMax);
		});

	const cheokG = svg.append('g').data([
		{
			first: arrayedCheok[0],
			last: arrayedCheok[arrayedCheok.length - 1]
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
			return `$${numberWithCommas(Math.floor(d.last.arrayed))}`;
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
		.text(`$${numberWithCommas(Math.floor(yMin))}`);

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
		.text(`$${numberWithCommas(Math.floor(yMax))}`);

	let i = 0;
	d3.timer(() => {
		const hue = `hsl(${i % 360}, 100%, 50%)`;
		d3.select('#cheokChart').attr('stroke', hue);
		cheokLatestLiquidation.style('fill', hue);
		i += 1;
	});
});
