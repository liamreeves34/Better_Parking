// accessible-helper.js


// Remove side menu if no items exist in list
$(document).ready(function() {
    if ($('.sidebar-list li').length === 0) {
        $('nav.left-nav.nav-accessible').remove();
    }
});

// Remove department nav if menubar has no navigation items (fixes "Container element is empty" on role="list")
$(document).ready(function() {
    var $menubar = $('#menubar1');
    if ($menubar.length && $menubar.find('li:not(.visually-hidden)').length === 0) {
        $menubar.closest('nav').remove();
    }
});




// Increases manual accessibility by adding keyboard fuctionality

// Graduate College Apply button fix for "Link text used for multiple different destinations" issue
$("a.button.blue.apply").attr('aria-label', 'Apply now to the Graduate College');

// Check functionality
console.log("accessible-helper loaded");


///////////////////////////////
// Regular Template Components 



// Slideshow - Manually Accessible - adding aria-pressed attribute
// $(".carousel-play-stop button").click(function() {
//     $(".rotation.play").attr('aria-pressed', 'false')
//     $(".rotation.pause").attr('aria-pressed', 'true')
// });

$(".carousel-play-stop button").click(function() {
    $(".rotation.play").attr('aria-pressed', 'Stop Slideshow')
    $(".rotation.pause").attr('aria-pressed', 'Play Slideshow')
});





// Slideshow  

// SS Slideshow - WAVE and Manual fixes
$(document).ready(function () {
    // SS slider make each 1,2,3 circle link text the alternative text of the image. 
    altTextArr = [];
    $(".figure_slide ").each(function (index) {
        // altTextArr[index] = $(this.children[0].alt).selector;
        altTextArr[index] = $(this.children[0]).alt;
    });
    $('.ss-pager-item a').each(function (index) {
        $(this).text(altTextArr[index]);
    });
    // To do: if alt ="", or if using OWL Slider update the code. 
    var arrSize = altTextArr.length
    var val = $(document).attr('title')
    var myTitle = val.substr(val.indexOf("|") + 1)
    //console.log("size: "+arrSize)
    for (let i = 0; i < arrSize; i++) {
        //console.log("i: "+i)
        $('.figure_slide img[alt=""]').first().attr('alt', myTitle + (i + 1))
    }


    // set aria-selected attribute on active pager
    // $('.home_slider .ss-pager-link.active').attr('aria-current', true);
    // $('.home_slider').bind('DOMSubtreeModified', function(){
    //     $('.home_slider .ss-pager-link').removeAttr('aria-current');
    //     $('.home_slider .ss-pager-link.active').attr('aria-current', true);
    // })



});  // end document ready

// Checking on screen reader announcement of current active slide
$(".figure_slide").attr({
    // removing the tabindex from the slide <li> tags to help fix intuitive. 2.4.3 Focus Order
    //   'tabindex': 0
    //,
    //'aria-label': 'Slideshow slide'
});

//Slideshow pagination dot links - increasing manual accessibility
$('.ss-pager-link').attr({ 'aria-selected': false })

// Slideshow: screen reader announcement of current active slide.  Required: attrchange jQuery plugin to bind listener to active slide
$(".figure_slide").attrchange({
    trackValues: true, // set to true so that the event object is updated with old & new values
    callback: function (evnt) {
        if (evnt.attributeName == "class") { // which attribute you want to watch for changes
            if (evnt.newValue.search(/active-slide/i) == -1) { // "open" is the class name you search for inside "class" attribute
                //  $(".active-slide").attr({
                //     'aria-label': 'Slideshow active slide'
                // }); 

                //Slideshow pagination dot links - increasing manual accessitibilty
                //$('.ss-pager-link').attr({ 'aria-selected' : true})

            }
        }
    }
});




// TEST Temporarily disabling this as it constantly announces slides when testing top menu


// Slideshow adding aria to announce with screen reader for each automatic or manual slide change
//$(".ss-viewport").attr('aria-live', 'polite')

$(document).ready(function () {
    // Enables the screen reader to read each slide transition on automatic or manual slide change
    // $(".ss-viewport").attr('aria-live', 'polite')


    // Firefox focus fix adds hidden spans around button to not display focus indicator across the screen to the left as button is on the right side. 
    $(".ss-start").html('<span class="hidden" >Start</span>');
    $(".ss-stop").html('<span class="hidden" >Stop</span>');



    // IE11 fix adds hidden spans around Prev and Next slideshow controls
    $(".ss-prev").html('<span class="hidden" >Prev</span>');
    $(".ss-next").html('<span class="hidden" >Next</span>');




});


//  Navigation  

// Mobile nav toggle: sync aria-expanded with the open/closed state.
// small-menu.js toggles the .active class on the nav element; we mirror
// that state onto the toggle link's aria-expanded attribute so screen readers
// announce "expanded" / "collapsed" correctly.
$(document).ready(function () {
    var $navToggle = $('a.nav-toggle[aria-controls]');
    if ($navToggle.length) {
        $navToggle.on('click', function () {
            var isExpanded = $(this).attr('aria-expanded') === 'true';
            $(this).attr('aria-expanded', String(!isExpanded));
        });
    }
});


//Top Menu 
$("nav .list li a").removeAttr('title');
$("nav .list li > ul").parent().addClass('down-arrow');
$("nav .list li > ul li > ul").parent().addClass('right-arrow');
// $("nav .list li > ul").parent().attr('aria-expanded', 'false');
// $('.list ul:has(ul)').addClass('dropdown');
// $('.list ul:has(ul) ul').addClass('flyout');

// Get the element with the ID 'menubar1'
//const menuBar = document.getElementById('menubar1');
 
/* Check if the menuBar exists
if (menuBar) {
    // Get all list items within the menubar
    const listItems = menuBar.querySelectorAll('li');
 
    // Iterate through each list item
    listItems.forEach(item => {
        // Check if the current list item has a <ul> child
        if (item.querySelector('ul')) {
            // Add the class 'right-arrow'
            item.classList.add('right-arrow');
        }
    });
}*/

//Top Menu adding class to add accessibility enhancements
//$("nav").eq(2).attr('id', 'top-and-mobile');
//$("#top-and-mobile").addClass("nav-accessible nav-top");
//$("div.department-content nav.global-nav").addClass("nav-accessible nav-top");



// Top menu HTML fixes - Remove Empty UL tags, these do not include LI elements
/*$("ul").each(function () {
    if ($(this).find("li").length == 0) {
        $(this).remove();
        console.log("Fixing invalid HTML... unordered list with no list items removed");
    }
});*/

/* Top menu - Remove down and flyout arrow classes if child items do not exist
$("nav li.list-item").each(function () {
    var item = $(this).find("ul>li");
    if (item.length > 0) {
        // Remove any arrow class if child items exist
        $(this).removeClass("right-arrow down-arrow");  
    } else {
        // Add the arrow class if no child items exist
        $(this).addClass("right-arrow");  
    }
});*/

/*Top menu - Remove down and flyout arrow classes if child items do not exist
$(".list-item").each(function() {
    if ($(this).find('ul').length > 0) {
        $(this).addClass("right-arrow");
    }
});*/

/*$(".list-item").each(function() {
    // Check if the current list item has a submenu (nested ul)
    if ($(this).find('ul').length > 0) {
        // Add the 'right-arrow' class if a submenu is found
        $(this).addClass("right-arrow");
    }
});*/


// Top menu - Remove down and flyout arrow classes if child items do not exist
/*$(".global-nav li.list-item").each(function (index) {
    var item = $(this).find("ul>li")
    if (item.children().length > 0) {
        item.attr("class", "right-arrow");
    }
})*/

//testing top menu remove arrow classes
//var count = 0;
//$(".list-item.down-arrow").each(function(index){
//    //console.log($(this))
//    if($(this).children().length < 2){
//        count++;
//        console.log("Nav with no children: "+count)
//        $(this).removeClass("down-arrow")
//    }
//})


// Side menu 
$(".sidebar-link").removeAttr('title');
// $(".sidebar-list-item > ul").parent().attr('aria-expanded', 'false');




//Left Menu adding class to add accessibility enhancements
//$("div.left-nav").addClass("nav-accessible");  //div was changed to nav in format
$("nav.left-nav").addClass("nav-accessible");






// Mobile Menu
$("a.nav-toggle").attr("aria-label", "Main Menu click to expand or collapse mobile menu");

/*  commenting out to test
$("a.nav-toggle").on("click", function(){
    if($(this).hasClass("active")){
        $(this).attr("aria-expanded", "false")
    }
    else{
       $(this).attr("aria-expanded", "true") 
    }
})

*/




// Quicklinks

// Quick Links using spans
// $(".quicklinks a").keyup(function() {
//     $(this).parent().addClass("hover");   
// });
// $(".quicklinks a").keydown(function() {
//     $(this).parent().removeClass("hover");   
// });


// // Quick Links that are External  
// $(".quicklinks span").filter(function( index ) {
//     var url = $(this).find("a").attr('href');
//     if(!(url.toLowerCase().indexOf('utrgv') !== -1)){
//       $(this).addClass("external");
//     }
// });





// Quick Links using list items  
$(".striped li a").keyup(function () {
    $(this).parent().addClass("hover");
});
$(".striped li a").keydown(function () {
    $(this).parent().removeClass("hover");
});

// Quick Links that are External  
$("ul.check-list li").filter(function (index) {
    var url = $(this).find("a").attr('href');
    if (!(url.toLowerCase().indexOf('utrgv') !== -1)) {
        $(this).addClass("external");
    }
});


$("ul.check-list li a[href^='../'] ").removeClass('external')

if ($(".quicklinks a").attr("target", "_blank")) {
    $(this).attr("aria-label", function () { return $(this).attr("aria-label") + "Opens in a new window" });
}

// If quicklink anchor has class internal assign target self
$(".quicklinks a.internal").attr("target", "_self")





// Feature Cards
// Reset Features on keypress
// Increasing accessibility of feature cards by removing aria expanded on focus. 

$(".feature a").keyup(function (e) {
    // $(this).attr("aria-expanded", "true")
    $(this).parent().addClass("hover");
    var ftrText = $(this).find(".ftr-text-container").first()
    //    console.log(ftrText)
    /*if(e.key === "Escape" || e.key === "x" || e.key === "X"){
        ftrText.css({"bottom":"-100%", "margin-bottom":"50px" })
        ftrText.attr('tabindex', '-1').blur()
        $(this).attr("aria-expanded","false")
        //console.log($(this).find(".ftr-text-container").first())
        return;
    }*/
});

// Increasing accessibility of feature cards by removing aria expanded on anchor without focus. 
$(".feature a").keydown(function () {
    // $(this).attr("aria-expanded", "false")
    $(this).parent().removeClass("hover");
    $(".ftr-text-container").attr('style', '')
});


// Side Give and Social Media Links
$(".social-media-link").attr('aria-label', 'Donate now - Make a gift to UTRGV - give to UTRGV,  opens in a new window');



// Footer social media icons
$(".footer-social-media a").keyup(function () {
    $(this).parent().addClass("hover");
});
$(".footer-social-media a").keydown(function () {
    $(this).parent().removeClass("hover");
});



// Jump to Top



// Tabs



// Accordion
//aria-selected fix
$("button.js-accordion__header").on("click", function () {
    if ($(this).attr("aria-expanded") == "true") {
        $(this).attr("aria-selected", "true")
    } else {
        $(this).attr("aria-selected", "false")
    }

})

// Fix to state or property not supported issue on accordion buttons
$(".js-accordion__header").removeAttr("aria-selected");



//Modals

// Staff Layout 
// $("div.profile.clickable").attr("aria-expanded", "false")
$("div.profile.clickable").on("keydown", function () {

    var currDiv = $(this)
    // $(this).attr("aria-expanded", "true")
    var modalid = $(this).attr("data-target")
    console.log(modalid);
    // #myModal62                           
    // shown for first box on https://testwww.utrgv.edu/mao/team/index.htm

    // $("#myModal62").modal('show')        
    // works in devtools as one line to show modal
    $("modalid").modal('show')

    var btn = $(modalid).find(".btn.btn-primary")
    btn.on("click", function () {
        currDiv.attr("aria-expanded", "false")

    })

})
//fix for modal keyboard Accessibility
$("div.profile.clickable").on("keypress", function () {
    let modal = $(this).attr("data-target")
    //console.log(modal)
    $(modal).modal('show')
})

//adding dynamic aria expanded attribute on profile boxes
// $("div.profile").attr("aria-expanded", "false")
$("div.profile").on("click", function () {
    var element = $(this)
    // $(this).attr("aria-expanded", "true")
    $(this).focusin(function () {
        // element.attr("aria-expanded", "false")
    })
})

// Changing the aria-hidden value to false if opened or true if closed.
$('.modal').on('shown.bs.modal', function () {
    $(this).attr('aria-hidden', 'false');
});
$('.modal').on('hidden.bs.modal', function () {
    $(this).attr('aria-hidden', 'true');
});

// Adding the opens in a new window aria label
$(document).ready(function () {
    $("#main-right-column a[target*=_blank]").each(function (_, el) {
        var currentAriaLabel = (el.attributes["aria-label"] || {}).value || $(el).text().trim();
        if (currentAriaLabel.includes('new window')) {
            return;
        }
        const applyLabel = function (label) {
            el.setAttribute("aria-label", label + ", opens in a new window");
        };

        if (currentAriaLabel.includes(', opens in a new tab')) {
            el.setAttribute("aria-label", currentAriaLabel.replace('new tab', 'new window'));
            return;
        }

        if (el.title !== "") {
            applyLabel(el.title);
            return;
        }

        // Set text of the link as aria label
        var linkText = $(el).text().trim();
        if (linkText !== "") {
            applyLabel(linkText);
            return;
        }

        // Set an alt of inner image as a aria label
        var childImage = el.querySelector("img");
        if (childImage) {
            applyLabel(childImage.alt);
            return;
        }
        applyLabel(currentAriaLabel);
    });
    
    // remove title attribute
    $("#main-right-column a").each(function (_, el) {
        if( el.attributes['title'] && el.attributes["aria-label"] ) {
            el.removeAttribute('title');
        }
    });
});