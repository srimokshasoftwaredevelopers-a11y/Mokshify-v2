import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const pad = (value) => String(value).padStart(2, "0");

function decodeDataUrl(dataUrl) {
  const [, payload] = dataUrl.split(",", 2);
  return Buffer.from(payload, "base64");
}

async function ensureCleanDir(directoryPath) {
  await fs.rm(directoryPath, { recursive: true, force: true });
  await fs.mkdir(directoryPath, { recursive: true });
}

function scrollWindow(sceneIndex, totalScenes) {
  const sceneSpan = 1 / totalScenes;
  const start = sceneSpan * sceneIndex;
  const end = sceneSpan * (sceneIndex + 1);
  return {
    scrollStart: Number(start.toFixed(4)),
    scrollEnd: Number(end.toFixed(4)),
  };
}

function buildCameraPayload(sceneIndex, totalScenes, analysis) {
  const scroll = scrollWindow(sceneIndex, totalScenes);
  return {
    cameraType: analysis.camera.cameraType,
    scrollStart: scroll.scrollStart,
    scrollEnd: scroll.scrollEnd,
    translateZ: analysis.camera.translateZ,
    translateX: analysis.camera.translateX,
    translateY: analysis.camera.translateY,
    rotateY: analysis.camera.rotateY,
    rotateX: analysis.camera.rotateX,
    fov: analysis.camera.fov,
    detectedShotBoundaries: analysis.shotBoundaries,
  };
}

function buildObjectsPayload(analysis) {
  return {
    objects: analysis.objects,
    layers: analysis.animation.layers,
  };
}

function buildAnimationPayload(sceneIndex, totalScenes, analysis) {
  const scroll = scrollWindow(sceneIndex, totalScenes);
  return {
    scrollStart: scroll.scrollStart,
    scrollEnd: scroll.scrollEnd,
    duration: Number(analysis.duration.toFixed(3)),
    timeline: analysis.animation.timeline,
    transitions: analysis.animation.transitions,
  };
}

function buildManifestScene(sceneIndex, totalScenes, analysis) {
  const scroll = scrollWindow(sceneIndex, totalScenes);
  return {
    scene: sceneIndex + 1,
    sourceVideo: `${sceneIndex + 1}.mp4`,
    duration: Number(analysis.duration.toFixed(3)),
    scrollStart: scroll.scrollStart,
    scrollEnd: scroll.scrollEnd,
    shots: analysis.shotBoundaries,
    camera: {
      position: [analysis.camera.translateX, analysis.camera.translateY, analysis.camera.translateZ],
      rotation: [analysis.camera.rotateX, analysis.camera.rotateY, 0],
      fov: analysis.camera.fov,
      type: analysis.camera.cameraType,
    },
    transitions: analysis.animation.transitions,
  };
}

export async function exportScenes(outputRoot, analyses) {
  await ensureCleanDir(outputRoot);
  const manifest = [];

  for (let i = 0; i < analyses.length; i += 1) {
    const analysis = analyses[i];
    const sceneDir = path.join(outputRoot, `scene${pad(i + 1)}`);
    await fs.mkdir(sceneDir, { recursive: true });

    for (let keyframeIndex = 0; keyframeIndex < analysis.keyframes.length; keyframeIndex += 1) {
      const keyframe = analysis.keyframes[keyframeIndex];
      const keyframeName = `keyframe${pad(keyframeIndex + 1)}`;
      await sharp(decodeDataUrl(keyframe.dataUrl))
        .avif({ quality: 68, effort: 6 })
        .toFile(path.join(sceneDir, `${keyframeName}.avif`));

      await sharp(decodeDataUrl(analysis.depthMaps[keyframeIndex]))
        .png()
        .toFile(path.join(sceneDir, `depth-map${pad(keyframeIndex + 1)}.png`));

      await sharp(decodeDataUrl(analysis.masks[keyframeIndex]))
        .png()
        .toFile(path.join(sceneDir, `mask${pad(keyframeIndex + 1)}.png`));
    }

    await fs.writeFile(
      path.join(sceneDir, "camera.json"),
      JSON.stringify(buildCameraPayload(i, analyses.length, analysis), null, 2)
    );
    await fs.writeFile(
      path.join(sceneDir, "objects.json"),
      JSON.stringify(buildObjectsPayload(analysis), null, 2)
    );
    await fs.writeFile(
      path.join(sceneDir, "animation.json"),
      JSON.stringify(buildAnimationPayload(i, analyses.length, analysis), null, 2)
    );

    manifest.push(buildManifestScene(i, analyses.length, analysis));
  }

  await fs.writeFile(path.join(outputRoot, "metadata.json"), JSON.stringify(manifest, null, 2));
}
