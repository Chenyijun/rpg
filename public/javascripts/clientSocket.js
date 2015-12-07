var myName = null, myRole = null;
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
		myRole = $('input[name=playerClass]:checked').val();
		console.log(myRole);
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

socket.on('message', function (data) {
  console.log(data);
  $("#welcome").text(data.message);
});