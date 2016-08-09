(function(){

function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}

app.factory('Tiles', [function(){
    var tiles = {};

    tiles.maxState = 5;

    tiles.generate = function(){
           return {
                state: 0
           };
    };

    var scale = d3.scaleLinear().domain([0, tiles.maxState]).range(['white', 'red']); //should probably use css classes instead

    tiles.color = function(tile){ return scale(tile.state) };

    return tiles;

}])

app.controller('GameController', ['$scope', 'Tiles', function($scope, Tiles){

    var n = 5;
    $scope.n = n;

    var tiles = [];
    $scope.tiles = tiles;
    for(var i = 0; i < n; i++){
        var tileRow = [];
        for(var j = 0; j < n; j++){
            tileRow.push(Tiles.generate());
        }
        tiles.push(tileRow);
    }

    console.debug($scope.tiles);

    $scope.tileColor = function(tile){
        return Tiles.color(tile);
    };

    var decrement = function(i, j){
        var t = tiles[i][j].state;
        tiles[i][j].state = 0;
    };

    $scope.launchRow = function(i){ round(function(){
            for(var j = 0; j < n; j++){
                decrement(i, j);
            }
        });
    };

    $scope.launchColumn = function(j){ round(function(){
            for(var i = 0; i < n ; i++){
                decrement(i, j);
            }
        });
    };

    var incrementAll = function(){
        for(var i = 0; i < n; i++){
            for(var j = 0; j < n; j++){
                if(tiles[i][j].state > 0){
                    tiles[i][j].state++;
                }

            }
        }
    };

    var nPopup = 2;

    var computeAvailable = function(){
        var available = [];
        for(var i = 0; i < n; i++){
            for(var j = 0; j < n; j++){
                if(tiles[i][j].state == 0){
                    available.push([i, j]);
                }

            }
        }
        return available;
    };

    var popup = function(available){
        var nPop = Math.min(nPopup, available.length);
        shuffle(available);
        for(var i = 0; i < nPop; i++){
            tiles[available[i][0]][available[i][1]].state = 1;
        }
    };

    var round = function(action){
        var available = computeAvailable();
        action();
        incrementAll();
        popup(available);
    };

    var checkState = function(){
        for(var i = 0; i < n; i++){
            for(var j = 0; j < n; j++){
                if(tiles[i][j].state >= Tiles.maxState){
                    $scope.gameState = 'LOST';
                    return;
                }
            }
        }
    }

    popup(computeAvailable());

    $scope.gameState = 'PLAYING';

}]);


})();