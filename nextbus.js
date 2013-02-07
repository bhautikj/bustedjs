var rrr_xmldata;

$(function() {
	var baseUrl = 'http://webservices.nextbus.com/service/publicXMLFeed';
	var $routes_el = $('#routes');
	var $directions_el = $('#directions');
	var $stops_el = $('#stops');
	// stopMap is used for mapping stopTags to titles
	var stopMap = {};
	// directionStops is used for storing which stops are on each direction
	var directionStops = {};

	$directions_el.on('change', function(e) {
		// When the directions dropdown changes...

		// Clear the stops
		$stops_el.empty();

		// Add all the stops for a direction to the dropdown
		$(directionStops[e.target.value]).each(function(index, stopTag) {
			var option = document.createElement('option');
			option.setAttribute('value', stopTag);
			option.text = stopMap[stopTag];
			$stops_el.append(option);
		});
	});

	$routes_el.on('change', function(e) {
		// When the routes dropdown changes...

		// Do cleanup
		$directions_el.empty();
		$stops_el.empty();
		stopMap = {};
		directionStops = {};

		// Get the config for this route and store the stops for each
		// direction and the title of each stop for the direction change to use
		$.get(baseUrl + '?command=routeConfig&a=ttc&r=' + e.target.value, function(xml) {
			rrr_xmldata = xml;
			var $xml = $(xml);

			// Create a lookup for stop tags to titles
			$xml.find('body > route > stop').each(function(index, stop) {
				var $stop = $(stop);
				stopMap[$stop.attr('tag')] = $stop.attr('title');
			});

			$xml.find('direction').each(function(index, direction) {
				// Create option tag for each direction
				var $direction = $(direction);
				var directionTag = $direction.attr('tag');
				var option = document.createElement('option');
				option.setAttribute('value', directionTag);
				option.text = $direction.attr('title');
				$directions_el.append(option);

				// Create an array for each direction storing all the stops
				directionStops[directionTag] = [];
				stopsForDirection = directionStops[directionTag];
				$direction.children('stop').each(function(index, stop) {
					$stop = $(stop);
					stopsForDirection.push($stop.attr('tag'));
				});
			});
		})
		.done(function() {
			$('#dropdowns').fadeIn();
			// trigger a change event
			$('#directions :first-child').change();
		});
	});
	// This initial fetch will get all the TTC routes and put them in a dropdown
	$.get(baseUrl + '?command=routeList&a=ttc', function(xml) {
		var $xml = $(xml);
		$xml.find('route').each(function(index, route) {
			var $route = $(route);
			var option = document.createElement('option');
			option.setAttribute('value', $route.attr('tag'));
			option.text = $route.attr('title').replace('-', ' '); 
			$routes_el.append(option);
		});
	})
	.done(function() {
		// trigger a change event
		$('#routes :first-child').change();
	})
	.fail(function() {
		$('#debug').text('fail');
	});
});