class MainScene extends Phaser.Scene {
    constructor() {
        super();
    }

    preload() {
        // Load some assets
        this.load.image('sky', 'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');
        this.load.image('bomb', 'assets/bomb.png');
        this.load.spritesheet(
            'dude',
            'assets/dude.png',
            { frameWidth: 32, frameHeight: 48 }
        );
        this.load.image('ball', 'assets/ball.png');
        this.load.image('wall-h', 'assets/wall-h.png');
        this.load.image('wall-v', 'assets/wall-v.png');

        this.loadCharacterSpritesheets('samurai');
        this.loadCharacterSpritesheets('fighter');
    }

    loadCharacterSpritesheets(name) {
        // Name with the first letter capitalized
        const nameUpper = name[0].toUpperCase() + name.substr(1);
        const size = { frameWidth: 128, frameHeight: 128 };
        this.load.spritesheet(
            `${name}-idle`,
            `assets/shinobi/${nameUpper}/Idle.png`,
            size
        );
        this.load.spritesheet(
            `${name}-walk`,
            `assets/shinobi/${nameUpper}/Walk.png`,
            size
        );
        this.load.spritesheet(
            `${name}-run`,
            `assets/shinobi/${nameUpper}/Run.png`,
            size
        );
        this.load.spritesheet(
            `${name}-attack-1`,
            `assets/shinobi/${nameUpper}/Attack_1.png`,
            size
        );
        this.load.spritesheet(
            `${name}-attack-2`,
            `assets/shinobi/${nameUpper}/Attack_2.png`,
            size
        );
        this.load.spritesheet(
            `${name}-attack-3`,
            `assets/shinobi/${nameUpper}/Attack_3.png`,
            size
        );
        this.load.spritesheet(
            `${name}-hurt`,
            `assets/shinobi/${nameUpper}/Hurt.png`,
            size
        );
    }

    create() {
        // Make a input objects
        this.cursors = this.input.keyboard.createCursorKeys();
        this.attackKey1 = this.input.keyboard.addKey('a');
        this.attackKey2 = this.input.keyboard.addKey('s');
        this.attackKey3 = this.input.keyboard.addKey('d');
        this.input.addPointer(); // Allow for 2 touch points

        // Create animations from spritesheets
        this.createCharacterAnimations('samurai');
        this.createCharacterAnimations('fighter');

        // Create the scene
        this.add.image(400, 300, 'sky');
        const walls = this.physics.add.staticGroup();
        walls.create(32, 300, 'wall-v');
        walls.create(768, 300, 'wall-v');
        walls.create(400, 32, 'wall-h');
        walls.create(400, 568, 'wall-h');
        this.add.text(16, 16, 'Use arrow keys to move, A/S/D to attack', {
            fontSize: '18px',
            fill: '#000'
        });

        this.player = this.physics.add.sprite(100, 450, 'samurai-idle');
        this.player.body.setSize(64, 128);
        this.enemies = [
            this.physics.add.sprite(700, 450, 'fighter-idle'),
            this.physics.add.sprite(400, 250, 'fighter-idle'),
        ];
        for (const enemy of this.enemies) {
            enemy.body.setSize(64, 128);
        }

        this.physics.add.collider(this.player, walls);
        this.physics.add.collider(this.enemies, walls);
    }

    createCharacterAnimations(name) {
        this.anims.create({
            key: `${name}-idle`,
            frames: `${name}-idle`,
            frameRate: 5,
            repeat: -1
        });
        this.anims.create({
            key: `${name}-walk`,
            frames: `${name}-walk`,
            frameRate: 15,
            repeat: -1
        });
        this.anims.create({
            key: `${name}-run`,
            frames: `${name}-run`,
            frameRate: 15,
            repeat: -1
        });
        this.anims.create({
            key: `${name}-attack-1`,
            frames: `${name}-attack-1`,
            frameRate: 15,
            repeat: 0
        });
        this.anims.create({
            key: `${name}-attack-2`,
            frames: `${name}-attack-2`,
            frameRate: 15,
            repeat: 0
        });
        this.anims.create({
            key: `${name}-attack-3`,
            frames: `${name}-attack-3`,
            frameRate: 15,
            repeat: 0
        });
        this.anims.create({
            key: `${name}-hurt`,
            frames: `${name}-hurt`,
            frameRate: 5,
            repeat: 0
        });
    }

    update(time, delta) {
        if (this.playerAttacking) return;

        const moveVector = this.getMoveVector();

        if (this.getAttack()) {
            const attackNumber = this.attackKey2.isDown ? 2 : this.attackKey3.isDown ? 3 : 1;
            this.player.setVelocity(0);
            this.player.anims.play(
                `samurai-attack-${attackNumber}`,
                true
            );
            this.playerAttacking = true;
            this.player.on('animationcomplete', () => {
                this.playerAttacking = false;
                this.lastAttack = attackNumber;
                this.onAttackComplete();
                this.player.off('animationcomplete');
            });
        }
        else if (moveVector.length() > 0) {
            this.player.setVelocity(moveVector.x, moveVector.y);
            this.player.flipX = moveVector.x < 0;
            this.player.anims.play('samurai-run', true);
        }
        else {
            this.player.setVelocity(0);
            this.player.anims.play('samurai-idle', true);
        }

        this.updateEnemies();
    }

    getMoveVector() {
        const scale = 160;

        const moveTouch = this.getMoveTouch();
        if (moveTouch) {
            return moveTouch.scale(scale);
        }

        const moveVector = new Phaser.Math.Vector2(
            this.cursors.right.isDown - this.cursors.left.isDown,
            this.cursors.down.isDown - this.cursors.up.isDown
        ).normalize().scale(scale);
        return moveVector;
    }

    getMoveTouch() {
        const p = this.input.pointer1;

        if (!p.isDown || !p.wasTouch)
            return null;

        const dir =
            new Phaser.Math.Vector2(
                p.x,
                p.y,
            ).subtract(this.player.body.center);

        if (dir.length() < 40)
            return null;

        return dir.normalize();
    }

    getAttack() {
        return this.getAttackByTouch() || this.getAttackByKey();
    }

    getAttackByTouch() {
        const p = this.input.pointer2;
        return p.isDown && p.wasTouch;
    }

    getAttackByKey() {
        return this.attackKey1.isDown || this.attackKey2.isDown || this.attackKey3.isDown;
    }

    updateEnemies() {
        for (const enemy of this.enemies) {
            // Check if the enemy is hurt
            if (enemy.anims.isPlaying && enemy.anims.currentAnim?.key === 'fighter-hurt') {
                continue;
            }

            const playerDirection = this.player.body.center.clone().subtract(enemy.body.center);

            if (playerDirection.length() > 100) {
                enemy.body.velocity = playerDirection.normalize().scale(80);
                enemy.flipX = playerDirection.x < 0;
                enemy.anims.play('fighter-walk', true);
            }
            else {
                enemy.body.velocity.scale(0.9);
                enemy.anims.play('fighter-idle', true);
            }
        }
    }

    onAttackComplete() {
        // Damage enemies
        for (const enemy of this.enemies) {
            // Check if the center of the enemy is in the attack area
            const enemyCenter = new Phaser.Math.Vector2(
                enemy.x + enemy.width / 2,
                enemy.y + enemy.height / 2,
            );
            const attackCenter = new Phaser.Math.Vector2(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2,
            );
            const distance = enemyCenter.distance(attackCenter);
            if (distance < 100) {
                const dir = enemyCenter.clone().subtract(attackCenter);
                const power = 60 / this.lastAttack / this.lastAttack;
                const shake = 0.001 / this.lastAttack;
                enemy.body.velocity.add(dir.normalize().scale(power));
                enemy.anims.play('fighter-hurt', true);
                this.cameras.main.shake(500, shake);
                console.log(shake);
            }
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
        }
    },
    scene: MainScene,
    pixelArt: true,
};

const game = new Phaser.Game(config);
