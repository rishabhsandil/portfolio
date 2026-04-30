$(document).ready(function () {



    $("ul").on("click", "li", function () {

        $(this).toggleClass("completed");


    });

    //DELETE ITEMS

    $("ul").on("click", "span", function (event) {
        $(this).parent().fadeOut(500, function () {
            $(this).remove();
        })
        event.stopPropagation();
    })


    //ADD ITEMS

    $("input[type='text']").keypress(function (event) {

        if (event.which === 13) {

            //grab the text
            var todoText = $(this).val();
            $(this).val("");
            //append to the list
            $("ul").append("<li><span><i class='fas fa-trash'></i></span> " + todoText + "</li>");


        }
    })

    $(".fa-plus-square").click(function(){

        $("input[type='text'").fadeToggle();

    })


});


