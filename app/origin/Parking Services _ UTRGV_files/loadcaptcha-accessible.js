    /*======================================
                 Insert ReCAPTCHA Generator
      ========================================*/
    // version: 1.0.1

    var onloadCallback = function() {

        function setReCaptchaAccessible(reCaptchaName, start) {
            if (!start) {
                start = performance.now()
            }
            var maxWait = 5000;
            var pause = 200;
            var now = performance.now();

            if (now < (start + maxWait)) {
                var iframeChallenge = document.querySelector("iframe[title='recaptcha challenge']")
                if (iframeChallenge) {
                    var iframes = Array.prototype.slice.call(document.querySelectorAll("#" + reCaptchaName + " iframe"));
                    iframes.push(iframeChallenge);
                    var attributes = ["frameborder", "height", "scrolling", "style", "width"]
                    iframes.forEach(function(iframe, index) {
                        iframe.id = reCaptchaName + "-" + (index + 1);
                        if (iframe.hasAttribute("title") === false) {
                            iframe.setAttribute("title", "recaptcha " + reCaptchaName + " iframe number " + (index + 1));
                        }

                        var removeStyle = !(iframe.hasAttribute("style") && iframe.style.cssText == "display: none;");
                        if (removeStyle === true) {
                            attributes.forEach(function(attr) {
                                if (iframe.hasAttribute(attr)) {
                                    iframe.removeAttribute(attr);
                                }
                            })
                        }
                    });
                    var textarea = document.getElementById("g-recaptcha-response");
                    textarea.setAttribute("aria-hidden", "true");
                    textarea.setAttribute("aria-label", "do not use");
                    textarea.setAttribute("aria-readonly", "true");
                } else {
                    setTimeout(function() {
                        setReCaptchaAccessible(reCaptchaName, start);
                    }, pause);
                }
            }
        }
        setReCaptchaAccessible(reCaptchaName);
    };

    //   <script async="" defer="" src="https://www.google.com/recaptcha/api.js?onload=onloadCallback"></script>
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://www.google.com/recaptcha/api.js?onload=onloadCallback";
    script.async = "";
    script.defer = "";
    document.head.appendChild(script);

    // <link href="recaptchaV2.css" rel="stylesheet" />
    var link = document.createElement("link");
    link.href = "//www.utrgv.edu/_internal/styles/recaptcha-v2.css";
    link.rel = "stylesheet";
    link.type = "text/css";
    document.head.appendChild(link);

    var reCaptchaName = "recaptchaV2";

    var recaptchaKey = "6LdFgQ0TAAAAACfPEQ7wFlQKOSpXjcIWBZ7Qg1Mw";
    recaptchaKey = "6LdFgQ0TAAAAACfPEQ7wFlQKOSpXjcIWBZ7Qg1Mw";
    $("form[action='https://webapps.utrgv.edu/it/emailer/api/forms/submit'],form[action='https://webapps.utrgv.edu/it/emailer/emaildelivery.cfm'], form[action='https://testwebapps.utrgv.edu/it/emailer/emaildelivery.cfm'], form[action='https://webapps.utrgv.edu/it/emailer/emaildelivery1.cfm'], form[action='https://devwebapps.utrgv.edu/it/emailer/emaildelivery1.cfm'], form[action='https://testwebapps.utrgv.edu/it/emailer/emaildelivery1.cfm']")
        .append('<div id="' + reCaptchaName + '" class="g-recaptcha" data-sitekey="' + recaptchaKey + '"></div>');

    var recpt = $("#" + reCaptchaName);
    recpt.prev().insertAfter(recpt);
    $("form[action='https://webapps.utrgv.edu/it/emailer/api/forms/submit'],form[action='https://webapps.utrgv.edu/it/emailer/emaildelivery.cfm'], form[action='https://testwebapps.utrgv.edu/it/emailer/emaildelivery.cfm'], form[action='https://webapps.utrgv.edu/it/emailer/emaildelivery1.cfm'], form[action='https://devwebapps.utrgv.edu/it/emailer/emaildelivery1.cfm'], form[action='https://testwebapps.utrgv.edu/it/emailer/emaildelivery1.cfm']").append('<label style="text-indent:-9999px;" for="g-recaptcha-response">Recaptcha</label>');


    // web form builder.