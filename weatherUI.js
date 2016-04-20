/**
 * @file weatherUI.js
 * Created by john varney on 4/1/2016, for FreeCodeCamp Assignment: "Show the Local Weather"
 *   - Builds UI demonstrating geocoding, autocomplete, Google Places
 *   - Expects user to approve use of location data
 *   - Dependent Files: index.htm, weatherUI.css
 *   - Observation: Icon easily lost visually
 *
 *  @author John Varney jdvarney@(nospam).msn.com
 *  @todo Add pale mile/km ring around icon
 */

/**
 * @function document.ready
 * Encompasses entire .js
 */
$(document).ready(function () {
    var lat, lng; // Captures and maintains location
    var tempUnit = "metric"; // Contextually available toggle
    var autocomplete, infowindow, marker, weatherTable;

    // Main logic
        lat = 26.1124;
        lng = -80.1373;

        // Returns local weather data from OpenWeatherMap
        var weatherPromise = getWeather(lat, lng, tempUnit);
        weatherPromise.done(function (data) {
            // Formats weather data for presentation
            weatherTable = createWeatherTable(data, tempUnit);
            var cityPromise = findCity(lat, lng);
            // Returns selected city and state
            cityPromise.done(function (data) {
                $("#locationText p").append(data.city.short_name + ", " + data.state.long_name);
                initMap(lat, lng, weatherTable.html, weatherTable.iconSource);
            });
            cityPromise.fail(function (error) {
                console.log(error);
            });
        });

    /**
     * @function in-line
     * Handles button {metric||imperial}
     */
    $(function() {
        $('#tempUnit').change(function()
        {
            tempUnit = "imperial";
            if($("#tempUnit").is(':checked'))
            {
                tempUnit = "metric";
            }
            var weatherPromise = getWeather(lat, lng, tempUnit);
            weatherPromise.done(function (data) {
                weatherTable = createWeatherTable(data, tempUnit);
                infowindow.close();
                infowindow = new google.maps.InfoWindow({
                    content: weatherTable.html
                });
                infowindow.setContent(weatherTable.html);
                infowindow.open(map, marker);
            });
        });
    });

    /**
     * @function createWeatherTable
     * @param data json object returned from getWeather
     * @param tempUnit <'metric' or 'imperial'>
     * @returns {{html: (string|*), iconSource: string}}
     */
    function createWeatherTable(data, tempUnit) {
        var city = data.name;
        var formattedDate = $.datepicker.formatDate("DD, d MM, yy", new Date());
        var temp = Math.round(10 * (data.main.temp)) / 10;
        var tmin = Math.round(10 * (data.main.temp_min)) / 10;
        var tmax = Math.round(10 * (data.main.temp_max)) / 10;
        var description = data.weather[0].description;
        var wind = data.wind.speed;
        var humidity = data.main.humidity;
        var pressure = data.main.pressure;
        var cloud = data.clouds.all;
        var icon = data.weather[0].icon;
        var sunrise = new Date(data.sys.sunrise *1000).toLocaleTimeString();
        var sunset =  new Date(data.sys.sunset *1000).toLocaleTimeString();
        var iconSource = "http://openweathermap.org/img/w/" + icon + ".png";

        if(tempUnit == "celcius") {
            unitIndicator = " &deg;C";
            unitMeasure = " m/s";
        }
        else {
            unitIndicator = " &deg;F";
            unitMeasure = " m/h"
        }

        html = '<table id="smallReport">';
        content = buildHTML('<th>', city);
        content+= buildHTML('<th>', formattedDate);
        html += buildHTML('<tr>', content);

        content = buildHTML('<td>', 'Description');
        content+= buildHTML('<td>', description);
        html += buildHTML('<tr>', content);

        content = buildHTML('<td>', 'Temperature');
        content+= buildHTML('<td>', temp + unitIndicator );
        html += buildHTML('<tr>', content);

        content = buildHTML('<td>', 'Humidity');
        content+= buildHTML('<td>', humidity + '%' );
        html += buildHTML('<tr>', content);

        content = buildHTML('<td>', 'Clouds');
        content+= buildHTML('<td>', cloud + '%' );
        html += buildHTML('<tr>', content);

        content = buildHTML('<td>', 'Wind');
        content+= buildHTML('<td>',  wind + unitMeasure );
        html += buildHTML('<tr>', content);

        content = buildHTML('<td>', 'Pressure');
        content+= buildHTML('<td>',  pressure + " hPa");
        html += buildHTML('<tr>', content);

        content = buildHTML('<td>', 'Sunrise');
        content+= buildHTML('<td>',  sunrise );
        html += buildHTML('<tr>', content);

        content = buildHTML('<td>', 'Sunset');
        content+= buildHTML('<td>',  sunset );
        html += buildHTML('<tr>', content) + '</table>';

        return results = {
            html: html,
            iconSource: iconSource
        };
    }

    /**
     * @function getCoordinates
     * @returns {promise object with location}
     */
    function getCoordinates() {
        var d = $.Deferred();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                d.resolve(position);
            }, function (error) {
                d.fail(error);
            });
        }
        else {
            d.reject("Geolocation is not available.");
        }
        return d.promise();
    }

    /**
     * @function initMap
     * @param initLat - latitude
     * @param initLng - Longitude
     * @param weatherTable - formatted HTLM weather data
     * @param iconSource - points to current weather icon
     */
    // Establishes the initial map, and configures autocomplete listener
    function initMap(initLat, initLng, weatherTable, iconSource) {

        var map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: initLat, lng: initLng},
            zoom: 13
        });

        var input = /** @type {!HTMLInputElement} */(
            document.getElementById('pac-input'));

        autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.bindTo('bounds', map);

        marker = new google.maps.Marker({
            map: map,
            icon: iconSource,
            position: {lat: initLat, lng: initLng}
        });

        infowindow = new google.maps.InfoWindow();
        infowindow.setContent(weatherTable);

        marker.addListener('click', function () {
            infowindow.open(map, marker);
        });

        autocomplete.addListener('place_changed', function () {
            infowindow.close();
            marker.setVisible(false);
            var place = autocomplete.getPlace();
            if (!place.geometry) {
                BootstrapDialog.show({
                    title: 'Autocomplete Was Unable to Find Your Location',
                    message: 'Please select your location choice using the mouse or arrow down key',
                    buttons: [{
                        id: 'btn-ok',
                        label: 'OK',
                        cssClass: 'btn-primary',
                        autospin: false,
                        action: function(dialogRef){
                            dialogRef.close();
                        }
                    }]
                });
                return;
            }

            if (place.geometry.viewport) {
                map.fitBounds(place.geometry.viewport);
            } else {
                map.setCenter(place.geometry.location);
                map.setZoom(17);
            }

            marker.setPosition(place.geometry.location);
            marker.setVisible(true);

            if (place.address_components) {
                lat = place.geometry.location.lat();
                lng = place.geometry.location.lng();
                var newAddress = findCity(lat, lng);
                newAddress.done(function (data) {
                    $("#locationText p").html("Weather for " + data.city.short_name + ", " + data.state.long_name);
                    // infowindow.setContent('<div><strong>' + data.city.short_name);
                    // infowindow.open(map, marker);
                    var weatherPromise = getWeather(lat, lng, tempUnit);
                    weatherPromise.done(function (data) {
                        weatherTable = createWeatherTable(data, tempUnit);
                        infowindow.close();
                        infowindow = new google.maps.InfoWindow({
                            content: weatherTable.html
                        });
                        infowindow.open(map, marker);
                    });
                });
            }
        });
    }

    /**
     * function GetWeather
     * @param initLat - latitude
     * @param initLng - longitude
     * @param tempUnit - metric||imperial
     * @returns {promise}
     */
    function getWeather(initLat, initLng, tempUnit) {
        var p = $.Deferred();
        var sourceURL = 'http://api.openweathermap.org/data/2.5/weather';
        var args = {
            lat: initLat,
            lon: initLng,
            units: tempUnit,
            APPID: '5f71d96eb22e79bec493940e420190e9'
        };
        $.getJSON(sourceURL, args, function (data) {
            p.resolve(data);
        });
        return p.promise();
    }

    /**
     * @function findCity
     * @param lat - latitude
     * @param lng - longitude
     * @returns {promise}
     */
    function findCity(lat, lng) {
        var city = "";
        var state = "";
        var d = $.Deferred();
        geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng(lat, lng);
        geocoder.geocode({'latLng': latlng}, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[1]) {
                    for (var i = 0; i < results[0].address_components.length; i++) {
                        for (var b = 0; b < results[0].address_components[i].types.length; b++) {
                            if (results[0].address_components[i].types[b] == "locality") {
                                city = results[0].address_components[i];
                                break;
                            }
                        }
                    }

                    for (var i = 0; i < results[0].address_components.length; i++) {
                        for (var b = 0; b < results[0].address_components[i].types.length; b++) {
                            if (results[0].address_components[i].types[b] == "administrative_area_level_1") {
                                state = results[0].address_components[i];
                                break;
                            }
                        }
                    }
                    var address = {};
                    address.city = city;
                    address.state = state;
                    d.resolve(address);
                }
                else {
                    d.fail(status);
                }
            }
            else {
                console.log("Geocoder failed due to: " + status);
            }
        });
        return d.promise();
    }

    /**
     * @function buildHTML
     * @param tag
     * @param content
     * @returns content within tag
     */
    function buildHTML(tag, content) {
        endtag =  '</' + tag.substr(1,tag.length);
        if (typeof content === undefined) return tag + endtag;
        else return tag + content + endtag;
    }

}); // End of document ready