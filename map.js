var map;

function getMyCoords() {
  var instructionEl = document.getElementById("instruction");
  var coordsObj;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        instructionEl.innerHTML = "Geolocation is not supported by this browser.";
    }

  function showPosition(position) {
    var lat = position.coords.latitude;
    var long = position.coords.longitude;
    var myData = {
      "latitude": lat,
      "vehicleSpec": "%282011-%29",
      "vehicleMake": "Nissan",
      "vehicleModel": "Leaf",
      "longitude": long
    };

    var location = new google.maps.LatLng(lat, long);
    place_marker(map, location, "You are here!");

    $('button#findStations').click(function(){
      find_stationsForMe(myData);
    });
  }

  function showError(error) {
      switch(error.code) {
        case error.PERMISSION_DENIED:
            instructionEl.innerHTML = "User denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            instructionEl.innerHTML = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            instructionEl.innerHTML = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            instructionEl.innerHTML = "An unknown error occurred.";
            break;
      }
  }
}

function myMap() {
  var centerOfUK = new google.maps.LatLng(53.4,-1.45);
  var mapCanvas = document.getElementById("map");
  var mapOptions = {center: centerOfUK, zoom: 6};
  map = new google.maps.Map(mapCanvas, mapOptions);
}

function place_marker(map, location, message) {
  var marker = new google.maps.Marker({
    position: location,
    map: map,
    icon: "https://d2suciz5inbc0m.cloudfront.net/extension/ecotricity-design/design/ecotricity-design/images/electric-highway/pin-acdc.png"
  });
  if (!message) {
    message = "Hello!";
  }
  var infowindow = new google.maps.InfoWindow({
    content: message
  });
  infowindow.open(map, marker);
}

function find_stationsForMe(data) {
  var settings = {
    "async": true,
    "crossDomain": true,
    "url": "https://www.ecotricity.co.uk/api/ezx/v1/getPumpList",
    "method": "POST",
    "headers": {
      "content-type": "application/x-www-form-urlencoded",
      "cache-control": "no-cache",
      "postman-token": "1ec55548-a8bd-263f-aee5-63fc02520443"
    },
    "data": data
  };
  // Send request to the server to retrieve pump list.
  $.ajax(settings).done(function (data) {
    $("div#chargingStations").empty();
    var stations = data.result;
    stations.forEach(function(station){
      var location = new google.maps.LatLng(station.latitude, station.longitude);
      place_marker(map, location);
      $("div#chargingStations").append("<div>"+station.name+"</div>");
    });
  });
}
