jQuery(document).ready(function($) {

	// Hiding the plain markers content on 768px or wider.
	var screencheck = window.matchMedia("(min-width: 768px)");
	if (screencheck.matches) {
		$('.mapMarkersContainer').addClass('hidden');
	}

});

$(document).ready(function(){
    //remove presentational attributes that are aunnaceptable by ne accessibility standards (diffucult to control, due to JCE editor's automatic addition of these)
    //$("iframe").removeAttr("frameborder");
    $("ul, li").removeAttr("type");
	$("*").removeAttr("border hspace topmargin rightmargin bottommargin leftmargin marginheight marginwidth bgcolor");
	$("hr, table, tr, td, th, thead, col, colgroup, p, ul, ol, li, a").removeAttr("width height valign align cellpadding cellspacing bordercolor frame rules nowrap size noshade");
	$("img").removeAttr("border vspace");
	$("br").removeAttr("clear");
    
    //replace the useful "align" presentational attributes added using jce editor (concentratin on images 1st, then text to avoid breating layouts using text wrapped around images)
    $("[align='center']").css("text-align", "center").removeAttr("align");
    $("img[align='left']").css("float", "left").removeAttr("align");
    $("img[align='right']").css("float", "right").removeAttr("align");
    $("img[align='middle']").css("vertical-align", "middle").removeAttr("align");
    
    //replace "align" presentational attributes for text alignment with css alternative
    $("[align='left']").css("text-align", "left").removeAttr("align");
    $("[align='right']").css("text-align", "right").removeAttr("align");
    $("[align='justify']").css("text-align", "justify").removeAttr("align");
    
    //replace ordered list "type" attributes by using css alternatives via the addition of classes 
    $("[type='1']").addClass("decimal").removeAttr("type");
    $("[type='a']").addClass("lower-alpha").removeAttr("type");
    $("[type='A']").addClass("upper-alpha").removeAttr("type");
    $("[type='i']").addClass("lower-roman").removeAttr("type");
    $("[type='I']").addClass("upper-roman").removeAttr("type");
    
    setTimeout(function () {
        $("iframe").removeAttr("frameborder allowtransparency");
        $("iframe[scrolling='no'], iframe[scrolling='']").removeAttr("scrolling");
        //console.log('bbb');
    }, 3000);
    
    $("h2").filter(function () {
        return $.trim($(this).html()) == '';
    }).remove();
    
    //add role to date picker to increase accessibility and fix content not included in landmarks
    $('#ui-datepicker-div').attr('role', 'complementary');
    
    
    
    
});