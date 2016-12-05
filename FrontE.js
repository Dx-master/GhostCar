

$(function () {
    "use strict";


    var hasGP = false; //est ce que le gamePad est connecté?
        var repGP;
    // for better performance - to avoid searching in DOM
    var content = $('#content');
    var input = $('#input');
    var status = $('#status');

    var canvas = document.getElementById("myCanvas");
            if(!canvas)
            {
                alert("Impossible de récupérer le canvas");
                return;
            }
           
            var context = canvas.getContext("2d");
            if(!context)
            {
                alert("Impossible de récupérer le context");
                return;
            }


    // my color assigned by the server
    var myColor = false;
    // my name sent to the server
    var myName = false;


    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        content.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
                                    + 'support WebSockets.'} ));
        input.hide();
        $('span').hide();
        return;
    }


    // open connection
    var connection = new WebSocket('ws://localhost:1099');

    connection.onopen = function () {
        // first we want users to enter their names
        input.removeAttr('disabled');
        status.text('Choose name:');
    };

    connection.onerror = function (error) {
        // just in there were some problems with conenction...
        content.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
                                    + 'connection or the server is down.</p>' } ));
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
		
	
        // try to parse JSON message. Because we know that the server always returns
        // JSON this should work without any problem but we should make sure that
        // the massage is not chunked or otherwise damaged.
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }
        // NOTE: if you're not sure about the JSON structure
        // check the server source code above
        if (json.type === 'color') { // first response from the server with user's color
		    myColor = json.data;
		    status.text(myName + ': ').css('color', myColor);
		    input.removeAttr('disabled').focus();
            // from now user can start sending messages
        } else if (json.type === 'history') { // entire message history
            // insert every single message to the chat window
            for (var i=0; i < json.data.length; i++) {
               	 addMessage(json.data[i].author, json.data[i].text,json.data[i].color, new Date(json.data[i].time));
            }
        } else if (json.type === 'message') { // it's a single message

		    input.removeAttr('disabled'); // let the user write another message
		    addMessage(json.data.author, json.data.text,json.data.color, new Date(json.data.time));

	} else if (json.type === 'gameover') { // it's the end of the game

		   alert("GAME OVER !!!! \n Veuillez rechager la page pour rejouer !!!! ");

        } else if (json.type === 'position'){   //it's the car position
		  context.clearRect(0, 0, canvas.width, canvas.height);
		 context.beginPath();
		//var positions = json.data;
			//console.log("data --- "+json.data);
			//console.log("json.data[i].posX: "+json.data[i].posX+" json.data[i].posY: "+json.data[i].posY);
			//for (var i=0; i < positions.length; i++) 
		    	//{
			for (var i=0; i < json.data.length; i++) {
               	 		//addMessage(json.data[i].posX, json.data[i].posY,"Rouge", new Date(json.data[i].time));
			
           	 		if(json.data[i].direction === 'stop'){
					var img = document.getElementById("voiturenord");
					context.drawImage(img,json.data[i].posX,json.data[i].posY,33,70);
				}
				if(json.data[i].direction === 'bas'){    
					var img = document.getElementById("voituresud");
					context.drawImage(img,json.data[i].posX,json.data[i].posY,33,70);		
				}
				if(json.data[i].direction === 'haut'){    
					var img = document.getElementById("voiturenord");
					context.drawImage(img,json.data[i].posX,json.data[i].posY,33,70);			
				}
				if(json.data[i].direction === 'gauche'){    
					var img = document.getElementById("voitureouest");
					context.drawImage(img,json.data[i].posX,json.data[i].posY,70,33);	
				}
				if(json.data[i].direction === 'droite'){    
					var img = document.getElementById("voitureest"); 		
					context.drawImage(img,json.data[i].posX,json.data[i].posY,70,33);			
				}
			}
	} else {
            console.log('Hmm..., I\'ve never seen JSON like this: ', json);
        }
    };

    /**
* Send mesage when user presses Enter key
*/

    input.keydown(function(e) {
        if (e.keyCode === 13) {
            var msg = $(this).val();
            if (!msg) {
                return;
            }
            // send the message as an ordinary text
            connection.send(msg);
            $(this).val('');
            // disable the input field to make the user wait until server
            // sends back response
            input.attr('disabled', 'disabled');

            // we know that the first message sent from a user their name
            if (myName === false) {
                myName = msg;
            }
        }

    });

    /**
* This method is optional. If the server wasn't able to respond to the
* in 3 seconds then show some error message to notify the user that
* something is wrong.
*/
    setInterval(function() {
        if (connection.readyState !== 1) {
            status.text('Error');
            input.attr('disabled', 'disabled').val('Unable to comminucate '
                                                 + 'with the WebSocket server.');
        }
    }, 3000);

    /**
* Add message to the chat window
*/
    function addMessage(author, message, color, dt) {
        content.append('<p><span style="color:' + color + '">' + author + '</span> @ ' +
             + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
             + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes())
             + ': ' + message + '</p>');
    }

/******************************************* GAME PAAAAAAAD ********************************************/


    
        //Le navigateur reconnait il cette propriété?
        function canGame() {
            return "getGamepads" in navigator;
        }
    
    
        //fonction principale lancée au chargement complet de la page
        $(document).ready(function() {
    
            if(canGame()) { //on vérifie si le navigateur est suffisament récent.

    
                $(window).on("gamepadconnected", function() { //rattachement  de l'événement (cf plus bas) à une callback
                    hasGP = true; //on garde en mémoire qu'il existe un gamePad
                    $("#gamepadPrompt").html("Gamepad connected!");
                    console.log("connection event");
                   
                    //Ceci est une boucle de jeu
            
                
           
            var gp = navigator.getGamepads()[0];
            var myInterval = setInterval(GamePad, 1000/30);

                   
                });
    
                $(window).on("gamepaddisconnected", function() {//récupération de l'événement (cf plus bas)
                    console.log("disconnection event");
                    $("#gamepadPrompt").text(prompt);
                    window.clearInterval(repGP);
                });
    
                //Chrome nécessite un petit interval, Firefox, non, mais cela ne dérange pas.
                var checkGP = window.setInterval(function() {
                    console.log('checkGP');
                    if(navigator.getGamepads()[0]) {
                        if(!hasGP) $(window).trigger("gamepadconnected"); //déclenchement de l'événement
                        window.clearInterval(checkGP);
                    }
                }, 500);
            }
    
     });   

  window.onload = function ()
        {   
    
		 var canvas = document.getElementById("myCanvas");
            if(!canvas)
            {
                alert("Impossible de récupérer le canvas");
                return;
            }
           
            var context = canvas.getContext("2d");
            if(!context)
            {
                alert("Impossible de récupérer le context");
                return;
            }
                
            var gp = navigator.getGamepads()[0];
            var myInterval = setInterval(GamePad, 1000/30);

            var content = "";


/**************************************************/
            function GamePad()
            {
             
                
                //context.arc(posX, posY, diametreBalle/2, 0, Math.PI*2);
                //context.fillRect(posX, posY, diametreBalle/2, 25);
               // context.fill();
              //  context.fillStyle = "#ff0000";


               var gp = navigator.getGamepads()[0];
               

                //On additionne les vitesses de déplacement avec les positions
                for(var i=0;i<gp.buttons.length;i++) {
            
		if(gp.axes[1]==-1){ 

			var msg = {direction : 'haut'};
			  
			var json = (JSON.stringify( { type: 'gamepad', data: msg}));
			    connection.send(json);

			
		  }
                    
		/*********************/
		if(gp.axes[1]==1) {
			 var msg = {direction : 'bas' };
			  
			var json = (JSON.stringify( { type: 'gamepad', data: msg}));
			    connection.send(json);
		  }
                   
		/*********************/
		 if(gp.axes[0]==-1){
			var msg = {direction : 'gauche' };
			  
			var json = (JSON.stringify( { type: 'gamepad', data: msg}));
			    connection.send(json);
		  }
		 
                   
		/*********************/
		 if(gp.axes[0]==1){

			var msg = {direction : 'droite'};
			  
			var json = (JSON.stringify( { type: 'gamepad', data: msg}));
			    connection.send(json);
					}
                }
         
            }
           
        }


});
/**********************************************************************************************************/





