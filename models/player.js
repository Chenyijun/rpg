function Player(name, role, leader, level, exp){
	this.name = name;
	this.role = role;
	this.leader = leader;
	this.level = level;
	this.exp = exp;
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