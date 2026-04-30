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



$(document).ready(function() {
  requestSearchNews();
  var loadedSource = loadSource();
  coords;

  if(navigator.geolocation !== undefined) { 
    //this code for finding the coordinates
    //is copied from the Lab 8 solution
    //https://thimble.mozilla.org/en-US/user/danielzenk/849643
    navigator.geolocation.getCurrentPosition(function(position) {
    coords = position.coords
    loadSource();
    requestSearchNews(loadedSource);
    })
      
  }
  
 
  
//  $("#news-button").click(function() {
//    console.log("news button clicked");
//    
//     
//  })
  
  
  
  setInterval(function() {
    requestSearchWeather(coords);
    requestSearchWeatherAside(coords);
    //checkIfRain();
    console.log("refreshed");
  }, 300000000);
  
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

function requestSearchNews(LoadedSource){
  $('#search-results').empty();
  var settings = {
    data: {
      source: source,
      apiKey: api_key,
      sortBy: "top"
    },
    success: searchSuccessNews,
    error: searchError
  }
  console.log(settings);
  console.log(news_endpoint);
  jQuery.ajax(news_endpoint, settings);

}

function searchSuccessNews(data, textStatus, jqHXR){
  requestSearchWeatherAside(coords);
  console.log("search success");
  console.log(data);
  var articles = data.articles;
  articles.forEach(function(article){
    var articleDiv = $("<div />", {'class': 'card4'})
    var articleHeaderDiv = $("<div />", {'class': 'articleHeader'})
    var title = $("<span class=\"card-title\">"+ article.title +"</span><hr><br>")
    var authorDiv = $("<div />", {'class': 'card-subtitle'});
    var titleRow = $("<div />", {'class': 'titleRow'})
    titleRow.append($("<span />", {html: article.title}))
    var image = $("<img />", {
      src: article.urlToImage
    })
    var author = $("<span />", {html: article.author});
    var descriptionDiv = $('<div class="card-text"/>');
    var imageAndAuthor = $("<div class=\"card-img-top\"/>");
    var descriptionSpan = $("<span />", {html: article.description});
    
    
    descriptionDiv.append(descriptionSpan);
    articleHeaderDiv.append(title);
    imageAndAuthor.append(image);
    authorDiv.append(author);
    imageAndAuthor.append(authorDiv);
    articleDiv.append(imageAndAuthor);
    articleDiv.append(articleHeaderDiv);
    articleDiv.append(descriptionDiv);
    articleDiv.appendTo($("#search-results"));
 
  })
  
  
}

function requestSearchWeatherAside(coordinates){
  console.log("in request for weather");
  //('#weather-aside').empty();
  var settings = {
    data: {
      units: units
    },
    success: searchSuccessWeatherAside,
    error: searchError
  }

  jQuery.ajax(weather_endpoint+weather_key+"/"+coordinates.latitude+","+coordinates.longitude, settings);

}

function searchSuccessWeatherAside(data, textStatus, jqHXR){
  var rainAlert = checkIfRain(data);
  console.log("in the weather");
  console.log(data);
  $("#weather-aside").empty();
  var weatherDiv = $("<div />", {'class': 'weatherDiv'});
  var currentTempDiv=$("<div />", {'class': 'currentTempDiv'});
  var currentTemp = $("<span />", {html: data.currently.temperature});
  var summary = $("<span />", {html: data.currently.summary});
  var windSpeedDiv = $("<div />", {'class': 'windSpeedDiv'});
  var windSpeed = $("<span />", {html: data.currently.windSpeed});
  
  windSpeedDiv.append($("<span>Winds reaching </span>"));
  windSpeedDiv.append(windSpeed);
  
  if(units==="si"){
    console.log("it is km");
    windSpeedDiv.append($("<span> kilometers an hour</span>"));
  }else{
    console.log("it is miles");
    windSpeedDiv.append($("<span> miles an hour</span>"));
  }
  currentTempDiv.append(currentTemp);
  console.log(units);
  console.log(units==="si");
  rainAlert.appendTo("#weather-aside");
  if(units==="si"){
    console.log("it is cel");
    currentTempDiv.append($("<span> ° celcius</span>"));
    currentTempDiv.appendTo($("#weather-aside"));
    $("<span> Winds reaching </span>").appendTo($("#weather-aside"));
    windSpeed.appendTo($("#weather-aside"));
    $("<span> kilometers an hour</span>").appendTo($("#weather-aside"));
  }else{
    console.log("it is fahr");
    currentTempDiv.append($("<span> ° fahrenheit</span>"));
    currentTempDiv.appendTo($("#weather-aside"));
    $("<span> Winds reaching </span>").appendTo($("#weather-aside"));
    windSpeed.appendTo($("#weather-aside"));
    $("<span> miles an hour</span>").appendTo($("#weather-aside"));
  }
  weatherDiv.append(summary);
  /*
  currentTempDiv.appendTo($("#search-results"));
  weatherDiv.appendTo($("#search-results"));
  windSpeedDiv.appendTo($("#search-results"));
  */
  checkIfRain(data);

}


function requestSearchWeather(coordinates){
  $('#search-results').empty();
  console.log("in request for weather");
  var settings = {
    data: {
      units: units
    },
    success: searchSuccessWeather,
    error: searchError
  }

  jQuery.ajax(weather_endpoint+weather_key+"/"+coordinates.latitude+","+coordinates.longitude+","+ Dateweather, settings);

}

function searchSuccessWeather(data, textStatus, jqHXR){
  console.log("in the weather");
  console.log(data);
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
  currentTempDiv.appendTo($("#search-results"));
  weatherDiv.appendTo($("#search-results"));
  windSpeedDiv.appendTo($("#search-results"));
  checkIfRain(data);

}


function searchError(){
  console.log("error");
}

function checkIfRain(data){
  var rainAlert = $("<div />", {'class': 'rainAlert'});
  var rainAlertSpan = $("<span />");
  if((data.hourly.data[0].precipType==="rain" && data.hourly.data[0].precipProbability > .2) || data.hourly.data[0].icon==="rain"){
    //alert("It's going to rain in the next hour!");

    rainAlertSpan.append("Rain alert in the next hour!");
    rainAlert.append(rainAlertSpan);
    rainAlert.prependTo("#search-results");
  }else{
    rainAlert.empty();
  }
  
  Notification.requestPermission(function (permission) {
    // If the user accepts, let's create a notification
    if (permission === "granted") {
      if((data.hourly.data[0].precipType==="rain" && data.hourly.data[0].precipProbability > .2) || data.hourly.data[0].icon==="rain"){
        var n = new Notification("Chance of rain in the next hour!");
        setTimeout(n.close.bind(n), 5000); // close the notification after 5s
      }
    }
    //the code for the 
    //notification above
    //was borrowed from lecture
  });
  
  
  
  return rainAlertSpan;
}





function loadSource(){
  var source;
  if(localStorage.source==="undefined"){
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
  if(localStorage.units==="undefined"){
    units = "si";
  }else{
    units = JSON.parse(localStorage.units);
  }
  console.log(units);
  return units;
}





