(function(){

function shuffled(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
    return a;
}

app.factory('Tiles', [function(){
    var tiles = {};

    tiles.maxState = 5;

    tiles.generate = function(i, j){
           return {
                state: 0,
                i: i,
                j: j
           };
    };

    var scale = d3.scaleLinear().domain([0, tiles.maxState]).range(['white', 'red']); //should probably use css classes instead

    tiles.color = function(tile){ return scale(tile.state) };

    tiles.increment = function(tile){
        tile.state ++;
    };

    tiles.decrement = function(tile){
        tile.state = Math.max(0, tile.state - 1);
    };

    tiles.reset = function(tile){
        tile.state = 0;
    };

    return tiles;

}]);

app.factory('TileFactory', ['Tiles', function(Tiles){

    var makeTiles = function(n){

        tiles = [];

        for(var i = 0; i < n; i++){
            var row = [];
            for(var j = 0; j < n; j++){
                row.push(Tiles.generate(i, j));
            }
            tiles.push(row);
        };

        tiles.forEach = function(action){
            for(var i = 0; i < n; i++){
                for(var j = 0; j < n; j++){
                    action(tiles[i][j]);
                }
            }
        };

        tiles.available = function(){
            var av = [];
            tiles.forEach(function(tile){
                if(tile.state == 0) av.push([tile.i, tile.j]);
            });
            return av;
        };

        tiles.resetRow = function(i){
            for(var j = 0; j < n; j++){
                Tiles.reset(tiles[i][j]);
            }
        };

        tiles.resetColumn = function(j){
            for(var i = 0; i < n; i++){
                Tiles.reset(tiles[i][j]);
            }
        };

        tiles.popup = function(indices){
            for(var i = 0; i < indices.length; i++){
                tiles.increment(indices[i][0], indices[i][1]);
            }
        }

        tiles.bomb = function(i, j){
            var minI = i == 0 ? 0 : (i - 1);
            var minJ = j == 0 ? 0 : (j - 1);;
            var maxI = i == (n - 1) ? (n - 1) : (i + 1);
            var max = j == (n - 1) ? (n - 1) : (j + 1);
            for(var i = minI; i <= maxI; i++){
                for(var j = minJ; j <= maxJ; j++){
                    Tiles.reset(tiles[i][j]);
                }
            }
        };

        tiles.increment = function(i, j){
            Tiles.increment(tiles[i][j]);
        }

        tiles.incrementActive = function(){
            tiles.forEach(function(tile){
                if(tile.state > 0){
                    Tiles.increment(tile);
                }
            })
        }

        tiles.resetAllWithSameNumber = function(i, j){
            var number = tiles[i][j].state;
            tiles.forEach(function(tile){
                if(tile.status == number) Tiles.reset(tile);
            });
        };

        return tiles;

    }

    return makeTiles;

}]);

app.factory('GameState', [function(){

    var cooldowns = 5;

    var rounds = 0;

    var state = {};

    state.rounds = 0;

    state.bombCDR = 0;
    state.crossCDR = 0;
    state.numberCDR = 0;
    state.decrementCDR = 0;

    state.next = function(){
        state.bombCDR = Math.max(0, state.bombCDR - 1);
        state.crossCDR = Math.max(0, state.crossCDR - 1);
        state.numberCDR = Math.max(0, state.numberCDR - 1);
        state.decrementCDR = Math.max(0, state.decrementCDR - 1);
        state.rounds++;
    };

    state.useBomb = function(){
        state.bombCDR = cooldowns;
    };

    state.useCross = function(){
        state.crossCDR = cooldowns;
    };

    state.useNumber = function(){
        state.numberCDR = cooldowns;
    };

    state.useDecrement = function(){
        state.decrementCDR = cooldowns;
    };

    return state;

}]);

app.controller('GameController', ['$scope', 'Tiles', 'TileFactory', 'GameState',
    function($scope, Tiles, TileFactory, GameState){

    var n = 5;
    $scope.n = n;

    var state = GameState;
    $scope.state = state;

    var tiles = TileFactory(n);
    $scope.tiles = tiles;

    console.debug($scope.tiles);

    $scope.tileColor = function(tile){
        return Tiles.color(tile);
    };

    var decrement = function(i, j){
        var t = tiles[i][j].state;
        tiles[i][j].state = 0;
    };

    $scope.launchRow = function(i){
        round(function(){ tiles.resetRow(i);});
    }

    $scope.launchColumn = function(i){
        round(function(){ tiles.resetColumn(i);});
    };

    $scope.decrementAll = function(){
        tiles.forEach(function(tile){Tiles.decrement(tile)});
        state.next();
        state.useDecrement();
    }

    var toggleType = null;

    var toggleWithType = function(type){
        if($scope.gameState == 'TOGGLED'){
            $scope.gameState = 'PLAYING';
        } else {
            $scope.gameState = 'TOGGLED';
            toggleType = type;
        }
    };

    $scope.toggleCrossMode = function(){
        toggleWithType('CROSS');
    };

    $scope.toggleBombMode = function(){
        toggleWithType('BOMB');
    };

    $scope.toggleNumberMode = function(){
        toggleWithType('NUMBER');
    };

    $scope.clickTile = function(tile){
        if($scope.gameState == 'TOGGLED'){
            round(function(){
                if(toggleType == 'CROSS'){
                    tiles.resetRow(tile.i);
                    tiles.resetColumn(tile.j);
                    state.useCross();
                } else if(toggleType == 'BOMB'){
                    tiles.bomb(tile.i, tile.j);
                    state.useBomb();
                } else if(toggleType == 'NUMBER'){
                    tiles.resetAllWithSameNumber(tile.i, tile.j);
                    state.useNumber();
                }
            });
            $scope.gameState = 'PLAYING';
        }
    };

    var nPopup = 2;
    var nPopupInit = 5;

    var round = function(action){
        var available = shuffled(tiles.available());
        action();
        tiles.incrementActive();
        tiles.popup(available.slice(0, Math.min(available.length, nPopup)));
        state.next();
        checkState();
    };

    var checkState = function(){

        tiles.forEach(function(tile){
            if(tile.state >= Tiles.maxState){
                $scope.gameState = 'LOST';
                return;
            }
        });
    }

    tiles.popup(shuffled(tiles.available()).slice(0, nPopupInit));

    $scope.gameState = 'PLAYING';

}]);


})();