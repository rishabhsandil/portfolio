var api_key = "b9349bec3e87497f996548ddcb7e32e8";
var weather_key = "df92d220bcaa589e3ee6dd0b99c1d108";
var news_endpoint = "https://newsapi.org/v1/articles";
//source=techcrunch&apiKey="
var weather_endpoint = "https://cors-anywhere.herokuapp.com/https://api.darksky.net/forecast/";
var source = loadSource();
var units = loadUnits();
var search_endpoint = news_endpoint + "source=" + source + "&apiKey=" + api_key; 
var coords;
var x = (new Date).getTime();
var n=(new Date).getDay();

var weekday = new Array(7);
weekday[0] = "Sunday";
weekday[1] = "Monday";
weekday[2] = "Tuesday";
weekday[3] = "Wednesday";
weekday[4] = "Thursday";
weekday[5] = "Friday";
weekday[6] = "Saturday";




$(document).ready(function() {

  var loadedSource = loadSource();


  if(navigator.geolocation !== undefined) { 
      console.log("weather loading");
    //this code for finding the coordinates
    //is copied from the Lab 8 solution
    //https://thimble.mozilla.org/en-US/user/danielzenk/849643
    navigator.geolocation.getCurrentPosition(function(position) {
      coords = position.coords;
         
        requestSearchWeather(coords);
    })
  }



//  $("#weather-button").click(function() {
//    console.log("weather button clicked");
   
    
//  })

  setInterval(function() {
    
    requestSearchWeatherAside(coords);
    //checkIfRain();
    console.log("refreshed");
  }, 3000000);

  /*var option = JSON.parse(localStorage.option);
  console.log(option);
  if(option==="undefined"){
    requestSearchNews()
  }else if(option==="news"){
    requestSearchNews();
  }else{
    if(navigator.geolocation !== undefined) { 
      //this code for finding the coordinates
      //is copied from the Lab 8 solution
      //https://thimble.mozilla.org/en-US/user/danielzenk/849643
      navigator.geolocation.watchPosition(function(position) {
        coords = position.coords
      })
    }
    requestSearchWeather(coords);
  }
  */

})



//function requestSearchWeatherAside(coordinates){
//  console.log("in request for weather aside");
//  ('#weather-aside').empty();
//  var settings = {
//    data: {
//      units: units
//    },
//    success: searchSuccessWeatherAside,
//    error: searchError
//  }
//
//  jQuery.ajax(weather_endpoint+weather_key+"/"+coordinates.latitude+","+coordinates.longitude, settings);
//
//}
//
//function searchSuccessWeatherAside(data, textStatus, jqHXR){
//  var rainAlert = checkIfRain(data);
//  console.log("in the weather aside");
//  console.log(data);
//  $("#weather-aside").empty();
//  var weatherDiv = $("<div />", {'class': 'weatherDiv'});
//  var currentTempDiv=$("<div />", {'class': 'currentTempDiv'});
//  var currentTemp = $("<span />", {html: data.currently.apparentTemperature});
//  var summary = $("<span />", {html: data.currently.summary});
//  var windSpeedDiv = $("<div />", {'class': 'windSpeedDiv'});
//  var windSpeed = $("<span />", {html: data.currently.windSpeed});
//
//  windSpeedDiv.append($("<span>Winds reaching </span>"));
//  windSpeedDiv.append(windSpeed);
//
//  if(units==="si"){
//    console.log("it is km");
//    windSpeedDiv.append($("<span> kilometers an hour</span>"));
//  }else{
//    console.log("it is miles");
//    windSpeedDiv.append($("<span> miles an hour</span>"));
//  }
//  currentTempDiv.append(currentTemp);
//  console.log(units);
//  console.log(units==="si");
//  rainAlert.appendTo("#weather-aside");
//  if(units==="si"){
//    console.log("it is cel");
//    currentTempDiv.append($("<span> ° celcius</span>"));
//    currentTempDiv.appendTo($("#weather-aside"));
//    $("<span> Winds reaching </span>").appendTo($("#weather-aside"));
//    windSpeed.appendTo($("#weather-aside"));
//    $("<span> kilometers an hour</span>").appendTo($("#weather-aside"));
//  }else{
//    console.log("it is fahr");
//    currentTempDiv.append($("<span> ° fahrenheit</span>"));
//    currentTempDiv.appendTo($("#weather-aside"));
//    $("<span> Winds reaching </span>").appendTo($("#weather-aside"));
//    windSpeed.appendTo($("#weather-aside"));
//    $("<span> miles an hour</span>").appendTo($("#weather-aside"));
//  }
//  weatherDiv.append(summary);
//  /*
//  currentTempDiv.appendTo($("#search-results"));
//  weatherDiv.appendTo($("#search-results"));
//  windSpeedDiv.appendTo($("#search-results"));
//  */
//  checkIfRain(data);
//
//}


function requestSearchWeather(coordinates){
  $('#search-results-weather').empty();
  console.log("in request for weather");
  var settings = {
    data: {
      units: units
    },
    success: searchSuccessWeather,
    error: searchError
  }

  jQuery.ajax(weather_endpoint+weather_key+"/"+coordinates.latitude+","+coordinates.longitude, settings);

}

function searchSuccessWeather(data, textStatus, jqHXR){
  console.log("in the weather");
  console.log(data);
  var header = $("<h1 class = \"currWeath\"> Current Weather </h1>");
  header.appendTo($("#search-results-weather"));
  var weatherDiv = $("<div />", {'class': 'weatherDiv'});
  var currentTempDiv=$("<div />", {'class': 'currentTempDiv'});
  var currentTemp = $("<span />", {html: data.currently.temperature});
  var summary = $("<span />", {html: data.currently.summary});
  var windSpeedDiv = $("<div />", {'class': 'windSpeedDiv'});
  var windSpeed = $("<span />", {html: data.currently.windSpeed});


  windSpeedDiv.append($("<span>Winds reaching </span>"));
  windSpeedDiv.append(windSpeed);
  if(units==="si"){
    windSpeedDiv.append($("<span> kilometers an hour</span>"));
    currentTempDiv.append(currentTemp);
    currentTempDiv.append($("<span> ° celcius</span>"));
  }else{
    windSpeedDiv.append($("<span> miles an hour</span>"));
    currentTempDiv.append(currentTemp);
    currentTempDiv.append($("<span> ° fahrenheit</span>"));
  }

  weatherDiv.append(summary);
  currentTempDiv.appendTo($("#search-results-weather"));
  if(data.currently.icon.includes("cloudy")){
    ($('<img src="images/cloudy.png" class = "itsImage"></img>').appendTo($("#search-results-weather")));
  } else if(data.currently.icon.includes("sun") || data.currently.icon.includes("clear")){
    ($('<img src="images/sunny.png" class = "itsImage"></img>').appendTo($("#search-results-weather")));
    } else if(data.currently.icon.includes("clear-day") || data.currently.icon.includes("clear-day")){
      ($('<br><br><img src="images/sunny.png" class = "itsImage"></img>').appendTo(overallDiv));      
  } else if(data.currently.icon.includes("rain")){
    ($('<img src="images/rain.jpg" class = "itsImage"></img>').appendTo($("#search-results-weather")));
  } else if(data.currently.summary.includes("Rain")){
    ($('<img src="images/rain.jpg" class = "itsImage"></img>').appendTo($("#search-results-weather")));
  }
  weatherDiv.appendTo($("#search-results-weather"));
  windSpeedDiv.appendTo($("#search-results-weather"));
  checkIfRain(data);
  loadNextSix(data);
}

function iterator(){


    console.log(n);
        n=n+1;
    n=n%7;
}

function loadNextSix(data){
  $("#weeks-weather").empty();
  var header = $("<br><br><br><hr><br><br><h1 class = \"weekHead\"> This Weeks Weather </h1><br><br>");
  header.appendTo($("#search-results-weather"));
  data.daily.data.forEach(function(day){
      
    //console.log("in next 6");
    //console.log(data);
    var overallDiv = $("<div />", {'class': 'overallDiv'});
    var weatherDiv = $("<div />", {'class': 'weatherDiv'});
    var currentTempDiv=$("<div />", {'class': 'currentTempDiv'});
    var currentTemp = $("<p />", {html: day.temperatureMax});
    var summary = $("<span />", {html: day.summary});
    var windSpeedDiv = $("<div />", {'class': 'windSpeedDiv'});
    var windSpeed = $("<span />", {html: day.windSpeed});
  iterator();
      var d = $("<p />", {html: weekday[n]});  
      d.appendTo(overallDiv);
      
    weatherDiv.append(windSpeed);
    currentTempDiv.append(currentTemp);
    currentTempDiv.appendTo(overallDiv);
      summary.appendTo(overallDiv);
    if(day.icon.includes("Cloudy") || day.icon.includes("cloudy")){
      ($('<br><br><img src="images/cloudy.png" class = "itsImage"></img>').appendTo(overallDiv));
    } else if(day.icon.includes("Sun") || data.currently.icon.includes("Clear")){
      ($('<br><br><img src="images/sunny.png" class = "itsImage"></img>').appendTo(overallDiv));
    } else if(day.icon.includes("clear-day") || data.currently.icon.includes("clear-day")){
      ($('<br><br><img src="images/sunny.png" class = "itsImage"></img>').appendTo(overallDiv));
    } else if(day.icon.includes("Rain") || day.icon.includes("rain")){
      ($('<br><br><img src="images/rain.jpg" class = "itsImage"></img>').appendTo(overallDiv));
    } else if(day.icon.includes("Rain")){
      ($('<br><br><img src="images/rain.jpg" class = "itsImage"></img>').appendTo(overallDiv));
    }
      
          overallDiv.appendTo($("#weeks-weather"));
  })
  
}

function searchError(){
  console.log("error");
}

function checkIfRain(data){
  var rainAlert = $("<div />", {'class': 'rainAlert'});
  var rainAlertSpan = $("<span />");
  if(data.hourly.data[0].precipType==="rain" && data.hourly.data[0].precipProbability > .2){
    //alert("It's going to rain in the next hour!");

    rainAlertSpan.append("Rain alert in the next hour!");
    rainAlert.append(rainAlertSpan);
    rainAlert.prependTo("#search-results-weather");
  }else{
    rainAlert.empty();
  }

  Notification.requestPermission(function (permission) {
    // If the user accepts, let's create a notification
    if (permission === "granted") {
      if(data.hourly.data[0].precipType==="rain" && data.hourly.data[0].precipProbability>.2){
        var n = new Notification("Chance of rain in the next hour!");
        setTimeout(n.close.bind(n), 5000); // close the notification after 5s
      }
      
    }
  });



  return rainAlertSpan;
}





function loadSource(){
  var source;
  if(localStorage.source=="undefined"){
    source = "reuters";
  }else{
    source = JSON.parse(localStorage.source);
  }
  console.log("loading source");
  console.log(source);
  return source;
}

function loadUnits(){
  var units;
  if(localStorage.units=="undefined"){
    units = "si";
  }else{
    units = JSON.parse(localStorage.units);
  }
  console.log(units);
  return units;
}






