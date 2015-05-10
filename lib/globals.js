Players = new Mongo.Collection('players');
Nodes = new Mongo.Collection('nodes');
Games = new Mongo.Collection('games');

HEIGHT_PIX = 400;
WIDTH_PIX = 400;
GRID_W_PIX = 20; // grid width
HEIGHT = HEIGHT_PIX / GRID_W_PIX;
WIDTH = WIDTH_PIX / GRID_W_PIX;

getDistance = function(x1, y1, x2, y2) {
  return Math.floor(Math.sqrt((x1 - x2) * (x1 - x2) +
                              (y1 - y2) * (y1 - y2)));    
}
