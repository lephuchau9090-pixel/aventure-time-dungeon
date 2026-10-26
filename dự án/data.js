/**
 * FILE 1/3: data.js
 * Chứa Hệ thống Âm thanh Web Audio API và toàn bộ Cơ sở dữ liệu Nhân vật, Vũ khí, Vật phẩm, Quái vật
 */

class SoundSystem {
    constructor() {
        this.ctx = null;
        this.musicOn = true;
        this.sfxOn = true;
        this.volume = 0.7;
        this.bgmMode = 'none';
        this.bgmTimer = null;
        this.noteIndex = 0;
        this.loadSettings();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('at_dungeon_audio');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.musicOn = parsed.musicOn ?? true;
                this.sfxOn = parsed.sfxOn ?? true;
                this.volume = parsed.volume ?? 0.7;
            }
        } catch (e) {}
    }

    saveSettings() {
        try {
            localStorage.setItem('at_dungeon_audio', JSON.stringify({
                musicOn: this.musicOn,
                sfxOn: this.sfxOn,
                volume: this.volume
            }));
        } catch (e) {}
    }

    initContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, duration, type = 'square', gainScale = 0.15, slideFreq = null) {
        if (!this.sfxOn || this.volume <= 0) return;
        this.initContext();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            if (slideFreq) {
                osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
            }

            const finalVol = Math.max(0.001, this.volume * gainScale);
            gain.gain.setValueAtTime(finalVol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    }

    sfxClick() { this.playTone(620, 0.07, 'square', 0.12, 880); }
    sfxAttack() { this.playTone(260, 0.11, 'sawtooth', 0.14, 110); }
    sfxHit() { this.playTone(150, 0.12, 'square', 0.18, 65); }
    sfxPlayerHurt() { this.playTone(190, 0.22, 'sawtooth', 0.22, 70); }
    sfxPickup() {
        this.playTone(523, 0.08, 'square', 0.13, 659);
        setTimeout(() => this.playTone(784, 0.12, 'square', 0.13, 1046), 70);
    }
    sfxChest() {
        [440, 554, 659, 880].forEach((n, i) => {
            setTimeout(() => this.playTone(n, 0.11, 'triangle', 0.16), i * 65);
        });
    }
    sfxSkill() {
        this.playTone(320, 0.18, 'triangle', 0.18, 760);
        setTimeout(() => this.playTone(580, 0.2, 'sawtooth', 0.14, 920), 60);
    }
    sfxWin() {
        [523, 659, 784, 1046, 784, 1046].forEach((n, i) => {
            setTimeout(() => this.playTone(n, 0.16, 'square', 0.16), i * 110);
        });
    }
    sfxLose() {
        [392, 349, 330, 261].forEach((n, i) => {
            setTimeout(() => this.playTone(n, 0.24, 'sawtooth', 0.16), i * 160);
        });
    }

    startBGM(mode) {
        this.bgmMode = mode;
        if (this.bgmTimer) clearInterval(this.bgmTimer);
        if (!this.musicOn) return;
        this.initContext();

        const homeMelody = [523, 659, 784, 659, 880, 784, 659, 587, 523, 587, 659, 523, 440, 494, 523, 0];
        const dungeonMelody = [220, 261, 246, 220, 196, 220, 261, 293, 220, 329, 293, 261, 246, 196, 220, 0];

        const tempo = mode === 'home' ? 230 : 260;
        this.bgmTimer = setInterval(() => {
            if (!this.musicOn || this.bgmMode === 'paused' || this.volume <= 0) return;
            if (!this.ctx || this.ctx.state !== 'running') return;

            const list = this.bgmMode === 'home' ? homeMelody : dungeonMelody;
            const freq = list[this.noteIndex % list.length];
            this.noteIndex++;

            if (freq > 0) {
                try {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = this.bgmMode === 'home' ? 'triangle' : 'square';
                    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                    const v = Math.max(0.001, this.volume * (this.bgmMode === 'home' ? 0.06 : 0.04));
                    gain.gain.setValueAtTime(v, this.ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start();
                    osc.stop(this.ctx.currentTime + 0.21);
                } catch (e) {}
            }
        }, tempo);
    }

    pauseBGM() { this.bgmMode = 'paused'; }
    stopBGM() {
        this.bgmMode = 'none';
        if (this.bgmTimer) clearInterval(this.bgmTimer);
    }
}

const CHARACTERS = {
    finn: {
        id: 'finn',
        name: 'Finn',
        fullName: 'Finn the Human',
        role: 'Chiến Binh Cân Bằng',
        desc: 'Cậu bé anh hùng đội mũ tai gấu trắng và đeo ba lô xanh lá. Cân bằng hoàn hảo giữa máu, tốc độ và kiếm thuật.',
        hp: 130, mp: 100, speed: 175, damage: 18,
        rangeType: 'Cận chiến', attackType: 'melee',
        colorPrimary: '#2998ff', colorSecondary: '#ffffff', hatType: 'finn',
        starterWeapon: 'scarlet_sword',
        skills: [
            { name: 'Chém Xoáy', icon: '🌀', cd: 3.5, mp: 15, desc: 'Xoay kiếm 360 độ tạo lốc kiếm vàng chém mọi kẻ địch xung quanh.' },
            { name: 'Nhát Chém Mạnh', icon: '💥', cd: 6.0, mp: 25, desc: 'Phóng lưỡi kiếm khí bán nguyệt khổng lồ xuyên thấu phía trước.' },
            { name: 'Trái Tim Anh Hùng', icon: '⚡', cd: 10.0, mp: 30, desc: 'Bùng nổ hào quang vàng, tăng 50% tốc chạy và tốc đánh trong 4.5 giây.' }
        ]
    },
    jake: {
        id: 'jake',
        name: 'Jake',
        fullName: 'Jake the Dog',
        role: 'Đấu Sĩ Co Giãn',
        desc: 'Chú chó phép thuật màu vàng cam với đôi mắt to tròn và cánh tay co giãn biến hình khổng lồ.',
        hp: 175, mp: 90, speed: 155, damage: 21,
        rangeType: 'Tầm trung', attackType: 'stretch',
        colorPrimary: '#f7b519', colorSecondary: '#d9910b', hatType: 'jake',
        starterWeapon: 'stretchy_gauntlet',
        skills: [
            { name: 'Đấm Co Giãn', icon: '👊', cd: 3.2, mp: 15, desc: 'Hóa khổng lồ nắm đấm vươn dài cực đại, đấm văng mục tiêu.' },
            { name: 'Đấm Đất Khổng Lồ', icon: '🌋', cd: 7.0, mp: 28, desc: 'Dậm vỡ sàn hầm ngục, tạo sóng địa chấn diện rộng.' },
            { name: 'Giáp Chó Phép', icon: '🛡️', cd: 11.0, mp: 30, desc: 'Bao bọc cơ thể bằng giáp phép vàng, giảm 65% sát thương nhận vào.' }
        ]
    },
    pb: {
        id: 'pb',
        name: 'Bubblegum',
        fullName: 'Princess Bubblegum',
        role: 'Nhà Khoa Học Kẹo',
        desc: 'Nữ hoàng Vương quốc Kẹo. Sử dụng súng công nghệ kẹo tầm xa, đặt bẫy nổ và tự hồi phục.',
        hp: 105, mp: 135, speed: 165, damage: 16,
        rangeType: 'Tầm xa', attackType: 'ranged',
        colorPrimary: '#ff70a6', colorSecondary: '#ff9ebb', hatType: 'crown',
        starterWeapon: 'jelly_blaster',
        skills: [
            { name: 'Đạn Khoa Học', icon: '🧪', cd: 3.0, mp: 15, desc: 'Bắn chùm 3 tia Laser Plasma kẹo ngọt để lại vệt sáng.' },
            { name: 'Mìn Kẹo Nổ', icon: '💣', cd: 6.5, mp: 25, desc: 'Đặt mìn cảm ứng phát nổ sóng hồng khi quái bước vào.' },
            { name: 'Huyết Thanh Ngọt', icon: '💖', cd: 12.0, mp: 35, desc: 'Tạo vòng trận khoa học hồi ngay 45 Máu cho bản thân.' }
        ]
    },
    marceline: {
        id: 'marceline',
        name: 'Marceline',
        fullName: 'Marceline Vampire',
        role: 'Nữ Hoàng Ma Cà Rồng',
        desc: 'Di chuyển siêu tốc độ. Chiến đấu bằng Rìu Bass phát sóng âm tầm trung-xa và kỹ năng hút máu.',
        hp: 110, mp: 115, speed: 198, damage: 20,
        rangeType: 'Sóng âm', attackType: 'sonic',
        colorPrimary: '#8338ec', colorSecondary: '#d90429', hatType: 'vamp',
        starterWeapon: 'axe_bass',
        skills: [
            { name: 'Hợp Âm Hủy Diệt', icon: '🎸', cd: 3.5, mp: 18, desc: 'Gảy đàn phát vòng sóng âm đỏ-tím cộng hưởng xuyên thấu.' },
            { name: 'Bước Nhảy Bóng Đêm', icon: '🦇', cd: 4.5, mp: 15, desc: 'Hóa dơi lướt siêu tốc qua kẻ địch, để lại tàn ảnh ma cà rồng.' },
            { name: 'Hút Sắc Đỏ', icon: '🩸', cd: 9.0, mp: 30, desc: 'Triệu hồi bầy dơi rút sinh lực kẻ địch xung quanh truyền về mình.' }
        ]
    },
    bmo: {
        id: 'bmo',
        name: 'BMO',
        fullName: 'BMO Robot',
        role: 'Máy Chơi Game Nhỏ',
        desc: 'Nhỏ nhắn, cực kỳ nhanh nhẹn. Bắn đạn laser 8-bit, tạo khiên điện tử và làm choáng toàn phòng.',
        hp: 95, mp: 140, speed: 205, damage: 15,
        rangeType: 'Tầm xa', attackType: 'laser',
        colorPrimary: '#2ec4b6', colorSecondary: '#cbf3f0', hatType: 'bmo',
        starterWeapon: 'pixel_blaster',
        skills: [
            { name: 'Đạn Năng Lượng', icon: '👾', cd: 2.8, mp: 14, desc: 'Bắn liên hoàn 4 tia đạn 8-Bit Pixel tốc độ cao.' },
            { name: 'Khiên Khung Hình', icon: '💠', cd: 9.0, mp: 25, desc: 'Tạo trường lực lục giác điện tử miễn nhiễm sát thương 3.5 giây.' },
            { name: 'Overclock 64-Bit', icon: '🔋', cd: 11.0, mp: 30, desc: 'Phóng lưới tia sét điện giật toàn bộ quái xung quanh và hồi HP/MP.' }
        ]
    }
};

const WEAPONS_DB = {
    scarlet_sword: {
        id: 'scarlet_sword', name: 'Kiếm Vàng Scarlet', icon: '🗡️', type: 'melee',
        damage: 16, range: 54, cooldown: 0.32, rarity: 'common', color: '#ffd93d',
        desc: 'Thanh kiếm vàng truyền thống của Finn, tốc độ chém nhanh và ổn định.'
    },
    stretchy_gauntlet: {
        id: 'stretchy_gauntlet', name: 'Đòn Tay Co Giãn Jake', icon: '🥊', type: 'melee',
        damage: 19, range: 72, cooldown: 0.36, rarity: 'common', color: '#f7b519',
        desc: 'Đôi tay phép thuật của Jake vươn dài ra phía trước đấm văng kẻ địch.'
    },
    jelly_blaster: {
        id: 'jelly_blaster', name: 'Súng Thạch Kẹo', icon: '🔫', type: 'ranged',
        damage: 14, range: 240, cooldown: 0.34, rarity: 'common', color: '#ff70a6',
        desc: 'Bắn đạn kẹo năng lượng tầm xa của Vương quốc Kẹo.'
    },
    axe_bass: {
        id: 'axe_bass', name: 'Đàn Rìu Gia Truyền', icon: '🎸', type: 'ranged',
        damage: 18, range: 190, cooldown: 0.36, rarity: 'rare', color: '#e63946',
        desc: 'Vừa chém vừa phóng sóng âm đỏ thẫm đặc trưng của Marceline.'
    },
    pixel_blaster: {
        id: 'pixel_blaster', name: 'Tay Cầm Laser 8-Bit', icon: '🕹️', type: 'ranged',
        damage: 13, range: 250, cooldown: 0.25, rarity: 'common', color: '#2ec4b6',
        desc: 'Tốc độ bắn cực nhanh bằng đạn tia điện tử.'
    },
    grass_sword: {
        id: 'grass_sword', name: 'Kiếm Cỏ Nguyền Rủa', icon: '🌿', type: 'melee',
        damage: 25, range: 60, cooldown: 0.22, rarity: 'rare', color: '#52b788',
        desc: 'Lưỡi kiếm cỏ sắc bén với tốc độ vung kiếm siêu thanh.'
    },
    ice_wand: {
        id: 'ice_wand', name: 'Trượng Băng Vương Miện', icon: '❄️', type: 'ranged',
        damage: 24, range: 260, cooldown: 0.42, rarity: 'rare', color: '#48cae4',
        desc: 'Phóng mũi giáo băng giá xuyên qua không khí.'
    },
    candy_hammer: {
        id: 'candy_hammer', name: 'Búa Kẹo Mút Khổng Lồ', icon: '🔨', type: 'melee',
        damage: 34, range: 64, cooldown: 0.55, rarity: 'rare', color: '#ff5d8f',
        desc: 'Sát thương cực lớn và đẩy lùi kẻ địch.'
    },
    demon_blood_sword: {
        id: 'demon_blood_sword', name: 'Kiếm Máu Quỷ Kee-Oth', icon: '⚔️', type: 'melee',
        damage: 42, range: 68, cooldown: 0.34, rarity: 'epic', color: '#d90429',
        desc: 'Vũ khí Sử Thi gia truyền của Joshua với sức mạnh hủy diệt.'
    },
    enchiridion_staff: {
        id: 'enchiridion_staff', name: 'Cổ Trượng Enchiridion', icon: '🪄', type: 'ranged',
        damage: 38, range: 290, cooldown: 0.35, rarity: 'epic', color: '#b5179e',
        desc: 'Vũ khí Sử Thi bắn cầu phép thuật cổ đại Xứ Ooo.'
    }
};

const CONSUMABLES_DB = {
    bacon_pancake: {
        id: 'bacon_pancake', name: 'Bánh Kếch Thịt Xông Khói', icon: '🥞', type: 'consumable',
        healHp: 45, healMp: 0, rarity: 'common',
        desc: 'Món bánh yêu thích của Jake! Hồi ngay 45 Máu (HP).'
    },
    everything_burrito: {
        id: 'everything_burrito', name: 'Burrito Thập Cẩm', icon: '🌯', type: 'consumable',
        healHp: 85, healMp: 30, rarity: 'rare',
        desc: 'Bữa ăn thịnh soạn hồi 85 Máu và 30 Năng lượng.'
    },
    sugar_potion: {
        id: 'sugar_potion', name: 'Bình Nước Đường Kẹo', icon: '🧪', type: 'consumable',
        healHp: 0, healMp: 65, rarity: 'common',
        desc: 'Nạp ngay 65 Năng lượng (MP) để dùng kỹ năng.'
    },
    crystal_gem_apple: {
        id: 'crystal_gem_apple', name: 'Táo Pha Lê Tối Thượng', icon: '🍎', type: 'consumable',
        healHp: 150, healMp: 100, rarity: 'epic',
        desc: 'Quả táo quý hiếm hồi phục gần như toàn bộ HP và MP.'
    }
};

const FLOOR_THEMES = [
    {
        floor: 1,
        name: 'Tầng 1: Hầm Ngục Lâu Đài Kẹo',
        wallColor: '#3d2645',
        wallTop: '#593863',
        floorColor1: '#24172b',
        floorColor2: '#2b1c33',
        corridorColor: '#1f1426',
        accent: '#ff70a6'
    },
    {
        floor: 2,
        name: 'Tầng 2: Động Băng Giá Của Ice King',
        wallColor: '#1d3557',
        wallTop: '#3a608f',
        floorColor1: '#122238',
        floorColor2: '#172a45',
        corridorColor: '#0f1c2e',
        accent: '#48cae4'
    },
    {
        floor: 3,
        name: 'Tầng 3: Điện Thờ Hắc Ám Của The Lich',
        wallColor: '#283618',
        wallTop: '#435929',
        floorColor1: '#151c11',
        floorColor2: '#1b2416',
        corridorColor: '#11170e',
        accent: '#8ac926'
    }
];

const ENEMY_TYPES = {
    candy_zombie: {
        name: 'Quái Kẹo Zombie', hp: 45, damage: 9, speed: 68, radius: 12,
        color: '#ff85a1', eyeColor: '#52b788', behavior: 'chase', xpGold: 8
    },
    slime_ooze: {
        name: 'Slime Độc Tố', hp: 35, damage: 7, speed: 82, radius: 11,
        color: '#8ac926', eyeColor: '#ffffff', behavior: 'chase', xpGold: 6
    },
    ice_golem: {
        name: 'Người Khổng Lồ Băng', hp: 90, damage: 15, speed: 52, radius: 15,
        color: '#90e0ef', eyeColor: '#ffbe0b', behavior: 'tank', xpGold: 14
    },
    gunter_bot: {
        name: 'Cánh Cụt Gunter Băng', hp: 50, damage: 11, speed: 75, radius: 11,
        color: '#3a86ff', eyeColor: '#ff006e', behavior: 'ranged', xpGold: 12
    },
    shadow_wraith: {
        name: 'Bóng Ma Hắc Ám', hp: 72, damage: 14, speed: 95, radius: 13,
        color: '#7209b7', eyeColor: '#ffbe0b', behavior: 'dasher', xpGold: 16
    },
    boss_lich_ice: {
        name: 'TRÙM CUỐI: THE LICH & ICE TITAN', hp: 560, damage: 22, speed: 62, radius: 24,
        color: '#52b788', eyeColor: '#ff0054', behavior: 'boss', xpGold: 150, isBoss: true
    }
};

const TILE_SIZE = 32;
const MAP_COLS = 64;
const MAP_ROWS = 48;