var mongoModel = require("../models/mongoModel.js")
var library = require("../models/library.js")
var player = require("../models/player.js")

exports.init = function(io) {
	var currentPlayers = 0; // keep track of the number of players
	var players = [];
	var hostId;
	var monster;
	var playerOrder = [];
	var currentTurn;
	var message;

  // When a new connection is initiated
	io.sockets.on('connection', function (socket) {
		console.log("a new player on socket "+socket.id+" has joined.");
		++currentPlayers;
		// Send ("emit") a 'players' event back to the socket that just connected.
		socket.emit('players', { number: currentPlayers});
		socket.emit('message', {message: "Welcome player " + currentPlayers});
		socket.emit('newPlayer', {});
		/*
		 * Emit players events also to all (i.e. broadcast) other connected sockets.
		 * Broadcast is not emitted back to the current (i.e. "this") connection
     */
		socket.broadcast.emit('players', { number: currentPlayers});


		socket.on("choseClass", function(data){
			if (players.length == 0){
				hostId = socket.id;
			}
			// players.push({name: data.name, role: data.role, socket: socket.id, level: 1, exp: 0});
			var roleInfo = library.getRoleInfo(data.role);
			var newPlayer = new player(data.name, data.role, socket.id, 1, 0, roleInfo.stats.hp, roleInfo.stats.mp)
			if (!checkAlreadyExists(socket.id)){
				players.push(newPlayer);
			}
			socket.emit('hpMp', {hp: newPlayer.hp, mp: newPlayer.mp});
			socket.emit('playerList', {playerList: players});
			socket.broadcast.emit('playerList', {playerList: players});

			if(socket.id == hostId){
				socket.emit('hostWait', {socket: socket.id}); //send host the hostWait screen
			}else{
				socket.emit('playerWait', {socket: socket.id}); //send players the playerWait screen
			}
		});	

		socket.on("startGame", function(data){
			// socket.broadcast.emit('gameStarted', {playerOrder: playerOrder, monster: monster})
			var monsters = library.getAllMonsters();
			var rand = getRandomInt(0,2);
			if(rand==1){
				monster = monsters.poring;
				monster.hp = 15;
			}else{
				monster = monsters.fabre;
				monster.hp = 10;
			}
			socket.broadcast.emit("gameStarted");
			monster.role = "monster";
			playerOrder = getPlayerOrder();
			getCurrentPlayer()
			socket.broadcast.emit('updateGameInfo', {playerOrder: playerOrder, monster: monster})
			socket.emit('updateGameInfo', {playerOrder: playerOrder, monster: monster, message: message})
			if (currentTurn == "monster"){
				message += " " + monsterTurn();
					socket.broadcast.emit('updateGameInfo', {playerOrder: playerOrder, monster:monster, message: message, help: "startGame"});
					socket.emit('updateGameInfo', {playerOrder: playerOrder, monster:monster, message: message, help: "startGameEMIT"});
					nextTurn();
					io.sockets.connected[currentTurn.socketId].emit("chooseAction", {socket: currentTurn.socketId})
			}else{
				io.sockets.connected[currentTurn.socketId].emit("chooseAction", {socket: currentTurn.socketId})
			}
			//load monster
			//broadcast whose turn
		});

		socket.on("makeAction", function(data){
			var message = "";
			//calculate damage
			var damageDone = calculateDamage(currentTurn.role);
			//if damage is enough to kill monster
			if (damageDone >= monster.hp){ 
				message = "Monster is dead. Congrats!"; 
				//remove monster from player order
				removeMonsterfromOrder()
				socket.broadcast.emit('gameFinish', {playerOrder: playerOrder, monster:monster, message: message, help: "makeAction"});
				socket.emit('gameFinish', {playerOrder: playerOrder, monster:monster, message: message, help: "makeActionEMIT"});
			}else{
				//subtract damage from monster's HP
				monster.hp = monster.hp - damageDone;
				message = currentTurn.name + " dealt "+ damageDone + " damage. ";
				//change order
				nextTurn(); 
				//if monster's turn
				if (currentTurn == "monster"){
					var target = monsterTarget();
					var damage = monsterDamage();
					if(players[target].hp < damage){ 
						//if monster kills someone
						console.log(players[target].name + "is dead");
						var deadSocket = removePlayerfromOrder(players[target].name);
						io.sockets.connected[deadSocket].emit("dead")
					}else{
						players[target].hp = players[target].hp - damage;
						message =  monster.name + " dealt " + damage + " damage to " + players[target].name+". ";
					}
					socket.broadcast.emit('updateGameInfo', {playerOrder: playerOrder, monster:monster, message: message, help: "MonsterTurn"});
					socket.emit('updateGameInfo', {playerOrder: playerOrder, monster:monster, message: message, help: "MonsterTurnEMIT"});
					//move onto next turn
					nextTurn();
					io.sockets.connected[currentTurn.socketId].emit("chooseAction", {socket: currentTurn.socketId})
				}else{
					//let next person go
					socket.broadcast.emit('updateGameInfo', {playerOrder: playerOrder, monster:monster, message: message, help: "NextPerson"});
					socket.emit('updateGameInfo', {playerOrder: playerOrder, monster:monster, message: message, help: "NextPersonEMIT"});
					io.sockets.connected[currentTurn.socketId].emit("chooseAction", {socket: currentTurn.socketId})
				}
			}
		});

		function nextTurn(){
			playerOrder.push(playerOrder.shift());
			getCurrentPlayer();
		}

		function monsterDamage(){
			var hitChance = calculateHitChance(3);
			if (hitChance == false){
				return 0;
			}else{
				return getRandomInt(monster.atkMin, monster.atkMax);
			}
		}

		function monsterTarget(){
			return getRandomInt(0, players.length-1);
		}

		function calculateDamage(role){
			var roleInfo = library.getRoleInfo(role);
			var hitChance = calculateHitChance(roleInfo.stats.dex)
			if (hitChance == false){
				return 0;
			}else{
				if(role=="mage"){
					return calculateHit(roleInfo.stats.int);
				}else{
					return calculateHit(roleInfo.stats.str);
				}
			}
		}

		function calculateHitChance(dex){
			var hitChance = 80+(dex*2);
			var rand = getRandomInt(0, 100);
			if(rand <= hitChance){
				return true;
			}else{
				return false;
			}
		}

		function calculateHit(str){ //or int
			return getRandomInt(1,str);
		}

		function getPlayerOrder(){
			var playerOrder = [];
			// var monsterPlace = getRandomInt(0, players.length);
			var monsterPlace = 1;
			for(var i = 0; i<players.length+1; i++){
				if(i==monsterPlace){
					playerOrder.push(monster);
				}
				if(i<players.length){
					playerOrder.push(players[i]);
				}
			}
			return playerOrder;
		}

		function getRandomInt(min, max) {
		  return Math.floor(Math.random() * (max - min + 1) + min);
		}

		function getCurrentPlayer(){ 
			if (playerOrder[0].role == "monster"){
				currentTurn = "monster";
			}else{
				currentTurn = playerOrder[0];
			}
		}

		function checkAlreadyExists(socket){
			for(var i=0; i<players.length-1; i++){
				if(players[i].socketId == socket){
					return true;
				}
			}
			return false;
		}

		function removeMonsterfromOrder(){
			for (var i =0; i < playerOrder.length; i++){
			   if (playerOrder[i].role === "monster") {
			      playerOrder.splice(i,1);
			      break;
			     }
			}
		}

		function removePlayerfromOrder(name){
			for (var i =0; i < playerOrder.length; i++){
			   if (playerOrder[i].name === "name") {
			   	  var socket = playerOrder[i].socketId
			      playerOrder.splice(i,1);
			      return socket;
			     }
			}
		}


		/*
		 * Upon this connection disconnecting (sending a disconnect event)
		 * decrement the number of players and emit an event to all other
		 * sockets.  Notice it would be nonsensical to emit the event back to the
		 * disconnected socket.
		 */
		socket.on('disconnect', function () {
			console.log(socket.id + "has left");

			--currentPlayers;
			socket.broadcast.emit('players', { number: currentPlayers});
		});
	});
}

