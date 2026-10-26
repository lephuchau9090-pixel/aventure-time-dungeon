/**
 * FILE 3/3: game.js
 * Chứa Lớp điều khiển Game chính, Sinh Dungeon, Kho đồ, AI và Cơ chế Khóa Phòng an toàn
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.miniCanvas = document.getElementById('minimapCanvas');
        this.miniCtx = this.miniCanvas.getContext('2d');
        this.previewCanvas = document.getElementById('charPreviewCanvas');
        this.previewCtx = this.previewCanvas.getContext('2d');

        this.sound = new SoundSystem();
        this.state = 'HOME';
        this.selectedCharId = localStorage.getItem('at_dungeon_hero') || 'finn';

        this.keys = {};
        this.mouse = { x: 480, y: 270, down: false };
        this.mobileDir = { up: false, down: false, left: false, right: false };

        this.homeClouds = [
            { x: 100, y: 70, w: 90, s: 12 },
            { x: 380, y: 45, w: 120, s: 8 },
            { x: 700, y: 85, w: 100, s: 15 }
        ];
        this.homeParticles = [];
        for (let i = 0; i < 25; i++) {
            this.homeParticles.push({
                x: Math.random() * 960,
                y: Math.random() * 540,
                vy: -10 - Math.random() * 20,
                size: 2 + Math.floor(Math.random() * 3),
                color: i % 2 === 0 ? '#ffd93d' : '#ff70a6'
            });
        }

        this.floor = 1;
        this.grid = [];
        this.rooms = [];
        this.decorations = [];
        this.chests = [];
        this.groundItems = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.visualEffects = [];
        this.floatingTexts = [];
        this.traps = [];

        this.player = null;
        this.camera = { x: 0, y: 0 };
        this.screenShake = 0;
        this.selectedInvIndex = -1;
        this.previewAnimTime = 0;

        this.stats = {
            kills: 0,
            goldCollected: 0,
            itemsLooted: 0,
            chestsOpened: 0,
            floorsCleared: 0
        };

        this.lastTime = performance.now();
        this.bindEvents();
        this.initUI();
        requestAnimationFrame((t) => this.loop(t));
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            const code = e.code;
            this.keys[code] = true;

            if (this.state === 'PLAYING') {
                if (code === 'KeyJ') this.playerAttack();
                if (code === 'Digit1') this.useSkill(0);
                if (code === 'Digit2') this.useSkill(1);
                if (code === 'Digit3') this.useSkill(2);
                if (code === 'KeyE') this.interactOrPickup();
                if (code === 'KeyQ') this.quickSwapWeapon();
                if (code === 'KeyI') this.toggleInventory();
                if (code === 'Escape') this.pauseGame();
            } else if (this.state === 'INVENTORY') {
                if (code === 'KeyI' || code === 'Escape') this.toggleInventory();
            } else if (this.state === 'PAUSED') {
                if (code === 'Escape') this.resumeGame();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
            this.mouse.y = ((e.clientY - rect.top) / rect.height) * this.canvas.height;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0 && this.state === 'PLAYING') {
                this.mouse.down = true;
                const worldMouseX = this.mouse.x + this.camera.x;
                const worldMouseY = this.mouse.y + this.camera.y;
                this.player.facingAngle = Math.atan2(worldMouseY - this.player.y, worldMouseX - this.player.x);
                this.player.dir = this.angleToDir(this.player.facingAngle);
                this.playerAttack();
            }
        });

        window.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });

        document.querySelectorAll('.dpad-btn').forEach(btn => {
            const dir = btn.dataset.dir;
            const start = (e) => { e.preventDefault(); this.mobileDir[dir] = true; };
            const end = (e) => { e.preventDefault(); this.mobileDir[dir] = false; };
            btn.addEventListener('touchstart', start, { passive: false });
            btn.addEventListener('touchend', end, { passive: false });
            btn.addEventListener('mousedown', start);
            btn.addEventListener('mouseup', end);
        });

        const bindMobAct = (id, fn) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('touchstart', (e) => { e.preventDefault(); fn(); }, { passive: false });
            el.addEventListener('click', fn);
        };
        bindMobAct('mob-atk', () => this.playerAttack());
        bindMobAct('mob-pickup', () => this.interactOrPickup());
        bindMobAct('mob-s1', () => this.useSkill(0));
        bindMobAct('mob-s2', () => this.useSkill(1));
        bindMobAct('mob-s3', () => this.useSkill(2));
    }

    angleToDir(angle) {
        const deg = (angle * 180) / Math.PI;
        if (deg >= -45 && deg <= 45) return 'right';
        if (deg > 45 && deg < 135) return 'down';
        if (deg >= -135 && deg < -45) return 'up';
        return 'left';
    }

    initUI() {
        const clickWrap = (id, callback) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('click', () => {
                this.sound.sfxClick();
                callback();
            });
        };

        this.updateHomeHeroBadge();
        clickWrap('btn-start', () => { this.sound.startBGM('home'); this.openCharSelect(); });
        clickWrap('btn-char-select', () => { this.sound.startBGM('home'); this.openCharSelect(); });
        clickWrap('btn-settings', () => { this.sound.startBGM('home'); this.openSettings(); });
        clickWrap('btn-info', () => {
            this.sound.startBGM('home');
            document.getElementById('info-screen').classList.add('active');
        });
        clickWrap('btn-close-info', () => {
            document.getElementById('info-screen').classList.remove('active');
        });

        this.buildCharacterCards();
        clickWrap('btn-back-home-char', () => this.goHome());
        clickWrap('btn-confirm-play', () => this.startNewGame());

        this.syncAudioUI();
        clickWrap('toggle-music', () => {
            this.sound.musicOn = !this.sound.musicOn;
            this.sound.saveSettings();
            this.syncAudioUI();
            if (this.sound.musicOn) {
                this.sound.startBGM(this.state === 'PLAYING' ? 'dungeon' : 'home');
            } else {
                this.sound.stopBGM();
            }
        });
        clickWrap('toggle-sfx', () => {
            this.sound.sfxOn = !this.sound.sfxOn;
            this.sound.saveSettings();
            this.syncAudioUI();
        });
        const slider = document.getElementById('volume-slider');
        slider.addEventListener('input', (e) => {
            this.sound.volume = parseInt(e.target.value, 10) / 100;
            document.getElementById('volume-val').textContent = `${e.target.value}%`;
            this.sound.saveSettings();
        });
        clickWrap('btn-close-settings', () => {
            document.getElementById('settings-screen').classList.remove('active');
        });

        clickWrap('btn-hud-inv', () => this.toggleInventory());
        clickWrap('btn-hud-swap', () => this.quickSwapWeapon());
        clickWrap('equipped-weapon-slot', () => this.quickSwapWeapon());
        clickWrap('btn-hud-pause', () => this.pauseGame());
        clickWrap('btn-close-inv', () => this.toggleInventory());
        clickWrap('btn-use-item', () => this.useSelectedInventoryItem());
        clickWrap('btn-drop-item', () => this.dropSelectedInventoryItem());

        document.querySelectorAll('.skill-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                if (this.state === 'PLAYING') this.useSkill(parseInt(slot.dataset.idx, 10));
            });
        });

        clickWrap('btn-resume', () => this.resumeGame());
        clickWrap('btn-pause-settings', () => this.openSettings());
        clickWrap('btn-restart', () => this.startNewGame());
        clickWrap('btn-pause-home', () => this.goHome());

        clickWrap('btn-end-restart', () => this.startNewGame());
        clickWrap('btn-end-char', () => {
            document.getElementById('end-modal').classList.remove('active');
            this.openCharSelect();
        });
        clickWrap('btn-end-home', () => this.goHome());
    }

    syncAudioUI() {
        document.getElementById('toggle-music').textContent = this.sound.musicOn ? 'BẬT' : 'TẮT';
        document.getElementById('toggle-sfx').textContent = this.sound.sfxOn ? 'BẬT' : 'TẮT';
        const pct = Math.round(this.sound.volume * 100);
        document.getElementById('volume-slider').value = pct;
        document.getElementById('volume-val').textContent = `${pct}%`;
    }

    updateHomeHeroBadge() {
        const hero = CHARACTERS[this.selectedCharId];
        document.getElementById('home-hero-name').textContent = hero ? hero.fullName : 'Finn';
    }

    buildCharacterCards() {
        const listEl = document.getElementById('char-list');
        listEl.innerHTML = '';
        Object.values(CHARACTERS).forEach(ch => {
            const card = document.createElement('div');
            card.className = `char-card ${ch.id === this.selectedCharId ? 'selected' : ''}`;
            card.dataset.id = ch.id;

            const miniCvs = document.createElement('canvas');
            miniCvs.width = 56;
            miniCvs.height = 56;
            SpriteRenderer.drawCharacter(miniCvs.getContext('2d'), ch, 28, 30, 1.55, 0, 'down', false);

            const nameDiv = document.createElement('div');
            nameDiv.className = 'char-card-name';
            nameDiv.textContent = ch.name;

            card.appendChild(miniCvs);
            card.appendChild(nameDiv);
            card.addEventListener('click', () => {
                this.sound.sfxClick();
                this.selectCharacter(ch.id);
            });
            listEl.appendChild(card);
        });
        this.selectCharacter(this.selectedCharId);
    }

    selectCharacter(id) {
        this.selectedCharId = id;
        localStorage.setItem('at_dungeon_hero', id);
        this.updateHomeHeroBadge();

        document.querySelectorAll('.char-card').forEach(el => {
            el.classList.toggle('selected', el.dataset.id === id);
        });

        const ch = CHARACTERS[id];
        document.getElementById('detail-name').textContent = ch.fullName;
        document.getElementById('detail-role').textContent = ch.role;
        document.getElementById('detail-desc').textContent = ch.desc;

        document.getElementById('stat-hp').style.width = `${Math.min(100, (ch.hp / 180) * 100)}%`;
        document.getElementById('val-hp').textContent = ch.hp;
        document.getElementById('stat-spd').style.width = `${Math.min(100, (ch.speed / 220) * 100)}%`;
        document.getElementById('val-spd').textContent = ch.speed;
        document.getElementById('stat-dmg').style.width = `${Math.min(100, (ch.damage / 25) * 100)}%`;
        document.getElementById('val-dmg').textContent = ch.damage;
        document.getElementById('stat-rng').style.width = ch.attackType === 'melee' ? '45%' : '90%';
        document.getElementById('val-rng').textContent = ch.rangeType;

        const skBox = document.getElementById('detail-skills');
        skBox.innerHTML = ch.skills.map((s, idx) => `
            <div class="sk-chip">
                <strong>[${idx + 1}] ${s.icon} ${s.name}</strong>
                <span>${s.desc} (CD: ${s.cd}s)</span>
            </div>
        `).join('');
    }

    openCharSelect() {
        this.hideAllOverlays();
        document.getElementById('char-screen').classList.add('active');
        this.state = 'CHAR_SELECT';
        this.selectCharacter(this.selectedCharId);
    }

    openSettings() { document.getElementById('settings-screen').classList.add('active'); }

    goHome() {
        this.hideAllOverlays();
        document.getElementById('hud-layer').classList.add('hidden');
        document.getElementById('home-screen').classList.add('active');
        this.state = 'HOME';
        this.sound.startBGM('home');
    }

    hideAllOverlays() {
        document.querySelectorAll('.screen-overlay').forEach(el => el.classList.remove('active'));
    }

    startNewGame() {
        this.hideAllOverlays();
        document.getElementById('hud-layer').classList.remove('hidden');

        const base = CHARACTERS[this.selectedCharId];
        const starterWep = { ...WEAPONS_DB[base.starterWeapon], instanceId: Date.now() };
        const potion = { ...CONSUMABLES_DB.bacon_pancake, qty: 2 };

        this.player = {
            charId: base.id,
            id: base.id,
            name: base.name,
            x: 0, y: 0,
            radius: 11,
            hp: base.hp, maxHp: base.hp,
            mp: base.mp, maxMp: base.mp,
            baseSpeed: base.speed,
            baseDamage: base.damage,
            colorPrimary: base.colorPrimary,
            colorSecondary: base.colorSecondary,
            hatType: base.hatType,
            attackType: base.attackType,
            facingAngle: Math.PI / 2,
            dir: 'down',
            walkFrame: 0,
            isMoving: false,
            attackCooldown: 0,
            attackAnimTimer: 0,
            invulnTimer: 0,
            speedBuffTimer: 0,
            shieldBuffTimer: 0,
            gold: 0,
            equippedWeapon: starterWep,
            inventory: [starterWep, potion],
            skills: base.skills.map(s => ({ ...s, currentCd: 0 }))
        };

        this.stats = { kills: 0, goldCollected: 0, itemsLooted: 0, chestsOpened: 0, floorsCleared: 0 };
        this.floor = 1;
        this.generateDungeonFloor(this.floor);
        this.setupHUDInitial();

        this.state = 'PLAYING';
        this.sound.startBGM('dungeon');
        this.showToast(`Chào mừng ${base.fullName} đến với Tầng 1!`);
    }

    generateDungeonFloor(floorNum) {
        this.grid = Array.from({ length: MAP_ROWS }, () => Array(MAP_COLS).fill(0));
        this.rooms = [];
        this.decorations = [];
        this.chests = [];
        this.groundItems = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.visualEffects = [];
        this.floatingTexts = [];
        this.traps = [];

        const gridCols = 3;
        const gridRows = 2;
        const cellW = Math.floor((MAP_COLS - 6) / gridCols);
        const cellH = Math.floor((MAP_ROWS - 6) / gridRows);

        for (let r = 0; r < gridRows; r++) {
            for (let c = 0; c < gridCols; c++) {
                const w = 11 + Math.floor(Math.random() * 3);
                const h = 9 + Math.floor(Math.random() * 3);
                const x = 3 + c * cellW + Math.floor((cellW - w) / 2);
                const y = 3 + r * cellH + Math.floor((cellH - h) / 2);

                const roomIndex = this.rooms.length;
                const room = {
                    id: roomIndex,
                    x, y, w, h,
                    cx: Math.floor(x + w / 2),
                    cy: Math.floor(y + h / 2),
                    cleared: roomIndex === 0,
                    discovered: roomIndex === 0,
                    locked: false,
                    doorTiles: []
                };
                this.rooms.push(room);

                for (let ry = y; ry < y + h; ry++) {
                    for (let rx = x; rx < x + w; rx++) {
                        this.grid[ry][rx] = 1;
                    }
                }
            }
        }

        const order = [0, 1, 2, 5, 4, 3];
        for (let i = 0; i < order.length - 1; i++) {
            const rA = this.rooms[order[i]];
            const rB = this.rooms[order[i + 1]];
            this.carveCorridor(rA.cx, rA.cy, rB.cx, rB.cy);
        }

        for (let y = 1; y < MAP_ROWS - 1; y++) {
            for (let x = 1; x < MAP_COLS - 1; x++) {
                if (this.grid[y][x] === 0) {
                    let nearFloor = false;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (this.grid[y + dy][x + dx] === 1) nearFloor = true;
                        }
                    }
                    if (nearFloor) this.grid[y][x] = 2;
                }
            }
        }

        this.rooms.forEach(room => {
            for (let x = room.x; x < room.x + room.w; x++) {
                if (this.grid[room.y - 1][x] === 1) room.doorTiles.push({ x, y: room.y - 1 });
                if (this.grid[room.y + room.h][x] === 1) room.doorTiles.push({ x, y: room.y + room.h });
            }
            for (let y = room.y; y < room.y + room.h; y++) {
                if (this.grid[y][room.x - 1] === 1) room.doorTiles.push({ x: room.x - 1, y });
                if (this.grid[y][room.x + room.w] === 1) room.doorTiles.push({ x: room.x + room.w, y });
            }
        });

        const startRoom = this.rooms[0];
        this.player.x = startRoom.cx * TILE_SIZE + TILE_SIZE / 2;
        this.player.y = startRoom.cy * TILE_SIZE + TILE_SIZE / 2;

        const lastRoom = this.rooms[order[order.length - 1]];
        this.rooms.forEach((room, idx) => {
            this.decorations.push({ x: (room.x + 1) * TILE_SIZE, y: (room.y + 1) * TILE_SIZE, type: 'torch' });
            this.decorations.push({ x: (room.x + room.w - 2) * TILE_SIZE, y: (room.y + 1) * TILE_SIZE, type: 'torch' });
            if (Math.random() < 0.7) {
                this.decorations.push({
                    x: (room.x + 2 + Math.floor(Math.random() * (room.w - 4))) * TILE_SIZE,
                    y: (room.y + 2 + Math.floor(Math.random() * (room.h - 4))) * TILE_SIZE,
                    type: Math.random() < 0.5 ? 'bones' : 'mushroom'
                });
            }

            if (idx === 0) return;

            if (Math.random() < 0.65 || room === lastRoom) {
                this.chests.push({
                    x: (room.x + 2) * TILE_SIZE + 16,
                    y: (room.y + room.h - 2) * TILE_SIZE + 16,
                    opened: false
                });
            }

            if (room === lastRoom) {
                if (floorNum < 3) {
                    this.grid[room.cy][room.cx] = 4;
                } else {
                    this.spawnEnemy('boss_lich_ice', room.cx * TILE_SIZE, room.cy * TILE_SIZE, room.id);
                }
            }

            const count = 2 + floorNum + Math.floor(Math.random() * 2);
            const pool = floorNum === 1
                ? ['candy_zombie', 'slime_ooze']
                : floorNum === 2
                    ? ['ice_golem', 'gunter_bot', 'candy_zombie']
                    : ['shadow_wraith', 'ice_golem', 'gunter_bot'];

            for (let i = 0; i < count; i++) {
                // Sinh quái sâu bên trong lòng phòng (cách tường tối thiểu 2 ô)
                const ex = (room.x + 2 + Math.floor(Math.random() * (room.w - 4))) * TILE_SIZE + 16;
                const ey = (room.y + 2 + Math.floor(Math.random() * (room.h - 4))) * TILE_SIZE + 16;
                const typeKey = pool[Math.floor(Math.random() * pool.length)];
                this.spawnEnemy(typeKey, ex, ey, room.id);
            }
        });
    }

    carveCorridor(x1, y1, x2, y2) {
        let cx = x1;
        let cy = y1;
        while (cx !== x2) {
            this.grid[cy][cx] = 1;
            this.grid[cy + 1][cx] = 1;
            cx += cx < x2 ? 1 : -1;
        }
        while (cy !== y2) {
            this.grid[cy][cx] = 1;
            this.grid[cy][cx + 1] = 1;
            cy += cy < y2 ? 1 : -1;
        }
    }

    spawnEnemy(typeKey, x, y, roomId) {
        const tpl = ENEMY_TYPES[typeKey];
        const scale = 1 + (this.floor - 1) * 0.18;
        this.enemies.push({
            typeKey,
            name: tpl.name,
            x, y,
            radius: tpl.radius,
            hp: Math.round(tpl.hp * (tpl.isBoss ? 1 : scale)),
            maxHp: Math.round(tpl.hp * (tpl.isBoss ? 1 : scale)),
            damage: Math.round(tpl.damage * (tpl.isBoss ? 1 : scale)),
            speed: tpl.speed,
            color: tpl.color,
            eyeColor: tpl.eyeColor,
            behavior: tpl.behavior,
            xpGold: tpl.xpGold,
            isBoss: !!tpl.isBoss,
            roomId,
            facingLeft: false,
            animOffset: Math.random() * 10,
            patrolAngle: Math.random() * Math.PI * 2,
            patrolTimer: 1.5,
            atkCooldown: 1.0,
            hurtFlash: 0,
            bossPhaseTimer: 3.0
        });
    }

    loop(now) {
        const dt = Math.min(0.05, (now - this.lastTime) / 1000);
        this.lastTime = now;
        this.previewAnimTime += dt;

        if (this.state === 'HOME' || this.state === 'CHAR_SELECT') {
            this.updateHomeScene(dt);
            this.renderHomeScene(now / 1000);
            if (this.state === 'CHAR_SELECT') {
                const ch = CHARACTERS[this.selectedCharId];
                const dirs = ['down', 'right', 'up', 'left'];
                const curDir = dirs[Math.floor(this.previewAnimTime * 0.7) % 4];
                const isAtk = Math.floor(this.previewAnimTime * 2) % 5 === 0;
                this.previewCtx.clearRect(0, 0, 96, 96);
                SpriteRenderer.drawCharacter(this.previewCtx, ch, 48, 52, 2.5, this.previewAnimTime * 7, curDir, isAtk);
            }
        } else if (this.state === 'PLAYING') {
            this.updateGameplay(dt);
            this.renderGameplay(now / 1000);
        } else if (this.state === 'PAUSED' || this.state === 'INVENTORY' || this.state === 'END') {
            this.renderGameplay(now / 1000);
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    updateHomeScene(dt) {
        this.homeClouds.forEach(c => {
            c.x += c.s * dt;
            if (c.x > 1020) c.x = -140;
        });
        this.homeParticles.forEach(p => {
            p.y += p.vy * dt;
            if (p.y < 0) {
                p.y = 540;
                p.x = Math.random() * 960;
            }
        });
    }

    updateGameplay(dt) {
        const p = this.player;
        if (!p) return;

        p.mp = Math.min(p.maxMp, p.mp + 3.5 * dt);

        if (p.attackCooldown > 0) p.attackCooldown -= dt;
        if (p.attackAnimTimer > 0) p.attackAnimTimer -= dt;
        if (p.invulnTimer > 0) p.invulnTimer -= dt;
        if (p.speedBuffTimer > 0) p.speedBuffTimer -= dt;
        if (p.shieldBuffTimer > 0) p.shieldBuffTimer -= dt;
        if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 25);

        p.skills.forEach(s => {
            if (s.currentCd > 0) s.currentCd = Math.max(0, s.currentCd - dt);
        });

        let dx = 0, dy = 0;
        if (this.keys['KeyW'] || this.keys['ArrowUp'] || this.mobileDir.up) dy -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown'] || this.mobileDir.down) dy += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft'] || this.mobileDir.left) dx -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight'] || this.mobileDir.right) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            dx /= len;
            dy /= len;
            p.facingAngle = Math.atan2(dy, dx);
            if (p.attackAnimTimer <= 0) {
                p.dir = this.angleToDir(p.facingAngle);
            }
            p.walkFrame += dt * 11;
            p.isMoving = true;

            const spd = p.baseSpeed * (p.speedBuffTimer > 0 ? 1.5 : 1);
            this.moveEntityWithCollision(p, dx * spd * dt, dy * spd * dt);

            if (Math.random() < 0.28) {
                const dustColor = p.speedBuffTimer > 0 ? '#ffd93d' : '#9e92b5';
                this.spawnParticle(p.x, p.y + 12, dustColor, 18, 0.25, 3);
            }
        } else {
            p.isMoving = false;
            p.walkFrame = 0;
        }

        // Kiểm tra đóng/mở cửa phòng an toàn (Đã sửa lỗi kẹt quái ngoài cửa!)
        this.updateRoomLockState();

        const tx = Math.floor(p.x / TILE_SIZE);
        const ty = Math.floor(p.y / TILE_SIZE);
        if (this.grid[ty] && this.grid[ty][tx] === 4) {
            const curRoom = this.getRoomAt(tx, ty);
            if (!curRoom || curRoom.cleared) {
                this.nextFloor();
                return;
            }
        }

        for (let i = this.groundItems.length - 1; i >= 0; i--) {
            const g = this.groundItems[i];
            const dist = Math.hypot(p.x - g.x, p.y - g.y);
            if (dist < 24) {
                if (g.item.type === 'gold') {
                    p.gold += g.item.amount;
                    this.stats.goldCollected += g.item.amount;
                    this.sound.sfxPickup();
                    this.spawnFloatingText(p.x, p.y - 16, `+${g.item.amount}G`, '#ffd93d');
                    this.groundItems.splice(i, 1);
                } else if (g.autoPickup) {
                    this.pickupGroundItem(i);
                }
            }
        }

        for (let i = this.traps.length - 1; i >= 0; i--) {
            const trap = this.traps[i];
            trap.timer -= dt;
            let triggered = false;
            for (const e of this.enemies) {
                if (Math.hypot(e.x - trap.x, e.y - trap.y) < e.radius + 18) {
                    triggered = true;
                    break;
                }
            }
            if (triggered || trap.timer <= 0) {
                this.sound.sfxHit();
                this.addVisualEffect({
                    type: 'shockwave',
                    x: trap.x, y: trap.y,
                    maxRadius: 85,
                    color: '#ff70a6',
                    secondaryColor: '#ffd93d',
                    life: 0.35, maxLife: 0.35
                });
                this.createExplosion(trap.x, trap.y, 80, trap.damage, '#ff70a6');
                this.traps.splice(i, 1);
            }
        }

        this.updateProjectiles(dt);
        this.updateEnemies(dt);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const pt = this.particles[i];
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.life -= dt;
            if (pt.life <= 0) this.particles.splice(i, 1);
        }

        for (let i = this.visualEffects.length - 1; i >= 0; i--) {
            const vfx = this.visualEffects[i];
            vfx.life -= dt;
            if (vfx.followPlayer && this.player) {
                vfx.x = this.player.x;
                vfx.y = this.player.y;
            }
            if (vfx.vx) vfx.x += vfx.vx * dt;
            if (vfx.vy) vfx.y += vfx.vy * dt;
            if (vfx.life <= 0) this.visualEffects.splice(i, 1);
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y -= 28 * dt;
            ft.life -= dt;
            if (ft.life <= 0) this.floatingTexts.splice(i, 1);
        }

        const targetCamX = p.x - this.canvas.width / 2;
        const targetCamY = p.y - this.canvas.height / 2;
        this.camera.x += (targetCamX - this.camera.x) * 0.14;
        this.camera.y += (targetCamY - this.camera.y) * 0.14;

        this.updateHUD();
    }

    addVisualEffect(vfx) { this.visualEffects.push(vfx); }

    spawnFloatingText(x, y, text, color = '#ffffff') {
        this.floatingTexts.push({
            x: x + (Math.random() * 12 - 6),
            y, text, color, life: 0.65
        });
    }

    getRoomAt(tileX, tileY) {
        return this.rooms.find(r => tileX >= r.x && tileX < r.x + r.w && tileY >= r.y && tileY < r.y + r.h);
    }

    // Kiểm tra người chơi đã bước hẳn vào bên trong lòng phòng (cách cửa ít nhất 1 ô) chưa
    isPlayerDeepInsideRoom(room) {
        const minX = (room.x + 0.85) * TILE_SIZE;
        const maxX = (room.x + room.w - 0.85) * TILE_SIZE;
        const minY = (room.y + 0.85) * TILE_SIZE;
        const maxY = (room.y + room.h - 0.85) * TILE_SIZE;
        return this.player.x >= minX && this.player.x <= maxX && this.player.y >= minY && this.player.y <= maxY;
    }

    // Kẹp chặt vị trí của quái vật luôn nằm gọn trong căn phòng của nó (Không bao giờ lọt ra hành lang)
    clampEnemyInsideRoom(enemy) {
        const room = this.rooms[enemy.roomId];
        if (!room) return;
        const pad = enemy.radius + 6;
        const minX = room.x * TILE_SIZE + pad;
        const maxX = (room.x + room.w) * TILE_SIZE - pad;
        const minY = room.y * TILE_SIZE + pad;
        const maxY = (room.y + room.h) * TILE_SIZE - pad;

        if (enemy.x < minX) enemy.x = minX;
        if (enemy.x > maxX) enemy.x = maxX;
        if (enemy.y < minY) enemy.y = minY;
        if (enemy.y > maxY) enemy.y = maxY;
    }

    updateRoomLockState() {
        const pTileX = Math.floor(this.player.x / TILE_SIZE);
        const pTileY = Math.floor(this.player.y / TILE_SIZE);
        const room = this.getRoomAt(pTileX, pTileY);

        // Trước tiên: Kiểm tra mọi phòng đang bị khóa, nếu quái trong phòng đó = 0 thì lập tức mở cửa!
        this.rooms.forEach(r => {
            if (r.locked) {
                const remaining = this.enemies.filter(e => e.roomId === r.id);
                if (remaining.length === 0) {
                    r.locked = false;
                    r.cleared = true;
                    r.doorTiles.forEach(d => {
                        if (this.grid[d.y][d.x] === 3) this.grid[d.y][d.x] = 1;
                    });
                    this.sound.sfxChest();
                    this.showToast('🔓 Đã dọn sạch phòng! Cửa đã mở!');
                }
            }
        });

        if (!room) return;
        room.discovered = true;

        const aliveInRoom = this.enemies.filter(e => e.roomId === room.id);

        // Chỉ khóa cửa khi người chơi đã bước hẳn vào bên trong lòng phòng (tránh kẹt ở cửa)
        if (aliveInRoom.length > 0 && !room.locked && this.isPlayerDeepInsideRoom(room)) {
            room.locked = true;
            // Kéo toàn bộ quái của phòng đó vào gọn trong phòng ngay lập tức
            aliveInRoom.forEach(e => this.clampEnemyInsideRoom(e));
            room.doorTiles.forEach(d => {
                if (this.grid[d.y][d.x] === 1) this.grid[d.y][d.x] = 3;
            });
        }
    }

    nextFloor() {
        this.stats.floorsCleared++;
        this.floor++;
        this.sound.sfxWin();
        this.generateDungeonFloor(this.floor);
        this.showToast(`Chuyển sang ${FLOOR_THEMES[this.floor - 1].name}`);
    }

    isTileBlocked(tx, ty) {
        if (ty < 0 || ty >= MAP_ROWS || tx < 0 || tx >= MAP_COLS) return true;
        const cell = this.grid[ty][tx];
        return cell === 0 || cell === 2 || cell === 3;
    }

    moveEntityWithCollision(ent, moveX, moveY) {
        const r = ent.radius;
        const nextX = ent.x + moveX;
        const checkX = moveX > 0 ? nextX + r : nextX - r;
        const topY = Math.floor((ent.y - r + 2) / TILE_SIZE);
        const botY = Math.floor((ent.y + r - 2) / TILE_SIZE);
        const tileX = Math.floor(checkX / TILE_SIZE);
        if (!this.isTileBlocked(tileX, topY) && !this.isTileBlocked(tileX, botY)) {
            ent.x = nextX;
        }

        const nextY = ent.y + moveY;
        const checkY = moveY > 0 ? nextY + r : nextY - r;
        const leftX = Math.floor((ent.x - r + 2) / TILE_SIZE);
        const rightX = Math.floor((ent.x + r - 2) / TILE_SIZE);
        const tileY = Math.floor(checkY / TILE_SIZE);
        if (!this.isTileBlocked(leftX, tileY) && !this.isTileBlocked(rightX, tileY)) {
            ent.y = nextY;
        }
    }

    playerAttack() {
        const p = this.player;
        if (!p || p.attackCooldown > 0) return;

        const wep = p.equippedWeapon;
        const speedMul = p.speedBuffTimer > 0 ? 0.65 : 1;
        p.attackCooldown = wep.cooldown * speedMul;
        p.attackAnimTimer = 0.22;
        p.dir = this.angleToDir(p.facingAngle);
        this.sound.sfxAttack();

        const totalDmg = p.baseDamage + wep.damage;

        if (wep.type === 'melee') {
            const reach = wep.range + (p.attackType === 'stretch' ? 18 : 0);

            this.addVisualEffect({
                type: 'slash_arc',
                x: p.x, y: p.y,
                angle: p.facingAngle,
                radius: reach * 0.78,
                color: wep.color || '#ffd93d',
                life: 0.16, maxLife: 0.16,
                followPlayer: true
            });

            this.enemies.forEach(e => {
                const dist = Math.hypot(e.x - p.x, e.y - p.y);
                if (dist <= reach + e.radius) {
                    const angleToEnemy = Math.atan2(e.y - p.y, e.x - p.x);
                    let diff = Math.abs(angleToEnemy - p.facingAngle);
                    if (diff > Math.PI) diff = Math.PI * 2 - diff;
                    if (diff <= 1.25) {
                        this.damageEnemy(e, totalDmg, Math.cos(p.facingAngle) * 14, Math.sin(p.facingAngle) * 14);
                    }
                }
            });
        } else {
            this.projectiles.push({
                x: p.x + Math.cos(p.facingAngle) * 14,
                y: p.y + Math.sin(p.facingAngle) * 14,
                vx: Math.cos(p.facingAngle) * 340,
                vy: Math.sin(p.facingAngle) * 340,
                radius: 5,
                damage: totalDmg,
                color: wep.color,
                fromPlayer: true,
                life: wep.range / 340,
                pierce: false,
                projStyle: p.charId
            });
        }
    }

    useSkill(index) {
        const p = this.player;
        if (!p || this.state !== 'PLAYING') return;
        const sk = p.skills[index];
        if (!sk) return;

        if (sk.currentCd > 0) {
            this.showToast(`${sk.name} đang hồi chiêu (${sk.currentCd.toFixed(1)}s)!`);
            return;
        }
        if (p.mp < sk.mp) {
            this.showToast('Không đủ Năng lượng (MP)!');
            return;
        }

        p.mp -= sk.mp;
        sk.currentCd = sk.cd;
        p.attackAnimTimer = 0.28;
        this.sound.sfxSkill();

        const baseDmg = p.baseDamage + p.equippedWeapon.damage;
        const angle = p.facingAngle;

        if (p.charId === 'finn') {
            if (index === 0) {
                this.screenShake = 5;
                this.addVisualEffect({
                    type: 'whirlwind_slash',
                    x: p.x, y: p.y,
                    radius: 82, color: '#ffd93d', secondaryColor: '#2998ff',
                    life: 0.38, maxLife: 0.38, followPlayer: true
                });
                this.createExplosion(p.x, p.y, 82, baseDmg * 1.45, '#ffd93d');
            } else if (index === 1) {
                this.screenShake = 6;
                this.projectiles.push({
                    x: p.x, y: p.y,
                    vx: Math.cos(angle) * 390, vy: Math.sin(angle) * 390,
                    angle, radius: 18, damage: baseDmg * 2.1, color: '#ffd93d',
                    fromPlayer: true, life: 0.75, pierce: true,
                    projStyle: 'crescent_wave'
                });
            } else if (index === 2) {
                p.speedBuffTimer = 4.5;
                this.addVisualEffect({
                    type: 'aura_burst',
                    x: p.x, y: p.y, radius: 56, color: '#ffd93d',
                    life: 0.5, maxLife: 0.5, followPlayer: true
                });
                this.showToast('⚡ Trái Tim Anh Hùng: Tăng 50% Tốc chạy & Tốc đánh!');
            }
        } else if (p.charId === 'jake') {
            if (index === 0) {
                this.screenShake = 7;
                const reach = 155;
                this.addVisualEffect({
                    type: 'jake_giant_punch',
                    x: p.x, y: p.y, angle, length: reach,
                    life: 0.32, maxLife: 0.32, followPlayer: true
                });
                this.enemies.forEach(e => {
                    const dist = Math.hypot(e.x - p.x, e.y - p.y);
                    if (dist <= reach + e.radius) {
                        const a = Math.atan2(e.y - p.y, e.x - p.x);
                        let diff = Math.abs(a - angle);
                        if (diff > Math.PI) diff = Math.PI * 2 - diff;
                        if (diff < 0.65) {
                            this.damageEnemy(e, baseDmg * 1.85, Math.cos(angle) * 36, Math.sin(angle) * 36);
                        }
                    }
                });
            } else if (index === 1) {
                this.screenShake = 10;
                this.addVisualEffect({
                    type: 'earth_shatter',
                    x: p.x, y: p.y, maxRadius: 115,
                    color: '#f7b519', secondaryColor: '#fb8500',
                    life: 0.55, maxLife: 0.55
                });
                this.createExplosion(p.x, p.y, 110, baseDmg * 1.9, '#fb8500');
            } else if (index === 2) {
                p.shieldBuffTimer = 5.0;
                this.addVisualEffect({
                    type: 'aura_burst',
                    x: p.x, y: p.y, radius: 52, color: '#f7b519',
                    life: 0.45, maxLife: 0.45, followPlayer: true
                });
                this.showToast('🛡️ Giáp Chó Phép Thuật: Giảm 65% sát thương!');
            }
        } else if (p.charId === 'pb') {
            if (index === 0) {
                [-0.22, 0, 0.22].forEach(offset => {
                    const a = angle + offset;
                    this.projectiles.push({
                        x: p.x, y: p.y,
                        vx: Math.cos(a) * 360, vy: Math.sin(a) * 360,
                        radius: 7, damage: baseDmg * 1.15, color: '#ff70a6',
                        fromPlayer: true, life: 0.85, pierce: false,
                        projStyle: 'plasma_candy'
                    });
                });
            } else if (index === 1) {
                this.traps.push({ x: p.x, y: p.y, damage: baseDmg * 2.5, timer: 6.0 });
                this.addVisualEffect({
                    type: 'shockwave',
                    x: p.x, y: p.y, maxRadius: 32,
                    color: '#ff70a6', secondaryColor: '#ffffff',
                    life: 0.25, maxLife: 0.25
                });
                this.showToast('💣 Đã đặt Mìn Kẹo Cảm Ứng!');
            } else if (index === 2) {
                p.hp = Math.min(p.maxHp, p.hp + 45);
                this.spawnFloatingText(p.x, p.y - 18, '+45 HP', '#6ce88b');
                this.addVisualEffect({
                    type: 'heal_fountain',
                    x: p.x, y: p.y, radius: 48,
                    color: '#6ce88b', secondaryColor: '#ff70a6',
                    life: 0.65, maxLife: 0.65, followPlayer: true
                });
                this.showToast('💖 Huyết Thanh Ngọt: Hồi +45 Máu!');
            }
        } else if (p.charId === 'marceline') {
            if (index === 0) {
                this.screenShake = 5;
                this.projectiles.push({
                    x: p.x, y: p.y,
                    vx: Math.cos(angle) * 360, vy: Math.sin(angle) * 360,
                    angle, radius: 16, damage: baseDmg * 1.75, color: '#e63946',
                    fromPlayer: true, life: 0.8, pierce: true,
                    projStyle: 'sonic_chord'
                });
            } else if (index === 1) {
                p.invulnTimer = 0.65;
                for (let s = 0; s < 5; s++) {
                    this.addVisualEffect({
                        type: 'dash_afterimage',
                        x: p.x, y: p.y, dir: p.dir, charId: p.charId,
                        life: 0.28 + s * 0.04, maxLife: 0.35
                    });
                    this.moveEntityWithCollision(p, Math.cos(angle) * 24, Math.sin(angle) * 24);
                    this.spawnParticle(p.x, p.y, '#8338ec', 45, 0.4, 5);
                }
            } else if (index === 2) {
                let drained = 0;
                this.enemies.forEach(e => {
                    if (Math.hypot(e.x - p.x, e.y - p.y) < 135) {
                        this.addVisualEffect({
                            type: 'blood_drain_beam',
                            x: e.x, y: e.y, targetX: p.x, targetY: p.y,
                            life: 0.45, maxLife: 0.45
                        });
                        this.damageEnemy(e, baseDmg * 1.35, 0, 0);
                        drained += 14;
                    }
                });
                const totalHeal = Math.max(18, drained);
                p.hp = Math.min(p.maxHp, p.hp + totalHeal);
                this.spawnFloatingText(p.x, p.y - 18, `+${totalHeal} HP`, '#ff2a55');
                this.addVisualEffect({
                    type: 'shockwave',
                    x: p.x, y: p.y, maxRadius: 130,
                    color: '#d90429', secondaryColor: '#8338ec',
                    life: 0.4, maxLife: 0.4
                });
                this.showToast(`🩸 Hút Sắc Đỏ: Hồi +${totalHeal} HP!`);
            }
        } else if (p.charId === 'bmo') {
            if (index === 0) {
                for (let i = 0; i < 4; i++) {
                    setTimeout(() => {
                        if (this.state !== 'PLAYING') return;
                        this.projectiles.push({
                            x: p.x, y: p.y,
                            vx: Math.cos(p.facingAngle) * 410, vy: Math.sin(p.facingAngle) * 410,
                            radius: 6, damage: baseDmg * 0.8, color: '#2ec4b6',
                            fromPlayer: true, life: 0.75, pierce: false,
                            projStyle: 'pixel_cube'
                        });
                    }, i * 65);
                }
            } else if (index === 1) {
                p.shieldBuffTimer = 4.0;
                p.invulnTimer = 3.5;
                this.addVisualEffect({
                    type: 'aura_burst',
                    x: p.x, y: p.y, radius: 46, color: '#2ec4b6',
                    life: 0.4, maxLife: 0.4, followPlayer: true
                });
                this.showToast('💠 Khiên Khung Hình BMO kích hoạt!');
            } else if (index === 2) {
                this.screenShake = 6;
                p.hp = Math.min(p.maxHp, p.hp + 30);
                p.mp = Math.min(p.maxMp, p.mp + 40);
                this.spawnFloatingText(p.x, p.y - 18, '+30HP +40MP', '#2ec4b6');

                this.addVisualEffect({
                    type: 'cyber_overclock',
                    x: p.x, y: p.y, maxRadius: 110,
                    life: 0.5, maxLife: 0.5, followPlayer: true
                });
                this.createExplosion(p.x, p.y, 105, baseDmg * 1.35, '#2ec4b6');
                this.showToast('🔋 BMO Overclock: Phóng điện & Hồi HP/MP!');
            }
        }
    }

    createExplosion(x, y, radius, damage, color) {
        for (let i = 0; i < 24; i++) {
            this.spawnParticle(x, y, color, 120, 0.38, 5);
        }
        this.enemies.forEach(e => {
            const dist = Math.hypot(e.x - x, e.y - y);
            if (dist <= radius + e.radius) {
                const ang = Math.atan2(e.y - y, e.x - x);
                this.damageEnemy(e, damage, Math.cos(ang) * 20, Math.sin(ang) * 20);
            }
        });
    }

    damageEnemy(enemy, amount, knockX = 0, knockY = 0) {
        const finalDmg = Math.max(1, Math.round(amount));
        enemy.hp -= finalDmg;
        enemy.hurtFlash = 0.15;
        this.moveEntityWithCollision(enemy, knockX, knockY);
        this.clampEnemyInsideRoom(enemy); // Giữ quái không bị đánh văng ra khỏi phòng
        this.sound.sfxHit();

        this.spawnFloatingText(enemy.x, enemy.y - enemy.radius - 6, `-${finalDmg}`, '#ffd93d');

        for (let i = 0; i < 6; i++) {
            this.spawnParticle(enemy.x, enemy.y, '#ffffff', 65, 0.2, 3);
        }

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        const idx = this.enemies.indexOf(enemy);
        if (idx !== -1) this.enemies.splice(idx, 1);

        this.stats.kills++;
        this.addVisualEffect({
            type: 'shockwave',
            x: enemy.x, y: enemy.y,
            maxRadius: enemy.isBoss ? 90 : 28,
            color: enemy.color, secondaryColor: '#ffffff',
            life: 0.25, maxLife: 0.25
        });

        for (let i = 0; i < 16; i++) {
            this.spawnParticle(enemy.x, enemy.y, enemy.color, 90, 0.42, 4);
        }

        this.groundItems.push({
            x: enemy.x + (Math.random() * 16 - 8),
            y: enemy.y + (Math.random() * 16 - 8),
            autoPickup: true,
            item: { type: 'gold', name: 'Vàng', icon: '🪙', amount: enemy.xpGold + Math.floor(Math.random() * 6) }
        });

        const roll = Math.random();
        if (roll < 0.35) {
            const consKeys = Object.keys(CONSUMABLES_DB);
            const pick = CONSUMABLES_DB[consKeys[Math.floor(Math.random() * consKeys.length)]];
            this.groundItems.push({
                x: enemy.x, y: enemy.y, autoPickup: false,
                item: { ...pick, qty: 1 }
            });
        } else if (roll < 0.52) {
            this.dropRandomWeapon(enemy.x, enemy.y);
        }

        // Mở cửa ngay lập tức nếu đây là con quái cuối cùng trong phòng
        this.updateRoomLockState();

        if (enemy.isBoss) {
            this.winGame();
        }
    }

    dropRandomWeapon(x, y, guaranteedRare = false) {
        const allWeps = Object.values(WEAPONS_DB);
        const pool = guaranteedRare ? allWeps.filter(w => w.rarity !== 'common') : allWeps;
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        this.groundItems.push({
            x, y, autoPickup: false,
            item: { ...chosen, instanceId: Date.now() + Math.random() }
        });
    }

    updateEnemies(dt) {
        const p = this.player;
        const pTileX = Math.floor(p.x / TILE_SIZE);
        const pTileY = Math.floor(p.y / TILE_SIZE);
        const playerRoom = this.getRoomAt(pTileX, pTileY);

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (!e) continue;

            if (e.hurtFlash > 0) e.hurtFlash -= dt;
            if (e.atkCooldown > 0) e.atkCooldown -= dt;

            const dist = Math.hypot(p.x - e.x, p.y - e.y);
            const angleToPlayer = Math.atan2(p.y - e.y, p.x - e.x);

            // Quái chỉ đuổi theo khi người chơi ở cùng phòng hoặc ở gần
            const sameRoom = playerRoom && playerRoom.id === e.roomId;

            if (sameRoom || dist < 220) {
                e.facingLeft = p.x < e.x;
                if (e.behavior === 'ranged' && dist > 110) {
                    this.moveEntityWithCollision(e, Math.cos(angleToPlayer) * e.speed * dt, Math.sin(angleToPlayer) * e.speed * dt);
                } else if (e.behavior !== 'ranged') {
                    this.moveEntityWithCollision(e, Math.cos(angleToPlayer) * e.speed * dt, Math.sin(angleToPlayer) * e.speed * dt);
                }

                if (e.behavior === 'ranged' && e.atkCooldown <= 0 && dist < 230) {
                    e.atkCooldown = 1.8;
                    this.projectiles.push({
                        x: e.x, y: e.y,
                        vx: Math.cos(angleToPlayer) * 210, vy: Math.sin(angleToPlayer) * 210,
                        radius: 5, damage: e.damage, color: '#48cae4',
                        fromPlayer: false, life: 1.4, projStyle: 'enemy_ice'
                    });
                }

                if (e.isBoss) {
                    e.bossPhaseTimer -= dt;
                    if (e.bossPhaseTimer <= 0) {
                        e.bossPhaseTimer = 3.0;
                        this.screenShake = 5;
                        if (Math.random() < 0.55) {
                            this.addVisualEffect({
                                type: 'shockwave',
                                x: e.x, y: e.y, maxRadius: 70,
                                color: '#8ac926', secondaryColor: '#111111',
                                life: 0.35, maxLife: 0.35
                            });
                            for (let k = 0; k < 8; k++) {
                                const a = (Math.PI * 2 * k) / 8;
                                this.projectiles.push({
                                    x: e.x, y: e.y,
                                    vx: Math.cos(a) * 195, vy: Math.sin(a) * 195,
                                    radius: 7, damage: e.damage, color: '#8ac926',
                                    fromPlayer: false, life: 1.8, projStyle: 'lich_skull_fire'
                                });
                            }
                        } else {
                            [-0.25, -0.12, 0, 0.12, 0.25].forEach(off => {
                                const a = angleToPlayer + off;
                                this.projectiles.push({
                                    x: e.x, y: e.y,
                                    vx: Math.cos(a) * 255, vy: Math.sin(a) * 255,
                                    radius: 6, damage: e.damage, color: '#48cae4',
                                    fromPlayer: false, life: 1.5, projStyle: 'enemy_ice'
                                });
                            });
                        }
                    }
                }
            } else {
                e.patrolTimer -= dt;
                if (e.patrolTimer <= 0) {
                    e.patrolTimer = 1.5 + Math.random() * 1.5;
                    e.patrolAngle = Math.random() * Math.PI * 2;
                }
                const vx = Math.cos(e.patrolAngle) * e.speed * 0.45 * dt;
                e.facingLeft = vx < 0;
                this.moveEntityWithCollision(e, vx, Math.sin(e.patrolAngle) * e.speed * 0.45 * dt);
            }

            // QUAN TRỌNG: Giữ chặt quái vật luôn ở trong phạm vi căn phòng của nó!
            this.clampEnemyInsideRoom(e);

            if (dist < p.radius + e.radius + 2 && e.atkCooldown <= 0) {
                e.atkCooldown = 0.9;
                this.damagePlayer(e.damage);
            }
        }
    }

    updateProjectiles(dt) {
        const p = this.player;
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const pr = this.projectiles[i];
            pr.x += pr.vx * dt;
            pr.y += pr.vy * dt;
            pr.life -= dt;

            if (Math.random() < 0.45) {
                this.spawnParticle(pr.x, pr.y, pr.color, 20, 0.15, 2);
            }

            const tx = Math.floor(pr.x / TILE_SIZE);
            const ty = Math.floor(pr.y / TILE_SIZE);
            // Đạn của người chơi được phép bắn xuyên qua chấn song cửa (ô số 3)
            const cell = (ty >= 0 && ty < MAP_ROWS && tx >= 0 && tx < MAP_COLS) ? this.grid[ty][tx] : 0;
            const blockedForProj = cell === 0 || cell === 2 || (!pr.fromPlayer && cell === 3);

            if (blockedForProj || pr.life <= 0) {
                this.spawnParticle(pr.x, pr.y, pr.color, 35, 0.15, 3);
                this.projectiles.splice(i, 1);
                continue;
            }

            if (pr.fromPlayer) {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const e = this.enemies[j];
                    if (Math.hypot(pr.x - e.x, pr.y - e.y) <= pr.radius + e.radius) {
                        this.damageEnemy(e, pr.damage, pr.vx * 0.03, pr.vy * 0.03);
                        if (!pr.pierce) {
                            this.projectiles.splice(i, 1);
                            break;
                        }
                    }
                }
            } else {
                if (Math.hypot(pr.x - p.x, pr.y - p.y) <= pr.radius + p.radius) {
                    this.damagePlayer(pr.damage);
                    this.projectiles.splice(i, 1);
                }
            }
        }
    }

    damagePlayer(rawAmount) {
        const p = this.player;
        if (p.invulnTimer > 0) return;

        const multiplier = p.shieldBuffTimer > 0 ? 0.35 : 1.0;
        const dmg = Math.max(1, Math.round(rawAmount * multiplier));
        p.hp = Math.max(0, p.hp - dmg);
        p.invulnTimer = 0.75;
        this.screenShake = 5;
        this.sound.sfxPlayerHurt();
        this.spawnFloatingText(p.x, p.y - 16, `-${dmg}`, '#ff2a55');

        for (let i = 0; i < 8; i++) {
            this.spawnParticle(p.x, p.y, '#ff2a55', 70, 0.3, 4);
        }

        if (p.hp <= 0) {
            this.loseGame();
        }
    }

    interactOrPickup() {
        const p = this.player;
        if (!p) return;

        for (const ch of this.chests) {
            if (!ch.opened && Math.hypot(p.x - ch.x, p.y - ch.y) < 42) {
                ch.opened = true;
                this.stats.chestsOpened++;
                this.sound.sfxChest();
                this.addVisualEffect({
                    type: 'shockwave',
                    x: ch.x, y: ch.y, maxRadius: 45,
                    color: '#ffd93d', secondaryColor: '#ffffff',
                    life: 0.3, maxLife: 0.3
                });
                this.showToast('🎁 Đã mở Rương Kho Báu!');

                this.groundItems.push({
                    x: ch.x - 12, y: ch.y + 10, autoPickup: true,
                    item: { type: 'gold', name: 'Vàng', icon: '🪙', amount: 25 + this.floor * 10 }
                });
                const cons = Math.random() < 0.5 ? CONSUMABLES_DB.everything_burrito : CONSUMABLES_DB.sugar_potion;
                this.groundItems.push({
                    x: ch.x + 12, y: ch.y + 10, autoPickup: false,
                    item: { ...cons, qty: 1 }
                });
                this.dropRandomWeapon(ch.x, ch.y + 14, true);
                return;
            }
        }

        for (let i = this.groundItems.length - 1; i >= 0; i--) {
            const g = this.groundItems[i];
            if (Math.hypot(p.x - g.x, p.y - g.y) < 44) {
                this.pickupGroundItem(i);
                return;
            }
        }
    }

    pickupGroundItem(index) {
        const g = this.groundItems[index];
        if (!g) return;
        const item = g.item;

        if (item.type === 'gold') {
            this.player.gold += item.amount;
            this.stats.goldCollected += item.amount;
            this.sound.sfxPickup();
            this.showToast(`Nhặt +${item.amount} Vàng 🪙`);
            this.groundItems.splice(index, 1);
            return;
        }

        if (item.type === 'consumable') {
            const existing = this.player.inventory.find(it => it.id === item.id);
            if (existing) {
                existing.qty = (existing.qty || 1) + (item.qty || 1);
                this.stats.itemsLooted++;
                this.sound.sfxPickup();
                this.showToast(`Đã nhặt: ${item.icon} ${item.name}`);
                this.groundItems.splice(index, 1);
                return;
            }
        }

        if (this.player.inventory.length >= 16) {
            this.showToast('⚠️ Kho đồ đã đầy (16/16)! Hãy vứt bớt đồ.');
            return;
        }

        this.player.inventory.push(item);
        this.stats.itemsLooted++;
        this.sound.sfxPickup();
        this.showToast(`Đã nhặt: ${item.icon} ${item.name}`);
        this.groundItems.splice(index, 1);
    }

    quickSwapWeapon() {
        const p = this.player;
        if (!p) return;
        const weapons = p.inventory.filter(it => it.type === 'melee' || it.type === 'ranged');
        if (weapons.length <= 1) {
            this.showToast('Chưa có vũ khí phụ trong kho để đổi!');
            return;
        }
        const curIdx = weapons.findIndex(w => w.instanceId === p.equippedWeapon.instanceId);
        const nextWep = weapons[(curIdx + 1) % weapons.length];
        p.equippedWeapon = nextWep;
        this.sound.sfxClick();
        this.showToast(`Trang bị: ${nextWep.icon} ${nextWep.name}`);
        this.updateHUD();
    }

    toggleInventory() {
        const modal = document.getElementById('inventory-modal');
        if (this.state === 'PLAYING') {
            this.state = 'INVENTORY';
            modal.classList.add('active');
            this.selectedInvIndex = -1;
            this.renderInventoryUI();
        } else if (this.state === 'INVENTORY') {
            modal.classList.remove('active');
            this.state = 'PLAYING';
        }
    }

    renderInventoryUI() {
        const p = this.player;
        const grid = document.getElementById('inv-grid');
        document.getElementById('inv-count').textContent = p.inventory.length;
        grid.innerHTML = '';

        for (let i = 0; i < 16; i++) {
            const slot = document.createElement('div');
            const item = p.inventory[i];
            slot.className = 'inv-slot';

            if (item) {
                slot.classList.add(`rarity-${item.rarity || 'common'}`);
                if (i === this.selectedInvIndex) slot.classList.add('selected');
                slot.textContent = item.icon;

                if (item.qty && item.qty > 1) {
                    const q = document.createElement('span');
                    q.className = 'slot-qty';
                    q.textContent = `x${item.qty}`;
                    slot.appendChild(q);
                }

                if (p.equippedWeapon && item.instanceId === p.equippedWeapon.instanceId) {
                    const eq = document.createElement('span');
                    eq.className = 'equipped-tag';
                    eq.textContent = 'E';
                    slot.appendChild(eq);
                }

                slot.addEventListener('click', () => {
                    this.sound.sfxClick();
                    this.selectedInvIndex = i;
                    this.renderInventoryUI();
                });
            }
            grid.appendChild(slot);
        }

        const sel = p.inventory[this.selectedInvIndex];
        const useBtn = document.getElementById('btn-use-item');
        const dropBtn = document.getElementById('btn-drop-item');

        if (!sel) {
            document.getElementById('item-title').textContent = 'Chọn một vật phẩm';
            document.getElementById('item-rarity').textContent = '';
            document.getElementById('item-desc').textContent = 'Nhấn vào ô vật phẩm để xem chi tiết, trang bị vũ khí hoặc dùng bình hồi phục.';
            document.getElementById('item-stats').innerHTML = '';
            useBtn.classList.add('hidden');
            dropBtn.classList.add('hidden');
        } else {
            document.getElementById('item-title').textContent = `${sel.icon} ${sel.name}`;
            const rarityMap = { common: 'Thường (Common)', rare: 'Hiếm (Rare)', epic: 'Sử Thi (Epic)' };
            document.getElementById('item-rarity').textContent = rarityMap[sel.rarity] || 'Thường';
            document.getElementById('item-desc').textContent = sel.desc;

            if (sel.type === 'melee' || sel.type === 'ranged') {
                document.getElementById('item-stats').innerHTML = `
                    <div>• Sát thương: +${sel.damage}</div>
                    <div>• Tầm đánh: ${sel.range}px (${sel.type === 'melee' ? 'Cận chiến' : 'Tầm xa'})</div>
                    <div>• Tốc đánh: ${(1 / sel.cooldown).toFixed(1)} đòn/giây</div>
                `;
                useBtn.textContent = 'TRANG BỊ VŨ KHÍ';
            } else {
                document.getElementById('item-stats').innerHTML = `
                    <div>• Hồi Máu (HP): +${sel.healHp || 0}</div>
                    <div>• Hồi Năng lượng (MP): +${sel.healMp || 0}</div>
                `;
                useBtn.textContent = 'SỬ DỤNG NGAY';
            }
            useBtn.classList.remove('hidden');
            dropBtn.classList.remove('hidden');
        }
    }

    useSelectedInventoryItem() {
        const p = this.player;
        const item = p.inventory[this.selectedInvIndex];
        if (!item) return;

        if (item.type === 'melee' || item.type === 'ranged') {
            p.equippedWeapon = item;
            this.showToast(`Đã trang bị ${item.name}!`);
        } else if (item.type === 'consumable') {
            p.hp = Math.min(p.maxHp, p.hp + (item.healHp || 0));
            p.mp = Math.min(p.maxMp, p.mp + (item.healMp || 0));
            this.sound.sfxPickup();
            this.showToast(`Đã dùng ${item.name}!`);
            if (item.qty > 1) {
                item.qty--;
            } else {
                p.inventory.splice(this.selectedInvIndex, 1);
                this.selectedInvIndex = -1;
            }
        }
        this.renderInventoryUI();
        this.updateHUD();
    }

    dropSelectedInventoryItem() {
        const p = this.player;
        const item = p.inventory[this.selectedInvIndex];
        if (!item) return;

        if (p.equippedWeapon && item.instanceId === p.equippedWeapon.instanceId) {
            this.showToast('Không thể vứt vũ khí đang cầm trên tay!');
            return;
        }

        p.inventory.splice(this.selectedInvIndex, 1);
        this.groundItems.push({
            x: p.x + 18, y: p.y + 18,
            autoPickup: false, item
        });
        this.selectedInvIndex = -1;
        this.renderInventoryUI();
    }

    pauseGame() {
        if (this.state !== 'PLAYING') return;
        this.state = 'PAUSED';
        this.sound.pauseBGM();
        document.getElementById('pause-modal').classList.add('active');
    }

    resumeGame() {
        if (this.state !== 'PAUSED') return;
        document.getElementById('pause-modal').classList.remove('active');
        this.state = 'PLAYING';
        this.sound.startBGM('dungeon');
    }

    winGame() {
        this.state = 'END';
        this.sound.stopBGM();
        this.sound.sfxWin();
        document.getElementById('end-title').textContent = '🏆 CHIẾN THẮNG VẺ VANG!';
        document.getElementById('end-subtitle').textContent = `${this.player.name} đã đánh bại Trùm Cuối và giải cứu Xứ Ooo!`;
        this.populateEndSummary();
        document.getElementById('end-modal').classList.add('active');
    }

    loseGame() {
        this.state = 'END';
        this.sound.stopBGM();
        this.sound.sfxLose();
        document.getElementById('end-title').textContent = '💀 THẤT BẠI TRONG HẦM NGỤC';
        document.getElementById('end-subtitle').textContent = 'Đừng bỏ cuộc! Các anh hùng Xứ Ooo luôn đứng dậy sau thất bại.';
        this.populateEndSummary();
        document.getElementById('end-modal').classList.add('active');
    }

    populateEndSummary() {
        document.getElementById('end-stats').innerHTML = `
            <div>• Tầng đạt tới: <strong>Tầng ${this.floor}</strong></div>
            <div>• Quái vật đã hạ: <strong>${this.stats.kills}</strong></div>
            <div>• Vàng thu thập: <strong>${this.stats.goldCollected} 🪙</strong></div>
            <div>• Vật phẩm nhặt được: <strong>${this.stats.itemsLooted}</strong></div>
            <div>• Rương đã mở: <strong>${this.stats.chestsOpened}</strong></div>
        `;
    }

    setupHUDInitial() {
        const p = this.player;
        document.getElementById('hud-char-name').textContent = p.name;
        const av = document.getElementById('hud-avatar');
        av.style.background = p.colorPrimary;
        av.textContent = p.name[0];

        p.skills.forEach((sk, idx) => {
            document.getElementById(`skill-icon-${idx}`).textContent = sk.icon;
            document.getElementById(`skill-name-${idx}`).textContent = sk.name;
        });
        this.updateHUD();
    }

    updateHUD() {
        const p = this.player;
        if (!p) return;

        document.getElementById('hud-gold').textContent = `🪙 ${p.gold}`;
        document.getElementById('hud-hp-fill').style.width = `${(p.hp / p.maxHp) * 100}%`;
        document.getElementById('hud-hp-text').textContent = `${Math.ceil(p.hp)}/${p.maxHp}`;
        document.getElementById('hud-mp-fill').style.width = `${(p.mp / p.maxMp) * 100}%`;
        document.getElementById('hud-mp-text').textContent = `${Math.floor(p.mp)}/${p.maxMp}`;

        document.getElementById('hud-floor').textContent = FLOOR_THEMES[this.floor - 1].name;
        const pRoom = this.getRoomAt(Math.floor(p.x / TILE_SIZE), Math.floor(p.y / TILE_SIZE));
        const roomEnemies = pRoom ? this.enemies.filter(e => e.roomId === pRoom.id).length : 0;
        document.getElementById('hud-enemies').textContent = `Quái trong phòng: ${roomEnemies} (Tổng: ${this.enemies.length})`;

        const lockEl = document.getElementById('hud-room-lock');
        if (pRoom && pRoom.locked) {
            lockEl.textContent = '🔒 Cửa Khóa (Diệt hết quái!)';
            lockEl.className = 'lock-status locked';
        } else {
            lockEl.textContent = '🔓 Cửa Mở';
            lockEl.className = 'lock-status unlocked';
        }

        if (p.equippedWeapon) {
            document.getElementById('hud-weapon-icon').textContent = p.equippedWeapon.icon;
            document.getElementById('hud-weapon-name').textContent = p.equippedWeapon.name;
            document.getElementById('hud-weapon-dmg').textContent = `DMG: ${p.baseDamage + p.equippedWeapon.damage}`;
        }

        p.skills.forEach((sk, idx) => {
            const slot = document.getElementById(`skill-slot-${idx}`);
            const cdEl = document.getElementById(`skill-cd-${idx}`);
            if (sk.currentCd > 0) {
                slot.classList.remove('ready');
                cdEl.style.display = 'flex';
                cdEl.textContent = sk.currentCd.toFixed(1);
            } else {
                slot.classList.add('ready');
                cdEl.style.display = 'none';
            }
        });

        const boss = this.enemies.find(e => e.isBoss);
        const bossHud = document.getElementById('boss-hud');
        if (boss) {
            bossHud.classList.remove('hidden');
            document.getElementById('boss-hp-fill').style.width = `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`;
        } else {
            bossHud.classList.add('hidden');
        }
    }

    showToast(text) {
        const box = document.getElementById('toast-container');
        const msg = document.createElement('div');
        msg.className = 'toast-msg';
        msg.textContent = text;
        box.appendChild(msg);
        setTimeout(() => msg.remove(), 2200);
    }

    spawnParticle(x, y, color, speed, life, size) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * speed;
        this.particles.push({
            x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, color, life, size
        });
    }

    renderHomeScene(timeSec) {
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;

        ctx.fillStyle = '#38b6ff';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#70d6ff';
        ctx.fillRect(0, H * 0.35, W, H * 0.35);

        ctx.fillStyle = '#ffffff';
        this.homeClouds.forEach(c => {
            ctx.fillRect(Math.floor(c.x), c.y, c.w, 22);
            ctx.fillRect(Math.floor(c.x) + 16, c.y - 12, c.w - 32, 14);
        });

        ctx.fillStyle = '#a9def9';
        for (let i = 0; i < 6; i++) {
            const bx = i * 180 - 20;
            ctx.beginPath();
            ctx.moveTo(bx, H * 0.72);
            ctx.lineTo(bx + 110, H * 0.36 + (i % 2) * 35);
            ctx.lineTo(bx + 220, H * 0.72);
            ctx.fill();
        }

        ctx.fillStyle = '#ff9ebb';
        ctx.fillRect(110, H * 0.44, 90, 140);
        ctx.fillStyle = '#ff70a6';
        ctx.fillRect(128, H * 0.34, 54, 60);

        ctx.fillStyle = '#52b788';
        ctx.fillRect(0, H * 0.68, W, H * 0.32);
        ctx.fillStyle = '#40916c';
        ctx.fillRect(0, H * 0.76, W, H * 0.24);

        const gateX = W / 2 - 110;
        const gateY = H * 0.48;
        ctx.fillStyle = '#2b2038';
        ctx.fillRect(gateX, gateY, 220, 190);
        ctx.fillStyle = '#4a375e';
        ctx.fillRect(gateX - 12, gateY - 16, 244, 24);
        ctx.fillStyle = '#0c0714';
        ctx.fillRect(gateX + 34, gateY + 34, 152, 156);

        const flicker = Math.sin(timeSec * 12) * 3;
        [gateX + 16, gateX + 204].forEach(tx => {
            ctx.fillStyle = '#7f5539';
            ctx.fillRect(tx - 3, gateY + 65, 6, 22);
            ctx.fillStyle = '#ff9f1c';
            ctx.fillRect(tx - 7, gateY + 52 + flicker, 14, 14);
            ctx.fillStyle = '#ffd93d';
            ctx.fillRect(tx - 4, gateY + 55 + flicker, 8, 8);
        });

        SpriteRenderer.drawCharacter(ctx, CHARACTERS.finn, 210, H * 0.73, 3.0, timeSec * 6, 'down', false);
        SpriteRenderer.drawCharacter(ctx, CHARACTERS.jake, W - 210, H * 0.73, 3.0, timeSec * 6 + 2, 'down', false);

        this.homeParticles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
    }

    renderGameplay(timeSec) {
        const ctx = this.ctx;
        const theme = FLOOR_THEMES[this.floor - 1];
        ctx.fillStyle = '#0b0712';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 2 : 0;
        const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 2 : 0;

        ctx.save();
        ctx.translate(-Math.floor(this.camera.x - shakeX), -Math.floor(this.camera.y - shakeY));

        const startCol = Math.max(0, Math.floor(this.camera.x / TILE_SIZE) - 1);
        const endCol = Math.min(MAP_COLS - 1, Math.ceil((this.camera.x + this.canvas.width) / TILE_SIZE) + 1);
        const startRow = Math.max(0, Math.floor(this.camera.y / TILE_SIZE) - 1);
        const endRow = Math.min(MAP_ROWS - 1, Math.ceil((this.camera.y + this.canvas.height) / TILE_SIZE) + 1);

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const cell = this.grid[r][c];
                const px = c * TILE_SIZE;
                const py = r * TILE_SIZE;

                if (cell === 1 || cell === 4) {
                    ctx.fillStyle = (r + c) % 2 === 0 ? theme.floorColor1 : theme.floorColor2;
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

                    if (cell === 4) {
                        ctx.fillStyle = '#ffd93d';
                        ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                        ctx.fillStyle = '#24172b';
                        for (let s = 0; s < 4; s++) {
                            ctx.fillRect(px + 6, py + 7 + s * 5, TILE_SIZE - 12, 3);
                        }
                    }
                } else if (cell === 2) {
                    ctx.fillStyle = theme.wallColor;
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = theme.wallTop;
                    ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 10);
                } else if (cell === 3) {
                    ctx.fillStyle = '#5c1a24';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#ff4d6d';
                    for (let b = 4; b < TILE_SIZE; b += 8) {
                        ctx.fillRect(px + b, py, 3, TILE_SIZE);
                    }
                }
            }
        }

        this.decorations.forEach(d => {
            if (d.type === 'torch') {
                ctx.fillStyle = '#6c584c';
                ctx.fillRect(d.x - 3, d.y, 6, 12);
                ctx.fillStyle = Math.sin(timeSec * 14 + d.x) > 0 ? '#ff9f1c' : '#ffd93d';
                ctx.fillRect(d.x - 5, d.y - 8, 10, 9);
            } else if (d.type === 'bones') {
                ctx.fillStyle = '#e0dcd5';
                ctx.fillRect(d.x - 6, d.y - 2, 12, 4);
                ctx.fillRect(d.x - 2, d.y - 6, 4, 12);
            } else if (d.type === 'mushroom') {
                ctx.fillStyle = '#e0aaff';
                ctx.fillRect(d.x - 2, d.y, 4, 6);
                ctx.fillStyle = theme.accent;
                ctx.fillRect(d.x - 6, d.y - 5, 12, 6);
            }
        });

        this.chests.forEach(ch => {
            ctx.fillStyle = '#111111';
            ctx.fillRect(ch.x - 13, ch.y - 11, 26, 22);
            ctx.fillStyle = ch.opened ? '#5c4738' : '#b07d4f';
            ctx.fillRect(ch.x - 12, ch.y - 10, 24, 20);
            ctx.fillStyle = '#ffd93d';
            ctx.fillRect(ch.x - 12, ch.y - 2, 24, 4);
            ctx.fillRect(ch.x - 3, ch.y - 4, 6, 8);
        });

        this.traps.forEach(tr => {
            const pulse = Math.sin(timeSec * 15) > 0 ? '#ff0054' : '#ff70a6';
            ctx.fillStyle = '#111111';
            ctx.fillRect(tr.x - 9, tr.y - 7, 18, 14);
            ctx.fillStyle = '#ff9ebb';
            ctx.fillRect(tr.x - 8, tr.y - 6, 16, 12);
            ctx.fillStyle = pulse;
            ctx.fillRect(tr.x - 3, tr.y - 3, 6, 6);
        });

        this.groundItems.forEach(g => {
            const bob = Math.sin(timeSec * 6 + g.x) * 2;
            const rarityColor = g.item.rarity === 'epic' ? '#c77dff' : g.item.rarity === 'rare' ? '#38b6ff' : '#ffd93d';
            ctx.fillStyle = rarityColor;
            ctx.fillRect(g.x - 9, g.y - 9 + bob, 18, 18);
            ctx.fillStyle = '#191224';
            ctx.fillRect(g.x - 7, g.y - 7 + bob, 14, 14);
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(g.item.icon, g.x, g.y + bob);
        });

        this.enemies.forEach(e => {
            SpriteRenderer.drawEnemy(ctx, e, timeSec);
        });

        const p = this.player;
        if (p) {
            if (p.speedBuffTimer > 0) {
                ctx.strokeStyle = '#ffd93d';
                ctx.lineWidth = 2;
                ctx.strokeRect(p.x - 14, p.y - 16, 28, 30);
            }

            const blink = p.invulnTimer > 0 && Math.floor(timeSec * 20) % 2 === 0;
            if (!blink) {
                const isAttacking = p.attackAnimTimer > 0;
                SpriteRenderer.drawCharacter(ctx, p, p.x, p.y, 1.35, p.walkFrame, p.dir || 'down', isAttacking);
            }

            if (p.shieldBuffTimer > 0) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(timeSec * 2.5);
                ctx.strokeStyle = p.charId === 'jake' ? '#f7b519' : '#2ec4b6';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                for (let k = 0; k < 6; k++) {
                    const a = (Math.PI * 2 * k) / 6;
                    const sx = Math.cos(a) * 22;
                    const sy = Math.sin(a) * 22;
                    if (k === 0) ctx.moveTo(sx, sy);
                    else ctx.lineTo(sx, sy);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            }
        }

        SpriteRenderer.drawVisualEffects(ctx, this.visualEffects);
        SpriteRenderer.drawProjectiles(ctx, this.projectiles, timeSec);

        this.particles.forEach(pt => {
            ctx.fillStyle = pt.color;
            ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
        });

        this.floatingTexts.forEach(ft => {
            ctx.font = 'bold 13px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#000000';
            ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
        });

        ctx.restore();
        this.renderMinimap();
    }

    renderMinimap() {
        const mCtx = this.miniCtx;
        const W = this.miniCanvas.width;
        const H = this.miniCanvas.height;
        mCtx.clearRect(0, 0, W, H);

        const sx = W / MAP_COLS;
        const sy = H / MAP_ROWS;

        this.rooms.forEach(r => {
            if (!r.discovered) return;
            mCtx.fillStyle = r.cleared ? '#4a3b69' : '#8a2be2';
            mCtx.fillRect(r.x * sx, r.y * sy, r.w * sx, r.h * sy);
        });

        if (this.player) {
            mCtx.fillStyle = '#6ce88b';
            mCtx.fillRect((this.player.x / TILE_SIZE) * sx - 2, (this.player.y / TILE_SIZE) * sy - 2, 4, 4);
        }

        mCtx.fillStyle = '#ff385c';
        this.enemies.forEach(e => {
            const room = this.rooms[e.roomId];
            if (room && room.discovered) {
                mCtx.fillRect((e.x / TILE_SIZE) * sx - 1, (e.y / TILE_SIZE) * sy - 1, 3, 3);
            }
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});