
// Function to create the map
function createMap(lat, lng, zoom){
  var mapOptions = {
    center: {
      lat: lat,
      lng: lng
    },
    zoom: zoom,
    mapTypeId: google.maps.MapTypeId.HYBRID
  };
  var map = new google.maps.Map(document.querySelector('#map'), mapOptions);
  return map;
}


// Helper function to set height equal to window height
function setHeights(){
  $('#map').height( $(document).height() - 65 );
  $('#sidebar').height( $(document).height() );
}


// Helper to show/hide sidebar depending on screen width
// This function is called whenever the body is resized (<body onresize="showHideSidebar();">)
function showHideSidebar(){
  $(document).width() > 995 ? $("#sidebar").show() : $("#sidebar").hide();
}


// All places on the map (model)
var places_model = [
  {
    name: 'Royal Palace of Amsterdam',
    lat: 52.373255,
    lng: 4.891379
  },
  {
    name: 'Van Gogh Museum',
    lat: 52.358413,
    lng: 4.881054
  },
  {
    name: 'Anne Frank House',
    lat: 52.375415,
    lng: 4.884009
  },
  {
    name: 'Heineken Experience',
    lat: 52.357825,
    lng: 4.891814
  },
  {
    name: 'Hermitage Amsterdam',
    lat: 52.365288,
    lng: 4.902436
  },
  {
    name: 'NEMO (museum)',
    lat: 52.374174,
    lng: 4.912496
  },
  {
    name: 'Bloemenmarkt',
    lat: 52.366831,
    lng: 4.891330
  }
];


// Place class
function Place(name, lat, lng){

  // Variables, options
  var self = this;
  this.name = name;
  this.lat = lat;
  this.lng = lng;
  this.show = ko.observable(true);
  this.marker_options = {
    position: {
      lat: this.lat,
      lng: this.lng
    },
    map: map,
    title: this.name,
    animation: google.maps.Animation.DROP
  };

  // Create the marker
  this.marker = new google.maps.Marker(this.marker_options);

  // Show/hide marker
  this.showHide = ko.computed(function(){
    self.show() ? self.marker.setMap(map) : self.marker.setMap(null);
  }, self);

  // AJAX call to Wikipedia API to retreive info about this specific place
  $.ajax({
    url: 'https://en.wikipedia.org/w/api.php',
    data: {
      action: 'opensearch',
      search: self.name,
      format: 'json',
      origin: '*'
    },
    type: 'GET',
    success: function(data) {
      // Content retreived from the API (for info window)
      self.content = '<div class="infowindow-content">';
      self.content += '<h4>' + self.name + '</h4>';
      self.content += '<p>' + data[2][0] + '</p>';
      self.content += '<a target="_blank" href="' + data[3] +'">Wikipedia Article</a>';
      self.content += '</div>';
    },
    error: function(err) {
      self.content = '<div class="infowindow-content">';
      self.content += '<p>We couldn\'t establish connection to Wikipedia API (https://en.wikipedia.org/w/api.php) because an error occured.</p>';
      self.content += '<p>\nPlease try again later. Thank you.</p></div>';
    }
  });

  // When marker is active
  this.active = function() {

      // Create info window and open it
      var info_window = new google.maps.InfoWindow({
        content: self.content,
        maxWidth: 250
      });
      info_window.open(map, self.marker);

      // Set the animation for active marker
      self.marker.setAnimation(google.maps.Animation.BOUNCE);

      // Set it back to normal after 4 seconds
      setTimeout(function(){
        self.marker.setAnimation(null);
      }, 4000);

  };

  // Listener to make the marker active if user clicks on it
  this.marker.addListener('click', function(){
    self.active();
  });

}


// Application ViewModel
function neighborhoodMapVM(){

  var vm = this;  // vm refers to this ViewModel
  this.places = ko.observableArray([]);
  this.search_filter = ko.observable('');

  // Set heights of map and sidebar equal to window height
  setHeights();

  // Set resize listener on body to show/hide sidear depending on window width
  $('body').attr('onresize', 'showHideSidebar()');

  // Creating the map
  map = createMap(52.380773, 4.902741, 13);

  // Creating places instances and store them in an array
  places_model.forEach(function(p) {
    vm.places.push(new Place(p.name, p.lat, p.lng));
  });

  // Set the marker to active if clicked from side menu
  this.setActiveMarker = function(place) {
    place.active();
  };

  // Filter
  this.filterPlaces = ko.computed(function() {
    this.places().forEach(function(p) {
      // if search term value is contained in place name
      p.name.toUpperCase().indexOf(vm.search_filter().toUpperCase()) > -1 ? p.show(true) : p.show(false);
    });
  }, vm);

  // Toggle sidebar on mobile and tablet devices (when toggle button is clicked)
  $('.toggle-button').click(function(){
    $('#sidebar').toggle();
  });

}


// Function that applies VM bindings when google maps is loaded
function initialize() {
  ko.applyBindings(new neighborhoodMapVM());
}
