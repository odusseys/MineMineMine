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

    tiles.maxState = null;

    var scale = null;

    var computeColorScale = function(){
        scale = d3.scaleLinear().domain([0, tiles.maxState]).range(['white', 'red']);
    };

    tiles.init = function(){
        tiles.maxState = 5;
        computeColorScale();
    };

    tiles.init();

    tiles.color = function(tile){ return scale(tile.state) };

     tiles.generate = function(i, j){
           return {
                state: 0,
                i: i,
                j: j
           };
      };

    tiles.increment = function(tile){
        tile.state ++;
    };

    tiles.decrement = function(tile){
        tile.state = Math.max(0, tile.state - 1);
    };

    tiles.reset = function(tile){
        tile.state = 0;
    };

    tiles.resetMaxState = function(){

    }

    tiles.incrementMaxState = function(){
        tiles.maxState++;
        computeColorScale();
    }

    return tiles;

}]);

app.factory('TileFactory', ['Tiles', function(Tiles){

    var makeTiles = function(size){

        var n = size;

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
        };

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
        };

        tiles.allClear = function(){
            var allClear = true;
            tiles.forEach(function(tile){
                allClear = allClear && tile.state == 0;
            });
            return allClear;
        };

        tiles.highlightBomb = function(i, j){
            var minI = i == 0 ? 0 : (i - 1);
            var minJ = j == 0 ? 0 : (j - 1);;
            var maxI = i == (n - 1) ? (n - 1) : (i + 1);
            var maxJ = j == (n - 1) ? (n - 1) : (j + 1);
            for(var i = minI; i <= maxI; i++){
                for(var j = minJ; j <= maxJ; j++){
                    tiles[i][j].highlighted = true;
                }
            }
        };

        tiles.highlightRow = function(i){
            for(var j = 0; j < n; j++){
                tiles[i][j].highlighted = true;
            }
        };

        tiles.highlightColumn = function(j){
            for(var i = 0; i < n; i++){
                tiles[i][j].highlighted = true;
            }
        };

        tiles.highlightCross = function(i, j){
            tiles.highlightRow(i);
            tiles.highlightColumn(j);
        };

        tiles.highlightNumber = function(i, j){
            var number = tiles[i][j].state;
            tiles.forEach(function(tile){
                if(tile.state == number){
                    tile.highlighted = true;
                }
            });
        };

        tiles.shuffle = function(){
            var collect = [];
            tiles.forEach(function(tile){collect.push(tile);});
            collect = shuffled(collect);
            var t = 0;
            for(var i = 0; i < n; i++){
                for(var j = 0; j < n; j++){
                    tiles[i][j].state = collect[t].state;
                }
            }
        };

        var deadlockedHorizontal = function(){
            for(var i = 0; i < n; i++){
                var t = tiles[i][0].state;
                for(var j = 0; j < n; j++){
                    if(t != tiles[i][j].state){
                        return false;
                    }
                }
            }
            return true;
        };
        var deadlockedVertical = function(){
            for(var i = 0; i < n; i++){
                var t = tiles[0][i].state;
                for(var j = 0; j < n; j++){
                    if(t != tiles[j][i].state){
                        return false;
                    }
                }
            }
            return true;
        };

        tiles.deadlocked = function(){
            return deadlockedHorizontal() || deadlockedVertical();
        };

        tiles.grow = function(){
            for(var i = 0; i < n; i++){
                tiles[i].push(Tiles.generate(i, n));
            }
            n++;
            var newRow = [];
            for(var i = 0; i < n; i++){
                newRow.push(Tiles.generate(n - 1, i));
            }
            tiles.push(newRow);
        };


        return tiles;

    }

    return makeTiles;

}]);

app.factory('GameState', [function(){

    return function(){

        var bombCooldown = 3;
        var crossCooldown = 5;
        var numberCooldown = 5;
        var decrementCooldown = 10;
        var incrementCooldown = 40;

        var state = {};

        state.nPopup = 2;

        var levelupInterval = 10;
        state.level = 1;
        state.popupInterval = 20;
        state.growInterval = 20;

        state.score = 0;

        var scoreMultiplier = 1;

        state.rounds = 0;

        state.bombCDR = 0;
        state.crossCDR = 0;
        state.numberCDR = 0;
        state.decrementCDR = 0;
        state.incrementMaxStateCDR = incrementCooldown;

        state.next = function(){
            state.bombCDR = Math.max(0, state.bombCDR - 1);
            state.crossCDR = Math.max(0, state.crossCDR - 1);
            state.numberCDR = Math.max(0, state.numberCDR - 1);
            state.decrementCDR = Math.max(0, state.decrementCDR - 1);
            state.incrementMaxStateCDR = Math.max(0, state.incrementMaxStateCDR - 1);
            state.rounds++;
            if((state.rounds + state.popupInterval/2) % state.popupInterval == 0){
                state.nPopup ++;
            }
            if(state.rounds % levelupInterval == 0){
                state.level++;
            }
        };

        //always cooldown + 1 because cooldown is immediately decreased after action
        state.useBomb = function(){
            state.bombCDR = bombCooldown + 1;
        };

        state.useCross = function(){
            state.crossCDR = crossCooldown + 1;
        };

        state.useNumber = function(){
            state.numberCDR = numberCooldown + 1;
        };

        state.useDecrement = function(){
            state.decrementCDR = decrementCooldown + 1;
        };

        state.useIncrementMaxState = function(){
            state.incrementMaxStateCDR = incrementCooldown;
        };

        state.addRawScore = function(s){
            state.score += scoreMultiplier * s;
        };

        return state;
    };

}]);

app.controller('GameController', ['$scope', 'Tiles', 'TileFactory', 'GameState',
    function($scope, Tiles, TileFactory, GameState){

    var n = 5;
    var state = null;
    var tiles = null;

    var nPopupInit = 5;

    $scope.Tiles = Tiles; // have to make this decent
    $scope.highScore = 0;
    $scope.showHelp = true;

    $scope.initGame = function(){
        tiles = TileFactory(n);
        Tiles.init();
        state = GameState();
        $scope.tiles = tiles;
        $scope.state = state;

        tiles.popup(shuffled(tiles.available()).slice(0, nPopupInit));
        $scope.gameState = 'PLAYING';
        $scope.toggleType = null;
        $scope.message = "Click on a blue launcher to destroy the mines !";
        $scope.powerupHover = null;
        $scope.highlightLaunchers = true;
    }

    $scope.initGame();

    $scope.tileColor = function(tile){
        return Tiles.color(tile);
    };

    $scope.fontSize = function(){
        var ratio = n/(tiles.length + 0.0);
        return {'font-size': ((ratio * 100).toFixed(2) + '%')};
    };

    var decrement = function(i, j){
        var t = tiles[i][j].state;
        tiles[i][j].state = 0;
    };

    $scope.launchRow = function(i){
        $scope.highlightLaunchers = false;
        round(function(){
            var score = tiles.resetRow(i);
            state.addRawScore(score);
            checkHighScore();
        });
    }

    $scope.launchColumn = function(i){
        $scope.highlightLaunchers = false;
        round(function(){
            var score = tiles.resetColumn(i);
            state.addRawScore(score);
            checkHighScore();
        });
    };

    $scope.decrementAll = function(){
        var score = tiles.decrementAll();
        state.addRawScore(score);
        checkHighScore();
        state.useDecrement();
        checkAllClear();
        state.next();
        $scope.gameState = 'PLAYING';
        $scope.toggleType = null;
    };

    $scope.incrementMaxState = function(){
        Tiles.incrementMaxState();
        state.useIncrementMaxState();
    };

    var toggleWithType = function(type, message){
        if($scope.gameState == 'TOGGLED'){
            if(type == $scope.toggleType){
                $scope.gameState = 'PLAYING';
                $scope.message = null;
                $scope.toggleType = null;
            } else {
                $scope.toggleType = type;
                $scope.message = message;
            }
        } else {
            $scope.gameState = 'TOGGLED';
            $scope.toggleType = type;
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
                if($scope.toggleType == 'CROSS'){
                    score += tiles.resetRow(tile.i);
                    score += tiles.resetColumn(tile.j);
                    state.useCross();
                } else if($scope.toggleType == 'BOMB'){
                    score = tiles.bomb(tile.i, tile.j);
                    state.useBomb();
                } else if($scope.toggleType == 'NUMBER'){
                    score = tiles.resetAllWithSameNumber(tile.i, tile.j);
                    state.useNumber();
                }
                state.addRawScore(score);
                $scope.clearHovers();
                $scope.gameState = 'PLAYING';
                $scope.toggleType = null;
                $scope.message = "";
                checkHighScore();
            });
        }
    };

    var checkHighScore = function(){
        $scope.highScore = Math.max($scope.highScore, state.score);
    }

    var checkAllClear = function(){
        if(tiles.allClear()){
            $scope.message = "Cleared the board ! Bonus points !";
            state.addRawScore(10);
            checkHighScore();
        }
    };

    var round = function(action, popup){
        var available = shuffled(tiles.available());
        action();
        $scope.message = null;
        checkAllClear();
        tiles.incrementActive();
        tiles.popup(available.slice(0, Math.min(available.length, state.nPopup)));
        state.next();
        if(tiles.deadlocked()){
            tiles.shuffle();
        }
        checkState();
        if(state.rounds % state.growInterval == 0){
            tiles.grow();
            $scope.message = "The minefield grew ! Damn !";
        }
    };

    var checkState = function(){
        tiles.forEach(function(tile){
            if(tile.state >= Tiles.maxState){
                $scope.gameState = 'LOST';
                return;
            }
        });
    }

    $scope.hoverLaunchColumn = function(j){
        tiles.highlightColumn(j);
    };

    $scope.hoverLaunchRow = function(i){
        tiles.highlightRow(i);
    }

    $scope.hoverTile = function(tile){
        if($scope.gameState == 'TOGGLED'){
            if($scope.toggleType == 'CROSS'){
                tiles.highlightCross(tile.i, tile.j);
            } else if($scope.toggleType == 'BOMB'){
                tiles.highlightBomb(tile.i, tile.j);
            } else if($scope.toggleType == 'NUMBER'){
                tiles.highlightNumber(tile.i, tile.j);
            }
        }
    };

    $scope.clearHovers = function(){
        tiles.forEach(function(tile){
            tile.highlighted = false;
        });
    };

    $scope.cheat = function(){
        round(function(){
            tiles.forEach(function(tile){
                tile.state = 0;
            });
        });
    }

    $scope.hoverPowerup = function(powerup){
        $scope.powerupHover = powerup;
    };

    $scope.clearPowerupHover = function(){
        $scope.powerupHover = null;
    }

}]);


})();
