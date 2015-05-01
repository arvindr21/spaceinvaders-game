// http://soundbible.com/2091-MP5-SMG-9mm.html
;
(function() {
    var Game = function(canvasId) {
        var canvas = document.getElementById(canvasId);
        this.screen = canvas.getContext('2d');
        this.gameSize = {
            x: canvas.width,
            y: canvas.height
        };

        this.trackAnimationFrameID = 0;
    };
    Game.prototype = {
        startGame: function() {
            var self = this;
            // All the entities in the game
            self.bodies = createInvaders(self).concat(new Player(self, self.gameSize));

            // Game logic
            loadSound('shoot.wav', function(shootSound) {
                self.shootSound = shootSound;
                self.playerAlive = true;
                self.atleastOneInvaderAlive = true;

                var tick = function() {
                    self.update();
                    self.draw(self.screen, self.gameSize);
                    //Run the game logic ~60 times a second
                    self.trackAnimationFrameID = requestAnimationFrame(tick);
                };
                tick();
            });
        },
        resumeGame: function() {
            var self = this;
            // Game logic
            loadSound('shoot.wav', function(shootSound) {
                self.shootSound = shootSound;
                var tick = function() {
                    self.update();
                    self.draw(self.screen, self.gameSize);
                    //Run the game logic ~60 times a second
                    self.trackAnimationFrameID = requestAnimationFrame(tick);
                };
                tick();
            });
        },
        update: function() {
            if (!this.playerAlive) {
                setTimeout(function(game) {
                    game.stopGame();
                    gameOver();
                }, 10, this); // third argument is the game object injected into STO()
            } else if (!this.atleastOneInvaderAlive) {
                setTimeout(function(game) {
                    game.stopGame();
                    youWon();
                }, 10, this); // third argument is the game object injected into STO()
            } else {
                var bodies = this.bodies;

                var notCollidingWithAnything = function(b1) {
                    return bodies.filter(function(b2) {
                        return colliding(b1, b2);
                    }).length === 0;
                }
                this.bodies = this.bodies.filter(notCollidingWithAnything);
                for (var i = 0; i < this.bodies.length; i++) {
                    this.bodies[i].update();
                };


                // check if the player is still alive!
                var isPlayerAlive = function() {
                    return bodies.filter(function(b) {
                        return (b instanceof Player);
                    });
                }

                if (isPlayerAlive().length == 0) {
                    this.playerAlive = false;
                } else {
                    this.playerAlive = true;
                }

                // check if at least one invader is still alive!
                var isatleastOneInvaderAlive = function() {
                    return bodies.filter(function(b) {
                        return (b instanceof Invader);
                    });
                }

                if (isatleastOneInvaderAlive().length == 0) {
                    this.atleastOneInvaderAlive = false;
                } else {
                    this.atleastOneInvaderAlive = true;
                }

            }

        },
        draw: function(screen, gameSize) {
            screen.clearRect(0, 0, gameSize.x, gameSize.y);
            for (var i = 0; i < this.bodies.length; i++) {
                drawRect(screen, this.bodies[i]);
            };
        },
        addBody: function(body) {
            this.bodies.push(body);
        },
        invadersBelow: function(invader) {
            return this.bodies.filter(function(b) {
                return b instanceof Invader && b.center.y > invader.center.y && b.center.x - invader.center.x < invader.size.x;
            }).length > 0;
        },
        pauseGame: function() {
            cancelAnimationFrame(this.trackAnimationFrameID);
        },
        stopGame: function() {
            cancelAnimationFrame(this.trackAnimationFrameID);
            this.screen.clearRect(0, 0, this.gameSize.x, this.gameSize.y);
        }
    };
    // The hero of the game
    var Player = function(game, gameSize) {
        // cache the game object for later use
        this.game = game;
        // Dimensions of the player
        this.size = {
            x: 15,
            y: 15
        };
        // Provide a center for the player. 
        // He will be placed at the bottom mid of screen
        this.center = {
            x: gameSize.x / 2,
            y: gameSize.y - this.size.x
        };
        // Init the keyboader
        this.keyboader = new KeyBoarder();
    };
    Player.prototype = {
        update: function() {
            if (this.keyboader.isDown(this.keyboader.KEYS.LEFT)) {
                this.center.x -= 2;
            } else if (this.keyboader.isDown(this.keyboader.KEYS.RIGHT)) {
                this.center.x += 2;
            }
            if (this.keyboader.isDown(this.keyboader.KEYS.SPACE)) {
                var bullet = new Bullet({
                    x: this.center.x,
                    y: this.center.y - this.size.x / 2
                }, {
                    x: 0,
                    y: -6
                });
                this.game.addBody(bullet);
                this.game.shootSound.load();
                this.game.shootSound.play();
            }
        }
    };
    var Invader = function(game, center) {
        // cache the game object for later use
        this.game = game;
        // Dimensions of the player
        this.size = {
            x: 15,
            y: 15
        };
        // Provide a center for the player. 
        // He will be placed at the bottom mid of screen
        this.center = center;
        this.patrolX = 0;
        this.speedX = 0.3;
    };
    Invader.prototype = {
        update: function() {
            if (this.patrolX < 0 || this.patrolX > 40) {
                this.speedX = -this.speedX;
            }
            this.center.x += this.speedX;
            this.patrolX += this.speedX;
            if (Math.random() > 0.995 && !this.game.invadersBelow(this)) {
                var bullet = new Bullet({
                    x: this.center.x,
                    y: this.center.y + this.size.x / 2
                }, {
                    x: Math.random() - 0.5,
                    y: 2
                });
                this.game.addBody(bullet);
            }
        }
    };
    var createInvaders = function(game) {
        var invaders = [];
        for (var i = 0; i < 24; i++) {
            var x = 30 + (i % 8) * 30;
            var y = 30 + (i % 3) * 30;
            invaders.push(new Invader(game, {
                x: x,
                y: y
            }));
        };
        return invaders;
    };
    // A bullet
    var Bullet = function(center, velocity) {
        // Dimensions of the bullet
        this.size = {
            x: 3,
            y: 3
        };
        this.center = center;
        this.velocity = velocity;
    };
    Bullet.prototype = {
        update: function() {
            this.center.x += this.velocity.x;
            this.center.y += this.velocity.y;
        }
    };
    var drawRect = function(screen, body) {
        screen.fillRect(body.center.x - body.size.x / 2, body.center.y - body.size.y / 2, body.size.x, body.size.y);
    };
    var KeyBoarder = function() {
        var keyState = {};
        window.onkeydown = function(e) {
            keyState[e.keyCode] = true;
        };
        window.onkeyup = function(e) {
            keyState[e.keyCode] = false;
        };
        this.isDown = function(keyCode) {
            return keyState[keyCode] === true;
        };
        this.KEYS = {
            LEFT: 37,
            RIGHT: 39,
            SPACE: 32
        };
    };
    var colliding = function(b1, b2) {
        return !(b1 === b2 || b1.center.x + b1.size.x / 2 < b2.center.x - b2.size.x / 2 || b1.center.y + b1.size.y / 2 < b2.center.y - b2.size.y / 2 || b1.center.x - b1.size.x / 2 > b2.center.x + b2.size.x / 2 || b1.center.y - b1.size.y / 2 > b2.center.y + b2.size.y / 2);
    };

    var loadSound = function(url, callback) {
        var loaded = function() {
            callback(sound);
            sound.removeEventListener('canplaythrough', loaded);
        }

        var sound = new Audio(url);
        sound.addEventListener('canplaythrough', loaded);
        sound.load();
    }

    var screen = document.getElementById('screen');
    var startBtn = document.getElementById('start');
    var pauseBtn = document.getElementById('pause');
    var resumeBtn = document.getElementById('resume');
    var stopBtn = document.getElementById('stop');
    var gameOverHeading = document.getElementById('gameover');
    var youWonHeading = document.getElementById('youwon');

    window.onload = function() {
        var spaceInvaders = new Game('screen');

        startBtn.addEventListener('click', function() {
            this.style.display = 'none';
            gameOverHeading.style.display = 'none';
            youWonHeading.style.display = 'none';
            stopBtn.style.display = 'inline-block';
            pauseBtn.style.display = 'inline-block';
            spaceInvaders.startGame();
        });

        pauseBtn.addEventListener('click', function() {
            this.style.display = 'none';
            stopBtn.style.display = 'inline-block';
            resumeBtn.style.display = 'inline-block';
            spaceInvaders.pauseGame();
        });

        resumeBtn.addEventListener('click', function() {
            this.style.display = 'none';
            stopBtn.style.display = 'inline-block';
            pauseBtn.style.display = 'inline-block';
            spaceInvaders.resumeGame();
        });

        stopBtn.addEventListener('click', function() {
            this.style.display = 'none';
            pauseBtn.style.display = 'inline-block';
            resumeBtn.style.display = 'none';
            startBtn.style.display = 'inline-block';
            gameOverHeading.style.display = 'block';
            spaceInvaders.stopGame();
        });
    };

    function resetState() {
        stopBtn.style.display = 'none';
        pauseBtn.style.display = 'none';
        resumeBtn.style.display = 'none';
        startBtn.style.display = 'inline-block';
    }

    function gameOver() {
        resetState();
        gameOverHeading.style.display = 'block';
    }

    function youWon() {
        resetState();
        youWonHeading.style.display = 'block';
    }
})();
