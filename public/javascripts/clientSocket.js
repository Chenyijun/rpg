$(document).ready(function(){
	var myName = null;
	var myRole = null;
	var host;
	var socket = io.connect();
	var mySocket = null;
	socket.on('players', function (data) {
		console.log(data);
		$("#numPlayers").text(data.number);
	});

	socket.on('newPlayer', function(data){
		$('#classInfo').slideDown();
		$('#playerInformation').slideDown().submit(function() {
			console.log("submit Pressed");
			myName = $('#playerName').val();
			myRole = $('input[name=radio]:checked').val();
			$('#myName').text(myName);
			$('#myRole').text(myRole);
			socket.emit('choseClass',{name: myName, role: myRole});
			$('#playerInfo').slideDown();
			$('#classInfo').slideUp();
			$('#playerInformation').slideUp();
			return false;
		});
	})

	socket.on('hpMp', function(data){
		$('#hp').fadeIn();
		$('#hp').text(data.hp);
		$('#mp').fadeIn();
		$('#mp').text(data.mp);
	});

	socket.on('playerList', function(data){
		$('#party').slideDown();
		console.log("UpdatePlayers");
		console.log(data);
		players = []
		$("#playerList").empty();
		for (i=0; i<data.playerList.length; i++){
			var player = data.playerList[i].name + " the " + data.playerList[i].role
			players.push(player);
			$("#playerList").append("<li>"+player+ "</li>");
		}
		console.log(players);
		// $("#playerList").text(players);
	});


	//Player waiting for host to start game, view party list
	socket.on("playerWait", function(data){
		mySocket = data.socket;
		console.log(mySocket);
		console.log("Player wait");
		$('#playerWait').fadeIn();
	});

	//Host waiting to start game, view party list and button
	socket.on("hostWait", function(data){
		mySocket = data.socket;
		console.log(mySocket);
		host = true; 
		$('#hostWait').fadeIn();
	});
	//when monster is killed
	socket.on("gameFinish", function(data){
		console.log("GAME IS DONE");
		$("#playerList").empty();
		for (var i = 0; i<data.playerOrder.length; i++){
			if(data.playerOrder[i].role != "monster"){
				if (data.playerOrder[i].name == myName){
					$('#hp').text(data.playerOrder[i].hp);
					$('#mp').text(data.playerOrder[i].mp);
				}
				$("#playerList").append("<li>"+data.playerOrder[i].name+ " ["+ data.playerOrder[i].role+"] HP: "+ data.playerOrder[i].hp+"</li>")
			}
		}
		$('#partyTurn').text="Party Members";
		$('#actions').fadeOut();
		$('#gameMessage').text("Congrats! you have defeated the monster!");
		//Play again
		// //if not host
		// if (host==true){
		// 	$('#hostPlayAgain').fadeIn();
		// 	// $('#gameMessage').text("");
		// }else{
		// 	$('#playerWait').fadeIn();
		// 	// $('#gameMessage').text("");	
		// }

	});
	//when game starts
	socket.on("gameStarted", function(data){
		$('#gameMessage').text("");
		$('#playerWait').fadeOut();
		$('#partyTurn').text("Turns");
	});

	socket.on("updateGameInfo", function(data){
		$('#actions').fadeOut();
		console.log('updategameInfo');
		$("#playerList").empty();
		for (var i = 0; i<data.playerOrder.length; i++){
			if (data.playerOrder[i].name == myName){
				$('#hp').text(data.playerOrder[i].hp);
				$('#mp').text(data.playerOrder[i].mp);
			}
			$("#playerList").append("<li>"+data.playerOrder[i].name+ " ["+ data.playerOrder[i].role+"] HP: "+ data.playerOrder[i].hp+"</li>")
		}
		$('#monsterInfo').text(data.monster.name);
		$('#gameMessage').text(data.message);
		$('#hp').text(data.hp);
		$('#mp').text(data.mp);
		console.log(data.help);
	});
	//Attack/Skill option
	socket.on("chooseAction", function(data){
		console.log(mySocket);
		if (data.socket == mySocket){
			console.log("YOUR TURN");
			$('#actions').fadeIn();
			$('#attack').click(function(){
				socket.emit('makeAction');
				$('#actions').fadeOut();
			});
		}
	});

	socket.on('dead', function(data){
		$('#gameMessage').text("You died.");
	});

	//Host presses start game 
	$('#startGame').click(function(){
		$('#hostWait').fadeOut();
		$('#playerWait').fadeOut();
		$('#partyTurn').text("Turns");
		socket.emit('startGame');
	});

	$('#playAgain').click(function(){
		$('#gameMessage').text("");
		$('#hostWait').fadeOut();
		$('#hostPlayAgain').fadeOut();
		socket.emit('startGame');
	});

	socket.on('message', function (data) {
	  $("#welcome").text(data.message);
	});
});