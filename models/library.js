var roles = [];
var monsters = [];
var monsterList = [];;

exports.getRoleInfo = function(name){
	if(name == "warrior"){
		return roles.warrior
	}
}

exports.getMonsterInfo = function(name){
	for (var i = 0; i<monsters.length-1; i++){
		if (monsters[i].name == name){
			return monsters[i];
		}
	}
}

exports.getAllMonsters = function(){
	return monsters;
}

exports.getMonsterList = function(){
	return monsterList;
}

exports.parseMonsters = function(){
	for (var monster in monsters){
		monsterList.push(monster.name);
	}
}

exports.loadJSON = function(fs) {
	var jsonName = "classes.json";
	fs.readFile(jsonName, function(err, data) {
		if(err) {
			console.log(err);
		} else {
			var jsonParse = JSON.parse(data);
			roles = jsonParse.roles;
			monsters = jsonParse.monsters;
		}
	})
}