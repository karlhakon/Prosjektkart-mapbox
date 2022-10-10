var transformRequest = (url, resourceType) => {
  var isMapboxRequest =
    url.slice(8, 22) === "api.mapbox.com" ||
    url.slice(10, 26) === "tiles.mapbox.com";
  return {
    url: isMapboxRequest
      ? url.replace("?", "?pluginName=sheetMapper&")
      : url
  };
};
//YOUR TURN: add your Mapbox token

mapboxgl.accessToken = 'pk.eyJ1IjoiZGlnaXRhbHRpbm5ob2xkIiwiYSI6ImNsOTJxOXVlbDFqOGszb3AyaTh4dWJjanYifQ.ORF8m6bAcBpPHim92e-kBw'; //Mapbox token 
var map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/digitaltinnhold/cl92p3j9i000s15lodbmayvzr', // YOUR TURN: choose a style: https://docs.mapbox.com/api/maps/#styles
  ccenter: [12.97, 63.83], // starting position [lng, lat]
  zoom: 4.57,// starting zoom
  transformRequest: transformRequest
});

$(document).ready(function () {
  $.ajax({
    type: "GET",
    //YOUR TURN: Replace with csv export link
    url: 'https://docs.google.com/spreadsheets/d/1NYLG3NbnZjnIjAx3EtgVaog6nJcRWC3sVIji2G8cYCA/gviz/tq?tqx=out:csv&sheet=Sheet1',
    dataType: "text",
    success: function (csvData) { makeGeoJSON(csvData); }
  });



  function makeGeoJSON(csvData) {
    csv2geojson.csv2geojson(csvData, {
      latfield: 'Latitude',
      lonfield: 'Longitude',
      delimiter: ','
    }, function (err, data) {
      map.on('load', function () {

        //Add the the layer to the map
        map.addLayer({
          'id': 'csvData',
          'type': 'circle',
          'source': {
            'type': 'geojson',
            'data': data
          },
          'paint': {
            'circle-radius': 5,
            'circle-color': "purple"
          }
        });


        // When a click event occurs on a feature in the csvData layer, open a popup at the
        // location of the feature, with description HTML from its properties.
        map.on('click', 'csvData', function (e) {
          var coordinates = e.features[0].geometry.coordinates.slice();

          //set popup text
          //You can adjust the values of the popup to match the headers of your CSV.
          // For example: e.features[0].properties.Name is retrieving information from the field Name in the original CSV.
          var description = `<h3>` + e.features[0].properties.Name + `</h3>` + `<h4>` + `<b>` + `Address: ` + `</b>` + e.features[0].properties.Address + `</h4>` + `<h4>` + `<b>` + `Phone: ` + `</b>` + e.features[0].properties.Phone + `</h4>`;

          // Ensure that if the map is zoomed out such that multiple
          // copies of the feature are visible, the popup appears
          // over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          //add Popup to map

          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
        });

        // Change the cursor to a pointer when the mouse is over the places layer.
        map.on('mouseenter', 'csvData', function () {
          map.getCanvas().style.cursor = 'pointer';
        });

        // Change it back to a pointer when it leaves.
        map.on('mouseleave', 'places', function () {
          map.getCanvas().style.cursor = '';
        });

        var bbox = turf.bbox(data);
        map.fitBounds(bbox, { padding: 50 });

      });

    });
  };
});