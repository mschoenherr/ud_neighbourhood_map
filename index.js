/** @description Represents a place in the list of places
    @constructor
    @param {string} name - The name of the place
    @param {string} placeid - The Google Maps placeid of the place
    @param {latlng} location - The latlng location of the place
*/
function Place (name, placeid, location) {
    const self = this;

    self.name = name;
    self.placeid = placeid;
    self.location =location;

}

/** @description The ViewModel for the application
    @constructor
*/
function PlacesModel () {
    const self = this;

    // currentInput holds the string by which the places are filtered
    self.currentInput = ko.observable('');
    
    // This array of places could be loaded from a server.
    self.places = [
	new Place('Le Pré Verre','ChIJyeg7Pedx5kcRQTfGSHXc8pM', {lat: 48.8499854, lng: 2.3458762}),
	new Place('Aki','ChIJf_cDSiVu5kcRimPRcNMdRlk', {lat: 48.86614100000001, lng: 2.3352886}),
	new Place('Au P\'Tit Grec','ChIJ3bpVzu5x5kcR2MrvU4G9-8I', {lat: 48.8427708, lng: 2.3495575}),
	new Place('Amorino','ChIJpS2RMu9x5kcRY4-FjIVPBc4', {lat: 48.8443279, lng: 2.3492272}),
	new Place('Academie de la biere', 'ChIJQzaEGcFx5kcRPCZFjZpmbZQ', {lat: 48.839246, lng: 2.339092})
    ];


    // Initially, there are no markers
    self.markers = [];

    // filteredPlaces is a computed observable returning the places
    // for which place.name includes the currentInput
    self.filteredPlaces = ko.computed(function () {
	return _.filter(self.places,
			function (place) {
			    return place.name.includes(self.currentInput());
			});
    });

    self.populateMarkers = function () {
	// Create new markers and store them in self.markers
	self.markers = _.map(self.filteredPlaces(), function (place) {
	    var marker = new google.maps.Marker({
		title: place.name,
		position:  place.location,
		map: self.map,
	    });
	    return marker;
	});

	// Bounce all markers on load
	_.each(self.markers, self.animateMarker);

	// now attach InfoWindows, later will be ajax query to ???
	_.each(self.markers, function (marker) {
	    self.addInfoWindow(marker);
	});
    }

    // hides markers whose title is not in filteredPlaces
    self.filterMarkers = function () {
	var visiblePlaces = _.map(self.filteredPlaces(), function (place) {
	    return place.name;
	});

	_.each(self.markers, function(marker) {
	    if (visiblePlaces.includes(marker.title)) {
		marker.setMap(self.map)
	    } else {
		marker.setMap(null);
	    }
	});
    }

    // animates a single marker
    self.animateMarker = function (marker) {
	marker.setAnimation(google.maps.Animation.BOUNCE);
	window.setTimeout(function () {
	    marker.setAnimation(null)
	}, 2000);
    }

    // asynchronously loads data form Foursquares and adds an info window to marker
    self.addInfoWindow = function (marker) {
	var url = 'https://api.foursquare.com/v2/venues/search?client_id=D4LH0EQQE4AH1SGUDFHB4ZXPAMPIWKGQP1YSGLKVXA1VGPBG&client_secret=UZFUZQD21FC2A2MAT4SAEZRJVQIBK4IPGPL0WT1YRUYHS0JD&v=20170801&ll=' + marker.position.lat() + ',' + marker.position.lng() +'&limit=1&intent=match&name=' + marker.title;

	$.getJSON(url, function (data) {
	    var infoWindow = new google.maps.InfoWindow({
		content: JSON.stringify(data.response)
	    });
	    marker.addListener('click', function () {
		infoWindow.open(self.map, marker);
		self.animateMarker(marker);
	    });
	})
	    .fail( function () {
		alert('Failed loading Foursquare data for ' + marker.title);
	    });
    }

    // function for clearing markers
    self.clearMarkers = function () {
	_.each(self.markers, function (marker) {
	    marker.setMap(null);
	});
    }

    self.fitMapToMarkers = function () {
	// This bounds object is used to set center and zoom of map
	// Centering is only done initially, in order to show the
	// user the full neighbourhood map at all times
	bounds = new google.maps.LatLngBounds();
	// Adjust the bounds to fit all markers
	_.each(self.markers, function (marker) {
	    bounds.extend(marker.position);
	});
    
	// Finally set the center and bound of the map
	self.map.setCenter(bounds.getCenter());
	self.map.fitBounds(bounds);
    }
}

// in order to separate maps api calls and model, the model must be
// accessible in global context
const myModel = new PlacesModel();

/** @description Initializes the map on the page sets markers */
function initMap () {
    myModel.map = new google.maps.Map(document.getElementById("map"), {
	zoom: 14,
	center: {lat: 48.864716, lng: 2.349014}
    });

    // fills the markers array in the view model
    myModel.populateMarkers();

    // fits the map to show all markers
    myModel.fitMapToMarkers();
}

ko.applyBindings(myModel);
