var directionsService;
var directionsDisplay;
var map;

$("#cars").change(function(){
  var str = $("#cars").val();
  var strArr = str.split(" ");
  var myDataObj = {
    "latitude": "",
    "longitude": "",
    "vehicleSpec": strArr[3],
    "vehicleMake": strArr[0],
    "vehicleModel": strArr[1]+" "+strArr[2]
  };
  $("#yourCar").html("Your car: "+myDataObj.vehicleMake+" "+myDataObj.vehicleModel+" "+myDataObj.vehicleSpec);
  getMyCoords(myDataObj);
});

function myMap() {
  var centerOfUK = new google.maps.LatLng(53.4,-1.45);
  var mapCanvas = document.getElementById("map");
  var mapOptions = {center: centerOfUK, zoom: 6};
  directionsService = new google.maps.DirectionsService;
  directionsDisplay = new google.maps.DirectionsRenderer;
  map = new google.maps.Map(mapCanvas, mapOptions);
}

function getMyCoords(myDataObj) {
  var instructionEl = document.getElementById("instruction");
      if (navigator.geolocation) {
      $("#instruction").html("<span class='animated fadeIn'>Finding your location...</span>");
      navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        instructionEl.innerHTML = "Geolocation is not supported by this browser.";
    }

  function showPosition(position) {
    var lat = position.coords.latitude;
    var long = position.coords.longitude;
    myDataObj.latitude = lat;
    myDataObj.longitude = long;
    $("#instruction").html("<span class='animated fadeIn'>Got your location.<br>Let's find charging stations near you.</span>");
    //now myDataObj has all the User car and location information.
    place_marker(map, myDataObj, undefined, "You are here!");
    $('button#findStations.findBtn').css({"display":"block"});
    $('button#findStations').click(function(){
      find_stationsNearMe(myDataObj);
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

function place_marker(map, locatObj, myDataObj, message) {
  // create & place a location marker
  var location = new google.maps.LatLng(locatObj.latitude, locatObj.longitude);
  var iconImg ="";
  iconImg = select_iconImg(locatObj.pumpModel);

  var marker = new google.maps.Marker({
    position: location,
    map: map,
    icon: iconImg
  });

  // Create & place an info window for the location.
  var contentStr = '<div class="infowindow">';
  if (message) {
    contentStr +=message+'<br>';
  }
  if (locatObj.name) {
    contentStr +='<h2 class="narrow">'+locatObj.name+'</h2>';
  }
  if (locatObj.pumpModel) {
    contentStr +='<h4 class="narrow">'+locatObj.pumpModel+'</h4>';
  }
  if (locatObj.location) {
    contentStr +='<h3 class="narrow">'+locatObj.location+'</h3>';
  }
  if (locatObj.postcode) {
    contentStr +='<h3 class="narrow">'+locatObj.postcode+'</h3>';
  }
  if (locatObj.distance) {
    contentStr +='<h3 class="narrow">Distance: '+(locatObj.distance).toFixed(1)+' Miles</h3>';
  }
  if (locatObj.postcode) {
    contentStr +='<button id="getDirectionBtn" class="btn">Get Directions</button><br/>';
  }
  if (typeof(myDataObj)!=="undefined") {
    display_locationDetails(locatObj, myDataObj, map, marker, contentStr);
  } else {
    display_infowindow(locatObj, myDataObj, map, marker, contentStr);
  }

}

function find_stationsNearMe(myDataObj) {
  // Clear past route.
  directionsDisplay.setMap(null);
  document.getElementById("direction-panel").innerHTML = "";

  //zoom map and center it to my location.
  map.setZoom(9);
  map.setCenter({lat:myDataObj.latitude, lng:myDataObj.longitude});

  // Send request to the server to retrieve pump list.
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
    "data": myDataObj
  };

  $.ajax(settings).done(function (data) {
    $("#instruction").html("<span class='animated fadeIn'>Here are the 10 charnging stations closest to you.</br> Click each marker above to see more details, including distance and directions.</span>");
    $("#chargingStations").empty();
    var stations = data.result;
    stations.forEach(function(stationObj){
      place_marker(map, stationObj, myDataObj);
      $("#chargingStations").append("<li class='locationListItem'>"+stationObj.name+" Distance: "+(stationObj.distance).toFixed(1)+" miles</li>");
    });
  });
}

function display_locationDetails(locatObj, myDataObj, map, marker, contentStr){
  var settings = {
    "async": true,
    "crossDomain": true,
    "url": "https://www.ecotricity.co.uk/api/ezx/v1/getLocationDetails",
    "method": "POST",
    "headers": {
      "content-type": "application/x-www-form-urlencoded",
      "cache-control": "no-cache",
      "postman-token": "10b6d71a-a038-1043-76cf-d80c5aa3005f"
    },
    "data": {
      "vehicleSpecification": myDataObj.vehicleSpec,
      "vehicleModel": myDataObj.vehicleModel,
      "locationId": locatObj.locationId,
      "vehicleMake": myDataObj.vehicleMake
    }
  };

  $.ajax(settings).done(function (data) {
    var stationPumps = data.result.pump;
    stationPumps.forEach(function(pumpObj){
      pumpObj.connector.forEach(function(connector){
        var connectorStr =
          "<div class='connectorDiv'>"+
          "<img src='"+select_iconImg(connector.type)+"' />"+
          "<h4>Connector "+connector.connectorId+": "+connector.name+"</h4>"+
          "<p>Compatibility with your car: "+connector.compatible+"</p>"+
          "<p>Availability: "+connector.status+"</p>"+
          "<p>Session Duration: "+connector.sessionDuration+" mins</p>"+
          "</div>";
        contentStr += connectorStr;
      });
    });
    display_infowindow(locatObj, myDataObj, map, marker, contentStr);
  });

}

function display_infowindow(locatObj, myDataObj, map, marker, contentStr, visible){
  var infowindow = new google.maps.InfoWindow({
    content: contentStr+"</div>"
  });
  if (visible==="false"||typeof(visible)==="undefined"){
    marker.addListener('click', function() {
    infowindow.open(map, marker);
    $("#getDirectionBtn").click(function(){
      infowindow.close();
      calculateAndDisplayRoute(myDataObj.latitude+","+myDataObj.longitude, locatObj.postcode);

    });
    });
  } else {
    infowindow.open(map, marker);
    $("#getDirectionBtn").click(function(){
      infowindow.close();
      calculateAndDisplayRoute(myDataObj.latitude+","+myDataObj.longitude, locatObj.postcode);
    });
  }
}

function select_iconImg(pumpModel){
  var iconImg ="";
  switch(pumpModel) {
    case "DC (CHAdeMO) / CCS":
      iconImg = "library/images/pin-acdc-dc.png";
      break;
    case "AC (RAPID) / DC (CHAdeMO)":
      iconImg = "library/images/pin-dcac-ac.png";
      break;
      case "AC (RAPID)":
        iconImg = "library/images/pin-ac.png";
        break;
    case "AC (Medium)":
      iconImg = "library/images/pin-ac.png";
      break;
    case "DC (CHAdeMO)":
      iconImg = "library/images/pin-acdc.png";
      break;
    case "CCS":
      iconImg = "library/images/pin-dc.png";
      break;
    default:
  }
  return iconImg;
}

function calculateAndDisplayRoute(origin, destination) {
  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(document.getElementById('direction-panel'));
  directionsService.route({
    origin: origin,
    destination: destination,
    travelMode: 'DRIVING',
    unitSystem: google.maps.UnitSystem.IMPERIAL
  }, function(response, status) {
    if (status === 'OK') {
      directionsDisplay.setDirections(response);
    } else {
      window.alert('Directions request failed due to ' + status);
    }
  });
}
