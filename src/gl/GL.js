import { Renderer, Triangle, Program, Mesh, Texture } from "ogl";
import gsap from "gsap";

import { vertex, fragment } from "./shaders";

const PARAMS = {
  offsetAmount: 2.25,
  columnsCount: 3,
};

class GL {
  constructor({ canvas, slidesCount }) {
    this.transitionProgress = 0;
    this.currentSlideIndex = 0;
    this.nextSlideIndex = 0;
    this.raf = null;

    this.render = this.render.bind(this);

    this.initRenderer(canvas);
    this.initGl();
    this.initTransparentTexture();
    this.initProgram();
    this.initGeometry();
    this.initMesh();
    this.initTextures(slidesCount);

    this.raf = requestAnimationFrame(this.render);
  }

  initRenderer(canvas) {
    this.renderer = new Renderer({
      canvas,
      alpha: true,
      // The original ran at dpr 1. Clamping at 2 keeps retina crisp without
      // quadrupling the fragment cost on phones.
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
  }

  initGl() {
    this.gl = this.renderer.gl;
    this.gl.clearColor(0.0666, 0.098, 0.1686, 1);
  }

  initGeometry() {
    // Rather than a plane (two triangles) covering the viewport, this is a single
    // triangle spanning -1..1 for 'position' and 0..1 for 'uv'. The excess falls
    // outside the viewport.
    //
    //         position                uv
    //      (-1, 3)                  (0, 2)
    //         |\                      |\
    //         |__\(1, 1)              |__\(1, 1)
    //         |__|_\                  |__|_\
    //   (-1, -1)   (3, -1)        (0, 0)   (2, 0)
    this.geometry = new Triangle(this.gl);
  }

  initTransparentTexture() {
    // A 1×1 fully transparent canvas replaces the transparent-pixel.png import,
    // so there's one less asset to ship and no load race on first paint.
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    canvas.getContext("2d");

    this.transparentPixelTexture = new Texture(this.gl, {
      image: canvas,
      generateMipmaps: false,
    });
  }

  initTextures(count) {
    this.textures = [];

    for (let i = 0; i < count; i++) {
      // Empty texture placeholders while the videos load.
      this.textures.push(
        new Texture(this.gl, {
          generateMipmaps: false,
          width: 1920,
          height: 1080,
        })
      );
    }
  }

  initProgram() {
    this.program = new Program(this.gl, {
      vertex,
      fragment,
      uniforms: {
        uTexture1: { value: this.transparentPixelTexture },
        uTexture2: { value: this.transparentPixelTexture },
        uOffsetAmount: { value: PARAMS.offsetAmount },
        uColumnsCount: { value: PARAMS.columnsCount },
        uTransitionProgress: { value: this.transitionProgress },
        uInputResolution: { value: [16, 9] },
        uOutputResolution: { value: [0, 0] }, // set by updateSize()
        uAngle: { value: (45 * Math.PI) / 180 },
        uScale: { value: 3 },
      },
    });
  }

  initMesh() {
    this.mesh = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program,
    });
  }

  updateSize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.program.uniforms.uOutputResolution.value = [
      window.innerWidth,
      window.innerHeight,
    ];
  }

  attachVideosToEmptyTextures(videos) {
    videos.forEach((video, i) => this.attachVideo(i, video));
  }

  // Slides arrive one at a time now, so textures fill as each clip lands
  // rather than all at once after a full preload.
  attachVideo(index, video) {
    if (this.textures?.[index]) this.textures[index].image = video;
  }

  isTransitionRunning() {
    return this.transitionProgress !== 0;
  }

  goToSlide(index) {
    this.nextSlideIndex = index;
    this.program.uniforms.uTexture2.value = this.textures[index];

    gsap.killTweensOf(this);
    gsap.to(this, {
      transitionProgress: 1,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: () => this.updateTransitionProgressUniform(),
      onComplete: () => {
        this.transitionProgress = 0;
        this.currentSlideIndex = index;
        this.program.uniforms.uTexture1.value = this.textures[index];
        this.updateTransitionProgressUniform();
      },
    });
  }

  updateTransitionProgressUniform() {
    this.program.uniforms.uTransitionProgress.value = this.transitionProgress;
  }

  render() {
    this.raf = requestAnimationFrame(this.render);

    // A context can die under us — GPU process crash, driver reset, a tab
    // backgrounded for too long on mobile. Bail rather than throw on every
    // frame for the rest of the session.
    if (this.gl.isContextLost()) return;

    // Pushing a new frame of the <video> into the texture every tick is what
    // makes the slide "play" — a texture is a static upload otherwise.
    if (this.textures?.[this.currentSlideIndex]?.image) {
      this.textures[this.currentSlideIndex].needsUpdate = true;
    }

    if (
      this.isTransitionRunning() &&
      this.textures?.[this.nextSlideIndex]?.image
    ) {
      this.textures[this.nextSlideIndex].needsUpdate = true;
    }

    this.renderer.render({ scene: this.mesh });
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    gsap.killTweensOf(this);

    // Not a perf change, a leak fix: dropping the JS references frees nothing
    // on the GPU. OGL's Texture has no destructor and never releases the
    // context, so each Fast Refresh in dev stranded both until the browser got
    // round to collecting them.
    this.textures?.forEach((texture) => this.gl.deleteTexture(texture.texture));
    this.gl.deleteTexture(this.transparentPixelTexture.texture);

    this.program.remove();
    this.geometry.remove();

    // Releasing the context is only safe when the canvas goes with it.
    //
    // getContext() is idempotent per canvas: ask twice and you get the same
    // object back, lost state included. So if React reuses this <canvas> — a
    // Strict Mode remount, or a navigation that restores a cached page — the
    // next GL instance gets the dead context, gl.createProgram() returns null,
    // linking fails, and OGL's Program constructor returns early *before* it
    // assigns uniformLocations. The crash surfaces one frame later inside
    // renderer.render() as "uniformLocations is undefined".
    //
    // Deferred a frame because effect cleanup can run before React detaches
    // the node. By the next frame the DOM has settled: canvas still in the
    // document means something reused it, so leave its context alone.
    const canvas = this.gl.canvas;
    const loseContext = this.gl.getExtension("WEBGL_lose_context");
    requestAnimationFrame(() => {
      if (!canvas.isConnected) loseContext?.loseContext();
    });

    this.textures = null;
  }
}

export default GL;
