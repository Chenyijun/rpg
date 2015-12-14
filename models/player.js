function Player(name, role, socketId, level, exp, hp, mp){
	this.name = name;
	this.role = role;
	this.socketId = socketId;
	this.level = level;
	this.exp = exp;
	this.hp = hp;
	this.mp = mp;
}

//getters
Player.prototype.getSkills = function(){ //find skills for role and level

}

Player.prototype.checkLevel = function(){ //see if you level up

}

Player.prototype.makeHost = function(){
	this.leader = true;
}

Player.prototype.removeHost = function(){
	this.leader = false;
}

module.exports = Player;