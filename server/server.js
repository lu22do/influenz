// Allow clients to subscribe to Players
Meteor.publish('players', function() {
  return Players.find();
});

Meteor.publish('games', function() {
  return Games.find();
});

Meteor.publish('nodes', function() {
  return Nodes.find();
});

Games.insert({
  name: "default",
  curplayer: undefined,
  player1: undefined,
  player2: undefined
});

// Meteor.call('METHODNAME') points here
Meteor.methods({
  'login': function(playerid) {
    var player;

    // if (Games.findOne({name: "default"}) === undefined) {
    //   Games.insert({
    //     name: "default",
    //     curplayer: undefined,
    //     player1: undefined,
    //     player2: undefined
    //   });
    // }

    if (Players.findOne({id: playerid}) === undefined) {
      // Add a new player for the new user.
      player = Players.insert({
        id: playerid,
        credit: 50
      });
    }

    var game = Games.findOne({name: "default"});
    if (playerid == 'player1' && !game.player1) {
      Games.update({name: "default"}, {$set: {player1: player}});
      game.player1 = player;
    }
    else if (playerid == 'player2' && !game.player2) {
      Games.update({name: "default"}, {$set: {player2: player}});
      game.player2 = player;
    }

    if (game.player1 && game.player2) {
      Games.update({name: "default"}, {$set: {curplayer: game.player1}});
    }
  },
  'createMotherNode': function(playerid, xpos, ypos) {
    var player = Players.findOne({id: playerid});

    var node = Nodes.insert({
      player: playerid,
      parent: undefined,
      xpos: xpos, 
      ypos: ypos, 
      power: 5,
      resistance: 1,
      children: []
    });

    Players.update({id: playerid}, {$set: {mothernode: node._id}})
  },
  'createSubNode': function(playerid, xpos, ypos, parent, power, resistance, cost) {
    var player = Players.findOne({id: playerid});

    if (player.credit < cost) {
      return;
    }

    var newNode = Nodes.insert({
      player: playerid,
      parent: parent,
      xpos: xpos, 
      ypos: ypos, 
      power: power,
      resistance: resistance,
      disabled: false,
      children: []
    });

    Nodes.update({_id: parent}, {$addToSet: {children: newNode._id}});
    Players.update({id: playerid}, {$inc: {credit: -cost}});

    var node = Nodes.findOne(newNode);

    function disableNode(_id) {
      Nodes.update(_id, {$set: {disabled: true}});
      
      Nodes.find().fetch().forEach(function(i) {
        if (_id === i._id || i.disabled) {
          return;
        }

        if (_id === i.parent) {
          disableNode(i);
        }
      });
    }

    // check if it is disabled by an opponent
    Nodes.find().fetch().forEach(function(i){
      if (node._id == i._id || i.disabled || node.disabled) {
        return;
      }
      if (node.player != i.player) {
        var dist = getDistance(node.xpos, node.ypos, i.xpos, i.ypos) 
        if (dist < i.power && node.power < i.power) {
          disableNode(node._id)
          node.disabled = true;
        }
      }
    });

    if (node.disabled) {
      return;
    }

    // check if it disables opponent nodes 
    Nodes.find().fetch().forEach(function(i){
      if (node._id == i._id || i.disabled) {
        return;
      }
      if (node.player != i.player) {
        var dist = getDistance(node.xpos, node.ypos, i.xpos, i.ypos) 
        if (dist < node.power && node.power > i.power) {
          disableNode(i._id)
        }
      }
    });
  },
  'reset': function() {
    Nodes.remove({});
    Players.remove({});
    //Games.remove({});
    Games.update({name: "default"}, {$set: {curplayer: undefined, player1: undefined, 
                                            player2: undefined}});
  }
})
