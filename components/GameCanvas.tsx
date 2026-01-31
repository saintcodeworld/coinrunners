import React, { useRef, useEffect, useCallback, memo } from 'react';
import { GameState, Obstacle, Coin, ObstacleType, Player, Particle, Room, SkinSettings, Skill, SkillType } from '../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRAVITY,
  JUMP_FORCE,
  FLOOR_HEIGHT,
  PLAYER_SIZE,
  COLOR_PLAYER,
  MIN_OBSTACLE_GAP,
  MAX_GAME_SPEED,
  SPEED_INCREMENT,
  COIN_SIZE,
  GAME_SPEED_INITIAL,
  COIN_VALUE_USD,
  SKILLS,
  RED_COIN_VALUE_USD
} from '../constants';
import { drawObstacle, drawCoin, drawDynamicChartBackground, drawPlayer } from '../utils/drawUtils';

interface Projectile {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  color: string;
}

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  setGameSpeedDisplay: React.Dispatch<React.SetStateAction<number>>;
  activeRoom: Room;
  selectedSkin: SkinSettings;
  activeSkills: Skill[];
}

const GameCanvas = memo<GameCanvasProps>(({
  gameState,
  setGameState,
  setScore,
  setGameSpeedDisplay,
  activeRoom,
  selectedSkin,
  activeSkills = [] // Default to empty array
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const baseSpeedRef = useRef<number>(GAME_SPEED_INITIAL);
  const skillStateRef = useRef<Record<string, { active: boolean, cooldownEnd: number, activeEnd: number }>>({});

  // Skill Limits Refs
  const magnetUsedRef = useRef(false);
  const rugInsuranceUsedRef = useRef(false); // One-time use per run
  const shieldUsedRef = useRef(false);
  const isRecoveringRef = useRef(false);
  const recoveryEndTimeRef = useRef(0);
  const projectilesRef = useRef<Projectile[]>([]);

  // Keep activeRoom in a ref to avoid restarting the game loop on every update
  const activeRoomRef = useRef(activeRoom);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  const activateSkill = useCallback((skillStub: Skill, slotIndex: number) => {
    // Rely on the passed skillStub (from fresh event) or fresh activeSkills
    const skill = skillStub || activeSkills[slotIndex];
    if (!skill) return;

    // Passive skills check (Magnet is active, others with duration 0 are passive)
    if (skill.durationMs === 0 && skill.type !== SkillType.MAGNET) return;

    const now = Date.now();

    // Magnet One-Time Check
    if (skill.type === SkillType.MAGNET) {
      if (magnetUsedRef.current) return; // Already used
      magnetUsedRef.current = true;
    }

    const currentState = skillStateRef.current[skill.id] || { active: false, cooldownEnd: 0, activeEnd: 0 };
    if (!currentState.active && now > currentState.cooldownEnd) {
      skillStateRef.current[skill.id] = {
        active: true,
        activeEnd: now + skill.durationMs,
        cooldownEnd: 0
      };
    }
  }, [activeSkills]);

  // Mutable Game State
  const playerRef = useRef<Player>({
    x: 60,
    y: CANVAS_HEIGHT - FLOOR_HEIGHT - PLAYER_SIZE,
    width: PLAYER_SIZE,
    height: 60,
    vy: 0,
    isJumping: false,
    color: COLOR_PLAYER
  });

  const obstaclesRef = useRef<Obstacle[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const gameSpeedRef = useRef<number>(GAME_SPEED_INITIAL);
  const distanceRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);

  // Initialize/Reset Game
  const resetGame = useCallback(() => {
    playerRef.current = {
      x: 60,
      y: CANVAS_HEIGHT - FLOOR_HEIGHT - 60,
      width: 40,
      height: 60,
      vy: 0,
      isJumping: false,
      color: COLOR_PLAYER
    };
    obstaclesRef.current = [];
    coinsRef.current = [];
    particlesRef.current = [];
    projectilesRef.current = [];
    baseSpeedRef.current = GAME_SPEED_INITIAL;
    gameSpeedRef.current = GAME_SPEED_INITIAL;
    skillStateRef.current = {};
    distanceRef.current = 0;
    scoreRef.current = 0;
    frameCountRef.current = 0;
    setScore(0);
    setGameSpeedDisplay(GAME_SPEED_INITIAL);
    // Reset Skill Limits on New Game
    magnetUsedRef.current = false;
    rugInsuranceUsedRef.current = false; // Reset insurance
    shieldUsedRef.current = false;
    isRecoveringRef.current = false;
    recoveryEndTimeRef.current = 0;
  }, [setScore, setGameSpeedDisplay]);

  // Handle Restart / Game State Changes
  useEffect(() => {
    if (gameState === GameState.PLAYING && (gameStateRef.current === GameState.GAMEOVER || frameCountRef.current > 0)) {
      // Reset Game Internal State
      obstaclesRef.current = [];
      coinsRef.current = [];
      particlesRef.current = [];
      scoreRef.current = 0;
      setScore(0);
      distanceRef.current = 0;
      frameCountRef.current = 0;
      baseSpeedRef.current = GAME_SPEED_INITIAL;
      gameSpeedRef.current = GAME_SPEED_INITIAL;

      // Reset Skills
      magnetUsedRef.current = false;
      rugInsuranceUsedRef.current = false;
      shieldUsedRef.current = false;
      isRecoveringRef.current = false;
      recoveryEndTimeRef.current = 0;
      projectilesRef.current = [];
      skillStateRef.current = {};
    }
    gameStateRef.current = gameState;
  }, [gameState]);

  // Keep track of previous game state
  const gameStateRef = useRef(gameState);

  // Handle Input
  const handleJump = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    if (!playerRef.current.isJumping) {
      const hasLongJump = activeSkills.some(s => s.type === SkillType.LONG_JUMP);
      playerRef.current.vy = hasLongJump ? JUMP_FORCE * 1.4 : JUMP_FORCE;
      playerRef.current.isJumping = true;
    }
  }, [gameState, activeSkills]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }

      // Numeric Key Handling (1, 2, 3) for Slots
      if (e.code === 'Digit1') activateSkill(activeSkills[0], 0);
      if (e.code === 'Digit2') activateSkill(activeSkills[1], 1);
      if (e.code === 'Digit3') activateSkill(activeSkills[2], 2);

      // Fallback/Dev keys
      activeSkills.forEach((skill, idx) => {
        if (skill.triggerKey && e.code === `Key${skill.triggerKey}`) {
          activateSkill(skill, idx);
        }
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump, activeSkills, activateSkill]);

  // Spawn Logic
  const spawnObstacle = () => {
    const lastObstacle = obstaclesRef.current[obstaclesRef.current.length - 1];
    const minGap = MIN_OBSTACLE_GAP + (gameSpeedRef.current * 15);

    if (lastObstacle && (CANVAS_WIDTH - lastObstacle.x) < minGap) {
      return;
    }

    // Regular Obstacles
    if (Math.random() < 0.02) {
      const typeRoll = Math.random();
      let type = ObstacleType.CANDLE;
      let width = 30;
      let height = 60;
      let y = CANVAS_HEIGHT - FLOOR_HEIGHT - height;

      if (typeRoll > 0.75) {
        type = ObstacleType.HALT;
        width = 40;
        height = 80;
        y = CANVAS_HEIGHT - FLOOR_HEIGHT - height;
      } else if (typeRoll > 0.5) {
        type = ObstacleType.LINK;
        width = 40;
        height = 40;
        y = CANVAS_HEIGHT - FLOOR_HEIGHT - height;
      }

      obstaclesRef.current.push({
        x: CANVAS_WIDTH,
        y,
        width,
        height,
        type,
        passed: false
      });
    }
  };

  const spawnCoin = () => {
    if (Math.random() < 0.03) {
      const x = CANVAS_WIDTH + 50;
      const isOverlapping = obstaclesRef.current.some(obs => Math.abs(obs.x - x) < 60);

      if (!isOverlapping) {
        const isHigh = Math.random() > 0.5;
        const y = isHigh
          ? CANVAS_HEIGHT - FLOOR_HEIGHT - 130
          : CANVAS_HEIGHT - FLOOR_HEIGHT - 50;

        // 20% chance for Red Coin
        const isRed = Math.random() < 0.2;

        coinsRef.current.push({
          x,
          y,
          width: COIN_SIZE,
          height: COIN_SIZE,
          collected: false,
          value: isRed ? RED_COIN_VALUE_USD : COIN_VALUE_USD,
          type: isRed ? 'red' : 'green'
        });
      }
    }
  };

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color,
        size: Math.random() * 4 + 2
      });
    }
  };

  const checkCollision = (rect1: Player, rect2: Obstacle | Coin) => {
    const padding = 5;
    return (
      rect1.x + padding < rect2.x + rect2.width - padding &&
      rect1.x + rect1.width - padding > rect2.x + padding &&
      rect1.y + padding < rect2.y + rect2.height - padding &&
      rect1.y + rect1.height - padding > rect2.y + padding
    );
  };

  // Main Game Loop
  const update = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // --- LOGIC ---
    // Local state for frame
    let magnetActive = false;
    let invisActive = false;

    if (gameState === GameState.PLAYING) {
      if (baseSpeedRef.current < MAX_GAME_SPEED) {
        baseSpeedRef.current += SPEED_INCREMENT;
      }

      // Check Skills
      const now = Date.now();
      let speedMult = 1;

      // Update Shield Recovery
      if (isRecoveringRef.current) {
        if (now > recoveryEndTimeRef.current) {
          isRecoveringRef.current = false;
        }
      }

      activeSkills.forEach(skill => {
        const state = skillStateRef.current[skill.id];
        if (state && state.active) {
          if (now > state.activeEnd) {
            state.active = false;
            state.cooldownEnd = now + skill.cooldownMs;
          } else {
            if (skill.type === SkillType.SPEED_BOOST) speedMult = 2;
            if (skill.type === SkillType.SLOW_MOTION) speedMult = 0.5;
            if (skill.type === SkillType.MAGNET) magnetActive = true;
            if (skill.type === SkillType.INVISIBILITY) invisActive = true;
            if (skill.type === SkillType.TO_THE_MOON) {
              // Low Gravity Effect
              playerRef.current.vy -= 0.4; // Counter gravity
            }
            if (skill.type === SkillType.LASER_EYES) {
              // Auto-fire laser every 20 frames
              if (frameCountRef.current % 20 === 0) {
                projectilesRef.current.push({
                  x: playerRef.current.x + playerRef.current.width,
                  y: playerRef.current.y + playerRef.current.height / 2,
                  width: 20,
                  height: 5,
                  vx: 15,
                  color: '#ef4444' // Red laser
                });
              }
            }
          }
          skillStateRef.current[skill.id] = state;
        }
      });

      // Update Projectiles
      for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
        const p = projectilesRef.current[i];
        p.x += p.vx;
        if (p.x > CANVAS_WIDTH) {
          projectilesRef.current.splice(i, 1);
        }
      }

      gameSpeedRef.current = baseSpeedRef.current * speedMult;

      if (frameCountRef.current % 60 === 0) {
        setGameSpeedDisplay(Math.floor(gameSpeedRef.current * 10) / 10);
      }

      frameCountRef.current++;
      distanceRef.current += gameSpeedRef.current;

      // Player Physics
      playerRef.current.vy += GRAVITY;
      playerRef.current.y += playerRef.current.vy;

      const floorY = CANVAS_HEIGHT - FLOOR_HEIGHT;
      if (playerRef.current.y + playerRef.current.height >= floorY) {
        playerRef.current.y = floorY - playerRef.current.height;
        playerRef.current.vy = 0;
        playerRef.current.isJumping = false;
      }

      spawnObstacle();
      spawnCoin();

      // Obstacles Update
      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];
        obs.x -= gameSpeedRef.current;

        // Collision Logic
        const playerRect = {
          x: playerRef.current.x + 10,
          y: playerRef.current.y + 5,
          width: playerRef.current.width - 20,
          height: playerRef.current.height - 10
        };

        if (!invisActive && !isRecoveringRef.current) {
          const obsRect = {
            x: obs.x,
            y: obs.y,
            width: obs.width,
            height: obs.height
          };

          // Projectile Collision checking
          for (let pIdx = projectilesRef.current.length - 1; pIdx >= 0; pIdx--) {
            const proj = projectilesRef.current[pIdx];
            if (
              proj.x < obsRect.x + obsRect.width &&
              proj.x + proj.width > obsRect.x &&
              proj.y < obsRect.y + obsRect.height &&
              proj.y + proj.height > obsRect.y
            ) {
              // Destroy Obstacle
              createParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#fff', 10);
              obstaclesRef.current.splice(i, 1);
              projectilesRef.current.splice(pIdx, 1);
              continue; // Next obstacle
            }
          }

          // Check for Whale Mode (Active Skill)
          const whaleModeActive = activeSkills.some(s => s.type === SkillType.WHALE_MODE && skillStateRef.current[s.id]?.active);

          if (whaleModeActive) {
            // WHALE SMASH
            if (
              playerRect.x < obsRect.x + obsRect.width &&
              playerRect.x + playerRect.width > obsRect.x &&
              playerRect.y < obsRect.y + obsRect.height &&
              playerRect.y + playerRect.height > obsRect.y
            ) {
              createParticles(obs.x, obs.y, '#ffffff', 15);
              obstaclesRef.current.splice(i, 1);
              // Small shake or feedback
              setScore(s => s + 10); // Bonus for smashing
              continue;
            }
          } else if (
            playerRect.x < obsRect.x + obsRect.width &&
            playerRect.x + playerRect.width > obsRect.x &&
            playerRect.y < obsRect.y + obsRect.height &&
            playerRect.y + playerRect.height > obsRect.y
          ) {
            // Check for Rug Insurance (Passive)
            const hasRugInsurance = activeSkills.some(s => s.type === SkillType.RUG_INSURANCE);

            if (hasRugInsurance && !rugInsuranceUsedRef.current) {
              // Activate Insurance
              rugInsuranceUsedRef.current = true;
              isRecoveringRef.current = true;
              recoveryEndTimeRef.current = now + 4000; // 4s immunity
              // Bounce back
              playerRef.current.vy = -15;
              // Visuals
              createParticles(playerRef.current.x, playerRef.current.y, '#FFD700', 20);
              continue;
            }

            // Check for passive Shield (Second Chance)
            const hasShield = activeSkills.some(s => s.type === SkillType.SHIELD);

            if (hasShield && !shieldUsedRef.current) {
              // Activate Shield Protection
              shieldUsedRef.current = true;
              isRecoveringRef.current = true;
              recoveryEndTimeRef.current = now + 3000;
              // Visual bounce back
              playerRef.current.vy = -5;
            } else {
              setGameState(GameState.GAMEOVER);
              createParticles(playerRef.current.x + 20, playerRef.current.y + 20, COLOR_PLAYER, 30);
            }
          }
        }

        if (obs.x + obs.width < 0) {
          obstaclesRef.current.splice(i, 1);
        }
      }

      // Coin Collection & Magnet
      const playerRect = {
        x: playerRef.current.x + 10,
        y: playerRef.current.y + 5,
        width: playerRef.current.width - 20,
        height: playerRef.current.height - 10
      };

      coinsRef.current = coinsRef.current.filter(coin => {
        coin.x -= gameSpeedRef.current;

        // Magnet Effect (Only Green Coins)
        if (magnetActive && coin.type !== 'red') {
          const dx = playerRef.current.x - coin.x;
          const dy = playerRef.current.y - coin.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 250) { // Magnet range
            coin.x += (dx / dist) * 15; // Move fast towards player
            coin.y += (dy / dist) * 15;
          }
        }

        const isCollected = !coin.collected &&
          playerRect.x < coin.x + COIN_SIZE &&
          playerRect.x + playerRect.width > coin.x &&
          playerRect.y < coin.y + COIN_SIZE &&
          playerRect.y + playerRect.height > coin.y;

        if (isCollected) {
          coin.collected = true;
          // --- SCORE MULTIPLIER LOGIC ---
          let val = coin.value;

          // Diamond Hands Check
          const hasDiamondHands = activeSkills.some(s => s.type === SkillType.DIAMOND_HANDS && skillStateRef.current[s.id]?.active);
          if (hasDiamondHands) {
            val *= 2;
          }

          const multipliedValue = val * activeRoomRef.current.multiplier;

          if (coin.type === 'red') {
            createParticles(coin.x, coin.y, '#ef4444', 8); // Red particles
            // Ensure score doesn't drop below 0 optional? User didn't specify. 
            // We'll allow it to subtract from total earnings.
            setScore(prev => Math.max(0, prev + multipliedValue)); // multipliedValue is negative
            scoreRef.current = Math.max(0, scoreRef.current + multipliedValue);
          } else {
            createParticles(coin.x, coin.y, '#14F195', 8); // Green particles
            setScore(prev => prev + multipliedValue);
            scoreRef.current += multipliedValue;
          }

          return false; // Remove from array
        }

        if (coin.x + coin.width < 0) {
          return false; // Remove
        }

        return true; // Keep
      });
    }

    // Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      if (p.life <= 0) particlesRef.current.splice(i, 1);
    }

    // --- DRAWING ---
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Dynamic Chart Background based on Room Theme and Real Price Data
    const currentTheme = activeRoomRef.current.themeColor;
    const bgOffset = distanceRef.current * 0.2;
    drawDynamicChartBackground(
      ctx,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      bgOffset,
      currentTheme,
      activeRoomRef.current.priceHistory || [],
      activeRoomRef.current.initialMarketCap,
      activeRoomRef.current.currentMarketCap
    );

    // Floor
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, CANVAS_HEIGHT - FLOOR_HEIGHT, CANVAS_WIDTH, FLOOR_HEIGHT);
    ctx.fillStyle = currentTheme; // Floor border matches room theme
    ctx.fillRect(0, CANVAS_HEIGHT - FLOOR_HEIGHT, CANVAS_WIDTH, 2);

    // Obstacles (Pass frameCount for animations)
    obstaclesRef.current.forEach(obs => drawObstacle(ctx, obs, frameCountRef.current));

    // Coins
    coinsRef.current.forEach(coin => drawCoin(ctx, coin, frameCountRef.current));

    // Player
    // Player Draw
    if (gameState !== GameState.GAMEOVER || Math.floor(Date.now() / 100) % 2 === 0) {
      // transparency for invis or recovery
      const isGhost = (invisActive || isRecoveringRef.current);
      if (isGhost) ctx.globalAlpha = 0.5;

      // Recovery blink
      if (isRecoveringRef.current && Math.floor(Date.now() / 100) % 2 === 0) {
        // Blink out
        ctx.globalAlpha = 0.2;
      }

      // Whale Mode Scale Visual
      let effectiveSkin = selectedSkin;
      const whaleModeActive = activeSkills.some(s => s.type === SkillType.WHALE_MODE && skillStateRef.current[s.id]?.active);

      if (whaleModeActive) {
        effectiveSkin = {
          ...selectedSkin,
          bodyScale: (selectedSkin.bodyScale || 1) * 2.5,
          headScale: (selectedSkin.headScale || 1) * 2.5,
        };
      }

      drawPlayer(ctx, playerRef.current, frameCountRef.current, effectiveSkin);

      if (whaleModeActive) {
        // Glowing aura for Whale
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(playerRef.current.x - 10, playerRef.current.y - 10, playerRef.current.width + 20, playerRef.current.height + 20);
        ctx.shadowBlur = 0;
      }

      ctx.globalAlpha = 1.0;
    }

    // Projectiles
    ctx.fillStyle = '#ef4444';
    projectilesRef.current.forEach(p => {
      ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    // Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1.0;
    });

    // Skill HUD canvas overlay
    const now = Date.now();
    let hudX = CANVAS_WIDTH - 60;
    const hudY = CANVAS_HEIGHT - 60;

    activeSkills.forEach((skill, index) => {
      if (skill.type === SkillType.LONG_JUMP) return;

      const state = skillStateRef.current[skill.id] || { active: false, cooldownEnd: 0, activeEnd: 0 };
      const x = hudX - (index * 50); // Stack leftwards

      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x, hudY, 40, 40);

      if (state.active) {
        // Active Border
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, hudY, 40, 40);

        // Duration Bar
        const remaining = Math.max(0, state.activeEnd - now);
        const pct = remaining / skill.durationMs;
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x, hudY + 36, 40 * pct, 4);
      } else if (now < state.cooldownEnd) {
        // Cooldown overlay - ANIMATED
        const cooldownRemaining = state.cooldownEnd - now;
        const totalCooldown = skill.cooldownMs;
        const p = Math.max(0, cooldownRemaining / totalCooldown); // 1.0 to 0.0

        // Darken full box
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, hudY, 40, 40);

        // Fill from bottom - "Recharging"
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x, hudY + 40 - (40 * p), 40, 40 * p);

        // Timer text
        ctx.fillStyle = 'white';
        ctx.font = '10px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(Math.ceil(cooldownRemaining / 1000).toString(), x + 20, hudY + 25);
      }

      // Slot Number Badge (1, 2, 3)
      ctx.fillStyle = '#f59e0b'; // Amber
      ctx.fillRect(x - 5, hudY - 5, 14, 14);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((index + 1).toString(), x + 2, hudY + 6);

      // Trigger Key (Display removed as we use Slot Badge)
      // ctx.fillText(skill.triggerKey || '', x + 38, hudY + 12);

      // Icon
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.fillText(skill.icon, x + 20, hudY + 28);
    });

    requestRef.current = requestAnimationFrame(update);
  }, [gameState, setGameState, setScore, setGameSpeedDisplay]); // activeRoom removed from dependencies

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update]);

  useEffect(() => {
    if (gameState === GameState.START) {
      resetGame();
    }
  }, [gameState, resetGame]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onClick={handleJump}
      className="cursor-pointer touch-manipulation w-full h-full block"
      style={{ imageRendering: 'pixelated' }}
    />
  );
});

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;