import {
  Application,
  Assets,
  Color,
  Container,
  Texture,
  Sprite,
  Graphics,
  Text,
  TextStyle,
  BlurFilter,
  FillGradient,
} from 'pixi.js';

(async () => {
  const app = new Application();

  await app.init({ background: '#1099bb', resizeTo: window });
  app.canvas.style.position = 'absolute';
  document.body.appendChild(app.canvas);

  await Assets.load([
    'https://pixijs.com/assets/eggHead.png',
    'https://pixijs.com/assets/flowerTop.png',
    'https://pixijs.com/assets/helmlok.png',
    'https://pixijs.com/assets/skully.png',
  ]);

  const REEL_WIDTH = 160;
  const SYMBOL_SIZE = 150;

  const slotTextures = [
    Texture.from('https://pixijs.com/assets/eggHead.png'),
    Texture.from('https://pixijs.com/assets/flowerTop.png'),
    Texture.from('https://pixijs.com/assets/helmlok.png'),
    Texture.from('https://pixijs.com/assets/skully.png'),
  ];

  const reels = [];
  const reelContainer = new Container();

  for (let i = 0; i < 5; i++) {
    const rc = new Container();
    rc.x = i * REEL_WIDTH;
    reelContainer.addChild(rc);

    const reel = {
      container: rc,
      symbols: [],
      position: 0,
      previousPosition: 0,
      blur: new BlurFilter(),
    };

    reel.blur.blurX = 0;
    reel.blur.blurY = 0;
    rc.filters = [reel.blur];

    for (let j = 0; j < 4; j++) {
      const symbol = new Sprite(
        slotTextures[Math.floor(Math.random() * slotTextures.length)]
      );

      symbol.y = j * SYMBOL_SIZE;
      symbol.scale.x = symbol.scale.y = Math.min(
        SYMBOL_SIZE / symbol.width,
        SYMBOL_SIZE / symbol.height
      );
      symbol.x = Math.round((SYMBOL_SIZE - symbol.width) / 2);
      reel.symbols.push(symbol);
      rc.addChild(symbol);
    }
    reels.push(reel);
  }
  app.stage.addChild(reelContainer);

  const margin = (app.screen.height - SYMBOL_SIZE * 3) / 2;
  reelContainer.y = margin;
  reelContainer.x = Math.round(app.screen.width - REEL_WIDTH * 7);

  const top = new Graphics()
    .rect(0, 0, app.screen.width, margin)
    .fill({ color: 0x0 });
  const bottom = new Graphics()
    .rect(0, SYMBOL_SIZE * 3 + margin, app.screen.width, margin)
    .fill({ color: 0x0 });

  const fill = new FillGradient(0, 0, 0, 36 * 1.7);
  const colors = [0xffffff, 0x00ff99].map((color) =>
    Color.shared.setValue(color).toNumber()
  );
  colors.forEach((number, index) => {
    const ratio = index / colors.length;
    fill.addColorStop(ratio, number);
  });

  const style = new TextStyle({
    fontFamily: 'Arial',
    fontSize: 36,
    fontStyle: 'italic',
    fontWeight: 'bold',
    fill: { fill },
    stroke: { color: 0x4a1850, width: 5 },
    dropShadow: {
      color: 0x000000,
      angle: Math.PI / 6,
      blur: 4,
      distance: 6,
    },
    wordWrap: true,
    wordWrapWidth: 440,
  });

  const playText = new Text('SPIN THE WHEELS', style);
  playText.x = Math.round((bottom.width - playText.width) / 2);
  playText.y =
    app.screen.height - margin + Math.round((margin - playText.height) / 2);
  bottom.addChild(playText);

  const headerText = new Text('PIXI MONSTER SLOTS!', style);
  headerText.x = Math.round((top.width - headerText.width) / 2);
  headerText.y = Math.round((margin - headerText.height) / 2);
  top.addChild(headerText);

  // Score display
  let score = 0;
  const scoreText = new Text(`Score: ${score}`, style);
  scoreText.x = 20;
  scoreText.y = 20;
  app.stage.addChild(scoreText);

  app.stage.addChild(top);
  app.stage.addChild(bottom);

  bottom.eventMode = 'static';
  bottom.cursor = 'pointer';
  bottom.addListener('pointerdown', () => {
    if (!running) {
      startPlay();
    }
  });

  let running = false;

  function startPlay() {
    if (running) return;
    running = true;

    for (let i = 0; i < reels.length; i++) {
      const r = reels[i];
      const extra = Math.floor(Math.random() * 3);
      const target = r.position + 10 + i * 5 + extra;
      const time = 2500 + i * 600 + extra * 600;
      tweenTo(
        r,
        'position',
        target,
        time,
        backout(0.5),
        null,
        i === reels.length - 1 ? reelsComplete : null
      );
    }
  }

  function reelsComplete() {
    running = false;

    const winningSymbol = Math.floor(Math.random() * slotTextures.length);
    let winCount = 0;

    for (let i = 0; i < reels.length; i++) {
      const r = reels[i];
      if (
        r.symbols[r.position % r.symbols.length].texture ===
        slotTextures[winningSymbol]
      ) {
        winCount++;
      }
    }

    if (winCount === reels.length) {
      score += 10;
      alert('You won! Your score is now: ' + score);
    } else {
      alert('Try again! Your score is: ' + score);
    }

    scoreText.text = `Score: ${score}`;
  }

  app.ticker.add(() => {
    for (let i = 0; i < reels.length; i++) {
      const r = reels[i];

      r.blur.blurY = (r.position - r.previousPosition) * 8;
      r.previousPosition = r.position;

      for (let j = 0; j < r.symbols.length; j++) {
        const s = r.symbols[j];
        const prevy = s.y;

        s.y = ((r.position + j) % r.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE;
        if (s.y < 0 && prevy > SYMBOL_SIZE) {
          s.texture =
            slotTextures[Math.floor(Math.random() * slotTextures.length)];
          s.scale.x = s.scale.y = Math.min(
            SYMBOL_SIZE / s.texture.width,
            SYMBOL_SIZE / s.texture.height
          );
          s.x = Math.round((SYMBOL_SIZE - s.width) / 2);
        }
      }
    }
  });
  const tweening = [];

  function tweenTo(
    object,
    property,
    target,
    time,
    easing,
    onchange,
    oncomplete
  ) {
    const tween = {
      object,
      property,
      propertyBeginValue: object[property],
      target,
      easing,
      time,
      change: onchange,
      complete: oncomplete,
      start: Date.now(),
    };

    tweening.push(tween);
    return tween;
  }

  app.ticker.add(() => {
    const now = Date.now();
    const remove = [];

    for (let i = 0; i < tweening.length; i++) {
      const t = tweening[i];
      const phase = Math.min(1, (now - t.start) / t.time);

      t.object[t.property] = lerp(
        t.propertyBeginValue,
        t.target,
        t.easing(phase)
      );
      if (t.change) t.change(t);
      if (phase === 1) {
        t.object[t.property] = t.target;
        if (t.complete) t.complete(t);
        remove.push(t);
      }
    }
    for (let i = 0; i < remove.length; i++) {
      tweening.splice(tweening.indexOf(remove[i]), 1);
    }
  });

  function lerp(a1, a2, t) {
    return a1 * (1 - t) + a2 * t;
  }

  function backout(amount) {
    return (t) => --t * t * ((amount + 1) * t + amount) + 1;
  }
})();
