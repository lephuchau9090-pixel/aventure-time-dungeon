/**
 * FILE 2/3: sprites.js
 * Chứa toàn bộ hàm vẽ Nhân vật 4 hướng (phong cách Jake Sprite Sheet),
 * vẽ Quái vật Pixel Art chi tiết và vẽ Hiệu ứng Chiêu thức (VFX)
 */

const SpriteRenderer = {
    // 1. VẼ NHÂN VẬT 4 HƯỚNG (MẶT TRƯỚC / LƯNG SAU / NGHIÊNG PHẢI / NGHIÊNG TRÁI)
    drawCharacter(ctx, ch, cx, cy, scale = 1, anim = 0, dir = 'down', isAttacking = false) {
        const id = ch.charId || ch.id || 'finn';
        ctx.save();
        ctx.translate(Math.floor(cx), Math.floor(cy));

        let renderDir = dir;
        if (dir === 'left') {
            ctx.scale(-scale, scale);
            renderDir = 'right';
        } else {
            ctx.scale(scale, scale);
        }

        const step = Math.sin(anim * 1.4);
        const legL = anim > 0 ? Math.round(step * 2) : 0;
        const legR = anim > 0 ? Math.round(-step * 2) : 0;
        const bob = anim > 0 ? Math.abs(Math.round(step)) : 0;

        const outlinedBox = (x, y, w, h, fill, outline = '#111111') => {
            ctx.fillStyle = outline;
            ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
            ctx.fillStyle = fill;
            ctx.fillRect(x, y, w, h);
        };

        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(-7, 10, 14, 3);

        // ==================== JAKE THE DOG ====================
        if (id === 'jake') {
            const fur = '#f7b519';
            const furShade = '#d9910b';

            if (renderDir === 'right') {
                outlinedBox(-3 + legL, 6, 3, 5, fur);
                ctx.fillStyle = '#111'; ctx.fillRect(-3 + legL, 11, 5, 1);
                outlinedBox(1 + legR, 6, 3, 5, fur);
                ctx.fillStyle = '#111'; ctx.fillRect(1 + legR, 11, 5, 1);
            } else {
                outlinedBox(-5, 6 + legL, 3, 5, fur);
                ctx.fillStyle = '#111'; ctx.fillRect(-6, 11 + legL, 4, 1);
                outlinedBox(2, 6 + legR, 3, 5, fur);
                ctx.fillStyle = '#111'; ctx.fillRect(2, 11 + legR, 4, 1);
            }

            if (renderDir === 'right' && !isAttacking) {
                outlinedBox(-8, -2 - bob, 3, 6, furShade);
            }

            outlinedBox(-6, -10 - bob, 12, 3, fur);
            outlinedBox(-7, -8 - bob, 14, 14, fur);
            ctx.fillStyle = furShade;
            ctx.fillRect(-6, 4 - bob, 12, 2);

            if (renderDir === 'down') {
                outlinedBox(-9, -6 - bob, 2, 6, fur);
                outlinedBox(7, -6 - bob, 2, 6, fur);

                if (isAttacking) {
                    outlinedBox(-10, -2 - bob, 3, 6, fur);
                    outlinedBox(7, -1 - bob, 11, 4, fur);
                } else {
                    outlinedBox(-9, -1 - bob, 2, 7, fur);
                    outlinedBox(7, -1 - bob, 2, 7, fur);
                }

                outlinedBox(-6, -7 - bob, 5, 5, '#ffffff');
                outlinedBox(1, -7 - bob, 5, 5, '#ffffff');
                ctx.fillStyle = '#111111';
                ctx.fillRect(-3, -6 - bob, 2, 3);
                ctx.fillRect(2, -6 - bob, 2, 3);

                outlinedBox(-3, -3 - bob, 6, 4, fur);
                ctx.fillStyle = '#111111';
                ctx.fillRect(-4, -2 - bob, 1, 4);
                ctx.fillRect(3, -2 - bob, 1, 4);
                ctx.fillRect(-1, -3 - bob, 2, 2);
                ctx.fillRect(-2, 0 - bob, 4, 1);
            } else if (renderDir === 'up') {
                outlinedBox(-9, -6 - bob, 2, 6, fur);
                outlinedBox(7, -6 - bob, 2, 6, fur);
                outlinedBox(-9, -1 - bob, 2, 7, fur);
                if (isAttacking) {
                    outlinedBox(7, -9 - bob, 4, 10, fur);
                } else {
                    outlinedBox(7, -1 - bob, 2, 7, fur);
                }
                outlinedBox(-1, 3 - bob, 2, 2, furShade);
            } else if (renderDir === 'right') {
                outlinedBox(2, -7 - bob, 5, 5, '#ffffff');
                ctx.fillStyle = '#111111';
                ctx.fillRect(5, -6 - bob, 2, 3);

                outlinedBox(5, -3 - bob, 4, 4, fur);
                ctx.fillStyle = '#111111';
                ctx.fillRect(7, -3 - bob, 2, 2);

                outlinedBox(-4, -5 - bob, 3, 6, furShade);
                outlinedBox(-8, 3 - bob, 2, 2, fur);

                if (isAttacking) {
                    outlinedBox(2, -2 - bob, 15, 4, fur);
                    outlinedBox(16, -3 - bob, 4, 6, fur);
                } else {
                    outlinedBox(-1, -1 - bob, 3, 6, fur);
                }
            }
        }

        // ==================== FINN THE HUMAN ====================
        else if (id === 'finn') {
            const shirt = '#2998ff';
            const shorts = '#1d4ed8';
            const packGreen = '#52b788';
            const packDark = '#2d6a4f';

            outlinedBox(-5, 6 + legL, 3, 5, '#ffcad4');
            ctx.fillStyle = '#ffffff'; ctx.fillRect(-5, 8 + legL, 3, 2);
            ctx.fillStyle = '#111111'; ctx.fillRect(-5, 10 + legL, 4, 2);

            outlinedBox(2, 6 + legR, 3, 5, '#ffcad4');
            ctx.fillStyle = '#ffffff'; ctx.fillRect(2, 8 + legR, 3, 2);
            ctx.fillStyle = '#111111'; ctx.fillRect(2, 10 + legR, 4, 2);

            outlinedBox(-6, 3 - bob, 12, 4, shorts);
            outlinedBox(-6, -3 - bob, 12, 7, shirt);

            outlinedBox(-7, -11 - bob, 14, 9, '#ffffff');
            outlinedBox(-7, -14 - bob, 3, 3, '#ffffff');
            outlinedBox(4, -14 - bob, 3, 3, '#ffffff');

            if (renderDir === 'down') {
                ctx.fillStyle = packDark;
                ctx.fillRect(-6, -3 - bob, 2, 6);
                ctx.fillRect(4, -3 - bob, 2, 6);

                outlinedBox(-5, -9 - bob, 10, 6, '#ffcad4');
                ctx.fillStyle = '#111111';
                ctx.fillRect(-3, -7 - bob, 2, 2);
                ctx.fillRect(1, -7 - bob, 2, 2);
                ctx.fillRect(-1, -5 - bob, 2, 1);

                outlinedBox(-9, -2 - bob, 3, 6, '#ffcad4');
                if (isAttacking) {
                    outlinedBox(6, -3 - bob, 9, 3, '#ffcad4');
                } else {
                    outlinedBox(6, -2 - bob, 3, 6, '#ffcad4');
                }
            } else if (renderDir === 'up') {
                outlinedBox(-6, -3 - bob, 12, 7, packGreen);
                ctx.fillStyle = packDark;
                ctx.fillRect(-6, 0 - bob, 12, 4);
                outlinedBox(-9, -2 - bob, 3, 6, '#ffcad4');
                outlinedBox(6, -2 - bob, 3, 6, '#ffcad4');
            } else if (renderDir === 'right') {
                outlinedBox(-9, -3 - bob, 4, 7, packGreen);
                outlinedBox(2, -9 - bob, 5, 6, '#ffcad4');
                ctx.fillStyle = '#111111';
                ctx.fillRect(4, -7 - bob, 2, 2);

                if (isAttacking) {
                    outlinedBox(3, -2 - bob, 10, 3, '#ffcad4');
                } else {
                    outlinedBox(-1, -1 - bob, 3, 6, '#ffcad4');
                }
            }
        }

        // ==================== PRINCESS BUBBLEGUM ====================
        else if (id === 'pb') {
            const hair = '#ff5d8f';
            const dress = '#ff9ebb';
            const skin = '#ffe5ec';

            outlinedBox(-4, 6 + legL, 3, 5, skin);
            outlinedBox(1, 6 + legR, 3, 5, skin);

            if (renderDir === 'down') {
                outlinedBox(-8, -9 - bob, 16, 14, hair);
            }

            outlinedBox(-6, -2 - bob, 12, 9, dress);
            outlinedBox(-6, -11 - bob, 12, 9, hair);

            outlinedBox(-4, -15 - bob, 8, 4, '#ffd93d');
            ctx.fillStyle = '#38b6ff';
            ctx.fillRect(-1, -14 - bob, 2, 2);

            if (renderDir === 'down') {
                outlinedBox(-5, -8 - bob, 10, 6, skin);
                ctx.fillStyle = '#111111';
                ctx.fillRect(-3, -6 - bob, 2, 2);
                ctx.fillRect(1, -6 - bob, 2, 2);

                outlinedBox(-8, -1 - bob, 2, 6, skin);
                outlinedBox(6, -1 - bob, 2, 6, skin);
            } else if (renderDir === 'up') {
                outlinedBox(-7, -10 - bob, 14, 15, hair);
            } else if (renderDir === 'right') {
                outlinedBox(-8, -10 - bob, 6, 15, hair);
                outlinedBox(1, -8 - bob, 5, 6, skin);
                ctx.fillStyle = '#111111';
                ctx.fillRect(4, -6 - bob, 2, 2);
                if (isAttacking) {
                    outlinedBox(3, -2 - bob, 9, 3, skin);
                } else {
                    outlinedBox(0, -1 - bob, 3, 6, skin);
                }
            }
        }

        // ==================== MARCELINE ====================
        else if (id === 'marceline') {
            const hair = '#181425';
            const skin = '#b8c0ff';
            const top = '#2b2d42';
            const pants = '#1d3557';

            outlinedBox(-4, 6 + legL, 3, 5, pants);
            ctx.fillStyle = '#d90429'; ctx.fillRect(-4, 9 + legL, 3, 2);
            outlinedBox(1, 6 + legR, 3, 5, pants);
            ctx.fillStyle = '#d90429'; ctx.fillRect(1, 9 + legR, 3, 2);

            if (renderDir === 'down') {
                outlinedBox(-8, -10 - bob, 16, 16, hair);
            }

            outlinedBox(-5, -2 - bob, 10, 8, top);
            outlinedBox(-6, -11 - bob, 12, 9, hair);

            if (renderDir === 'down') {
                outlinedBox(-5, -8 - bob, 10, 6, skin);
                ctx.fillStyle = '#d90429';
                ctx.fillRect(-3, -6 - bob, 2, 2);
                ctx.fillRect(1, -6 - bob, 2, 2);
                ctx.fillRect(-2, -2 - bob, 1, 1);
                ctx.fillRect(0, -2 - bob, 1, 1);

                outlinedBox(-8, -1 - bob, 2, 6, skin);
                if (isAttacking) {
                    outlinedBox(5, -3 - bob, 9, 4, '#d90429');
                } else {
                    outlinedBox(6, -1 - bob, 2, 6, skin);
                }
            } else if (renderDir === 'up') {
                outlinedBox(-8, -11 - bob, 16, 17, hair);
            } else if (renderDir === 'right') {
                outlinedBox(-8, -11 - bob, 7, 16, hair);
                outlinedBox(1, -8 - bob, 5, 6, skin);
                ctx.fillStyle = '#d90429';
                ctx.fillRect(4, -6 - bob, 2, 2);
                if (isAttacking) {
                    outlinedBox(3, -3 - bob, 10, 4, '#d90429');
                } else {
                    outlinedBox(0, -1 - bob, 3, 6, skin);
                }
            }
        }

        // ==================== BMO ====================
        else if (id === 'bmo') {
            const teal = '#2ec4b6';
            const darkTeal = '#1b9aaa';
            const screen = '#cbf3f0';

            outlinedBox(-4, 6 + legL, 2, 4, darkTeal);
            outlinedBox(2, 6 + legR, 2, 4, darkTeal);
            outlinedBox(-7, -9 - bob, 14, 15, teal);

            if (renderDir === 'down') {
                outlinedBox(-5, -7 - bob, 10, 6, screen);
                ctx.fillStyle = '#111111';
                ctx.fillRect(-3, -5 - bob, 2, 2);
                ctx.fillRect(1, -5 - bob, 2, 2);
                ctx.fillRect(-1, -3 - bob, 2, 1);

                ctx.fillStyle = '#111111';
                ctx.fillRect(-4, 1 - bob, 5, 1);
                ctx.fillStyle = '#ffd93d';
                ctx.fillRect(-4, 3 - bob, 3, 3);
                ctx.fillStyle = '#e63946';
                ctx.fillRect(2, 3 - bob, 2, 2);
                ctx.fillStyle = '#38b6ff';
                ctx.fillRect(4, 1 - bob, 2, 2);

                outlinedBox(-9, -1 - bob, 2, 5, darkTeal);
                outlinedBox(7, -1 - bob, 2, 5, darkTeal);
            } else if (renderDir === 'up') {
                ctx.fillStyle = '#111111';
                ctx.fillRect(-4, -6 - bob, 8, 2);
                outlinedBox(-4, -1 - bob, 8, 5, darkTeal);
                outlinedBox(-9, -1 - bob, 2, 5, darkTeal);
                outlinedBox(7, -1 - bob, 2, 5, darkTeal);
            } else if (renderDir === 'right') {
                outlinedBox(1, -7 - bob, 6, 6, screen);
                ctx.fillStyle = '#111111';
                ctx.fillRect(4, -5 - bob, 2, 2);
                ctx.fillRect(-4, -5 - bob, 3, 7);

                if (isAttacking) {
                    outlinedBox(2, -1 - bob, 8, 3, darkTeal);
                } else {
                    outlinedBox(-1, 0 - bob, 2, 5, darkTeal);
                }
            }
        }

        ctx.restore();
    },

    // 2. VẼ QUÁI VẬT & TRÙM CUỐI PIXEL ART CHI TIẾT
    drawEnemy(ctx, e, timeSec) {
        ctx.save();
        ctx.translate(Math.floor(e.x), Math.floor(e.y));

        const anim = timeSec * 6 + e.animOffset;
        const bob = Math.round(Math.sin(anim) * 1.5);
        const step = Math.round(Math.cos(anim * 1.5) * 2);
        const isHurt = e.hurtFlash > 0;

        const outlinedBox = (x, y, w, h, fill) => {
            ctx.fillStyle = '#111111';
            ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
            ctx.fillStyle = isHurt ? '#ffffff' : fill;
            ctx.fillRect(x, y, w, h);
        };

        ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
        ctx.fillRect(-e.radius, e.radius - 2, e.radius * 2, 4);

        ctx.save();
        if (e.facingLeft) ctx.scale(-1, 1);

        if (e.typeKey === 'candy_zombie') {
            outlinedBox(-6, 7 + step, 4, 5, '#c9184a');
            outlinedBox(2, 7 - step, 4, 5, '#c9184a');
            outlinedBox(-9, -8 - bob, 18, 16, '#ff85a1');
            outlinedBox(-10, -11 - bob, 20, 5, '#52b788');
            ctx.fillStyle = isHurt ? '#fff' : '#52b788';
            ctx.fillRect(-6, -6 - bob, 3, 3);
            ctx.fillRect(3, -6 - bob, 3, 4);

            outlinedBox(7, -3 - bob, 6, 4, '#ff85a1');
            outlinedBox(-11, -2 - bob, 4, 5, '#ff85a1');

            outlinedBox(-6, -4 - bob, 4, 4, '#fff');
            outlinedBox(2, -5 - bob, 5, 5, '#fff');
            ctx.fillStyle = '#111111';
            ctx.fillRect(-4, -3 - bob, 2, 2);
            ctx.fillRect(4, -3 - bob, 2, 2);
            ctx.fillRect(-4, 2 - bob, 8, 3);
            ctx.fillStyle = '#ffd93d';
            ctx.fillRect(-2, 2 - bob, 2, 2);
            ctx.fillRect(2, 2 - bob, 2, 2);
        } else if (e.typeKey === 'slime_ooze') {
            const stretch = Math.round(Math.sin(anim * 1.5) * 2);
            outlinedBox(-11 - stretch, 2, 22 + stretch * 2, 7, '#55a630');
            outlinedBox(-9, -5 + stretch, 18, 9, '#8ac926');
            outlinedBox(-6, -9 + stretch, 12, 5, '#b5e48c');

            outlinedBox(-6, -3 + stretch, 4, 4, '#ffffff');
            outlinedBox(2, -3 + stretch, 4, 4, '#ffffff');
            ctx.fillStyle = '#111111';
            ctx.fillRect(-4, -2 + stretch, 2, 2);
            ctx.fillRect(4, -2 + stretch, 2, 2);
        } else if (e.typeKey === 'ice_golem') {
            outlinedBox(-9, 8 + step, 6, 7, '#48cae4');
            outlinedBox(3, 8 - step, 6, 7, '#48cae4');
            outlinedBox(-12, -9 - bob, 24, 18, '#90e0ef');
            outlinedBox(-16, -8 - bob, 6, 12, '#00b4d8');
            outlinedBox(10, -8 - bob, 6, 12, '#00b4d8');

            outlinedBox(-8, -14 - bob, 4, 5, '#caf0f8');
            outlinedBox(-1, -16 - bob, 4, 7, '#caf0f8');
            outlinedBox(5, -13 - bob, 4, 4, '#caf0f8');

            ctx.fillStyle = '#1d3557';
            ctx.fillRect(-8, -5 - bob, 16, 5);
            ctx.fillStyle = '#ffbe0b';
            ctx.fillRect(-6, -4 - bob, 4, 3);
            ctx.fillRect(2, -4 - bob, 4, 3);
        } else if (e.typeKey === 'gunter_bot') {
            outlinedBox(-6, 8 + step, 4, 3, '#ffbe0b');
            outlinedBox(2, 8 - step, 4, 3, '#ffbe0b');
            outlinedBox(-8, -9 - bob, 16, 17, '#1d3557');
            ctx.fillStyle = isHurt ? '#fff' : '#ffffff';
            ctx.fillRect(-5, -3 - bob, 10, 10);

            outlinedBox(-11, -3 - bob, 3, 7, '#1d3557');
            outlinedBox(8, -3 - bob, 3, 7, '#1d3557');

            outlinedBox(-6, -7 - bob, 4, 4, '#ffffff');
            outlinedBox(2, -7 - bob, 4, 4, '#ffffff');
            ctx.fillStyle = '#111111';
            ctx.fillRect(-4, -6 - bob, 2, 2);
            ctx.fillRect(4, -6 - bob, 2, 2);
            outlinedBox(-2, -4 - bob, 5, 3, '#ffbe0b');
        } else if (e.typeKey === 'shadow_wraith') {
            const floatY = Math.round(Math.sin(anim * 1.4) * 3);
            outlinedBox(-8, 4 + floatY, 4, 6, '#3c096c');
            outlinedBox(-2, 5 + floatY, 4, 7, '#3c096c');
            outlinedBox(4, 4 + floatY, 4, 6, '#3c096c');

            outlinedBox(-10, -10 + floatY, 20, 16, '#5a189a');
            outlinedBox(-7, -13 + floatY, 14, 4, '#7209b7');

            ctx.fillStyle = '#10002b';
            ctx.fillRect(-6, -7 + floatY, 12, 8);
            ctx.fillStyle = '#ffbe0b';
            ctx.fillRect(-5, -5 + floatY, 3, 3);
            ctx.fillRect(2, -5 + floatY, 3, 3);
        } else if (e.isBoss) {
            const floatY = Math.round(Math.sin(anim) * 2);
            for (let k = 0; k < 4; k++) {
                const a = timeSec * 3 + (Math.PI * 2 * k) / 4;
                const fx = Math.cos(a) * 30;
                const fy = Math.sin(a) * 20;
                outlinedBox(fx - 3, fy - 3, 6, 6, '#8ac926');
            }

            outlinedBox(-18, -10 + floatY, 36, 28, '#2b2d42');
            outlinedBox(-14, -8 + floatY, 28, 24, '#4a4e69');

            outlinedBox(-19, -24 + floatY, 6, 12, '#3d405b');
            outlinedBox(-22, -28 + floatY, 5, 7, '#3d405b');
            outlinedBox(13, -24 + floatY, 6, 12, '#3d405b');
            outlinedBox(17, -28 + floatY, 5, 7, '#3d405b');

            outlinedBox(-12, -20 + floatY, 24, 15, '#d8f3dc');
            outlinedBox(-10, -27 + floatY, 20, 7, '#ffd93d');
            ctx.fillStyle = '#ff0054';
            ctx.fillRect(-6, -25 + floatY, 3, 4);
            ctx.fillRect(0, -26 + floatY, 3, 5);
            ctx.fillRect(6, -25 + floatY, 3, 4);

            ctx.fillStyle = '#111111';
            ctx.fillRect(-9, -16 + floatY, 7, 6);
            ctx.fillRect(2, -16 + floatY, 7, 6);
            ctx.fillStyle = '#8ac926';
            ctx.fillRect(-7, -14 + floatY, 3, 3);
            ctx.fillStyle = '#ff0054';
            ctx.fillRect(4, -14 + floatY, 3, 3);

            outlinedBox(-24, -2 + floatY, 7, 7, '#8ac926');
            outlinedBox(17, -2 + floatY, 7, 7, '#48cae4');
        }

        ctx.restore();

        if (e.hp < e.maxHp && !e.isBoss) {
            const bw = 28;
            ctx.fillStyle = '#111111';
            ctx.fillRect(-bw / 2 - 1, -e.radius - 13, bw + 2, 7);
            ctx.fillStyle = '#2b0912';
            ctx.fillRect(-bw / 2, -e.radius - 12, bw, 5);
            ctx.fillStyle = '#ff2a55';
            ctx.fillRect(-bw / 2, -e.radius - 12, bw * (e.hp / e.maxHp), 5);
        }

        ctx.restore();
    },

    // 3. VẼ HIỆU ỨNG CHIÊU THỨC (VFX)
    drawVisualEffects(ctx, visualEffects) {
        visualEffects.forEach(vfx => {
            const progress = 1 - (vfx.life / vfx.maxLife);
            ctx.save();

            if (vfx.type === 'slash_arc') {
                ctx.translate(vfx.x, vfx.y);
                ctx.rotate(vfx.angle);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(0, 0, vfx.radius, -0.95, 0.95);
                ctx.stroke();

                ctx.strokeStyle = vfx.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, vfx.radius + 3, -1.05, 1.05);
                ctx.stroke();
            } else if (vfx.type === 'whirlwind_slash') {
                ctx.translate(vfx.x, vfx.y);
                ctx.rotate(progress * Math.PI * 4);
                for (let b = 0; b < 3; b++) {
                    ctx.rotate((Math.PI * 2) / 3);
                    ctx.strokeStyle = b % 2 === 0 ? vfx.color : vfx.secondaryColor;
                    ctx.lineWidth = 6 * (1 - progress * 0.4);
                    ctx.beginPath();
                    ctx.arc(0, 0, vfx.radius * (0.6 + progress * 0.4), 0, Math.PI * 0.9);
                    ctx.stroke();
                }
            } else if (vfx.type === 'jake_giant_punch') {
                ctx.translate(vfx.x, vfx.y);
                ctx.rotate(vfx.angle);
                const ext = Math.sin(progress * Math.PI) * vfx.length;

                ctx.fillStyle = '#111111';
                ctx.fillRect(8, -7, ext, 14);
                ctx.fillStyle = '#f7b519';
                ctx.fillRect(8, -5, ext, 10);

                const fx = 8 + ext;
                ctx.fillStyle = '#111111';
                ctx.fillRect(fx - 4, -15, 24, 30);
                ctx.fillStyle = '#f7b519';
                ctx.fillRect(fx - 2, -13, 20, 26);
                ctx.fillStyle = '#d9910b';
                ctx.fillRect(fx + 10, -11, 6, 5);
                ctx.fillRect(fx + 10, -3, 6, 5);
                ctx.fillRect(fx + 10, 5, 6, 5);
            } else if (vfx.type === 'earth_shatter') {
                const curR = vfx.maxRadius * progress;
                ctx.translate(vfx.x, vfx.y);
                ctx.strokeStyle = vfx.color;
                ctx.lineWidth = 4 * (1 - progress);
                ctx.beginPath();
                ctx.arc(0, 0, curR, 0, Math.PI * 2);
                ctx.stroke();

                for (let k = 0; k < 8; k++) {
                    const a = (Math.PI * 2 * k) / 8;
                    ctx.strokeStyle = vfx.secondaryColor;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(a) * curR, Math.sin(a) * curR);
                    ctx.stroke();

                    const rx = Math.cos(a) * curR;
                    const ry = Math.sin(a) * curR;
                    ctx.fillStyle = '#111111';
                    ctx.fillRect(rx - 5, ry - 5, 10, 10);
                    ctx.fillStyle = vfx.color;
                    ctx.fillRect(rx - 4, ry - 4, 8, 8);
                }
            } else if (vfx.type === 'shockwave') {
                const r = vfx.maxRadius * progress;
                ctx.strokeStyle = vfx.color;
                ctx.lineWidth = 4 * (1 - progress);
                ctx.beginPath();
                ctx.arc(vfx.x, vfx.y, r, 0, Math.PI * 2);
                ctx.stroke();

                if (vfx.secondaryColor) {
                    ctx.strokeStyle = vfx.secondaryColor;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(vfx.x, vfx.y, r * 0.7, 0, Math.PI * 2);
                    ctx.stroke();
                }
            } else if (vfx.type === 'aura_burst') {
                ctx.strokeStyle = vfx.color;
                ctx.lineWidth = 3;
                const r = vfx.radius * progress;
                ctx.strokeRect(vfx.x - r, vfx.y - r, r * 2, r * 2);
            } else if (vfx.type === 'heal_fountain') {
                ctx.translate(vfx.x, vfx.y);
                ctx.strokeStyle = vfx.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 4, vfx.radius * (0.5 + progress * 0.5), 0, Math.PI * 2);
                ctx.stroke();

                for (let k = 0; k < 4; k++) {
                    const ang = (Math.PI * 2 * k) / 4 + progress * 3;
                    const hx = Math.cos(ang) * 18;
                    const hy = -progress * 26 + (k % 2) * 8;
                    ctx.fillStyle = '#6ce88b';
                    ctx.fillRect(hx - 4, hy - 1, 8, 3);
                    ctx.fillRect(hx - 1, hy - 4, 3, 8);
                }
            } else if (vfx.type === 'dash_afterimage') {
                ctx.globalAlpha = (vfx.life / vfx.maxLife) * 0.45;
                this.drawCharacter(ctx, CHARACTERS.marceline, vfx.x, vfx.y, 1.35, 0, vfx.dir, false);
            } else if (vfx.type === 'blood_drain_beam') {
                const curX = vfx.x + (vfx.targetX - vfx.x) * progress;
                const curY = vfx.y + (vfx.targetY - vfx.y) * progress;
                ctx.strokeStyle = '#d90429';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(vfx.x, vfx.y);
                ctx.lineTo(vfx.targetX, vfx.targetY);
                ctx.stroke();

                ctx.fillStyle = '#111111';
                ctx.fillRect(curX - 7, curY - 3, 14, 6);
                ctx.fillStyle = '#ff0054';
                ctx.fillRect(curX - 5, curY - 2, 10, 4);
            } else if (vfx.type === 'cyber_overclock') {
                ctx.translate(vfx.x, vfx.y);
                const r = vfx.maxRadius * progress;
                ctx.strokeStyle = '#2ec4b6';
                ctx.lineWidth = 2;
                ctx.strokeRect(-r, -r, r * 2, r * 2);

                for (let k = 0; k < 8; k++) {
                    const a = (Math.PI * 2 * k) / 8 + progress * 2;
                    ctx.strokeStyle = k % 2 === 0 ? '#ffd93d' : '#cbf3f0';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(a + 0.15) * (r * 0.5), Math.sin(a + 0.15) * (r * 0.5));
                    ctx.lineTo(Math.cos(a - 0.1) * r, Math.sin(a - 0.1) * r);
                    ctx.stroke();
                }
            }

            ctx.restore();
        });
    },

    // 4. VẼ ĐẠN KỸ NĂNG (PROJECTILES)
    drawProjectiles(ctx, projectiles, timeSec) {
        projectiles.forEach(pr => {
            ctx.save();
            ctx.translate(pr.x, pr.y);

            if (pr.projStyle === 'crescent_wave') {
                ctx.rotate(pr.angle || 0);
                ctx.strokeStyle = '#111111';
                ctx.lineWidth = 9;
                ctx.beginPath();
                ctx.arc(0, 0, pr.radius, -1.1, 1.1);
                ctx.stroke();

                ctx.strokeStyle = '#ffd93d';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(0, 0, pr.radius, -1.05, 1.05);
                ctx.stroke();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, pr.radius + 2, -0.8, 0.8);
                ctx.stroke();
            } else if (pr.projStyle === 'sonic_chord') {
                ctx.rotate(pr.angle || 0);
                const pulse = Math.sin(timeSec * 25) * 3;
                ctx.strokeStyle = '#e63946';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 0, pr.radius + pulse, -0.9, 0.9);
                ctx.stroke();

                ctx.strokeStyle = '#8338ec';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(-6, 0, pr.radius * 0.7, -0.9, 0.9);
                ctx.stroke();
            } else if (pr.projStyle === 'pixel_cube') {
                ctx.rotate(timeSec * 12);
                ctx.fillStyle = '#111111';
                ctx.fillRect(-7, -7, 14, 14);
                ctx.fillStyle = '#2ec4b6';
                ctx.fillRect(-5, -5, 10, 10);
                ctx.fillStyle = '#ffd93d';
                ctx.fillRect(-2, -2, 4, 4);
            } else if (pr.projStyle === 'lich_skull_fire') {
                ctx.fillStyle = '#111111';
                ctx.fillRect(-8, -8, 16, 16);
                ctx.fillStyle = '#8ac926';
                ctx.fillRect(-6, -6, 12, 12);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-3, -3, 6, 6);
            } else {
                ctx.fillStyle = '#111111';
                ctx.fillRect(-pr.radius - 1, -pr.radius - 1, pr.radius * 2 + 2, pr.radius * 2 + 2);
                ctx.fillStyle = pr.color;
                ctx.fillRect(-pr.radius, -pr.radius, pr.radius * 2, pr.radius * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-2, -2, 3, 3);
            }

            ctx.restore();
        });
    }
};