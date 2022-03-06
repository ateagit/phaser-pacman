let score = 0;
let lives = 3;

function handlePacmanEatPill(pacman, pill) {
  // increase the score by 5
  // remove the pill from the screen
}

function handleGhostEatPacman(pacman, ghosts) {
  // stop pacman
  // make all the ghosts invisible
  // play pacmans death animation
  // decrease lives by 1
}

function loadImages() {
  let baseUrl =
    'https://raw.githubusercontent.com/ateagit/phaser-pacman/master/';

  this.load.setBaseURL(baseUrl);

  this.load.spritesheet('sprites', 'assets/images/pacmansprites.png', {
    frameWidth: 32,
    frameHeight: 32,
  });

  this.load.tilemapTiledJSON('map', 'assets/levels/codepen-level.json');

  this.load.image('background', 'assets/images/background.png');

  this.load.image('pill', 'assets/images/pill/normal_pill.png');

  this.load.image('life', 'assets/images/life/life.png');
}

function setupGame() {
  let tilemap = setupMap(this.make);

  let objects = tilemap.getObjectLayer('Objects').objects;

  let initialPlayerInfo = objects.find((o) => o.name === 'Player');

  let pacman = setupPacmanPlayer(initialPlayerInfo, this.make, this.physics);

  let initialPillsInfo = objects.filter((o) => o.name === 'Pill');

  let pills = setupPills(initialPillsInfo, this.make, this.physics);

  let initialGhostsInfo = objects.filter((o) => o.name === 'Ghost');

  let ghosts = setupGhosts(initialGhostsInfo, this.make, this.physics);

  setupColliders(this.physics, tilemap, pacman, pills, ghosts);

  let cursors = this.input.keyboard.createCursorKeys();

  let scoreText = setupScoreText(this.add);

  let livesImages = setupLivesText(this.add);

  this.data.set('pacman', pacman);
  this.data.set('pills', pills);
  this.data.set('ghosts', ghosts);
  this.data.set('cursors', cursors);
  this.data.set('tilemap', tilemap);
  this.data.set('scoreText', scoreText);
  this.data.set('lives', livesImages);
}

function setupLivesText(gameObjectCreator) {
  let livesImages = [];

  for (let i = 0; i < lives; i++) {
    livesImages.push(gameObjectCreator.image(700 + i * 25, 605, 'life'));
  }

  return livesImages;
}

function setupScoreText(gameObjectCreator) {
  return gameObjectCreator
    .text(25, 595, 'Score: ' + score)
    .setFontFamily('Arial')
    .setFontSize(18)
    .setColor('#ffffff');
}

function setupMap(gameObjectCreator) {
  let tilemap = gameObjectCreator.tilemap({
    key: 'map',
    tileWidth: 32,
    tileHeight: 32,
  });

  let tileset = tilemap.addTilesetImage('pacman-tiles', 'background');

  let mapLayer = tilemap.createLayer('Layer 1', tileset, 0, 0);
  mapLayer.setCollisionByProperty({ collides: true });

  let ghostBlockerLayer = tilemap.createLayer('Layer 2', tileset, 0, 0);
  ghostBlockerLayer.setCollisionByProperty({ collides: true });

  return tilemap;
}

function transformInitialPosition(initialInfo) {
  initialInfo.x = initialInfo.x + initialInfo.width / 2;
  initialInfo.y = initialInfo.y - initialInfo.height / 2;

  return initialInfo;
}

function setupPacmanPlayer(initialPlayerInfo, gameObjectCreator, physics) {
  let player = gameObjectCreator.sprite(
    transformInitialPosition(initialPlayerInfo)
  );

  player.setScale(0.8);

  setupPacmanAnimations(player);

  player.anims.play('eat');

  player.setData('initial-position', initialPlayerInfo);

  physics.add.existing(player);

  return player;
}

function setupPacmanAnimations(pacman) {
  pacman.anims.create({
    key: 'eat',
    frames: pacman.anims.generateFrameNumbers('sprites', {
      start: 9,
      end: 13,
    }),
    frameRate: 10,
    repeat: -1,
  });

  pacman.anims.create({
    key: 'die',
    frames: pacman.anims.generateFrameNumbers('sprites', {
      start: 6,
      end: 8,
    }),
    frameRate: 1,
  });
}

function setupPills(initialPillsInfo, gameObjectCreator, physics) {
  let pillGroup = physics.add.group();

  for (let i = 0; i < initialPillsInfo.length; ++i) {
    let pillInfo = transformInitialPosition(initialPillsInfo[i]);

    let pill = gameObjectCreator.sprite({
      x: pillInfo.x,
      y: pillInfo.y,
      key: 'pill',
    });

    physics.add.existing(pill);

    pillGroup.add(pill);
  }

  return pillGroup;
}

function setupGhosts(initialGhostsInfo, gameObjectCreator, physics) {
  let ghostsGroup = physics.add.group();

  let ghostFrames = [0, 4, 14, 16];
  let ghostColours = ['red', 'orange', 'pink', 'blue'];

  for (let i = 0; i < initialGhostsInfo.length; ++i) {
    let ghostInfo = transformInitialPosition(initialGhostsInfo[i]);

    let ghost = gameObjectCreator.sprite({
      x: ghostInfo.x,
      y: ghostInfo.y,
      key: 'sprites',
      frame: ghostFrames[i],
    });

    ghost.setData('initial-position', ghostInfo);

    ghost.name = ghostColours[i];

    physics.add.existing(ghost);
    ghostsGroup.add(ghost);
  }

  return ghostsGroup;
}

function setupColliders(physics, tilemap, pacman, pills, ghosts) {
  physics.add.collider(pacman, tilemap.getLayer('Layer 1').tilemapLayer);
  physics.add.collider(pacman, tilemap.getLayer('Layer 2').tilemapLayer);
  physics.add.collider(ghosts, tilemap.getLayer('Layer 1').tilemapLayer);

  physics.add.overlap(pacman, pills, handlePacmanEatPill);
  physics.add.overlap(pacman, ghosts, (pacman) => {
    handleGhostEatPacman(pacman, ghosts.children.entries);
  });

  pacman.on('animationcomplete', function (animation) {
    if (animation.key === 'die') {
      handleDieAnimationComplete(pacman, ghosts.children.entries);
    }
  });
}

function handleDieAnimationComplete(pacman, ghosts) {
  respawn(pacman, ghosts);
  for (let i = 0; i < ghosts.length; ++i) {
    let ghost = ghosts[i];

    ghost.setVisible(true);
  }

  pacman.body.setEnable(true);
  pacman.anims.play('eat');
}

function respawn(pacman, ghosts) {
  let pacmanRespawnPoint = pacman.getData('initial-position');
  pacman.setPosition(pacmanRespawnPoint.x, pacmanRespawnPoint.y);

  for (let i = 0; i < ghosts.length; ++i) {
    let ghostRespawnPoint = ghosts[i].getData('initial-position');
    ghosts[i].setPosition(ghostRespawnPoint.x, ghostRespawnPoint.y);
  }
}

let game = main();

function update() {
  let cursors = this.data.get('cursors');
  let pacman = this.data.get('pacman');
  let tilemap = this.data.get('tilemap');
  let ghostsGroup = this.data.get('ghosts');
  let scoreText = this.data.get('scoreText');
  let livesImages = this.data.get('lives');

  handlePacmanMovement(pacman, tilemap, cursors);

  let ghosts = ghostsGroup.children.entries;

  for (let i = 0; i < ghosts.length; ++i) {
    let ghost = ghosts[i];

    handleGhostMovement(ghost, tilemap);
  }

  scoreText.setText('Score: ' + score);

  for (let i = lives; i < livesImages.length; ++i) {
    livesImages[i].alpha = 0;
  }
}

let randomNumberGenerator = new Phaser.Math.RandomDataGenerator();

function handleGhostMovement(ghost, tilemap) {
  let randomNumber = randomNumberGenerator.integerInRange(1, 200);
  let probabilityOfRandomlyChangingDirection = 1;

  // if ghost cant move or we hit that 1/200 chance of changing direction randomly
  if (
    ghost.body.speed === 0 ||
    randomNumber <= probabilityOfRandomlyChangingDirection
  ) {
    changeDirection(getRandomDirection(ghost, tilemap), ghost);
  }
}

function getRandomDirection(ghost, tilemap) {
  let directions = [Phaser.UP, Phaser.RIGHT, Phaser.DOWN, Phaser.LEFT];

  randomNumberGenerator.shuffle(directions);

  for (let i = 0; i < directions.length; ++i) {
    if (canMove(directions[i], ghost, tilemap, 32)) {
      return directions[i];
    }
  }

  throw new Error(ghost.name);
}

let newDirection = Phaser.RIGHT;

let currentDirection;

function handlePacmanMovement(pacman, tilemap, cursors) {
  if (cursors.up.isDown) {
    newDirection = Phaser.UP;
  } else if (cursors.right.isDown) {
    newDirection = Phaser.RIGHT;
  } else if (cursors.down.isDown) {
    newDirection = Phaser.DOWN;
  } else if (cursors.left.isDown) {
    newDirection = Phaser.LEFT;
  }

  if (newDirection === currentDirection) {
    return;
  }

  if (!canMove(newDirection, pacman, tilemap)) {
    return;
  }

  if (!isOpposite(currentDirection, newDirection)) {
    snapToCenterOfTile(pacman);
  }

  changeDirection(newDirection, pacman, true);
  currentDirection = newDirection;
}

function snapToCenterOfTile(pacman) {
  let tileX = Phaser.Math.Snap.Floor(pacman.x, 32);
  let tileY = Phaser.Math.Snap.Floor(pacman.y, 32);
  pacman.x = tileX + 16;
  pacman.y = tileY + 16;
}

let opposites = {
  [Phaser.RIGHT]: Phaser.LEFT,
  [Phaser.LEFT]: Phaser.RIGHT,
  [Phaser.UP]: Phaser.DOWN,
  [Phaser.DOWN]: Phaser.UP,
};

function isOpposite(directionA, directionB) {
  return opposites[directionA] === directionB;
}

function canMove(direction, sprite, tilemap, threshold = 5) {
  let tileX = Phaser.Math.Snap.Floor(sprite.x, 32);
  let tileY = Phaser.Math.Snap.Floor(sprite.y, 32);

  let walls = tilemap.getLayer('Layer 1').tilemapLayer;

  let tileUp = walls.getTileAtWorldXY(tileX, tileY - 32);
  let tileRight = walls.getTileAtWorldXY(tileX + 32, tileY);
  let tileDown = walls.getTileAtWorldXY(tileX, tileY + 32);
  let tileLeft = walls.getTileAtWorldXY(tileX - 32, tileY);

  let distance = Phaser.Math.Distance.Between(
    tileX + 16,
    tileY + 16,
    sprite.x,
    sprite.y
  );

  return (
    {
      [Phaser.UP]: tileUp,
      [Phaser.RIGHT]: tileRight,
      [Phaser.DOWN]: tileDown,
      [Phaser.LEFT]: tileLeft,
    }[direction] === null && distance < threshold
  );
}

function changeDirection(direction, sprite, angle) {
  let speed = 100;
  sprite.body.setVelocity(0);
  switch (direction) {
    case Phaser.UP:
      sprite.body.setVelocityY(-1 * speed);
      angle && sprite.setAngle(-90);
      return;
    case Phaser.RIGHT:
      sprite.body.setVelocityX(speed);
      angle && sprite.setAngle(0);
      return;
    case Phaser.DOWN:
      sprite.body.setVelocityY(speed);
      angle && sprite.setAngle(90);
      return;
    case Phaser.LEFT:
      sprite.body.setVelocityX(-1 * speed);
      angle && sprite.setAngle(180);
      return;
  }
}

function main() {
  let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 625,
    physics: {
      default: 'arcade',
    },
    scene: {
      preload: loadImages,
      create: setupGame,
      update: update,
    },
  };

  let game = new Phaser.Game(config);

  return game;
}
