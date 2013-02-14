var rrr_xmldata;

$(function() {
	// Utility functions
	var fadeIn = function(selector) {
		$(selector).css('-webkit-animation', 'fadeInAnimation 600ms forwards');
	};

	// Handy declarations for common elements
	var baseUrl = 'http://webservices.nextbus.com/service/publicXMLFeed';
	var $agencies_el = $('#agencies');
	var $routes_el = $('#routes');
	var $directions_el = $('#directions');
	var $stops_el = $('#stops');
	var $predictions_el = $('#predictions');

	// stopMap is used for mapping stopTags to titles
	var stopMap = {};
	// directionStops is used for storing which stops are on each direction
	var directionStops = {};

	// When the agencies dropdown changes...
	$agencies_el.on('change', function(e) {
		// Do cleanup; Make dropdowns invisible and clear route dropdown
		$('.achg, .rchg').css('-webkit-animation', '');
		$routes_el.empty();

		var agency = $agencies_el.val();
		// Get all the agency routes and put them in a dropdown
		$.get(baseUrl + '?command=routeList&a=' + agency, function(xml) {
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
			fadeIn('.achg');
		})
		.fail(function() {
			$('#debug').text('fail');
		});
	});

	// When the routes dropdown changes...
	$routes_el.on('change', function(e) {
		// Do cleanup
		$('.rchg').css('-webkit-animation', '');
		$directions_el.empty();
		$stops_el.empty();
		stopMap = {};
		directionStops = {};

		// Get the config for this route and store the stops for each
		// direction and the title of each stop for the direction change to use
		var agency = $agencies_el.val();
		var route = e.target.value;
		$.get(baseUrl + '?command=routeConfig&a=' + agency + '&r=' + route, function(xml) {
			var $xml = $(xml);

			// Create a lookup for stop tags to titles
			$xml.find('body > route > stop').each(function(index, stop) {
				var $stop = $(stop);
				stopMap[$stop.attr('tag')] = $stop.attr('title');
			});

			$xml.find('direction').each(function(index, direction) {
				var $direction = $(direction);
				var directionTag = $direction.attr('tag');

				// Create option tag for each direction
				var option = document.createElement('option');
				option.setAttribute('value', directionTag);
				option.text = $direction.attr('title');
				$directions_el.append(option);

				// Create an array for each direction storing all the stops
				directionStops[directionTag] = [];
				stopsForDirection = directionStops[directionTag];
				$direction.children('stop').each(function(index, stop) {
					var $stop = $(stop);
					stopsForDirection.push($stop.attr('tag'));
				});
			});
		}) // End of $.get for routeConfig
		.done(function() {
			// trigger a change event
			$('#directions :first-child').change();
			fadeIn('#dropdowns, .rchg');
		}); // Done for $.get on routeConfig
	}); // End of route_el change handler

	// When the directions dropdown changes...
	$directions_el.on('change', function(e) {
		// Clear the stops
		$stops_el.empty();

		// Add all the stops for a direction to the dropdown
		$(directionStops[e.target.value]).each(function(index, stopTag) {
			var option = document.createElement('option');
			option.setAttribute('value', stopTag);
			option.text = stopMap[stopTag];
			$stops_el.append(option);
		});

		// Trigger change on stops
		$('#stops :first-child').change();
	}); // End of directions_el change handler

	// Function to retreive predictions and put them in #predictions
	var get_predictions = function(e) {
		// Clear the predictions div
		$predictions_el.empty();

		var agency = $agencies_el.val();
		var route = $routes_el.val();
		var stop = $stops_el.val();

		$.get(baseUrl + '?command=predictions&a=' + agency + '&r=' + route + '&s=' + stop, function(xml) {
			var $xml = $(xml);
			var $directions = $xml.find('direction');
			if ($directions.size() == 0) {
				$predictions_el.html('<h3>No predictions available</h3>');
			}

			$directions.each(function(index, direction) {
				var $direction = $(direction);
				var direction_div = document.createElement('div');
				direction_div.setAttribute('class', 'predictionDirection');
				var $direction_div_el = $(direction_div);

				// Add a heading to the ul
				var heading = document.createElement('h3');
				heading.innerHTML = $direction.attr('title');
				$direction_div_el.append(heading);

				// Add a ul to the direction div
				var predictions_ul = document.createElement('ul');
				$direction_div_el.append(predictions_ul);

				var $predictions_ul_el = $(predictions_ul);
				// Iterate over the predictions and add them to the ul
				$direction.find('prediction').each(function(index, prediction) {
					var $prediction = $(prediction);
					var prediction_li = document.createElement('li');
					var minutes = $prediction.attr('minutes');
					if (minutes <= 0) {
						prediction_li.innerHTML = 'Arriving';
					} else {
						prediction_li.innerHTML = minutes + (minutes == 1 ? ' minute' : ' minutes');
					}

					$predictions_ul_el.append(prediction_li);
				});

				$predictions_el.append($direction_div_el);
			});
		}); // End of fetching predictions
	}; // End of get_predictions handler

	// Get predictions when changing the stops or clicking refresh
	$stops_el.on('change', get_predictions);
	$('#refresh').on('click', get_predictions);

	// This initial fetch will get all the agencies
	$.get(baseUrl + '?command=agencyList', function(xml) {
		var $xml = $(xml);
		$xml.find('agency').each(function(index, agency) {
			var $agency = $(agency);
			var option = document.createElement('option');
			option.setAttribute('value', $agency.attr('tag'));
			option.text = $agency.attr('title');
			$agencies_el.append(option);
		});
	})
	.done(function() {
		// trigger a change event
		$('#agencies :first-child').change();
	})
	.fail(function() {
		$('#debug').text('fail');
	});

});