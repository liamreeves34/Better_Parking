/*
* Increasing Accessibility
* 
* EasyAjax_Form Script
* 
* Copyright 2009 John Stevens.  
*
* Themeforest.net: 
* http://themeforest.net/item/easyajax_form/57497
*
* Requires jQuery 1.3+
*
* version 5.5
*
* -----------------------------------------------------------------------------------------------
*
* This form validation code piece has been customized to use jquery 1.7 remotely.
*
* This file has been modified to serve Spanish validation messages if this page is included in the ES-ES folder 
* and English validation messages if the page is included in a different folder. 
*/

//remove captcha on other forms if form being sumbitted has no captcha
$("input[type='submit']").click(function () {
  if (!($(this).siblings('.g-recaptcha').length)) {
    //alert('this form has NO captcha');
    $('.g-recaptcha').remove();
  }
});


var hasShownAlertAlready = false;


function showAlert(text) {
  if (!hasShownAlertAlready)
    alert(text);
  hasShownAlertAlready = true;
}


EasyAjax_Form = function () {

  /*Configuration Options*/

  var config = {};

  if (window.location.href.indexOf("es-es") > -1) {
    // alert("your url contains the name es-es");
    // }

    // if($("#spa").length){
    config = {
      errorMsgs: {
        required: 'Campo obligatorio.',
        email: 'Porfavor ingresa un correo valido.',
        phone: 'Ejemplo: (956) 928-5000.',
        lengthInput: 'Menos de 50 characteres para este campo.',
        lengthText: 'Menos de 50000 characteres para este campo.',
        ruHuman: 'Incorrect single digit number',
        ajaxTimeout: 'Ocurrio un error al guardar tu solicitud, porfavor intenta de nuevo.' +
          'Si este problema persiste, porfavor intenta de nuevo mas tarde.'
      },
      ruHuman: {
        answer: '4'
      },
      fades: {
        validation: 200, /*The time it takes validation messages to fade in.*/
        ajax: 500 /*The time it takes ajax communicaiton to fade in and out.*/
      },
      ajaxTimers: {
        pause: 2000, /*Ajax message sent to server is delayed by this amount.*/
        timeout: 10000 /*Will return the ajax_timeout error message if no server response in this amount of time*/
      },
      valClasses: { /*Customize the class names used in the HTML that will trigger Validation actions in this script.*/
        requiredField: 'REQUIRED',
        emailField: 'EMAIL',
        phoneField: 'PHONE',
        charLengthInput: 'LENGTH_INPUT',  /*Default is 50 characters, useful for regular input fields*/
        charLengthText: 'LENGTH_TEXT',    /*Useful for text areas.  Default is 5000 characters (about 800 words) */
        optionalField: 'OPTIONAL',
        ruHumanField: 'RU_HUMAN'
      },
      formClasses: {   /*Customize the class names used in the HTML that will trigger Ajax actions in this script*/
        validateOnly: 'VALIDATE',
        ajaxOnly: 'AJAX',
        disable: 'DISABLE',
        choose: 'CHOOSE'
      },
      cssSelectors: { /*Customize class & ID names used in the CSS file.  Make sure to update the CSS file if you change these*/
        validationPass: 'PASS',
        validationFail: 'FAIL',
        ajaxLoading: '#FORM_LOAD', /* # needed as it is used as a jQuery selector in this script, this is an ID.*/
        ajaxTimeout: "AJAX_TIMEOUT", /*Reccomend keep double quotes*/
        ajaxResponse: "AJAX_RESPONSE" /*Reccomend keep double quotes*/
      },
      regExps: { /*Contains regular expressions used later in the script*/
        email: /^\w+([\.\-]?\w+)*@\w+([\.\-]?\w+)*(\.\w{2,3})+$/,
        phone: /^\(?(\d{3})\)?[\.\-\/ ]?(\d{3})[\.\-\/ ]?(\d{4})$/
      },
      charLimit: {
        input: 50,
        textArea: 5000
      }
    };

  } else {

    config = {
      errorMsgs: {
        required: 'Error. This is a required field.',
        email: 'Error. Please enter a valid email.',
        phone: 'Error. Please enter a valid phone number. Example: (956) 928-5000.',
        lengthInput: '50 or fewer characters for this field.',
        lengthText: '5000 or fewer characters for this field.',
        ruHuman: 'Incorrect single digit number',
        ajaxTimeout: 'An error occurred when saving your request, please try again.' +
          'If this problem persists, please try again later.'
      },
      ruHuman: {
        answer: '4'
      },
      fades: {
        validation: 200, /*The time it takes validation messages to fade in.*/
        ajax: 500 /*The time it takes ajax communicaiton to fade in and out.*/
      },
      ajaxTimers: {
        pause: 2000, /*Ajax message sent to server is delayed by this amount.*/
        timeout: 10000 /*Will return the ajax_timeout error message if no server response in this amount of time*/
      },
      valClasses: { /*Customize the class names used in the HTML that will trigger Validation actions in this script.*/
        requiredField: 'REQUIRED',
        emailField: 'EMAIL',
        phoneField: 'PHONE',
        charLengthInput: 'LENGTH_INPUT',  /*Default is 50 characters, useful for regular input fields*/
        charLengthText: 'LENGTH_TEXT',    /*Useful for text areas.  Default is 5000 characters (about 800 words) */
        optionalField: 'OPTIONAL',
        ruHumanField: 'RU_HUMAN'
      },
      formClasses: {   /*Customize the class names used in the HTML that will trigger Ajax actions in this script*/
        validateOnly: 'VALIDATE',
        ajaxOnly: 'AJAX',
        disable: 'DISABLE',
        choose: 'CHOOSE'
      },
      cssSelectors: { /*Customize class & ID names used in the CSS file.  Make sure to update the CSS file if you change these*/
        validationPass: 'PASS',
        validationFail: 'FAIL',
        ajaxLoading: '#FORM_LOAD', /* # needed as it is used as a jQuery selector in this script, this is an ID.*/
        ajaxTimeout: "AJAX_TIMEOUT", /*Reccomend keep double quotes*/
        ajaxResponse: "AJAX_RESPONSE" /*Reccomend keep double quotes*/
      },
      regExps: { /*Contains regular expressions used later in the script*/
        email: /^\w+([\.\-]?\w+)*@\w+([\.\-]?\w+)*(\.\w{2,3})+$/,
        phone: /^\(?(\d{3})\)?[\.\-\/ ]?(\d{3})[\.\-\/ ]?(\d{4})$/
      },
      charLimit: {
        input: 50,
        textArea: 5000
      }
    };

  }



  /*
   * I use the jQuery $.each function for looping in this script.  I find it easier to read and work with
   * and it does all the necessary type checking, etc behind the scenes.  In my mind it is well worth the 
   * slightly, slightly, slightly slower processing.  In my experience I've seen no perceptible performance 
   * difference. 
   *
   * See the following url for more information on $.each : 
   * http://docs.jquery.com/Utilities/jQuery.each
   */

  /*
   * General Helper Functions
   */

  // function appendSpan(allFields) {   /*Appends an empty span element after each form field found in the HTML*/
  // 	$.each(allFields, function (i, field) {     
  // 		$('<span class="validation-message"></span>').insertAfter(this);		 			 
  // 	});
  // }

  // Generate Unique IDs for Error Messages
  function appendSpan(allFields) {
    $.each(allFields, function (i, field) {

      var fieldId = $(field).attr('id');

      if (!fieldId) {
        return;
      }

      var errorId = 'error-' + $(field).attr('id');
      // $('<span class="validation-message" id="' + errorId + '" aria-live="polite"></span>').insertAfter(this);
      //   $('<span class="validation-message" id="' + errorId + '"></span>')
      $('<span class="validation-message" id="' + errorId + '"></span>')
        .insertAfter(this);
    });
  }

  function hasClassArray_maker(currentField, formLevel) { /*Populates the HasClass Array for a given form field when needed.*/
    var hasClassArray = [],
      Classes = config.valClasses,
      j = 0;
    if (formLevel) { /*Makes the second paramenter optional. Is passed true from the init function, null for validation uses*/
      Classes = config.formClasses;
    }
    $.each(Classes, function (k, currentClass) {
      if ($(currentField).hasClass(currentClass)) {
        hasClassArray[j] = currentClass;
        j = j + 1;
      }
    });
    return hasClassArray;
  }

  function fieldProperty_maker(currentField) {
    var valTypes = config.valClasses,  /*The keys of valClasses object will describe all possible field properties*/
      fieldProperties = {};
    $.each(valTypes, function (l, currentType) {
      fieldProperties[l] = false;
    });
    return fieldProperties;
  }

  function calcFieldProperties(fieldProperties, hasClassArray) { /*Based on classes present, determines what validation is indicated*/
    $.each(hasClassArray, function (m, currentClass) {
      switch (currentClass) {
        case config.valClasses.emailField:
          fieldProperties.emailField = true;
          break;
        case config.valClasses.requiredField:
          fieldProperties.requiredField = true;
          break;
        case config.valClasses.phoneField:
          fieldProperties.phoneField = true;
          break;
        case config.valClasses.charLengthInput:
          fieldProperties.charLengthInput = true;
          break;
        case config.valClasses.charLengthText:
          fieldProperties.charLengthText = true;
          break;
        case config.valClasses.ruHumanField:
          fieldProperties.ruHumanField = true;
          break;
        default:
          break;
      }
    });
    return fieldProperties;
  }
  function boolObjDecoder(boolObj, retFalseIf) { /*Returns false if any value in the object is equal to the second paramenter (true or false)*/
    var x = 0;
    $.each(boolObj, function (p, currentBool) {
      var booleanKeepGoing;
      if (currentBool === retFalseIf) {
        x = 1;
        booleanKeepGoing = false;
      }
    });
    if (x === 1) {
      return false;
    }
    return true;
  }
  /*
     * Ajax Helper Functions
     */

  function ajaxError(daddy, thisForm) {  /*Is called in the case of a timeout error*/
    $(config.cssSelectors.ajaxLoading).fadeOut(config.fades.ajax / 4, function () {
      $(this).remove();
    });
    $('<div id="Response">' +
      '<p class=' + config.cssSelectors.ajaxTimeout + '>' + config.errorMsgs.ajaxTimeout + '</p>' +
      '</div>').hide().appendTo(daddy).fadeIn(config.fades.ajax);
    $('<div id="Refresh">' +
      '<p><a href ="#">Click here</a> to re-enter form information.</p>' +
      '</div>').hide().appendTo(daddy).fadeIn(config.fades.ajax);
    $('#Refresh').click(function () {
      $('#Response, #Refresh').fadeOut(config.fades.ajax / 2, function () {
        $('#Response, #Refresh').remove();
        $(thisForm).fadeIn(config.fades.ajax / 2);
      });
      return false;
    });
    return true;
  }
  function ajaxSuccess(serverResponse, daddy, thisForm) {
    $(config.cssSelectors.ajaxLoading).fadeOut(config.fades.ajax / 4, function () {
      $(this).remove();
    });
    $('<div id="Response">' +
      '<p class=' + config.cssSelectors.ajaxResponse + '>' + serverResponse + '</p>' +
      '</div>').hide().appendTo(daddy).fadeIn(config.fades.ajax);
    $('<div id="Refresh">' +
      //'<p><a href ="#">Click Here</a> to re-enter form information.</p>' + 
      '<br /> <br /> <br /> <br /> <br /> <br />' +
      '</div>').hide().appendTo(daddy).fadeIn(config.fades.ajax);
    $('#Refresh').click(function () {
      $('#Response, #Refresh').fadeOut(config.fades.ajax / 2, function () {
        $('#Response, #Refresh').remove();
        $(thisForm).fadeIn(config.fades.ajax / 2);
      });
      return false;
    });
    return true;
  }

  /*
   * Validation Helper Functions
   */



  // aria-describedby: Associates the error message with the form field.
  // role="alert": Ensures the error message is announced by screen readers immediately.
  // aria-invalid: Indicates the field has a validation error.
  function requiredValidator(currentField, input) {
    var thisError = config.errorMsgs.required,
      hasReqErr = false;
    if (input === '') {
      $(currentField).next().removeClass(config.cssSelectors.validationPass);
      $(currentField).next().hide().addClass(config.cssSelectors.validationFail)
        .text(thisError).attr('role', 'alert').fadeIn(config.fades.validation);
      $(currentField).attr('aria-describedby', $(currentField).next().attr('id'));
      $(currentField).attr('aria-invalid', 'true');
      // $(currentField).focus(); // Move focus to the invalid field
      hasReqErr = true;
    } else {
      // $(currentField).removeAttr('aria-invalid');
      $(currentField)
        .removeAttr('aria-invalid')
        .removeAttr('aria-describedby');
    }
    return hasReqErr;
  }



  // increasing accessibility by adding aria-describedby, role="alert", and aria-invalid attributes

  function emailValidator(currentField, input) {
    var thisError = config.errorMsgs.email,
      hasEmailErr = false,
      reEmail = config.regExps.email;
    if (!input)
      return false;
    if (!reEmail.test(input)) {
      $(currentField).next().removeClass(config.cssSelectors.validationPass);
      $(currentField).next().hide().addClass(config.cssSelectors.validationFail)
        .text(thisError).attr('role', 'alert').fadeIn(config.fades.validation);
      $(currentField).attr('aria-describedby', $(currentField).next().attr('id'));
      $(currentField).attr('aria-invalid', 'true');
      hasEmailErr = true;
    } else {
      //   $(currentField).removeAttr('aria-invalid');
      $(currentField)
        .removeAttr('aria-invalid')
        .removeAttr('aria-describedby');
    }
    return hasEmailErr;
  }



  function phoneValidator(currentField, input) {
    var thisError = config.errorMsgs.phone,
      hasPhoneErr = false,
      rePhone = config.regExps.phone;
    if (!input)
      return false;
    if (!rePhone.test(input)) {
      $(currentField).next().removeClass(config.cssSelectors.validationPass);
      $(currentField).next().hide().addClass(config.cssSelectors.validationFail)
        .text(thisError).attr('role', 'alert').fadeIn(config.fades.validation);
      $(currentField).attr('aria-describedby', $(currentField).next().attr('id'));
      $(currentField).attr('aria-invalid', 'true');
      // $(currentField).focus(); // Move focus to the invalid field
      hasPhoneErr = true;
    } else {
      // $(currentField).removeAttr('aria-invalid');
      $(currentField)
        .removeAttr('aria-invalid')
        .removeAttr('aria-describedby');
    }
    return hasPhoneErr;
  }



  function inputLengthValidator(currentField, input) {
    var thisError = config.errorMsgs.lengthInput,
      hasInputLengthErr = false;
    if (input.length > config.charLimit.input) {
      $(currentField).next().removeClass(config.cssSelectors.validationPass);
      $(currentField).next().hide().addClass(config.cssSelectors.validationFail).
        text(thisError).fadeIn(config.fades.validation);
      hasInputLengthErr = true;
    }
    return hasInputLengthErr;
  }
  function textLengthValidator(currentField, input) {
    var thisError = config.errorMsgs.lengthText,
      hasTextLengthErr = false;
    if (input.length > config.charLimit.textArea) {
      $(currentField).next().removeClass(config.cssSelectors.validationPass);
      $(currentField).next().hide().addClass(config.cssSelectors.validationFail).
        text(thisError).fadeIn(config.fades.validation);
      hasTextLengthErr = true;
    }
    return hasTextLengthErr;
  }
  function ruHumanValidator(currentField, input) {
    var thisError = config.errorMsgs.ruHuman,
      hasRuHumanErr = false;
    if (input !== config.ruHuman.answer) {
      $(currentField).next().removeClass(config.cssSelectors.validationPass);
      $(currentField).next().hide().addClass(config.cssSelectors.validationFail).
        text(thisError).fadeIn(config.fades.validation);
      hasRuHumanErr = true;
    }
    return hasRuHumanErr;
  }
  function fieldValidator(fieldProperties, input, currentField) {  /*This function is called by the Main Functions (below) and in turn calls the specific validation types (above)*/
    var errorObject = {};
    errorObject = {
      requiredError: false,
      emailError: false,
      phoneError: false,
      inputLengthError: false,
      textLengthError: false,
      ruHumanError: false
    };
    if (fieldProperties.requiredField) {
      errorObject.requiredError = requiredValidator(currentField, input);
      if (errorObject.requiredError) {
        return errorObject;
      }
    }
    if (fieldProperties.emailField) {
      errorObject.emailError = emailValidator(currentField, input);
      if (errorObject.emailError) {
        return errorObject;
      }
    }
    if (fieldProperties.phoneField) {
      errorObject.phoneError = phoneValidator(currentField, input);
      if (errorObject.phoneError) {
        return errorObject;
      }
    }
    if (fieldProperties.charLengthInput) {
      errorObject.inputLengthError = inputLengthValidator(currentField, input);
      if (errorObject.inputLengthError) {
        return errorObject;
      }
    }
    if (fieldProperties.charLengthText) {
      errorObject.textLengthError = textLengthValidator(currentField, input);
      if (errorObject.textLengthError) {
        return errorObject;
      }
    }
    if (fieldProperties.ruHumanField) {
      errorObject.ruHumanError = ruHumanValidator(currentField, input);
      if (errorObject.ruHumanError) {
        return errorObject;
      }
    }
    return errorObject;
  }
  function greenChecker(currentField) { /*Adds a green check if validation passes*/
    $(currentField).next().removeClass('FAIL');
    if ($(currentField).next().hasClass("PASS")) {
      return;
    }
    $(currentField).next().hide().addClass("PASS").text('').fadeIn(config.fades.validation);
  }


  /*
   * Main Functions
   */
  function validate_onBlur(formID, allInputs) {

    $(allInputs).blur(function () {

      var allValClasses = {},
        currentField = this,
        input = $(currentField).val(),
        blankOptInput = false,
        hasClassArray = [],
        fieldProperties = {},
        validationTracker = {},
        validationResults = true;

      allValClasses = config.valClasses;

      hasClassArray = hasClassArray_maker(currentField);

      fieldProperties = fieldProperty_maker(currentField);

      if (
        input === '' &&
        $(currentField).hasClass(config.valClasses.optionalField)
      ) {
        blankOptInput = true;
      }


      //   Fixing to Keep the focus-trap fix and change the required field validation so it runs on submit rather than on blur.

      if (hasClassArray.length !== 0) {

        fieldProperties = calcFieldProperties(
          fieldProperties,
          hasClassArray
        );

        if (!blankOptInput) {

          if (
            input === '' &&
            fieldProperties.requiredField
          ) {

            $(currentField).next()
              .removeClass("PASS FAIL")
              .text('')
              .hide();

            validationResults = false;

          } else {

            validationTracker = fieldValidator(
              fieldProperties,
              input,
              currentField
            );

            validationResults = boolObjDecoder(
              validationTracker,
              true
            );

          }

        }

      }

      if (
        validationResults &&
        input !== ''
      ) {
        greenChecker(currentField);
      }

    });  

  }     


  function validate_onSubmit(formID, allFields) { /*See the validate_onBlur function for more notes. Only new stuff is noted here.*/
    $(formID).submit(function () {



      var allValClasses = {},
        allGood = [], /*Will be populated with booleans for each field. If all true, the form passes validation*/
        formValid = false;
      allValClasses = config.valClasses;
      $.each(allFields, function (r, currentField) { /*For each form field, do the following (run validation)*/
        var input = $(currentField).val(),
          blankOptInput = false,
          hasClassArray = [],
          fieldProperties = {},
          validationTracker = {},
          validationResults = true;
        allGood[r] = false;
        hasClassArray = hasClassArray_maker(currentField);
        fieldProperties = fieldProperty_maker(currentField);
        if (input === '' && $(currentField).hasClass(config.valClasses.optionalField)) {
          blankOptInput = true;
        }
        if (hasClassArray.length !== 0) {
          fieldProperties = calcFieldProperties(fieldProperties, hasClassArray);
          if (!blankOptInput) {
            validationTracker = fieldValidator(fieldProperties, input, currentField);
          }
          validationResults = boolObjDecoder(validationTracker, true);
        }
        if (validationResults) { /*if true, give a green check to this field*/
          allGood[r] = true;
          greenChecker(currentField);
        }
      });
      formValid = boolObjDecoder(allGood, false);


console.log('formValid =', formValid);

      if (!formValid) {

console.log('Entered invalid block');

        // var firstInvalid = $('[aria-invalid="true"]').first();

        var firstInvalid = $(
            'input[aria-invalid="true"], ' +
            'select[aria-invalid="true"], ' +
            'textarea[aria-invalid="true"]'
        ).first();

console.log(
    'Invalid controls:',
    $('[aria-invalid="true"]').length
);

console.log(
    $('[aria-invalid="true"]')
);

if (firstInvalid.length) {

    console.log(
        'First invalid:',
        firstInvalid.prop('tagName'),
        firstInvalid.attr('id'),
        firstInvalid[0]
    );

}


        if (firstInvalid.length) {

            if (firstInvalid.is('fieldset')) {

                firstInvalid
                    .find('input[type="radio"], input[type="checkbox"]')
                    .first()
                    .focus();

            } else {

                firstInvalid.focus();

 console.log(
    'Focused element:',
    document.activeElement
);

            }

        }

      }

      if (grecaptcha.getResponse() == "")
        formValid = false;

      if (formValid) {
        return true;
      }
      $(document).trigger('formerror');

      if (window.location.href.indexOf("es-es") > -1) {

        showAlert("Porfavor asegurate de que todos los campos obligatorios hayan sido ingresados correctamente.");

      } else {
        showAlert("Please make sure that all required fields are filled in correctly.");

      }
      hasShownAlertAlready = false;
      return false;
    });

  }
  function ajaxOnly(formID, allFields) {
    $("" + formID + "").submit(function () {

      var thisForm = this,
        toFile = this.action,
        daddy = $(this).parent(),
        dataString = $(this).serialize();  /*jQuery function to make form data as portable as possible*/
      $(thisForm).fadeOut(config.fades.ajax, function () {
        $("<div id='FORM_LOAD'/>").hide().appendTo(daddy).show();
      });
      $.ajax({
        type: "post",
        url: toFile,
        data: dataString,
        timeout: config.ajaxTimers.timeout,
        error: function (XMLHttpRequest, timeout) { /*Run the following in the event of a timeout error*/
          setTimeout(function () {
            ajaxError(daddy, thisForm);
          }, config.fades.ajax + 10);  /*Timeout here to take the fade into account, otherwise the loading div may not be removed*/
        },
        success: function (serverResponse) {
          setTimeout(function () { /*Response function delayed in order to show the loading icon for a perceptible amount of time*/
            ajaxSuccess(serverResponse, daddy, thisForm);
          }, config.fades.ajax + config.ajaxTimers.pause);
        }
      });
      hasShownAlertAlready = false;
      return false;
    });
  }
  function validatePlusAjax_onSubmit(formID, allFields) { /*See the above main functions for more notes, only new stuff is noted here.*/
    $(formID).submit(function () {

      var allValClasses = {},
        allGood = [],
        formValid = false,
        thisForm = this, /*Start: Ajax Variables*/
        toFile = this.action,
        daddy = $(this).parent(),
        dataString = $(this).serialize(); /*End: Ajax Variables*/
      allValClasses = config.valClasses;
      $.each(allFields, function (r, currentField) {
        var input = $(currentField).val(),	 /*Start: Validation variables*/
          blankOptInput = false,
          hasClassArray = [],
          fieldProperties = {},
          validationTracker = {},
          validationResults = true; /*End: Validation variables*/
        allGood[r] = false;
        hasClassArray = hasClassArray_maker(currentField);
        fieldProperties = fieldProperty_maker(currentField);
        if (input === '' && $(currentField).hasClass(config.valClasses.optionalField)) {
          blankOptInput = true;
        }
        if (hasClassArray.length !== 0) {
          fieldProperties = calcFieldProperties(fieldProperties, hasClassArray);
          if (!blankOptInput) {
            validationTracker = fieldValidator(fieldProperties, input, currentField);
          }
          validationResults = boolObjDecoder(validationTracker, true);
        }
        if (validationResults) { /*if true, give a green check to this field*/
          allGood[r] = true;
          greenChecker(currentField);
        }
      });
      formValid = boolObjDecoder(allGood, false);


      console.log('formValid =', formValid);

      if (!formValid) {

        console.log('Entered invalid block');

          var firstInvalid = $(
              'input[aria-invalid="true"], ' +
              'select[aria-invalid="true"], ' +
              'textarea[aria-invalid="true"]'
          ).first();

          console.log(
          'Invalid controls:',
          $('[aria-invalid="true"]').length
          );

          console.log(
              'First invalid:',
              firstInvalid.prop('tagName'),
              firstInvalid.attr('id')
          );

          if (firstInvalid.length) {
              firstInvalid.focus();

 console.log(
    'Focused element:',
    document.activeElement
);
          }
      }


      if (formValid) {
        $(thisForm).fadeOut(config.fades.ajax, function () {
          $("<div id='FORM_LOAD'/>").hide().appendTo(daddy).show();
        });
        $.ajax({
          type: "POST",
          url: toFile,
          data: dataString,
          timeout: config.ajaxTimers.timeout,
          error: function (XMLHttpRequest, timeout) {
            setTimeout(function () {
              ajaxError(daddy, thisForm);
            }, config.fades.ajax + 10);
          },
          success: function (serverResponse) {
            setTimeout(function () {
              ajaxSuccess(serverResponse, daddy, thisForm);
            }, config.fades.ajax + config.ajaxTimers.pause);
          }
        });
      }
      hasShownAlertAlready = false;
      return false;
    });

  }

  /*
   * Class Reader Functions: <form> Element
   *
   * These read the class attribute of the <form> tag to determine which
   * main functions above will be utilized.
   */

  function chooseID(formID) {  /*Called in the case where the user chooses the form by ID*/
    var allFields;
    if (formID) {
      formID = '#' + formID;
    } else {
      formID = "form";
    }
    allFields = $('' + formID + ' :input:not(:submit):not(:button):not(:image)');
    if ($(formID).hasClass(config.formClasses.validateOnly)) {
      validate_onBlur(formID, allFields);
      validate_onSubmit(formID, allFields);
      return;
    } else if ($(formID).hasClass(config.formClasses.ajaxOnly)) {
      ajaxOnly(formID, allFields);
      return;
    } else {
      validate_onBlur(formID, allFields);
      validatePlusAjax_onSubmit(formID, allFields);
      return;
    }
  }



  function init() {
    var formID = "form";

    $.each($(formID), function (i, f) {
      var allFields = $(f).find(':input:not(:submit):not(:button):not(:image)');
      appendSpan(allFields); /*If you are using Ajax Only, this line can be deleted.*/
      if ($(f).hasClass(config.formClasses.disable)) {
        return;
      } else if ($(f).hasClass(config.formClasses.choose)) {
        return;
      } else if ($(f).hasClass(config.formClasses.validateOnly)) {
        validate_onBlur(f, allFields);
        validate_onSubmit(f, allFields);
        return;
      } else if ($(f).hasClass(config.formClasses.ajaxOnly)) {
        ajaxOnly(f, allFields);
        return;
      } else {
        validate_onBlur(f, allFields);
        validatePlusAjax_onSubmit(f, allFields);
        return;
      }
    });


  }

  /*
   * EA_Form Public Pointers
   *
   * These pointers are used for access from the outside. 
   * Notice the name changes for outside access.
   */

  return {
    CustomMessages: config.errorMsgs,
    CustomFades: config.fades,
    CustomTimers: config.ajaxTimers,
    CustomCharLimits: config.charLimit,
    Go: init,
    ByID: chooseID
  };
}(); /*End EasyAjax_Form Function*/

$(function () {
  EasyAjax_Form.Go();
});






$("input[type=submit]").click(radioCheckOnSubmit);
$("fieldset.REQUIRED input").change(valCheckboxOnChange);
//On submit: This function checks sets of radios and chechboxes...if all are empty in a set it shows validation error span 


// Updated to not throw error if radio is null 
function radioCheckOnSubmit(event) {
  $("fieldset.REQUIRED").each(function () {

    var myInput = $(this).find('input:checked');

    if (myInput.length <= 0) {

        $(this).attr('aria-invalid', 'true');     
        
        $(this)
          .find('input')
          .first()
          // .focus();

      showAlert("Please make sure that all required fields are filled in correctly.");

      $(this).find('legend > span + span')
        .replaceWith('<span class="FAIL" style="display:inline;">This is a required field.</span>');



      if (event) {
        event.preventDefault();
      }

      return false;
    } else {
      $(this).removeAttr('aria-invalid');
      // $(this).find('.FAIL').remove();
      $(this).find('legend > span + span')
        .replaceWith('<span></span>');
      }
  });
}

//On changing radio/checkbox input: This function checks it's containing fieldset inputs...if all are empty within that fieldset this shows validation error span
function valCheckboxOnChange() {
  if ($(this).is(':radio')) {
    var parentFieldset = $(this).parent('fieldset');
    var childInputs = parentFieldset.children('input:checked');
  }
  else {
    var parentFieldset = $(this).parent('label').parent('fieldset');
    var childInputs = parentFieldset.children('label').children('input:checked');
  }

  // if a user selects a radio button before submitting again, the fieldset remains invalid until the next submit.
  // if (childInputs.length <= 0) {
  //   parentFieldset.find('legend > span + span').replaceWith('<span class="FAIL" style="display:inline;">This is a required field.</span>');
  // } else {
  //   parentFieldset.find('legend > span + span').replaceWith('<span class="PASS"></span>');
  // }



    if (childInputs.length <= 0) {

        parentFieldset.attr('aria-invalid', 'true');

        parentFieldset.find('legend > span + span')
            .replaceWith('<span class="FAIL" style="display:inline;">This is a required field.</span>');

    } else {

        parentFieldset.removeAttr('aria-invalid');

        parentFieldset.find('legend > span + span')
            .replaceWith('<span class="PASS"></span>');
    }

};



