// JavaScript Document //
        (function(){
            var metas = document.getElementsByTagName("meta");
            var exists = false;
            for(var i = 0; i < metas.length; i++){
                var http_equiv = metas[i].getAttribute("http-equiv");
                var content = metas[i].getAttribute("content");
                if(http_equiv != null && content != null && http_equiv == "X-UA-Compatible" && content == "IE=edge"){
                    exists = true;
                    break;
                }
            }
            if(!exists){
                var head = document.getElementsByTagName("head")[0];
                var meta = document.createElement("meta");
                meta.setAttribute("http-equiv", "X-UA-Compatible");
                meta.setAttribute("content", "IE=edge");
                head.appendChild(meta);
            }
        })();
        var directory_state = 0;
		var currentQuery = '';
		var dirTimeoutid = '';
		var dirTimeoutInterval = 100;
		
		
		/**
			puts queries on a short delay so they can be cancelled if a new query is made  within the timeout window
		**/
		function startQueryManager(query, numResultsRequested)
		{
			cancelPreviousQuery();
			if(numResultsRequested < 0 )
			{
			dirTimeoutid = setTimeout(function(){retrive_directory(query)},dirTimeoutInterval);
			} else {
			dirTimeoutid = setTimeout(function(){retrive_directory_incomplete(query)},dirTimeoutInterval);
			}
		}
		
		/**
			Cancels query currently queued so that only the newest query is used
		**/
		function cancelPreviousQuery()
		{
			try{
			clearTimeout(dirTimeoutid);
			} catch(err) {
				// fall through, no special handling needed
				}
		}
		
		/**
			Resets the text field, search instructions, and current query obj
		**/		
		function resetDirectorySearch(textFieldObj)
		{
			if( textFieldObj.value == "Search Faculty / Staff" ){textFieldObj.value='';}

			if( textFieldObj.length < 2 )
			{$(".directory_response").html('<div class="empty-message"><center class="light-text">Please type the name of the Faculty,<br />Staff that you are looking for.</center></div>');}
			
			currentQuery='';

			//textFieldObj.value='';
//			currentQuery='';
//			$(".directory_response").html('<div class="empty-message"><center class="light-text">Please type the name of the Faculty,<br />Staff that you are looking for.</center></div>');
			
		}
		
		function retrive_directory(query){
				
				query = $.trim(query);
				if(currentQuery == query)
				{
					return;	// don't perform a new request if the query has not changed
					}
					currentQuery = query;
				if(query.length > 2 ){
					directory_state = 1;  
					$.ajax({ url: "//www.utrgv.edu/_common/lib/json-content-utrgv.asp?method=Directory&key="+query+"&callback=?",dataType: "jsonp", success: 
        			function(data){

				if(currentQuery != query)
				{
					return;	// don't perform a new write if the query has changed since this was requested
					}

					if(data.DATA.length > 1){
						$(".directory_response").html('<ul class="list"></ul>');
						$.each(data.DATA,function(i,data){ $(".directory_response ul.list").append("<li class='list-item'><a href='javascript:retrive_directory_usr("+'"'+data[0]+'"'+");'>" +data[1]+", "+data[4]+"</a></li>"); });
					}else if(data.DATA.length == 1){
						
						$.each(data.DATA,function(i,data){
					
    					/******************************************************************
                        var deskPhone = data[5];
                        var deptartmentPhone = data[6];
                        
                        if(deskPhone == deptartmentPhone || deskPhone.length > 0) { 
                            numbers = '<dd class="tel">'+data[6]+'</dd>'
                        }
                        else{
                            numbers = '<dd class="tel">'+data[5]+'</dd><dd class="tel">'+data[6]+'</dd>'
                        }
                        
						if(data[10].length > 0){ card = card + data[10];}
						card = card + "<br />Dept. "+data[11];
						if(data[11] != data[8] ){ card = card + "<br />Office. " +data[8];}
						if(data[5].length > 0){ card = card + "<br />Fax. " +data[5];}
						*******************************************************************/
                        
                        var deskPhone = data[5];
                        var departmentPhone = data[6];
                        
                        //if(deskPhone == departmentPhone || deskPhone.length > 0) { 
                        if(deskPhone == departmentPhone || deskPhone == "") { 
                            numbers = '<dd class="tel department">'+data[6]+'</dd>'
                        }
                        else{
                            numbers = '<dd class="tel office">'+data[5]+' (Office)</dd><dd class="tel department">'+data[6]+' (Department)</dd>'
                        }
                    
                        var card = '<dl class="vcard"><dt class="fn">'+data[1]+'</dt><dd class="title">'+data[4]+'</dd><dd class="department">'+data[3]+'</dd><dd class="extended-address">'+data[7]+'</dd>'+ numbers +'<dd class="email"><a href="mailto:'+data[2]+'">'+data[2]+'</a></dd></dl><br /><ul class="directory-nav"><li class="logo"><a href="://www.utrgv.edu/en-us/index.htm">logo</a></li><!--<li class="share"><a href="#">Share</a></li>--><li class="save"><a href="#">Save to Contacts</a></li></ul>';
					//  var card = '<dl class="vcard"><dt class="fn">'+data[1]+'</dt><dd class="title">'+data[4]+'</dd><dd class="department">'+data[3]+'</dd><dd class="extended-address">'+data[6]+'</dd><dd class="tel">'+data[5]+'</dd><dd class="email"><a href="mailto:'+data[2]+'">'+data[2]+'</a></dd></dl><br /><ul class="directory-nav"><li class="logo"><a href="://www.utrgv.edu/en-us/index.htm">logo</a></li><!--<li class="share"><a href="#">Share</a></li>--><li class="save"><a href="#">Save to Contacts</a></li></ul>';
						
						var cn = data[0];
                        var email = data[2];
						
						if(cn == 'lqu148 '){ 
                            email = 'president'
                            card = card + '<br /><a style="color:#444" href="mailto:'+email+'">'+email+'</a></div>'
                        }						
						
						
						$(".directory_response").html(card);
						
						});																	
					}else{
						$(".directory_response").html("<br />No user was found.");
					}	
					directory_state = 0;
        		  } });									
				}else{
					$(".directory_response").html(" ");
					if(query == ""){$(".directory_response").html('<div class="empty-message"><center class="light-text">Please type the name of the Faculty,<br />Staff that you are looking for.</center></div>');} 
				}
			
										

		};
		
		function retrive_directory_incomplete(query){
				//alert(query);
				query = $.trim(query);
				if(currentQuery == query)
				{
					return;
					}
					currentQuery = query;
				if(query.length > 2 ){
					directory_state = 1;  
					$.ajax({ url: "//www.utrgv.edu/_common/lib/json-content-utrgv.asp?method=DirectoryInc&key="+query+"&callback=?",dataType: "jsonp", success: 
        			function(data){
						
				if(currentQuery != query)
				{
					return;	// don't perform a new write if the query has changed since this was requested
					}						
						
					if(data.DATA.length > 1){
						$(".directory_response").html('<ul class="list"></ul>');
						$.each(data.DATA,function(i,data){ $(".directory_response ul.list").append("<li class='list-item'><a href='javascript:retrive_directory_usr("+'"'+data[0]+'"'+");'>" +data[1]+", "+data[4]+"</a></li>"); });
					}else if(data.DATA.length == 1){
					
						if(data.DATA.length > 9)
						{
							$(".directory_response").append('<div style="padding-left:50px; line-height:20px; text-decoration:underline;"><a href="/directory/?results='+query+'">View complete List</a></div>')
						}
					}else if(data.DATA.length == 1){
						
						$.each(data.DATA,function(i,data){
												  
						var deskPhone = data[5];
                        var departmentPhone = data[6];
                        
                        //if(deskPhone == departmentPhone || deskPhone.length > 0) { 
                        if(deskPhone == departmentPhone || deskPhone == "") { 
                            numbers = '<dd class="tel department">'+data[6]+'</dd>'
                        }
                        else{
                            numbers = '<dd class="tel office">'+data[5]+' (Office)</dd><dd class="tel department">'+data[6]+' (Department)</dd>'
                        }
                    
                        var card = '<dl class="vcard"><dt class="fn">'+data[1]+'</dt><dd class="title">'+data[4]+'</dd><dd class="department">'+data[3]+'</dd><dd class="extended-address">'+data[7]+'</dd>'+ numbers +'<dd class="email"><a href="mailto:'+data[2]+'">'+data[2]+'</a></dd></dl><br /><ul class="directory-nav"><li class="logo"><a href="://www.utrgv.edu/en-us/index.htm">logo</a></li><!--<li class="share"><a href="#">Share</a></li>--><li class="save"><a href="#">Save to Contacts</a></li></ul>';
    				//  var card = '<dl class="vcard"><dt class="fn">'+data[1]+'</dt><dd class="title">'+data[4]+'</dd><dd class="department">'+data[3]+'</dd><dd class="extended-address">'+data[6]+'</dd><dd class="tel">'+data[5]+'</dd><dd class="email"><a href="mailto:'+data[2]+'">'+data[2]+'</a></dd></dl><br /><ul class="directory-nav"><li class="logo"><a href="://www.utrgv.edu/en-us/index.htm">logo</a></li><!--<li class="share"><a href="#">Share</a></li>--><li class="save"><a href="#">Save to Contacts</a></li></ul>';
						
						/******************************************************************
						if(data[10].length > 0){ card = card + data[10];}
						card = card + "<br />Dept. "+data[11];
						if(data[11] != data[8] ){ card = card + "<br />Office. " +data[8];}
						if(data[5].length > 0){ card = card + "<br />Fax. " +data[5];}
						******************************************************************/
						
						var cn = data[0];
                        var email = data[2];
						
						if(cn == 'lqu148 '){ 
                            email = 'president'
                            card = card + '<br /><a style="color:#444" href="mailto:'+email+'">'+email+'</a></div>'
                        }
						
						
						$(".directory_response").html(card);
						
						});					
						
						
					}else{
						$(".directory_response").html("<br />No user was found.");
					}	
					directory_state = 0;
        		  } });
					
				
				}else{
					$(".directory_response").html(" ");
					if(query == ""){$(".directory_response").html('<div class="empty-message"><center class="light-text">Please type the name of the Faculty,<br />Staff that you are looking for.</center></div>');} 
				}
		};
		
		
		function retrive_directory_usr(query){
           $.ajax({ url: "//www.utrgv.edu/_common/lib/json-content-utrgv.asp?method=Directoryusr&key="+query+"&callback=?",dataType: "jsonp", success: function(data){
    					 
						$.each(data.DATA,function(i,data){
															  
						var deskPhone = data[5];
                        var departmentPhone = data[6];
                        
                        //if(deskPhone == departmentPhone || deskPhone.length > 0) { 
                        if(deskPhone == departmentPhone || deskPhone == "") { 
                            numbers = '<dd class="tel department">'+data[6]+'</dd>'
                        }
                        else{
                            numbers = '<dd class="tel office">'+data[5]+' (Office)</dd><dd class="tel department">'+data[6]+' (Department)</dd>'
                        }
                    
                        var card = '<dl class="vcard"><dt class="fn">'+data[1]+'</dt><dd class="title">'+data[4]+'</dd><dd class="department">'+data[3]+'</dd><dd class="extended-address">'+data[7]+'</dd>'+ numbers +'<dd class="email"><a href="mailto:'+data[2]+'">'+data[2]+'</a></dd></dl><br /><ul class="directory-nav"><li class="logo"><a href="://www.utrgv.edu/en-us/index.htm">logo</a></li><!--<li class="share"><a href="#">Share</a></li>--><li class="save"><a href="#">Save to Contacts</a></li></ul>';
    				//  var card = '<dl class="vcard"><dt class="fn">'+data[1]+'</dt><dd class="title">'+data[4]+'</dd><dd class="department">'+data[3]+'</dd><dd class="extended-address">'+data[6]+'</dd><dd class="tel">'+data[5]+'</dd><dd class="email"><a href="mailto:'+data[2]+'">'+data[2]+'</a></dd></dl><br /><ul class="directory-nav"><li class="logo"><a href="://www.utrgv.edu/en-us/index.htm">logo</a></li><!--<li class="share"><a href="#">Share</a></li>--><li class="save"><a href="#">Save to Contacts</a></li></ul>';
									
									/******************************************************************
									if(data[9].length > 0){ card = card + data[9];}
									card = card + "<br />Dept. "+data[11];
									if(data[11] != data[7] ){ card = card + "<br />Office. " +data[7];}
									if(data[10].length > 0){ card = card + "<br />Fax. " +data[10];}
									/******************************************************************/
									
									var cn = data[0];
			                        var email = data[2];
									
									if(cn == 'lqu148 '){ 
                                        email = 'president'
                                        card = card + '<br /><a style="color:#444" href="mailto:'+email+'">'+email+'</a></div>'
                                    }
									
									
									
									$(".directory_response").html(card);
									
									});	
						
		} });	
  		};