import { Obstacle, ObstacleType, Coin, Player, PricePoint, SkinSettings } from '../types';
import { COLOR_RUG, COLOR_LINK, COLOR_HALT } from '../constants';

// --- Sprites & Assets ---

// Helper to draw pixel rectangles
const drawPixelRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
};

export const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player, frameTick: number, skin?: SkinSettings) => {
  const { x, y, width, height } = player;

  // Default fallback if no skin provided
  const s = skin || {
    id: 'default',
    name: 'Default',
    hoodieColor: player.color, // Fallback to player.color
    pantsColor: '#1e293b',
    skinColor: '#fca5a5',
    accessory: 'sunglasses' as const
  };

  const { hoodieColor, pantsColor, skinColor, accessory, accessoryColor } = s;
  const accColor = accessoryColor || '#000000';

  ctx.save();

  // Animation bobbing
  const bounce = player.isJumping ? 0 : (Math.sin(frameTick * 0.2) * 2);
  const drawY = y + bounce;

  // Legs
  if (player.isJumping) {
    drawPixelRect(ctx, x + 10, drawY + 25, 8, 10, pantsColor);
    drawPixelRect(ctx, x + 22, drawY + 20, 8, 10, pantsColor);
  } else {
    const legPhase = Math.sin(frameTick * 0.5);
    drawPixelRect(ctx, x + 10, drawY + 25 + (legPhase * 5), 8, 15, pantsColor);
    drawPixelRect(ctx, x + 22, drawY + 25 - (legPhase * 5), 8, 15, pantsColor);
  }

  // Body
  drawPixelRect(ctx, x + 5, drawY + 10, 30, 20, hoodieColor);

  // Head
  drawPixelRect(ctx, x + 8, drawY - 5, 24, 15, skinColor);

  // Accessories
  if (accessory === 'sunglasses') {
    drawPixelRect(ctx, x + 18, drawY - 2, 16, 6, 'black');
    drawPixelRect(ctx, x + 20, drawY - 1, 3, 2, 'white');
    drawPixelRect(ctx, x + 28, drawY - 1, 2, 2, 'white');
  } else if (accessory === 'hat') {
    drawPixelRect(ctx, x + 6, drawY - 10, 28, 6, accColor); // Brim
    drawPixelRect(ctx, x + 10, drawY - 18, 20, 8, accColor); // Top
    // Eyes
    drawPixelRect(ctx, x + 22, drawY - 2, 4, 4, 'black');
    drawPixelRect(ctx, x + 28, drawY - 2, 4, 4, 'black');
  } else if (accessory === 'cap') {
    drawPixelRect(ctx, x + 6, drawY - 10, 26, 6, accColor);
    drawPixelRect(ctx, x + 20, drawY - 10, 14, 4, accColor); // Bill
    // Eyes
    drawPixelRect(ctx, x + 22, drawY - 2, 4, 4, 'black');
    drawPixelRect(ctx, x + 28, drawY - 2, 4, 4, 'black');
  } else if (accessory === 'headphones') {
    // Band
    drawPixelRect(ctx, x + 6, drawY - 8, 28, 4, accColor);
    // Muffs
    drawPixelRect(ctx, x + 4, drawY - 2, 6, 12, accColor);
    drawPixelRect(ctx, x + 30, drawY - 2, 6, 12, accColor);
    // Eyes
    drawPixelRect(ctx, x + 18, drawY - 2, 4, 4, 'black');
    drawPixelRect(ctx, x + 26, drawY - 2, 4, 4, 'black');
  } else if (accessory === 'bandana') {
    // Eyes
    drawPixelRect(ctx, x + 18, drawY - 4, 4, 4, 'black');
    drawPixelRect(ctx, x + 26, drawY - 4, 4, 4, 'black');
    // Bandana
    drawPixelRect(ctx, x + 8, drawY + 2, 24, 10, accColor);
  } else if (accessory === 'tophat') {
    drawPixelRect(ctx, x + 6, drawY - 8, 28, 4, 'black'); // Brim
    drawPixelRect(ctx, x + 10, drawY - 20, 20, 12, 'black'); // Top
    drawPixelRect(ctx, x + 10, drawY - 12, 20, 4, accColor); // Ribbon
    // Eyes and monocle
    drawPixelRect(ctx, x + 18, drawY - 2, 4, 4, 'black');
    drawPixelRect(ctx, x + 26, drawY - 2, 4, 4, 'black');
    ctx.strokeStyle = 'gold'; ctx.lineWidth = 1; ctx.strokeRect(x + 25, drawY - 3, 6, 6); // Monocle
  } else if (accessory === 'crown') {
    drawPixelRect(ctx, x + 6, drawY - 12, 28, 8, 'gold');
    drawPixelRect(ctx, x + 6, drawY - 16, 6, 4, 'gold');
    drawPixelRect(ctx, x + 17, drawY - 16, 6, 4, 'gold');
    drawPixelRect(ctx, x + 28, drawY - 16, 6, 4, 'gold');
    // Eyes
    drawPixelRect(ctx, x + 18, drawY - 2, 4, 4, 'black');
    drawPixelRect(ctx, x + 26, drawY - 2, 4, 4, 'black');
  } else if (accessory === 'mask') {
    drawPixelRect(ctx, x + 8, drawY - 5, 24, 15, accColor); // Full mask
    drawPixelRect(ctx, x + 12, drawY - 2, 6, 4, 'white'); // Eye holes
    drawPixelRect(ctx, x + 22, drawY - 2, 6, 4, 'white');
  } else if (accessory === 'visor') {
    drawPixelRect(ctx, x + 10, drawY - 4, 20, 6, accColor);
    // Glow
    ctx.shadowColor = accColor; ctx.shadowBlur = 5;
    ctx.fillStyle = 'white'; ctx.fillRect(x + 15, drawY - 3, 10, 2);
    ctx.shadowBlur = 0;
  } else {
    // None/Default eyes
    drawPixelRect(ctx, x + 22, drawY - 2, 4, 4, 'black');
    drawPixelRect(ctx, x + 28, drawY - 2, 4, 4, 'black');
  }

  // Arm
  if (!player.isJumping) {
    const armPhase = Math.cos(frameTick * 0.5);
    drawPixelRect(ctx, x + 12 + (armPhase * 5), drawY + 15, 8, 12, hoodieColor);
  } else {
    drawPixelRect(ctx, x + 25, drawY + 8, 8, 12, hoodieColor);
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
    ctx.font = '10px VT323';
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
  ctx.fillStyle = '#0f172a';

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

  // Horizontal grid lines (static)
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

  // Chart area (leave space for floor)
  const chartTop = 50;
  const chartBottom = height - 80;
  const chartHeight = chartBottom - chartTop;
  const centerY = chartTop + chartHeight / 2;

  // Calculate the price range for scaling
  // We want ±20% from initial to fill the visual range
  const maxDeviation = 0.20; // 20% deviation fills the chart

  // Normalize current price to chart coordinates
  const normalizePrice = (marketCap: number): number => {
    if (initialMarketCap <= 0) return centerY;
    const percentChange = (marketCap - initialMarketCap) / initialMarketCap;
    // Clamp to ±20% visually
    const clampedChange = Math.max(-maxDeviation, Math.min(maxDeviation, percentChange));
    // Map to chart Y (inverted because Y grows downward)
    return centerY - (clampedChange / maxDeviation) * (chartHeight / 2);
  };

  // Set up chart line style
  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 3;
  ctx.shadowColor = themeColor;
  ctx.shadowBlur = 15;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw the chart line
  ctx.beginPath();

  if (priceHistory.length === 0) {
    // No data yet - draw flat line at center with slight noise for animation
    ctx.moveTo(0, centerY);
    for (let x = 0; x < width; x += 5) {
      const worldX = x + offset;
      // Subtle animated noise while waiting for data
      const noise = Math.sin(worldX * 0.02) * 5 + Math.cos(worldX * 0.05) * 3;
      ctx.lineTo(x, centerY + noise);
    }
  } else if (priceHistory.length === 1) {
    // Single data point - draw flat line from initial with smooth transition
    const y = normalizePrice(priceHistory[0].marketCap);
    ctx.moveTo(0, centerY);
    for (let x = 0; x < width; x += 5) {
      // Smooth transition from center to current price
      const progress = Math.min(1, x / (width * 0.3));
      const interpolatedY = centerY + (y - centerY) * progress;
      // Add subtle noise for visual interest
      const worldX = x + offset;
      const noise = Math.sin(worldX * 0.03) * 2;
      ctx.lineTo(x, interpolatedY + noise);
    }
  } else {
    // Multiple data points - draw real price action
    // Space out points across the width
    const pointSpacing = width / Math.max(1, priceHistory.length - 1);

    // Start from the oldest data point
    let startY = normalizePrice(priceHistory[0].marketCap);
    ctx.moveTo(0, startY);

    // Draw smooth curve through all price points
    for (let i = 1; i < priceHistory.length; i++) {
      const x = i * pointSpacing;
      const y = normalizePrice(priceHistory[i].marketCap);

      // Use quadratic curve for smoothness
      const prevX = (i - 1) * pointSpacing;
      const prevY = normalizePrice(priceHistory[i - 1].marketCap);
      const cpX = (prevX + x) / 2;

      ctx.quadraticCurveTo(cpX, prevY, x, y);
    }

    // Extend line to edge of screen with subtle animation
    const lastY = normalizePrice(priceHistory[priceHistory.length - 1].marketCap);
    const lastX = (priceHistory.length - 1) * pointSpacing;

    for (let x = lastX; x < width; x += 5) {
      const worldX = x + offset;
      // Subtle prediction/continuation noise
      const noise = Math.sin(worldX * 0.04) * 3 + Math.cos(worldX * 0.07) * 2;
      ctx.lineTo(x, lastY + noise);
    }
  }

  ctx.stroke();

  // Fill area under the chart
  ctx.lineTo(width, chartBottom);
  ctx.lineTo(0, chartBottom);
  ctx.closePath();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = themeColor;
  ctx.fill();

  // ===========================================
  // DRAW PRICE INDICATOR DOTS at actual data points
  // ===========================================
  if (priceHistory.length > 1) {
    ctx.globalAlpha = 1;
    const pointSpacing = width / Math.max(1, priceHistory.length - 1);

    priceHistory.forEach((point, i) => {
      const x = i * pointSpacing;
      const y = normalizePrice(point.marketCap);

      // Draw small dot at each data point
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = themeColor;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  // ===========================================
  // DRAW BASELINE INDICATOR (1.00x line)
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
  ctx.font = '12px VT323';
  ctx.textAlign = 'left';
  ctx.fillText('1.00x', 5, centerY - 5);

  // ===========================================
  // CURRENT PRICE INDICATOR (right side)
  // ===========================================
  if (currentMarketCap > 0 && initialMarketCap > 0) {
    const currentY = normalizePrice(currentMarketCap);
    const multiplier = currentMarketCap / initialMarketCap;

    ctx.globalAlpha = 1;

    // Glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = multiplier >= 1 ? '#22c55e' : '#ef4444';

    // Horizontal line to current price
    ctx.strokeStyle = multiplier >= 1 ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width - 60, currentY);
    ctx.lineTo(width, currentY);
    ctx.stroke();

    // Price label
    ctx.fillStyle = multiplier >= 1 ? '#22c55e' : '#ef4444';
    ctx.font = 'bold 14px VT323';
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