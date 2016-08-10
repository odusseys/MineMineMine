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
            var score = 0;
            for(var j = 0; j < n; j++){
                score += tiles[i][j].state;
                Tiles.reset(tiles[i][j]);
            }
            return score;
        };

        tiles.resetColumn = function(j){
            var score = 0;
            for(var i = 0; i < n; i++){
                score += tiles[i][j].state;
                Tiles.reset(tiles[i][j]);
            }
            return score;
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
            var maxJ = j == (n - 1) ? (n - 1) : (j + 1);
            var score = 0;
            for(var i = minI; i <= maxI; i++){
                for(var j = minJ; j <= maxJ; j++){
                    score += tiles[i][j].state;
                    Tiles.reset(tiles[i][j]);
                }
            }
            return score;
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
            var score = 0;
            var number = tiles[i][j].state;
            tiles.forEach(function(tile){
                if(tile.state == number){
                    Tiles.reset(tile);
                    score += number;
                }
            });
            return score;
        };

        tiles.decrementAll = function(){
            var score = 0;
            tiles.forEach(function(tile){
              if(tile.state > 0){
                score++;
                Tiles.decrement(tile);
              }
            });
            return score;
        }

        return tiles;

    }

    return makeTiles;

}]);

app.factory('GameState', [function(){

    var cooldowns = 10;

    var state = {};

    state.nPopup = 2;

    var levelupInterval = 10;

    state.score = 0;

    var scoreMultiplier = 1;

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
        if(state.rounds % levelupInterval == 0){
            state.nPopup ++;
        }
    };

    //always cooldown + 1 because cooldown is immediately decreased after action
    state.useBomb = function(){
        state.bombCDR = cooldowns + 1;
    };

    state.useCross = function(){
        state.crossCDR = cooldowns + 1;
    };

    state.useNumber = function(){
        state.numberCDR = cooldowns + 1;
    };

    state.useDecrement = function(){
        state.decrementCDR = cooldowns + 1;
    };

    state.addRawScore = function(s){
        state.score += scoreMultiplier * s;
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
        round(function(){
            var score = tiles.resetRow(i);
            state.addRawScore(score);
        });
    }

    $scope.launchColumn = function(i){
        round(function(){
            var score = tiles.resetColumn(i);
            state.addRawScore(score);
        });
    };

    $scope.decrementAll = function(){
        var score = tiles.decrementAll();
        state.addRawScore(score);
        state.useDecrement();
        state.next();
        $scope.gameState = 'PLAYING';
    }

    var toggleType = null;

    var toggleWithType = function(type, message){
        if($scope.gameState == 'TOGGLED'){
            if(type == toggleType){
                $scope.gameState = 'PLAYING';
                $scope.message = null;
            } else {
                toggleType = type;
                $scope.message = message;
            }
        } else {
            $scope.gameState = 'TOGGLED';
            toggleType = type;
            $scope.message = message;
        }
    };

    $scope.toggleCrossMode = function(){
        toggleWithType('CROSS', "Click on a mine to destroy the corresponding line and row");
    };

    $scope.toggleBombMode = function(){
        toggleWithType('BOMB', "Click on a mine to destroy it and its surroundings.");
    };

    $scope.toggleNumberMode = function(){
        toggleWithType('NUMBER', "Click on a mine to destroy all mines with the same number.");
    };

    $scope.clickTile = function(tile){
        if($scope.gameState == 'TOGGLED'){
            round(function(){
                var score = 0;
                if(toggleType == 'CROSS'){
                    score += tiles.resetRow(tile.i);
                    score += tiles.resetColumn(tile.j);
                    state.useCross();
                } else if(toggleType == 'BOMB'){
                    score = tiles.bomb(tile.i, tile.j);
                    state.useBomb();
                } else if(toggleType == 'NUMBER'){
                    score = tiles.resetAllWithSameNumber(tile.i, tile.j);
                    state.useNumber();
                }
                state.addRawScore(score);
            });
            $scope.gameState = 'PLAYING';
            $scope.message = "";
        }
    };

    var nPopupInit = 5;

    var round = function(action){
        var available = shuffled(tiles.available());
        action();
        tiles.incrementActive();
        console.debug(state.nPopup);
        tiles.popup(available.slice(0, Math.min(available.length, state.nPopup)));
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

    $scope.message = null;

}]);


})();