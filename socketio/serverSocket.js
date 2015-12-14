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
			console.log("Chose Class");
			console.log(data);
			if (currentPlayers == 1){
				hostId = socket.id;
				console.log("im the host");
			}
			// players.push({name: data.name, role: data.role, socket: socket.id, level: 1, exp: 0});
			var roleInfo = library.getRoleInfo(data.role);
			players.push(new player(data.name, data.role, socket.id, 1, 0, roleInfo.stats.hp, roleInfo.stats.mp));
			console.log(players);
			socket.emit('playerList', {playerList: players});
			socket.broadcast.emit('playerList', {playerList: players});

			if(socket.id == hostId){
				socket.emit('hostWait'); //send host the hostWait screen
			}else{
				socket.emit('playerWait'); //send players the playerWait screen
			}
		});	

		socket.on("startGame", function(data){
			var monsters = library.getAllMonsters();
			monster = monsters.fabre;
			monster.role = "monster";
			playerOrder = getPlayerOrder();
			console.log(playerOrder);
			socket.broadcast.emit('startGame', {playerOrder: playerOrder, monster: monster})
			socket.emit('startGame', {playerOrder: playerOrder, monster: monster, message: message})
			getCurrentPlayer()
			if (currentTurn == "monster"){
				console.log("MONSTERRRR");
			}else{
				io.sockets.connected[currentTurn.socketId].emit("chooseAction")
			}
			//load monster
			//broadcast whose turn
		});

		socket.on("makeAction", function(data){
			var message = "";
			console.log("current turn " + currentTurn)
			var damageDone = calculateDamage(currentTurn.role);
			if (damageDone > monster.hp){
				message = "Monster is dead. Congrats!";
				console.log("MONSTER IS DEAD");
				socket.broadcast.emit('gameFinish', {playerOrder: playerOrder, monster:monster, message: message});
				socket.emit('gameFinish', {playerOrder: playerOrder, monster:monster, message: message});
			}else{
				console.log("Dealt " + damageDone);
				monster.hp = monster.hp - damageDone;
				console.log("monster hp " + monster.hp);
				message = currentTurn.name + " dealt "+ damageDone + "damage";
			}
			socket.broadcast.emit('startGame', {playerOrder: playerOrder, monster:monster, message: message});
			socket.emit('startGame', {playerOrder: playerOrder, monster:monster, message: message});
			nextTurn();
			if (currentTurn == "monster"){
				console.log("monster turn");
				message += monsterTurn();
				console.log("next Turn");
				nextTurn();
				socket.broadcast.emit('startGame', {playerOrder: playerOrder, monster:monster, message: message});
				socket.emit('startGame', {playerOrder: playerOrder, monster:monster, message: message});
				io.sockets.connected[currentTurn.socketId].emit("chooseAction")
			}else{
				io.sockets.connected[currentTurn.socketId].emit("chooseAction")
			}

			//calculate damage
			//check if monster is dead
			//show that damage has been taken
			//broadcast to everyone
			//go to next person in line
		});

		function nextTurn(){
			playerOrder.push(playerOrder.shift());
			getCurrentPlayer();
		}

		function monsterTurn(){
			var target = monsterTarget();
			var damage = monsterDamage();
			if(players[target].hp < damage){
				return console.log(players[target].name + "is dead");
			}else{
				players[target].hp = players[target].hp - damage;
				console.log("Dealt " + damage + " to " + players[target].name);
				console.log(players[target].name + " hp:" + players[target].hp);
				return "Monster dealt " + damage + " to " + players[target].name;
			}
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
			console.log("role " + role)
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
			var hitChance = dex/5 * 100 + 20;
			var rand = getRandomInt(0, 100);
			console.log("Hit chance " + hitChance);
			console.log("rand " + rand);
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

