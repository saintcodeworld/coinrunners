import { Obstacle, ObstacleType, Coin, Player, PricePoint, SkinSettings } from '../types';
import { COLOR_RUG, COLOR_LINK, COLOR_HALT } from '../constants';

// --- Sprites & Assets ---

// Helper to draw pixel rectangles
const drawPixelRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
};

export const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player, frameTick: number, skin?: SkinSettings) => {
  const { x, y } = player;

  // Default fallback if no skin provided
  const s = skin || {
    id: 'default',
    name: 'Default',
    hoodieColor: player.color, // Fallback to player.color
    pantsColor: '#1e293b',
    skinColor: '#fca5a5',
    accessory: 'sunglasses' as const,
    model: 'human',
    headScale: 1,
    bodyScale: 1
  };

  const { hoodieColor, pantsColor, skinColor, accessory, accessoryColor, model = 'human', headScale = 1, bodyScale = 1, chain = false, footwear = 'none' } = s;
  const accColor = accessoryColor || '#000000';

  ctx.save();

  // Animation bobbing
  const bounce = player.isJumping ? 0 : (Math.sin(frameTick * 0.2) * 2);
  const drawY = y + bounce;

  // Helper for footwear
  const drawFootwear = (fx: number, fy: number, fw: number, fh: number) => {
    if (footwear === 'none') return;

    if (footwear === 'boots') {
      drawPixelRect(ctx, fx - 1, fy + fh - 6, fw + 2, 8, '#1e293b'); // Dark boot
      drawPixelRect(ctx, fx - 1, fy + fh - 2, fw + 2, 2, '#0f172a'); // Sole
    } else if (footwear === 'sneakers') {
      drawPixelRect(ctx, fx - 1, fy + fh - 5, fw + 2, 6, '#ea580c'); // Bright orange
      drawPixelRect(ctx, fx, fy + fh - 5, 2, 2, 'white'); // Lace
      drawPixelRect(ctx, fx - 1, fy + fh - 2, fw + 2, 2, 'white'); // Sole
    } else if (footwear === 'flippers') {
      drawPixelRect(ctx, fx - 4, fy + fh - 2, fw + 8, 3, '#0ea5e9'); // Blue flipper
    } else if (footwear === 'shoes') {
      drawPixelRect(ctx, fx - 1, fy + fh - 4, fw + 2, 4, 'black'); // Black dress shoe
      drawPixelRect(ctx, fx - 1, fy + fh - 1, fw + 2, 1, '#333'); // Sole
    }
  };

  if (model === 'penguin') {
    // ... (Penguin code remains the same, omitted for brevity if I could, but I must replace the block.
    // Wait, I am using replace_file_content with a range. I should probably target the specific blocks or use multi_replace.
    // I will use multi_replace if I need to touch multiple places, but here I can just inject the footwear logic in the helper
    // and then the accessory logic later.
    // Actually, I am editing the `drawFootwear` helper and the `accessory` block. They are far apart.
    // I will use multi_replace.
    // Wait, the previous tool call loop handles one tool at a time.
    // To be safe and clean, I will use `multi_replace`.
  }


  if (model === 'penguin') {
    // === PENGUIN MODEL ===
    const bellyColor = 'white';

    // Body (Roundish)
    drawPixelRect(ctx, x + 10, drawY + 15, 20, 25, hoodieColor); // Main body
    drawPixelRect(ctx, x + 14, drawY + 18, 12, 22, bellyColor); // Belly

    // Head (Connected to body)
    drawPixelRect(ctx, x + 10, drawY + 5, 20, 15, hoodieColor);

    // Eyes
    drawPixelRect(ctx, x + 14, drawY + 8, 4, 4, 'white');
    drawPixelRect(ctx, x + 22, drawY + 8, 4, 4, 'white');
    drawPixelRect(ctx, x + 15, drawY + 9, 2, 2, 'black');
    drawPixelRect(ctx, x + 23, drawY + 9, 2, 2, 'black');

    // Beak
    drawPixelRect(ctx, x + 18, drawY + 12, 6, 3, '#f97316');

    // Feet
    if (player.isJumping) {
      drawPixelRect(ctx, x + 10, drawY + 38, 8, 4, '#f97316');
      drawPixelRect(ctx, x + 22, drawY + 38, 8, 4, '#f97316');
    } else {
      const legPhase = Math.sin(frameTick * 0.5);
      drawPixelRect(ctx, x + 10, drawY + 38 + (legPhase * 2), 8, 4, '#f97316');
      drawPixelRect(ctx, x + 22, drawY + 38 - (legPhase * 2), 8, 4, '#f97316');
    }

    // Flippers
    if (player.isJumping) {
      // Flapping
      const flap = Math.sin(frameTick * 0.8) * 5;
      drawPixelRect(ctx, x + 2, drawY + 15 + flap, 8, 12, hoodieColor);
      drawPixelRect(ctx, x + 30, drawY + 15 + flap, 8, 12, hoodieColor);
    } else {
      drawPixelRect(ctx, x + 4, drawY + 18, 6, 12, hoodieColor);
      drawPixelRect(ctx, x + 30, drawY + 18, 6, 12, hoodieColor);
    }

    // Minimal accessories support for Penguin (Hat only usually fits)
    if (accessory === 'hat') {
      drawPixelRect(ctx, x + 8, drawY - 2, 24, 6, accColor); // Brim
      drawPixelRect(ctx, x + 12, drawY - 10, 16, 8, accColor); // Top
    }

  } else if (model === 'lobster') {
    // === LOBSTER MODEL ===
    const shellColor = hoodieColor; // Usually red
    const secondaryColor = pantsColor; // Darker red

    // Tail (Curled)
    drawPixelRect(ctx, x + 5, drawY + 20, 12, 10, secondaryColor); // Left tail part
    drawPixelRect(ctx, x + 23, drawY + 20, 12, 10, secondaryColor); // Right tail part
    drawPixelRect(ctx, x + 15, drawY + 25, 10, 15, secondaryColor); // Center tail

    // Body (Carapace)
    drawPixelRect(ctx, x + 10, drawY + 8, 20, 18, shellColor);

    // Head Area
    drawPixelRect(ctx, x + 15, drawY + 2, 10, 8, shellColor);

    // Eyes (Stalks)
    drawPixelRect(ctx, x + 14, drawY - 4, 3, 6, shellColor);
    drawPixelRect(ctx, x + 23, drawY - 4, 3, 6, shellColor);
    drawPixelRect(ctx, x + 14, drawY - 5, 3, 3, 'black');
    drawPixelRect(ctx, x + 23, drawY - 5, 3, 3, 'black');

    // Claws
    const armY = drawY + 10;
    if (player.isJumping) {
      // Snip snip
      const snip = Math.abs(Math.sin(frameTick * 0.5)) * 3;
      // Left Claw
      drawPixelRect(ctx, x - 2, armY - 10, 10, 15, shellColor);
      drawPixelRect(ctx, x - 2, armY - 15 - snip, 4, 8, shellColor);
      drawPixelRect(ctx, x + 4, armY - 15 + snip, 4, 8, shellColor);

      // Right Claw
      drawPixelRect(ctx, x + 32, armY - 10, 10, 15, shellColor);
      drawPixelRect(ctx, x + 32, armY - 15 + snip, 4, 8, shellColor);
      drawPixelRect(ctx, x + 38, armY - 15 - snip, 4, 8, shellColor);
    } else {
      // Idle claws
      const bob = Math.sin(frameTick * 0.2) * 2;
      drawPixelRect(ctx, x - 2, armY + bob, 10, 12, shellColor);
      drawPixelRect(ctx, x + 32, armY + bob, 10, 12, shellColor);
    }

    // Legs
    drawPixelRect(ctx, x + 8, drawY + 30, 4, 8, secondaryColor);
    drawPixelRect(ctx, x + 18, drawY + 30, 4, 8, secondaryColor);
    drawPixelRect(ctx, x + 28, drawY + 30, 4, 8, secondaryColor);

  } else if (model === 'dog') {
    // === DOG MODEL (Dogwifhat style) ===
    // Colors derived from props or defaults
    const furColor = hoodieColor; // Main body/fur
    const hatColor = accessoryColor || '#ec4899'; // Default pink for wif hat

    // Body (Little quadruped standing up like a person for game mechanics)
    // Actually, let's make it look like the meme (sitting/standing dog)

    // Body / Chest
    drawPixelRect(ctx, x + 10, drawY + 18, 20, 18, furColor);

    // Head (Shiba style)
    drawPixelRect(ctx, x + 8, drawY + 2, 24, 16, furColor);

    // Ears
    drawPixelRect(ctx, x + 6, drawY - 2, 6, 6, furColor);
    drawPixelRect(ctx, x + 28, drawY - 2, 6, 6, furColor);

    // Snout
    drawPixelRect(ctx, x + 16, drawY + 10, 8, 6, '#fff7ed'); // Lighter muzzle
    drawPixelRect(ctx, x + 18, drawY + 10, 4, 2, 'black'); // Nose

    // Eyes
    drawPixelRect(ctx, x + 12, drawY + 6, 4, 4, 'black');
    drawPixelRect(ctx, x + 24, drawY + 6, 4, 4, 'black');

    // THE HAT (Beanie)
    if (accessory === 'hat') {
      drawPixelRect(ctx, x + 6, drawY - 4, 28, 8, hatColor); // Main band
      drawPixelRect(ctx, x + 10, drawY - 8, 20, 6, hatColor); // Top dome
    }

    // Legs/Paws
    if (player.isJumping) {
      drawPixelRect(ctx, x + 10, drawY + 34, 6, 6, furColor);
      drawPixelRect(ctx, x + 24, drawY + 34, 6, 6, furColor);
    } else {
      const legPhase = Math.sin(frameTick * 0.5);
      drawPixelRect(ctx, x + 10, drawY + 36 + (legPhase * 2), 6, 6, furColor);
      drawPixelRect(ctx, x + 24, drawY + 36 - (legPhase * 2), 6, 6, furColor);
    }

    // Arms/Forelegs
    drawPixelRect(ctx, x + 4, drawY + 22, 6, 10, furColor);
    drawPixelRect(ctx, x + 30, drawY + 22, 6, 10, furColor);

  } else {
    // === HUMAN / STANDARD MODEL ===

    // Legs
    if (player.isJumping) {
      drawPixelRect(ctx, x + 10, drawY + 25, 8, 10, pantsColor);
      drawPixelRect(ctx, x + 22, drawY + 20, 8, 10, pantsColor);
      drawFootwear(x + 10, drawY + 25, 8, 10);
      drawFootwear(x + 22, drawY + 20, 8, 10);
    } else {
      const legPhase = Math.sin(frameTick * 0.5);
      drawPixelRect(ctx, x + 10, drawY + 25 + (legPhase * 5), 8, 15, pantsColor);
      drawPixelRect(ctx, x + 22, drawY + 25 - (legPhase * 5), 8, 15, pantsColor);
      drawFootwear(x + 10, drawY + 25 + (legPhase * 5), 8, 15);
      drawFootwear(x + 22, drawY + 25 - (legPhase * 5), 8, 15);
    }

    // Body
    const bw = 30 * bodyScale;
    const bx = x + (40 - bw) / 2;
    drawPixelRect(ctx, bx, drawY + 10, bw, 20, hoodieColor);

    // Chain (Gold)
    if (chain) {
      drawPixelRect(ctx, bx + bw / 2 - 6, drawY + 12, 12, 8, '#fcd34d'); // Gold chain loop
      drawPixelRect(ctx, bx + bw / 2 - 4, drawY + 14, 8, 4, hoodieColor); // Inner hole
      drawPixelRect(ctx, bx + bw / 2 - 2, drawY + 18, 4, 4, '#fcd34d'); // Pendant
    }

    // Head
    const hw = 24 * headScale;
    const hh = 15 * headScale;
    const hx = x + (40 - hw) / 2;
    const hy = drawY - 5 - (hh - 15); // Grow upwards
    drawPixelRect(ctx, hx, hy, hw, hh, skinColor);

    // === ACCESSORIES ===
    // Note: Accessories are hardcoded for standard size. 
    // We'll apply a simple offset check or just draw them relative to center.
    // For simplicity, we mostly stick to standard coordinates but shifted if head is moved.

    const cx = x + 20; // Center X

    if (accessory === 'sunglasses') {
      const glassesWidth = 16 * headScale;
      drawPixelRect(ctx, cx - glassesWidth / 2 + 2, hy + 3 * headScale, glassesWidth, 6 * headScale, 'black');
      drawPixelRect(ctx, cx - glassesWidth / 2 + 4, hy + 4 * headScale, 3 * headScale, 2 * headScale, 'white');
      drawPixelRect(ctx, cx + 2, hy + 4 * headScale, 2 * headScale, 2 * headScale, 'white');
    } else if (accessory === 'hat') {
      drawPixelRect(ctx, cx - 14 * headScale, hy - 5, 28 * headScale, 6 * headScale, accColor); // Brim
      drawPixelRect(ctx, cx - 10 * headScale, hy - 13, 20 * headScale, 8 * headScale, accColor); // Top
      // Eyes
      drawPixelRect(ctx, cx + 2, hy + 3 * headScale, 4, 4, 'black');
      drawPixelRect(ctx, cx + 8, hy + 3 * headScale, 4, 4, 'black');
    } else if (accessory === 'cap') {
      drawPixelRect(ctx, cx - 14 * headScale, hy - 5, 26 * headScale, 6 * headScale, accColor);
      drawPixelRect(ctx, cx, hy - 5, 14 * headScale, 4 * headScale, accColor); // Bill
      // Eyes
      drawPixelRect(ctx, cx + 2, hy + 3 * headScale, 4, 4, 'black');
      drawPixelRect(ctx, cx + 8, hy + 3 * headScale, 4, 4, 'black');
    } else if (accessory === 'headphones') {
      // Band
      drawPixelRect(ctx, cx - 14 * headScale, hy - 3, 28 * headScale, 4 * headScale, accColor);
      // Muffs
      drawPixelRect(ctx, cx - 16 * headScale, hy + 3, 6 * headScale, 12 * headScale, accColor);
      drawPixelRect(ctx, cx + 10 * headScale, hy + 3, 6 * headScale, 12 * headScale, accColor);
      // Eyes
      drawPixelRect(ctx, cx - 2, hy + 3 * headScale, 4, 4, 'black');
      drawPixelRect(ctx, cx + 6, hy + 3 * headScale, 4, 4, 'black');
    } else if (accessory === 'bandana') {
      // Eyes
      drawPixelRect(ctx, cx - 2, hy + 1 * headScale, 4, 4, 'black');
      drawPixelRect(ctx, cx + 6, hy + 1 * headScale, 4, 4, 'black');
      // Bandana
      drawPixelRect(ctx, cx - 12 * headScale, hy + 7 * headScale, 24 * headScale, 10 * headScale, accColor);
    } else if (accessory === 'tophat') {
      drawPixelRect(ctx, cx - 14 * headScale, hy - 3, 28 * headScale, 4 * headScale, 'black'); // Brim
      drawPixelRect(ctx, cx - 10 * headScale, hy - 15, 20 * headScale, 12 * headScale, 'black'); // Top
      drawPixelRect(ctx, cx - 10 * headScale, hy - 7, 20 * headScale, 4 * headScale, accColor); // Ribbon
      // Eyes and monocle
      drawPixelRect(ctx, cx - 2, hy + 3 * headScale, 4, 4, 'black');
      drawPixelRect(ctx, cx + 6, hy + 3 * headScale, 4, 4, 'black');
      ctx.strokeStyle = 'gold'; ctx.lineWidth = 1; ctx.strokeRect(cx + 5, hy + 2 * headScale, 6 * headScale, 6 * headScale); // Monocle
    } else if (accessory === 'crown') {
      drawPixelRect(ctx, cx - 14 * headScale, hy - 7, 28 * headScale, 8 * headScale, 'gold');
      drawPixelRect(ctx, cx - 14 * headScale, hy - 11, 6 * headScale, 4 * headScale, 'gold');
      drawPixelRect(ctx, cx - 3 * headScale, hy - 11, 6 * headScale, 4 * headScale, 'gold');
      drawPixelRect(ctx, cx + 8 * headScale, hy - 11, 6 * headScale, 4 * headScale, 'gold');
      // Eyes
      drawPixelRect(ctx, cx - 2, hy + 3 * headScale, 4, 4, 'black');
      drawPixelRect(ctx, cx + 6, hy + 3 * headScale, 4, 4, 'black');
    } else if (accessory === 'mask') {
      drawPixelRect(ctx, hx, hy, hw, hh, accColor); // Full mask over face area
      drawPixelRect(ctx, cx - 8, hy + 3, 6, 4, 'white'); // Eye holes
      drawPixelRect(ctx, cx + 2, hy + 3, 6, 4, 'white');
    } else if (accessory === 'visor') {
      drawPixelRect(ctx, cx - 10 * headScale, hy + 1, 20 * headScale, 6 * headScale, accColor);
      // Glow
      ctx.shadowColor = accColor; ctx.shadowBlur = 5;
      ctx.fillStyle = 'white'; ctx.fillRect(cx - 5, hy + 2, 10, 2);
      ctx.shadowBlur = 0;
    } else if (accessory === 'hair') {
      // Custom Hair (Trump style combover)
      drawPixelRect(ctx, hx - 2, hy - 4, hw + 4, 8, accColor); // Main bulk
      drawPixelRect(ctx, hx - 4, hy - 2, 4, 8, accColor); // Left puff
      drawPixelRect(ctx, hx + hw - 2, hy + 2, 4, 6, accColor); // Right side
      // Eyes
      drawPixelRect(ctx, cx + 2, hy + 5 * headScale, 4, 4, 'black');
      drawPixelRect(ctx, cx + 8, hy + 5 * headScale, 4, 4, 'black');
    } else {
      // None/Default eyes
      drawPixelRect(ctx, cx + 2, hy + 3 * headScale, 4, 4, 'black');
      drawPixelRect(ctx, cx + 8, hy + 3 * headScale, 4, 4, 'black');
    }

    // Arm
    if (!player.isJumping) {
      const armPhase = Math.cos(frameTick * 0.5);
      drawPixelRect(ctx, x + 12 + (armPhase * 5), drawY + 15, 8, 12, hoodieColor);
    } else {
      drawPixelRect(ctx, x + 25, drawY + 8, 8, 12, hoodieColor);
    }
  }

  // Easter Egg: Trump Tie
  if (skin?.id === 'trump') {
    // Red Tie
    const bw = 30 * bodyScale;
    const bx = x + (40 - bw) / 2;
    drawPixelRect(ctx, bx + bw / 2 - 2, drawY + 14, 4, 12, '#ef4444');
  }

  ctx.restore();
};

export const drawObstacle = (ctx: CanvasRenderingContext2D, obs: Obstacle, frameTick: number = 0) => {
  ctx.save();

  if (obs.type === ObstacleType.CANDLE) {
    // Red Candle (Dev Sell)
    const wickHeight = 15;
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLOR_RUG;

    ctx.fillStyle = '#f87171';
    ctx.fillRect(obs.x + obs.width / 2 - 1, obs.y - wickHeight, 2, wickHeight);
    ctx.fillRect(obs.x + obs.width / 2 - 1, obs.y + obs.height, 2, wickHeight);

    ctx.fillStyle = COLOR_RUG;
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2;
    ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
    ctx.shadowBlur = 0;

  } else if (obs.type === ObstacleType.LINK) {
    // Phishing Link
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

    ctx.strokeStyle = COLOR_LINK;
    ctx.lineWidth = 3;
    ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', obs.x + obs.width / 2, obs.y + obs.height / 2);

    ctx.fillStyle = '#60a5fa';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('SCAM', obs.x + obs.width / 2, obs.y - 5);

  } else if (obs.type === ObstacleType.HALT) {
    // Exchange Halt
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

    ctx.fillStyle = 'black';
    const stripeWidth = 10;
    for (let i = -obs.height; i < obs.width; i += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(obs.x + i, obs.y + obs.height);
      ctx.lineTo(obs.x + i + stripeWidth, obs.y + obs.height);
      ctx.lineTo(obs.x + i + stripeWidth + obs.height, obs.y);
      ctx.lineTo(obs.x + i + obs.height, obs.y);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
  }

  ctx.restore();
};

export const drawCoin = (ctx: CanvasRenderingContext2D, coin: Coin, frameTick: number) => {
  if (coin.collected) return;

  const centerX = coin.x + coin.width / 2;
  const centerY = coin.y + coin.height / 2;
  const radius = coin.width / 2;

  const bobY = Math.sin(frameTick * 0.1) * 3;
  const finalY = centerY + bobY;

  ctx.save();

  if (coin.type === 'red') {
    // Red Coin Visuals (Bad)
    const gradient = ctx.createLinearGradient(coin.x, coin.y, coin.x + coin.width, coin.y + coin.height);
    gradient.addColorStop(0, '#ef4444');
    gradient.addColorStop(1, '#991b1b');

    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ef4444';

    ctx.beginPath();
    ctx.arc(centerX, finalY, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 2;
    ctx.stroke();

    // "-" symbol on coin
    ctx.beginPath();
    ctx.moveTo(centerX - 5, finalY);
    ctx.lineTo(centerX + 5, finalY);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else {
    // Green/Standard Coin Visuals (Good)
    const gradient = ctx.createLinearGradient(coin.x, coin.y, coin.x + coin.width, coin.y + coin.height);
    gradient.addColorStop(0, '#9945FF');
    gradient.addColorStop(1, '#14F195');

    ctx.shadowBlur = 10;
    ctx.shadowColor = '#14F195';

    ctx.beginPath();
    ctx.arc(centerX, finalY, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const w = radius * 0.6;
    const h = radius * 0.6;

    ctx.beginPath();
    ctx.moveTo(centerX - w + 2, finalY - h / 2);
    ctx.lineTo(centerX + w - 2, finalY - h / 2 - 2);
    ctx.moveTo(centerX - w + 2, finalY);
    ctx.lineTo(centerX + w - 2, finalY - 2);
    ctx.moveTo(centerX - w + 2, finalY + h / 2);
    ctx.lineTo(centerX + w - 2, finalY + h / 2 - 2);
    ctx.stroke();
  }

  ctx.restore();
};

// ===========================================
// DYNAMIC CHART BACKGROUND
// Uses real price history data for visualization
// ===========================================
export const drawDynamicChartBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  offset: number,
  themeColor: string,
  priceHistory: PricePoint[],
  initialMarketCap: number,
  currentMarketCap: number
) => {
  // Dark Grid Background
  ctx.fillStyle = '#121212';

  // Basic Grid
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;

  // Scrolling vertical grid lines
  const gridSize = 40;
  ctx.beginPath();
  for (let x = - (offset % gridSize); x < width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  ctx.stroke();

  // Horizontal grid lines
  ctx.beginPath();
  for (let y = 0; y < height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // ===========================================
  // DYNAMIC PRICE CHART LINE
  // ===========================================
  ctx.save();

  // Chart area
  const chartTop = 50;
  const chartBottom = height - 80;
  const chartHeight = chartBottom - chartTop;
  const centerY = chartTop + chartHeight / 2;

  // Price Scaling
  const maxDeviation = 0.20;

  const normalizePrice = (marketCap: number): number => {
    if (initialMarketCap <= 0) return centerY;
    const percentChange = (marketCap - initialMarketCap) / initialMarketCap;
    const clampedChange = Math.max(-maxDeviation, Math.min(maxDeviation, percentChange));
    return centerY - (clampedChange / maxDeviation) * (chartHeight / 2);
  };

  // Helper to get base trend Y at screen X
  const getTrendY = (screenX: number): number => {
    if (priceHistory.length === 0) return centerY;

    // If only one point, constant Y
    if (priceHistory.length === 1) return normalizePrice(priceHistory[0].marketCap);

    // Multiple points
    const pointSpacing = width / (priceHistory.length - 1);

    // Find index
    const idx = Math.floor(screenX / pointSpacing);
    if (idx < 0) return normalizePrice(priceHistory[0].marketCap);
    if (idx >= priceHistory.length - 1) return normalizePrice(priceHistory[priceHistory.length - 1].marketCap);

    const p1 = priceHistory[idx];
    const p2 = priceHistory[idx + 1];
    const y1 = normalizePrice(p1.marketCap);
    const y2 = normalizePrice(p2.marketCap);

    // Linear interpolation for trend (or smoothstep)
    const t = (screenX - (idx * pointSpacing)) / pointSpacing;
    // Cosine interpolation for smoother trend
    const smoothT = (1 - Math.cos(t * Math.PI)) / 2;
    return y1 + (y2 - y1) * smoothT;
  };

  // Generate "Market Activity" Noise
  const getNoiseFn = (screenX: number) => {
    const worldX = screenX + offset;
    // Layered sine waves for "organic" market noise
    // High frequency jitter + lower frequency undulation
    return (
      Math.sin(worldX * 0.05) * 4 +
      Math.cos(worldX * 0.15) * 2 +
      Math.sin(worldX * 0.3 + offset * 0.1) * 2 // Moving component
    );
  };

  // Path Construction
  ctx.beginPath();
  const step = 4; // Pixel step for drawing

  // Start point
  let startY = getTrendY(0) + getNoiseFn(0);
  ctx.moveTo(0, startY);

  for (let x = step; x <= width; x += step) {
    const trendY = getTrendY(x);
    const noise = getNoiseFn(x);
    ctx.lineTo(x, trendY + noise);
  }

  // Draw Line
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 3;
  ctx.shadowColor = themeColor;
  ctx.shadowBlur = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Fill Area
  ctx.lineTo(width, chartBottom);
  ctx.lineTo(0, chartBottom);
  ctx.closePath();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = themeColor;
  ctx.fill();

  // Draw "Current Price" Pulse (instead of dots)
  // We can draw a little pulse at the very end of the line
  if (priceHistory.length > 0) {
    const lastX = width;
    const lastY = getTrendY(width) + getNoiseFn(width);

    // Pulse effect
    const pulsePhase = (Date.now() / 500) % Math.PI;
    const pulseSize = 4 + Math.sin(pulsePhase) * 2;

    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(lastX, lastY, pulseSize, 0, Math.PI * 2);
    ctx.fillStyle = themeColor;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(lastX, lastY, pulseSize + 4, 0, Math.PI * 2);
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1 - Math.sin(pulsePhase); // Fade out ring
    ctx.stroke();
  }

  // ===========================================
  // BASELINE INDICATOR (1.00x line)
  // ===========================================
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Label for baseline
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = 'left';
  ctx.fillText('1.00x', 5, centerY - 5);

  // ===========================================
  // CURRENT PRICE INDICATOR (Label)
  // ===========================================
  if (currentMarketCap > 0 && initialMarketCap > 0) {
    const currentY = normalizePrice(currentMarketCap);
    const multiplier = currentMarketCap / initialMarketCap;

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 20;
    ctx.shadowColor = multiplier >= 1 ? '#22c55e' : '#ef4444';

    // Right-side indicator line (small)
    ctx.strokeStyle = multiplier >= 1 ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width - 60, currentY);
    ctx.lineTo(width, currentY);
    ctx.stroke();

    // Price label
    ctx.fillStyle = multiplier >= 1 ? '#22c55e' : '#ef4444';
    ctx.font = '12px "Press Start 2P"';
    ctx.textAlign = 'right';
    ctx.fillText(`${multiplier.toFixed(2)}x`, width - 5, currentY - 8);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
};

// Legacy function for backwards compatibility
export const drawChartBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  offset: number,
  themeColor: string
) => {
  // Call new function with empty price history for fallback
  drawDynamicChartBackground(ctx, width, height, offset, themeColor, [], 0, 0);
};