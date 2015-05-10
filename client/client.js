var context;
var SELECT_PLAYER = 0;
var WAITING_FOR_OTHER_PLAYER = 1;
var CREATION_MOTHER = 2;
var SELECTION = 3;
var CREATION = 4;
var CREATION_POPUP = 5;
var END = 6;

var states = ["Select a player",
              'Waiting for other player',
              "Create the mother node", 
              "Select a node to derive from", 
              "Create a new node",
              "Configure the new node",
              "End of the game"];

var PLAYER1_COLOR = '#FF0000';
var PLAYER2_COLOR = '#8080FF';

Session.setDefault('state', SELECT_PLAYER);
Session.setDefault('creation_parent', undefined);
Session.setDefault('playerid', undefined);
Session.setDefault('cursor_x', undefined);
Session.setDefault('cursor_y', undefined);
Session.setDefault('defaultPower', 0);
Session.setDefault('purchasedPower', 0);

// Get updates when they occur
Meteor.subscribe('players');
Meteor.subscribe('nodes');
Meteor.subscribe('games');

Tracker.autorun(function () {
  var game = Games.findOne({name: "default"});
  console.log('autorun');
  if (game && game.curplayer && Session.get('state') === WAITING_FOR_OTHER_PLAYER) {
    Session.set('state', CREATION_MOTHER);
  }
});

getDistance = function(xpos, ypos, node) {
  var player = Players.findOne({id: Session.get('playerid')});

  return Math.floor(Math.sqrt((xpos - node.xpos) * (xpos - node.xpos) +
                              (ypos - node.ypos) * (ypos - node.ypos)));    
}

getCost = function() {
  return 5 + Session.get('purchasedPower');
}

Template.login.events({
  'click .player1login': function() {
    Meteor.call('login', 'player1', function(error, result) {
      Session.set('playerid', 'player1');
      Session.set('state', WAITING_FOR_OTHER_PLAYER);
      Session.set('cursor_x', WIDTH/2);
      Session.set('cursor_y', HEIGHT-1);
    });
  },
  'click .player2login': function() {
    Meteor.call('login', 'player2', function(error, result) {
      Session.set('playerid', 'player2');
      Session.set('state', WAITING_FOR_OTHER_PLAYER);
      Session.set('cursor_x', WIDTH/2);
      Session.set('cursor_y', 0);
    });
  },
  'click .restart': function() {
    Session.set('state', SELECT_PLAYER);
    Session.set('playerid', undefined);
    Meteor.call('reset');
  }
});

Template.login.helpers({
  notloggedin: function() {
    return Session.get('state') > WAITING_FOR_OTHER_PLAYER ? 'loggedin' : '';
  },
  player1_loggedin: function() {
    var game = Games.findOne({name: "default"});
    return (game && game.player1) ? 'disabled' : '';
  },
  player2_loggedin: function() {
    var game = Games.findOne({name: "default"});
    return (game && game.player2) ? 'disabled' : '';
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
    if (Session.get('state') == CREATION || Session.get('state') == CREATION_POPUP) {
      return getDistance(Session.get('cursor_x'), Session.get('cursor_y'), 
                         Nodes.findOne({_id: Session.get('creation_parent')}));
    }
  }
});

Template.popup.helpers({
  display: function() {
    return Session.get('state') == CREATION_POPUP ? true : false;
  },
  power: function() {
    return Session.get('defaultPower') + Session.get('purchasedPower');
  },
  cost: function() {
    return getCost();
  }
});

Template.end_popup.helpers({
  display: function() {
    return Session.get('state') == END ? true : false;
  },
  message: function() {
    return "End";
  }
});

// Get arrow key presses
// Not passing a value allows server to be authoritative
window.addEventListener("keydown", function(e) {
  var cursor_x = Session.get('cursor_x');
  var cursor_y = Session.get('cursor_y');
  
  switch(e.keyCode) {
    case 37: // left
      switch(Session.get('state')) {
        case SELECTION:
        case CREATION_MOTHER:        
          if (cursor_x > 0) {
            Session.set('cursor_x', cursor_x - 1);
          }
          break;            
        case CREATION:
          var parent = Nodes.findOne({_id: Session.get('creation_parent')});
          if (cursor_x > 0 && getDistance(cursor_x - 1, cursor_y, parent) < parent.power) {
            Session.set('cursor_x', cursor_x - 1);
          }
          break;            
        default:
          break;
      }
      break;
    case 38: // up
      switch(Session.get('state')) {
        case SELECTION:
          if (cursor_y > 0) {
            Session.set('cursor_y', cursor_y - 1);
          }
          break;
        case CREATION:
          var parent = Nodes.findOne({_id: Session.get('creation_parent')});
          if (cursor_y > 0 && getDistance(cursor_x, cursor_y - 1, parent) < parent.power) {
            Session.set('cursor_y', cursor_y - 1);
          }
          break;            
        case CREATION_MOTHER:        
          break;            
        case CREATION_POPUP:
          var power = Session.get('purchasedPower');
          if (power < 5) {
            Session.set('purchasedPower', power + 1);    
          }
          break;            
      }
      break;      
    case 39: // right
      switch(Session.get('state')) {
        case SELECTION:
        case CREATION_MOTHER:        
          if (cursor_x < WIDTH-1) {
            Session.set('cursor_x', cursor_x + 1);
          }
          break;            
        case CREATION:
          var parent = Nodes.findOne({_id: Session.get('creation_parent')});
          if (cursor_x < WIDTH-1 && getDistance(cursor_x + 1, cursor_y, parent) < parent.power) {
            Session.set('cursor_x', cursor_x + 1);
          }
          break;            
        default:
          break;
      }
      break;
    case 40: // down
      switch(Session.get('state')) {
        case SELECTION:
          if (cursor_y  < HEIGHT-1) {
            Session.set('cursor_y', cursor_y + 1);
          }
          break;
        case CREATION:
          var parent = Nodes.findOne({_id: Session.get('creation_parent')});
          if (cursor_y  < HEIGHT-1 && getDistance(cursor_x, cursor_y + 1, parent) < parent.power) {
            Session.set('cursor_y', cursor_y + 1);
          }
          break;            
        case CREATION_MOTHER:        
          break;            
        case CREATION_POPUP:
          var power = Session.get('purchasedPower');
          if (power > 0) {
            Session.set('purchasedPower', power - 1);    
          }
          break;            
      }
      break;
    
    case 13: // enter
      switch(Session.get('state')) {
        case SELECTION:
          var node = Nodes.findOne({xpos: Session.get('cursor_x'), ypos: Session.get('cursor_y')});
          if (node && node.player === Session.get('playerid') && !node.disabled) {
            Session.set('creation_parent', node._id);
            Session.set('state', CREATION);
          }
          break;        
        case CREATION_MOTHER:        
          Meteor.call('createMotherNode', Session.get('playerid'), Session.get('cursor_x'), Session.get('cursor_y')); 
          Session.set('state', SELECTION);
          break;
        case CREATION:
          // Cannot be on top of existing node 
          var node = Nodes.findOne({xpos: Session.get('cursor_x'), ypos: Session.get('cursor_y')});          
          if (node) {
            break;
          }
          var parent = Nodes.findOne({_id: Session.get('creation_parent')});
          var default_power = parent.power - getDistance(Session.get('cursor_x'), Session.get('cursor_y'), parent);
          Session.set('defaultPower', default_power > 0 ? default_power : 0);
          Session.set('purchasedPower', 0);
          Session.set('state', CREATION_POPUP);
          break;   
        case CREATION_POPUP:
          var power = Session.get('defaultPower') + Session.get('purchasedPower'); 
          var cost = getCost(); 
          var resistance = 5;
          Meteor.call('createSubNode', Session.get('playerid'), Session.get('cursor_x'), Session.get('cursor_y'), 
                      Session.get('creation_parent'), power, resistance, cost); 
          Session.set('creation_parent', undefined);
          Session.set('state', SELECTION);        
          break;             
      }
      break;    

    case 27: // esc
      switch(Session.get('state')) {
        case CREATION:
          Session.set('state', SELECTION);
          break;   
        case CREATION_POPUP:
          Session.set('state', CREATION);        
          break;             
      }
      break;  
  }
});

findInObjectArray = function(source, field, value) {
  for (var i = 0; i < source.length; i++) {
    if (source[i][field] === value) {
      return source[i];
    }
  }
  throw "Couldn't find object with id: " + id;
}

// This is the main render loop
render = function() {
  if (!context) {
    var canvas = document.getElementById("canvas");
    context = canvas ? canvas.getContext('2d') : undefined; 
  }

  if (context) {
    var nodes = Nodes.find().fetch(); // cache nodes in case they disapear during redraw
    var colors = [];
    colors['player1'] = PLAYER1_COLOR;
    colors['player2'] = PLAYER2_COLOR;

    // Grid
    context.fillStyle = '#000000';
    context.clearRect(0, 0, WIDTH_PIX, HEIGHT_PIX);
    for (var i = 0; i < HEIGHT; i ++) {
      context.fillRect(i*GRID_W_PIX+GRID_W_PIX/2, 0, 1, 400);
    }
    for (var i = 0; i < WIDTH; i ++) {
      context.fillRect(0,i*GRID_W_PIX+GRID_W_PIX/2,400,1);
    }

    function drawLink(i) {
        var parent = findInObjectArray(nodes, "_id", i.parent);
        context.beginPath();
        context.lineWidth = 3;
        context.strokeStyle = colors[i.player];
        context.moveTo(parent.xpos*GRID_W_PIX + GRID_W_PIX/2, parent.ypos*GRID_W_PIX + GRID_W_PIX/2);
        context.lineTo(i.xpos*GRID_W_PIX + GRID_W_PIX/2, i.ypos*GRID_W_PIX + GRID_W_PIX/2);
        context.stroke();
        context.closePath();
    }

    // Node influences
    nodes.forEach(function(i){
      if (i.power > 0) {        
        context.beginPath();
        context.arc(i.xpos*GRID_W_PIX + GRID_W_PIX/2, i.ypos*GRID_W_PIX + GRID_W_PIX/2, 
                    i.power*GRID_W_PIX, 0, 2 * Math.PI, false);
        context.fillStyle = 'rgba(200,200,200,0.3)';
        context.fill();
        context.closePath();
      }
    });

    // Node links
    nodes.forEach(function(i){
      if (i.parent) {
        drawLink(i);
      }
    });

    // Link for node being created
    if (Session.get('state') == CREATION || Session.get('state') == CREATION_POPUP) {
      var tmpNode = {parent: Session.get('creation_parent'), 
                     xpos: Session.get('cursor_x'), 
                     ypos: Session.get('cursor_y'),
                     player: Session.get('playerid')};
      drawLink(tmpNode);
    }

    // Nodes
    nodes.forEach(function(i){
      if (i.disabled) {
        context.fillStyle = '#A0A0A0';      
      }
      else {
        context.fillStyle = colors[i.player];    
      }
      if (i.parent) {
        context.fillRect(i.xpos*GRID_W_PIX, i.ypos*GRID_W_PIX, GRID_W_PIX, GRID_W_PIX);
      }
      else {
        context.fillRect(i.xpos*GRID_W_PIX - GRID_W_PIX*25/100, i.ypos*GRID_W_PIX - GRID_W_PIX*25/100, 
                         GRID_W_PIX*150/100, GRID_W_PIX*150/100);
      }

      context.fillStyle = '#000000';
      context.font = "18px Arial";
      context.fillText(i.power, i.xpos*GRID_W_PIX + GRID_W_PIX*25/100, i.ypos*GRID_W_PIX + GRID_W_PIX*80/100);

//        context.font = "10px Arial";
//        context.fillText(i.resistance,i.xpos*GRID_W_PIX, i.ypos*GRID_W_PIX + GRID_W_PIX);
    });

    // Cursor
    var player = Players.findOne({id: Session.get('playerid')});
    var cursor_x = Session.get('cursor_x');
    var cursor_y = Session.get('cursor_y');
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