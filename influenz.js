Players = new Mongo.Collection("players");
Nodes = new Mongo.Collection("nodes");

if (Meteor.isClient) {
  var context;
  var SELECTION = 0;
  var CREATION = 1;
  var states = ["Select a node", 
                "Create a node"];
  var creation_parent;
  var cursor_x = 0;
  var cursor_y = 0;

  Session.set('state', CREATION);

  // Get updates when they occur
  Meteor.subscribe('players');
  Meteor.subscribe('nodes');

  getDistance = function() {
    var player = Players.findOne({id: Session.get('playerid')});
    var node = Nodes.findOne({_id: creation_parent});

    return Math.floor(Math.sqrt((cursor_x - node.xpos) * (cursor_x - node.xpos) +
                                (cursor_y - node.ypos) * (cursor_y - node.ypos)));    
  }

  Template.login.events({
    'click .player1': function() {
      Meteor.call('login', 'player1', '#FF0000', function(error, result) {
        Session.set('playerid', 'player1');
      });
    },
    'click .player2': function() {
      Meteor.call('login', 'player2', '#8080FF', function(error, result) {
        Session.set('playerid', 'player2');
      });
    }
  });

  Template.login.helpers({
    notloggedin: function() {
      return Session.get('playerid') ? 'notloggedin' : '';
    }
  });

  Template.info.helpers({
    player: function() {
      return Session.get('playerid');
    },
    credit: function() {
      var player = Players.findOne({id: Session.get('playerid')});
      return player? player.credit: 0;
    },
    state: function() {
      return states[Session.get('state')];
    },
    distance: function() {
      if (Session.get('state') == CREATION && creation_parent) {
        return getDistance();
      }
    }
  });

  // Get arrow key presses
  // Not passing a value allows server to be authoritative
  window.addEventListener("keydown", function(e) {
    switch(e.keyCode) {
      case 37: // left
        if (cursor_x > 0) {
          cursor_x -= 1;
        }
        break;
      case 38: // up
        if (cursor_y > 0) {
          cursor_y -= 1;
        }
        break;
      case 39: // right
        if (cursor_x < WIDTH-1) {
          cursor_x += 1;
        }
        break;
      case 40: // down
        if (cursor_y < HEIGHT-1) {
          cursor_y += 1;
        }
        break;
      
      case 13: // enter
        switch(Session.get('state')) {
          case SELECTION:
            var player = Players.findOne({id: Session.get('playerid')});
            var node = Nodes.findOne({xpos: cursor_x, ypos: cursor_y});
            if (node) {
              creation_parent = node._id;
              Session.set('state', CREATION);
            }
            break;
          
          case CREATION:        
            if (!creation_parent) {
              Meteor.call('createMotherNode', Session.get('playerid'), cursor_x, cursor_y); 
              Session.set('state', SELECTION);
            }
            else {
              var node = Nodes.findOne({_id: creation_parent});
              var power = (node.power - getDistance() / 2);
              var resistance = 5;
              Meteor.call('createSubNode', Session.get('playerid'), cursor_x, cursor_y, creation_parent, power, resistance); 
              creation_parent = undefined;

              Session.set('state', SELECTION);
            }
          break;            
        }
        break;      
    }
  });

  // This is the main render loop
  render = function() {
    if (!context) {
      var canvas = document.getElementById("canvas");
      context = canvas ? canvas.getContext('2d') : undefined; 
    }

    if (context) {
      // Grid
      context.fillStyle = '#000000';
      context.clearRect(0, 0, WIDTH_PIX, HEIGHT_PIX);
      for (var i = 0; i < HEIGHT; i ++) {
        context.fillRect(i*GRID_W_PIX+GRID_W_PIX/2, 0, 1, 400);
      }
      for (var i = 0; i < WIDTH; i ++) {
        context.fillRect(0,i*GRID_W_PIX+GRID_W_PIX/2,400,1);
      }

      // Node links
      Nodes.find().fetch().forEach(function(i){
        if (i.parent) {
          var parent = Nodes.findOne({_id: i.parent});
          context.beginPath();
          context.lineWidth = 3;
          context.strokeStyle = Players.findOne({id: i.player}).color;
          context.moveTo(parent.xpos*GRID_W_PIX + GRID_W_PIX/2, parent.ypos*GRID_W_PIX + GRID_W_PIX/2);
          context.lineTo(i.xpos*GRID_W_PIX + GRID_W_PIX/2, i.ypos*GRID_W_PIX + GRID_W_PIX/2);
          context.stroke();
          context.closePath();
        }
      });

      // Nodes
      Nodes.find().fetch().forEach(function(i){
        context.fillStyle = Players.findOne({id: i.player}).color;
        context.fillRect(i.xpos*GRID_W_PIX, i.ypos*GRID_W_PIX, GRID_W_PIX, GRID_W_PIX);

        context.fillStyle = '#000000';
        context.font = "10px Arial";
        context.fillText(i.power,i.xpos*GRID_W_PIX, i.ypos*GRID_W_PIX + GRID_W_PIX/2);

        context.fillStyle = '#000000';
        context.fill

        if (i.power > 0) {        
          context.beginPath();
          context.arc(i.xpos*GRID_W_PIX, i.ypos*GRID_W_PIX, i.power*GRID_W_PIX, 0, 2 * Math.PI, false);
          context.fillStyle = 'rgba(200,200,200,0.3)';
          context.fill();
          context.closePath();
        }

//        context.font = "10px Arial";
//        context.fillText(i.resistance,i.xpos*GRID_W_PIX, i.ypos*GRID_W_PIX + GRID_W_PIX);
      });

      // Cursor
      var player = Players.findOne({id: Session.get('playerid')});
      if (player) {
        context.beginPath();
        context.lineWidth = 2;
        context.strokeStyle = '#000000';
        context.moveTo(cursor_x*GRID_W_PIX, cursor_y*GRID_W_PIX);
        context.lineTo(cursor_x*GRID_W_PIX + GRID_W_PIX, cursor_y*GRID_W_PIX + GRID_W_PIX);
        context.moveTo(cursor_x*GRID_W_PIX + GRID_W_PIX, cursor_y*GRID_W_PIX);
        context.lineTo(cursor_x*GRID_W_PIX, cursor_y*GRID_W_PIX + GRID_W_PIX);
        context.stroke();
        context.closePath();        
      }
    }
    requestAnimationFrame(render)
  }
  render()
}

var HEIGHT_PIX = 400;
var WIDTH_PIX = 400;
var GRID_W_PIX = 20; // grid width
var HEIGHT = HEIGHT_PIX / GRID_W_PIX;
var WIDTH = WIDTH_PIX / GRID_W_PIX;

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  // Allow clients to subscribe to Players
  Meteor.publish('players', function() {
    return Players.find();
  });

  Meteor.publish('nodes', function() {
    return Nodes.find();
  });

  // Meteor.call('METHODNAME') points here
  Meteor.methods({
    'login': function(playerid, color) {
      if (Players.findOne({id: playerid}) === undefined) {
        // Add a new player for the new user.
        Players.insert({
          id: playerid,
          color: color,
          credit: 100
        });
      } else {
        Players.update({id: playerid}, {      
          id: playerid,
          color: color,
          credit: 100
        });
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
    'createSubNode': function(playerid, xpos, ypos, parent, power, resistance) {
      var player = Players.findOne({id: playerid});

      if (player.credit < 10) {
        return;
      }

      var node = Nodes.insert({
        player: playerid,
        parent: parent,
        xpos: xpos, 
        ypos: ypos, 
        power: power,
        resistance: resistance,
        children: []
      });

      Nodes.update({_id: parent}, {$addToSet: {children: node._id}});
      Players.update({id: playerid}, {$inc: {credit: -10}});
    },
    'reset': function() {
      Nodes.remove({});
      Players.remove({});
    }
  })
}
