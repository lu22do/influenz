* Start
Enter player name and game name
Reject if player is already logged in
Reject if game already has 2 players
If game has already 1 player, join it
If game does not exist, create game and wait for second player

* Game
Need popup to select strength


* Partie 
Démarrage de chaque côté d’un plan carré 
L’adversaire ne voit pas ce que fait l’autre 
Le mother engine est la source d’energie, il faut le capturer
On créer des nodules (avec des crédits) qui font relaies d’énergie et ont une force d’influence et de résistance
Les nodules sont créés en tirant des cables (des fils d’énergie à partir d’un node existant) 
Une fois cassé, ils peuvent être capturés mais doivent être réparé
Les crédits sont obtenus régulièrement (éventuellement avec des bonus de source d’énergie)

* Concept
Jeu assez abstrait mais avec des règles assez proche d’une physique de l’énergie
Tour par tour ou bien en simultané (cadencé par les crédits)

* Modes de jeux 
on joue à tour de rôle
on joue sur deux devices (tablet ou PC) 
l’écran peut être partagé en deux pour pouvoir jouer sur le même device avec une feuille verticale comme cache
Start
Connect
Play as player 1

* Details of a turn
Selection of a node, a popup is displayed
    Create a child node (cost: 10)
State « child node creation »
Selection of location (distance reduces energy)
Attributes setting: power & resistance (power * incoming energy)


Mother node: 
Resistance: 1
Power: 10
Sub node at 5 distance:
Resistance: 5 (cost 5)
Power: 5 (cost 5)
Get 5 energy from mother due to distance
Generate 10 energy (+5 due to power)
Has an influence of 10

Meteor notes



TODO
prevent node to be built further than parent's strength
bug: restart causes crash in render  
bug: restart does not show login button to opponent
automated opponent 
turn based