$(document).ready(function(){
	var myName = null;
	var myRole = null;
	var host;
	var socket = io.connect();
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
			$('#myName').text("I am " + myName);
			$('#myRole').text(" the " + myRole);
			socket.emit('choseClass',{name: myName, role: myRole});
			$('#classInfo').slideUp();
			$('#playerInformation').slideUp();
			return false;
		});
	})

	socket.on('playerList', function(data){
		$('#party').slideDown();
		console.log("UpdatePlayers");
		console.log(data);
		players = []
		for (i=0; i<data.playerList.length; i++){
			players.push(" "+data.playerList[i].name + " the " + data.playerList[i].role+" ");
		}
		console.log(players);
		$("#playerList").text(players);
	});


	//ON Player waiting for host to start game
	socket.on("playerWait", function(data){
		console.log("Player wait");
		$('#playerWait').fadeIn();
	});

	//ON Host View waiting to start game
	socket.on("hostWait", function(data){
		console.log("Host wait");
		host = true; 
		$('#hostWait').fadeIn();
	});

	//choose battle option
	socket.on("startGame", function(data){
		console.log(data);
		$('#monsterInfo').text(data.monster.name);
		$('#monsterInfo').fadeIn();
		$('#turns').text(data.playerOrder);
		console.log("MESSAGE " + data.message);
		$('#gameMessage').text(data.message);

	});

	socket.on("chooseAction", function(data){
		// $('#gameMessage').text("Your turn");
		console.log("YOUR TURN");
		$('#actions').fadeIn();
		$('#attack').click(function(){
			socket.emit('makeAction');
		});
	});

	//Host presses start game 
	$('#startGame').click(function(){
		console.log("StartGame Pressed");
		$('#hostWait').fadeOut();
		$('#playerWait').fadeOut();
		socket.emit('startGame');
	});

	socket.on('message', function (data) {
	  console.log(data);
	  $("#welcome").text(data.message);
	});
});