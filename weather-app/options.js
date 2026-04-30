$(document).ready(function() {
    
    
    saveSource("reuters");
    saveUnits("si");

  $("#reuters-option").click(function() {
    saveSource("reuters");
      $('.selected').removeClass('selected');
      $("#reuters-option").addClass('selected');
  })

  $("#time-option").click(function() {
    saveSource("time");
      $('.selected').removeClass('selected');
      $("#time-option").addClass('selected');
  })

  $("#cnn-option").click(function() {
    saveSource("cnn");
      $('.selected').removeClass('selected');
      $("#cnn-option").addClass('selected');
  })

  $("#ap-option").click(function() {
    saveSource("associated-press");
      $('.selected').removeClass('selected');
      $("#ap-option").addClass('selected');
  })
  
  $("#breit-option").click(function() {
    saveSource("breitbart-news");
      $('.selected').removeClass('selected');
      $("#breit-option").addClass('selected');
  })
  
  $("#independent-option").click(function() {
    saveSource("independent");
      $('.selected').removeClass('selected');
      $("#independent-option").addClass('selected');
  })
  
  $("#usatoday-option").click(function() {
    saveSource("usa-today");
      $('.selected').removeClass('selected');
      $("#usatoday-option").addClass('selected');
  })
  
  $("#washpost-option").click(function() {
    saveSource("the-washington-post");
      $('.selected').removeClass('selected');
      $("#washpost-option").addClass('selected');
  })
  
  $("#tnw-option").click(function() {
    saveSource("the-next-web");
      $('.selected').removeClass('selected');
      $("#tnw-option").addClass('selected');
  })
  
  $("#sky-option").click(function() {
    saveSource("sky-news");
      $('.selected').removeClass('selected');
      $("#sky-option").addClass('selected');
  })
            
  $("#imp-units").click(function() {
    saveUnits("us"); 
      $('.selected2').removeClass('selected2');
      $("#imp-units").addClass('selected2');
  })
  
  $("#si-units").click(function() {
    saveUnits("si"); 
      $('.selected2').removeClass('selected2');
      $("#si-units").addClass('selected2');
  })
  
  $("#weather-button").click(function() {
    saveOption("weather");
  })
  
  $("#news-button").click(function() {
    saveOption("news");
  })
  
  
})


function saveOption(option){
  localStorage.option = JSON.stringify(option);
  console.log("Saved option");
    
}

function saveSource(source){
  localStorage.source = JSON.stringify(source);
}

function saveUnits(units){
  localStorage.units = JSON.stringify(units);
  
}
