"use client";

import { useEffect, useRef } from "react";

export type GardenScenePlant = {
  id: string;
  key: string;
  name: string;
  stage: number;
};

type GardenSceneProps = {
  room: string;
  plants: GardenScenePlant[];
  streak: number;
  availableMotes: number;
  onCollectMote: () => void;
  onPetStaubi: () => void;
};

const WIDTH = 390;
const HEIGHT = 624;
const ASSET_REVISION = "2026-08-26a";
const withAssetRevision = (path: string) => `${path}?v=${ASSET_REVISION}`;

const PROTOTYPE_ROOM = "Wohnzimmer";

const roomBackgrounds: Record<string, string> = {
  Wohnzimmer: withAssetRevision("/garden/rooms/garden-living-game-v2.png"),
  Schlafzimmer: withAssetRevision("/garden/rooms/garden-bedroom-game-v2.png"),
  Küche: withAssetRevision("/garden/rooms/garden-kitchen-game-v2.png"),
  Bad: withAssetRevision("/garden/rooms/garden-bathroom-game-v2.png"),
};
const roomFallbacks: Record<string, string> = {
  Balkon: withAssetRevision("/garden/rooms/garden-living-game-v2.png"),
  Wohnzimmer: withAssetRevision("/garden/rooms/garden-living-game-v2.png"),
  Küche: withAssetRevision("/garden/rooms/garden-kitchen-game-v2.png"),
  Bad: withAssetRevision("/garden/rooms/garden-bathroom-game-v2.png"),
  Arbeitszimmer: withAssetRevision("/garden/rooms/garden-bedroom-game-v2.png"),
};

const roomSlots: Record<string, Array<{ x: number; y: number; maxWidth: number; maxHeight: number }>> = {
  Wohnzimmer: [
    { x: 128, y: 205, maxWidth: 104, maxHeight: 118 },
    { x: 296, y: 205, maxWidth: 104, maxHeight: 118 },
    { x: 128, y: 365, maxWidth: 105, maxHeight: 112 },
    { x: 296, y: 365, maxWidth: 105, maxHeight: 112 },
  ],
  Schlafzimmer: [
    { x: 128, y: 205, maxWidth: 104, maxHeight: 118 },
    { x: 296, y: 205, maxWidth: 104, maxHeight: 118 },
    { x: 128, y: 365, maxWidth: 105, maxHeight: 112 },
    { x: 296, y: 365, maxWidth: 105, maxHeight: 112 },
  ],
  Küche: [
    { x: 128, y: 205, maxWidth: 104, maxHeight: 118 },
    { x: 296, y: 205, maxWidth: 104, maxHeight: 118 },
    { x: 128, y: 365, maxWidth: 105, maxHeight: 112 },
    { x: 296, y: 365, maxWidth: 105, maxHeight: 112 },
  ],
  Bad: [
    { x: 128, y: 205, maxWidth: 104, maxHeight: 118 },
    { x: 296, y: 205, maxWidth: 104, maxHeight: 118 },
    { x: 128, y: 365, maxWidth: 105, maxHeight: 112 },
    { x: 296, y: 365, maxWidth: 105, maxHeight: 112 },
  ],
};

function normalizePlantKey(raw: string) {
  const clean = raw.toLowerCase().trim();
  if (clean === "aloka" || clean === "aloecasia" || clean === "alocazea") {
    return "alocasia";
  }
  return clean;
}

function stageSpriteUrl(rawPlantKey: string, stage: number) {
  const plantKey = normalizePlantKey(rawPlantKey);
  const mapped = Math.max(1, Math.min(5, Math.ceil((Math.min(12, stage) / 12) * 5)));
  return withAssetRevision(`/garden/stages/${plantKey}-${mapped}.png`);
}

type AnimatedPlant = {
  node: import("pixi.js").Container;
  baseScale: number;
  phase: number;
  pulse: number;
  baseY: number;
};

function createPlantAura(PIXI: PixiModule, stage: number, scale: number) {
  const aura = new PIXI.Container();
  const level = Math.max(0, stage - 1);
  const count = Math.min(4, Math.floor(level / 3));
  for (let i = 0; i < count; i++) {
    const dot = new PIXI.Graphics();
    const size = 3 + (i + 1) * 0.8;
    const orbit = 8 + i * 4;
    const angle = (Math.PI * 2 * i) / Math.max(1, count);
    dot.circle(Math.cos(angle) * orbit, Math.sin(angle) * orbit, size).fill({ color: 0xfff3b0, alpha: 0.18 });
    aura.addChild(dot);
  }
  aura.scale.set(scale);
  return aura;
}

type PixiModule = typeof import("pixi.js");

const plantColors: Record<string, { leaf: number; light: number; pot: number }> = {
  monstera: { leaf: 0x315f37, light: 0x6f9960, pot: 0x91a274 },
  pilea: { leaf: 0x4e7b45, light: 0x8cac68, pot: 0xc98272 },
  calathea: { leaf: 0x365e3e, light: 0x91aa72, pot: 0xd8cdb4 },
  fern: { leaf: 0x416b3f, light: 0x7fa463, pot: 0xb36f4a },
  ficus: { leaf: 0x315b39, light: 0x759460, pot: 0x879970 },
  alocasia: { leaf: 0x285946, light: 0x83a578, pot: 0xbd7970 },
  ivy: { leaf: 0x3f7340, light: 0x8aaa69, pot: 0xd7c9ad },
  palm: { leaf: 0x437044, light: 0x93a96a, pot: 0xb66f43 },
  cactus: { leaf: 0x4b7d59, light: 0x83a878, pot: 0x859873 },
  orchid: { leaf: 0x416f42, light: 0x89a96d, pot: 0xc98272 },
  snake: { leaf: 0x3f6a3d, light: 0xa6b05a, pot: 0xddd0b5 },
  bonsai: { leaf: 0x3f7040, light: 0x809d62, pot: 0xb57148 },
};

function buildPlantArtwork(PIXI: PixiModule, key: string, stage: number) {
  const palette = plantColors[key] ?? plantColors.monstera;
  const plant = new PIXI.Container();
  const mature = Math.max(1, Math.min(12, stage));
  const stemColor = key === "bonsai" ? 0x75503a : 0x557347;
  const stems = new PIXI.Graphics();
  const stemHeight = 25 + mature * 5;
  stems.moveTo(0, -22).bezierCurveTo(-2, -38, 3, -stemHeight + 7, 0, -stemHeight).stroke({ color: stemColor, width: key === "bonsai" ? 5 : 2.2, cap: "round" });
  plant.addChild(stems);

  const addLeaf = (x: number, y: number, w: number, h: number, rotation: number, color = palette.leaf) => {
    const leaf = new PIXI.Graphics().ellipse(0, 0, w, h).fill(color);
    leaf.rotation = rotation;
    leaf.position.set(x, y);
    const shine = new PIXI.Graphics().ellipse(-w * .18, -h * .12, Math.max(1, w * .16), Math.max(1, h * .45)).fill({ color: palette.light, alpha: .42 });
    leaf.addChild(shine);
    plant.addChild(leaf);
  };

  if (key === "cactus" && mature >= 4) {
    const cactusHeight = 35 + mature * 3.8;
    const body = new PIXI.Graphics().roundRect(-9, -22-cactusHeight, 18, cactusHeight, 9).fill(palette.leaf);
    const arm = new PIXI.Graphics().roundRect(5, -48-mature, 17, 10, 5).fill(palette.leaf).roundRect(14, -58-mature*1.5, 9, 21+mature*.5, 5).fill(palette.leaf);
    plant.addChild(body, arm);
  } else if (key === "snake" && mature >= 3) {
    const count = Math.min(9, 2 + Math.ceil(mature / 1.5));
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * 7;
      const height = 30 + ((i * 13) % 24) + mature * 3.5;
      const blade = new PIXI.Graphics().moveTo(x - 5, -22).quadraticCurveTo(x - 3, -22 - height * .7, x, -22 - height).quadraticCurveTo(x + 5, -22 - height * .62, x + 5, -22).closePath().fill(i % 2 ? palette.light : palette.leaf);
      plant.addChild(blade);
    }
  } else if (key === "palm" && mature >= 4) {
    const fronds=4+Math.ceil(mature/2);
    for (let i = 0; i < fronds; i++) {
      const angle = -1.15 + (i / Math.max(1,fronds-1)) * 2.3;
      addLeaf(Math.sin(angle) * (18+mature*.7), -stemHeight + Math.abs(Math.sin(angle)) * 5, 4.5, 21 + mature * 1.25, angle, i % 2 ? palette.light : palette.leaf);
    }
  } else if (key === "fern" && mature >= 4) {
    const fronds=5+Math.ceil(mature/2);
    for (let i = 0; i < fronds; i++) {
      const angle = -1.2 + (i / Math.max(1,fronds-1)) * 2.4;
      addLeaf(Math.sin(angle) * (17+mature*.5), -34 - Math.cos(angle) * (11+mature*.5), 4, 20 + mature * 1.7, angle, i % 2 ? palette.light : palette.leaf);
    }
  } else if (key === "bonsai" && mature >= 4) {
    const branch = new PIXI.Graphics().moveTo(0, -43).bezierCurveTo(10, -55, -8, -66, 13, -77).stroke({ color: stemColor, width: 5, cap: "round" });
    plant.addChild(branch);
    const crown=3+Math.floor(mature/3);
    for(let i=0;i<crown;i++){const angle=(i/(crown-1)-.5)*Math.PI*.9;addLeaf(Math.sin(angle)*(17+mature),-59-Math.cos(angle)*(9+mature*.5),12+mature*.55,8+mature*.3,angle*.15,i%3===1?palette.light:palette.leaf)}
  } else {
    const leafCount = Math.min(14, 2 + mature);
    for (let i = 0; i < leafCount; i++) {
      const side = i % 2 ? 1 : -1;
      const row = Math.floor(i / 2);
      const y = -34 - row * (6.4 + mature * .28);
      const width = key === "pilea" ? 9 + mature*.25 : key === "alocasia" ? 12 + mature*.5 : 10 + mature * .48;
      const height = key === "pilea" ? 8 + mature*.18 : key === "alocasia" ? 14 + mature*.65 : 7 + mature*.52;
      addLeaf(side * (9 + row * 3.2), y, width, height, side * (.78 - row * .08), i % 3 ? palette.leaf : palette.light);
    }
    if (key === "orchid" && mature >= 10) {
      const bloomStem = new PIXI.Graphics().moveTo(2, -35).bezierCurveTo(5, -62, 5, -80, 10, -92).stroke({ color: 0x617a4a, width: 1.8 });
      plant.addChild(bloomStem);
      const bloom = new PIXI.Container(); bloom.position.set(10, -92);
      for (let i=0;i<5;i++){const petal=new PIXI.Graphics().ellipse(0,-5,4,7).fill(0xdba2a7);petal.rotation=i*(Math.PI*2/5);bloom.addChild(petal)}
      bloom.addChild(new PIXI.Graphics().circle(0,0,2.2).fill(0xf4d789)); plant.addChild(bloom);
    }
  }

  const soil = new PIXI.Graphics().ellipse(0, -23, 23, 6).fill(0x5a3a27);
  const pot = new PIXI.Graphics().moveTo(-23, -23).lineTo(23, -23).lineTo(17, 0).quadraticCurveTo(0, 5, -17, 0).closePath().fill(palette.pot);
  const rim = new PIXI.Graphics().roundRect(-25, -27, 50, 9, 4.5).fill({ color: palette.pot }).ellipse(0, -25, 21, 3.2).fill({ color: 0xf2c6a1, alpha: .3 });
  const potShade = new PIXI.Graphics().moveTo(8, -18).lineTo(21, -20).lineTo(16, -1).quadraticCurveTo(8, 1, 8, 1).closePath().fill({ color: 0x674735, alpha: .15 });
  plant.addChild(soil, pot, potShade, rim);
  plant.scale.set(.74 + mature * .018);
  return plant;
}

export default function GardenScene({ room, plants, streak, availableMotes, onCollectMote, onPetStaubi }: GardenSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const sceneHost = host;

    let cancelled = false;
    let application: import("pixi.js").Application | null = null;

    async function buildScene() {
      const PIXI = await import("pixi.js");
      const app = new PIXI.Application();
      await app.init({
        width: WIDTH,
        height: HEIGHT,
        antialias: true,
        autoDensity: true,
        backgroundAlpha: 0,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        preference: "webgl",
      });
      if (cancelled) {
        app.destroy(true, { children: true });
        return;
      }

      application = app;
      app.canvas.className = "garden-canvas";
      app.canvas.setAttribute("aria-hidden", "true");
      sceneHost.replaceChildren(app.canvas);

      const backgroundUrl = room === PROTOTYPE_ROOM ? roomBackgrounds.Wohnzimmer : (roomFallbacks[room] ?? roomBackgrounds.Wohnzimmer);
      const plantAssets = plants.flatMap((plant) => {
        const key = normalizePlantKey(plant.key);
        return [1, 2, 3, 4, 5].map((stage) => stageSpriteUrl(key, stage));
      });
      const assets = [backgroundUrl, withAssetRevision("/garden/staubi-game-cutout.png"), ...new Set(plantAssets)];
      await PIXI.Assets.load(assets);
      if (cancelled) return;

      const background = new PIXI.Sprite(PIXI.Assets.get(backgroundUrl));
      background.width = WIDTH;
      background.height = HEIGHT;
      background.alpha = 0.96;
      background.zIndex = 0;
      app.stage.addChild(background);
      app.stage.sortableChildren = true;

      const ambientGlow = new PIXI.Graphics();
      ambientGlow.circle(88, 72, 42).fill({ color: 0xfff2a3, alpha: 0.12 });
      ambientGlow.circle(302, 150, 48).fill({ color: 0xffe2b0, alpha: 0.10 });
      ambientGlow.circle(305, 540, 55).fill({ color: 0x80b16a, alpha: 0.12 });
      ambientGlow.zIndex = 1;
      app.stage.addChild(ambientGlow);

      const floorRim = new PIXI.Graphics()
        .rect(18, 610, 356, 8)
        .fill({ color: 0x7a5f42, alpha: 0.18 });
      floorRim.zIndex = 2;
      app.stage.addChild(floorRim);

      const plantLayer = new PIXI.Container();
      plantLayer.zIndex = 10;
      app.stage.addChild(plantLayer);
      const animatedPlants: Array<AnimatedPlant> = [];
      const slots = roomSlots[room] ?? roomSlots.Wohnzimmer;

      plants.slice(0, 4).forEach((plant, index) => {
        const slot = slots[index];
        const plantNode = new PIXI.Container();
        plantNode.position.set(slot.x, slot.y);
        plantNode.eventMode = "static";
        plantNode.cursor = "pointer";
        plantNode.zIndex = index + 1;
        const normalized = normalizePlantKey(plant.key);

        const stageUrl = stageSpriteUrl(normalized, plant.stage);
        const spriteTexture = PIXI.Assets.get(stageUrl) as PIXI.Texture | null;
        let sprite: PIXI.Sprite | PIXI.Container = buildPlantArtwork(PIXI, plant.key, plant.stage);
        let baseScale = 0.82;

        if (spriteTexture) {
          const spriteFromImage = new PIXI.Sprite(spriteTexture);
          const fitWidth = slot.maxWidth * (0.96 + (Math.min(plant.stage, 12) / 12) * 0.18);
          const fitHeight = slot.maxHeight * (0.87 + (Math.min(plant.stage, 12) / 12) * 0.18);
          baseScale = Math.min(fitWidth / spriteTexture.width, fitHeight / spriteTexture.height, 1.6);
          spriteFromImage.anchor.set(0.5, 1);
          spriteFromImage.scale.set(baseScale);
          spriteFromImage.skew.set(-0.03 + (index % 2) * 0.06, 0);
          spriteFromImage.position.set(0, 0);
          sprite = spriteFromImage;
        } else {
          baseScale = 0.78 + Math.min(plant.stage, 12) / 12;
          sprite.scale.set(baseScale);
          sprite.position.set(0, 0);
        }
        if (plant.stage >= 7) {
          const aura = createPlantAura(PIXI, plant.stage, baseScale);
          aura.alpha = 0.75;
          aura.position.set(0, -slot.maxHeight + 14);
          plantNode.addChild(aura);
        }

        const shadow = new PIXI.Graphics()
          .ellipse(0, 4, 26 + plant.stage * 1.2, 5.2)
          .fill({ color: 0x5c371f, alpha: 0.2 });
        shadow.zIndex = index;
        plantNode.addChild(shadow);

        plantNode.addChild(sprite);
        plantNode.position.set(slot.x, slot.y);
        plantNode.on("pointertap", () => {
          const animated = animatedPlants[index];
          if (animated) animated.pulse = 1;
        });
        plantLayer.addChild(plantNode);
        animatedPlants.push({ node: plantNode, baseScale, phase: index * 1.47, pulse: 0, baseY: slot.y });
      });

      const staubi = new PIXI.Sprite(PIXI.Assets.get(withAssetRevision("/garden/staubi-game-cutout.png")));
      staubi.anchor.set(0.5, 1);
      staubi.width = 76;
      staubi.scale.y = staubi.scale.x;
      staubi.position.set(333, 548);
      staubi.zIndex = 20;
      staubi.eventMode = "static";
      staubi.cursor = "pointer";
      staubi.on("pointertap", () => {
        staubi.scale.set(staubi.scale.x * 1.12);
        onPetStaubi();
      });
      app.stage.addChild(staubi);

      const badge = new PIXI.Container();
      badge.position.set(306, 486);
      badge.zIndex = 30;
      const badgeBackground = new PIXI.Graphics().roundRect(0, 0, 67, 25, 13).fill({ color: 0xfff5dc, alpha: 0.96 });
      badgeBackground.stroke({ color: 0x9d7a45, alpha: 0.22, width: 1 });
      const badgeText = new PIXI.Text({ text: streak ? `Serie ${streak}` : "Zzz", style: { fill: 0x654c2b, fontFamily: "Georgia,serif", fontSize: 10, fontWeight: "700" } });
      badgeText.anchor.set(0.5);
      badgeText.position.set(33.5, 12.5);
      badge.addChild(badgeBackground, badgeText);
      app.stage.addChild(badge);

      const motePositions = [
        { x: 55, y: 470 },
        { x: 91, y: 505 },
        { x: 48, y: 541 },
      ];
      const motes: Array<{ node: import("pixi.js").Container; phase: number }> = [];
      motePositions.slice(0, availableMotes).forEach((position, index) => {
        const mote = new PIXI.Container();
        mote.position.set(position.x, position.y);
        mote.zIndex = 25;
        mote.eventMode = "static";
        mote.cursor = "pointer";
        mote.hitArea = new PIXI.Circle(0, 0, 20);
        const halo = new PIXI.Graphics().circle(0, 0, 15).fill({ color: 0xffdf74, alpha: 0.16 });
        const glow = new PIXI.Graphics().circle(0, 0, 7).fill({ color: 0xffe69a, alpha: 0.56 });
        const core = new PIXI.Graphics().circle(0, 0, 2.8).fill({ color: 0xfff9dc, alpha: 1 });
        mote.addChild(halo, glow, core);
        mote.on("pointertap", () => {
          mote.eventMode = "none";
          onCollectMote();
        });
        motes.push({ node: mote, phase: index * 2.1 });
        app.stage.addChild(mote);
      });

      let elapsed = 0;
      app.ticker.add((ticker) => {
        elapsed += ticker.deltaMS / 1000;
        animatedPlants.forEach((plant) => {
          const sway = Math.sin(elapsed * 1.1 + plant.phase) * 0.008;
          if (plant.pulse > 0) plant.pulse = Math.max(0, plant.pulse - ticker.deltaMS / 520);
          const bounce = plant.pulse > 0 ? Math.sin((1 - plant.pulse) * Math.PI) * 0.12 : 0;
          plant.node.rotation = sway;
          plant.node.scale.set(1 + bounce, 0.98 + bounce * 0.9);
          plant.node.position.y = plant.baseY + Math.sin(plant.pulse * Math.PI * 2) * 2;
        });
        const staubiBaseScale = 76 / staubi.texture.width;
        const petScale = Math.max(staubiBaseScale, staubi.scale.x - ticker.deltaMS * 0.00002);
        staubi.scale.set(petScale);
        staubi.y = 548 + Math.sin(elapsed * 1.8) * 1.8;
        staubi.rotation = Math.sin(elapsed * 1.25) * 0.012;
        motes.forEach((mote) => {
          mote.node.y += Math.sin(elapsed * 1.7 + mote.phase) * 0.035;
          mote.node.scale.set(0.96 + Math.sin(elapsed * 2.1 + mote.phase) * 0.05);
          mote.node.alpha = 0.78 + Math.sin(elapsed * 2.4 + mote.phase) * 0.2;
        });
      });
    }

    void buildScene();
    return () => {
      cancelled = true;
      if (application) application.destroy(true, { children: true });
      sceneHost.replaceChildren();
    };
  }, [availableMotes, onCollectMote, onPetStaubi, plants, room, streak]);

  return <div ref={hostRef} className="garden-scene-host" data-testid="garden-scene" />;
}
