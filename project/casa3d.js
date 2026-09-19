/* <casa-3d> — plastico architettonico 3D (three.js, caricamento lazy).
   Attributi: autorotate (default on), interactive, variant="villa|palazzo", tone="light|dark" */
(function () {
  const SRC = 'https://unpkg.com/three@0.184.0/build/three.module.js';
  let p = null;
  const loadThree = () => (p || (p = import(SRC)));

  const M = {
    stucco: 0xefe7d9, stuccoDark: 0xdccfba, travertine: 0xd7cab4,
    roof: 0xb4491f, glass: 0x16293a, brass: 0xc9a227, cypress: 0x33523a, ink: 0x0a1826
  };

  function mat(THREE, name, color, opts) {
    const m = new THREE.MeshStandardMaterial(Object.assign({ color }, opts || {}));
    m.name = name; return m;
  }

  function buildVilla(THREE, variant) {
    const g = new THREE.Group(); g.name = 'giacasa_villa';
    const stucco = mat(THREE, 'stucco', M.stucco, { roughness: 0.85 });
    const stucco2 = mat(THREE, 'stucco_ombra', M.stuccoDark, { roughness: 0.9 });
    const roofM = mat(THREE, 'terracotta', M.roof, { roughness: 0.6 });
    const stone = mat(THREE, 'travertino', M.travertine, { roughness: 0.95 });
    const glass = mat(THREE, 'vetro', M.glass, { roughness: 0.15, metalness: 0.4 });
    const brass = mat(THREE, 'ottone', M.brass, { roughness: 0.35, metalness: 0.85 });
    const green = mat(THREE, 'cipresso', M.cypress, { roughness: 1 });

    const box = (w, h, d, x, y, z, m, name) => {
      const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      me.position.set(x, y, z); me.name = name || 'parte';
      me.castShadow = true; me.receiveShadow = true; g.add(me); return me;
    };

    box(7.4, 0.44, 5.8, 0, 0.22, 0, stone, 'basamento');
    box(7.0, 0.1, 5.4, 0, 0.45, 0, stucco2, 'pavimentazione');

    const tall = variant === 'palazzo';
    const bodyH = tall ? 4.6 : 3.1;
    box(4.6, bodyH, 4.0, -0.7, 0.45 + bodyH / 2, 0, stucco, 'corpo_principale');

    // tetto a due falde
    const tri = new THREE.Shape();
    tri.moveTo(-2.45, 0); tri.lineTo(2.45, 0); tri.lineTo(0, 1.45); tri.closePath();
    const roofGeo = new THREE.ExtrudeGeometry(tri, { depth: 4.3, bevelEnabled: false });
    roofGeo.translate(0, 0, -2.15);
    const roof = new THREE.Mesh(roofGeo, roofM);
    roof.position.set(-0.7, 0.45 + bodyH, 0);
    roof.name = 'tetto'; roof.castShadow = true; roof.receiveShadow = true; g.add(roof);
    box(0.4, 0.9, 0.4, -2.0, 0.45 + bodyH + 1.0, 0, stucco2, 'camino');
    box(0.56, 0.12, 0.56, -2.0, 0.45 + bodyH + 1.5, 0, brass, 'camino_cappello');

    // ala laterale + terrazza
    box(2.5, 2.0, 3.2, 2.1, 1.45, 0.2, stucco, 'ala');
    box(2.72, 0.16, 3.42, 2.1, 2.53, 0.2, roofM, 'ala_copertura');
    box(2.3, 0.14, 2.0, 2.15, 0.55, 2.55, stone, 'terrazza');
    [1.2, 3.1].forEach((x, i) => {
      box(0.09, 2.2, 0.09, x, 1.6, 1.7, brass, 'pergola_palo_' + i);
      box(0.09, 2.2, 0.09, x, 1.6, 3.4, brass, 'pergola_palo_b' + i);
    });
    box(2.3, 0.07, 1.85, 2.15, 2.68, 2.55, brass, 'pergola_trave');

    // finestre fronte (z+)
    const win = (x, y, w, h, z) => {
      box(w, h, 0.08, x, y, z, glass, 'vetro');
      box(w + 0.14, 0.07, 0.14, x, y - h / 2 - 0.05, z + 0.03, stone, 'soglia');
    };
    win(-1.75, 1.55, 0.72, 0.95, 2.02);
    win(0.35, 1.55, 0.72, 0.95, 2.02);
    win(-1.75, 3.0, 0.72, 0.8, 2.02);
    win(0.35, 3.0, 0.72, 0.8, 2.02);
    if (tall) { win(-1.75, 4.3, 0.72, 0.8, 2.02); win(0.35, 4.3, 0.72, 0.8, 2.02); }
    win(2.1, 1.5, 1.5, 1.05, 1.82);
    // finestre lato (x-)
    box(0.08, 0.9, 0.7, -2.98, 1.6, 0.6, glass, 'vetro_lato');
    box(0.08, 0.9, 0.7, -2.98, 3.0, 0.6, glass, 'vetro_lato2');

    // ingresso
    box(0.9, 1.9, 0.1, -1.5, 1.4, 2.03, brass, 'portone');
    box(1.4, 0.14, 0.7, -1.5, 0.52, 2.35, stone, 'gradino');

    const cypress = (x, z, h) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.4, 10), green);
      t.position.set(x, 0.65, z); t.name = 'tronco'; t.castShadow = true; g.add(t);
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.42, h, 18), green);
      c.position.set(x, 0.85 + h / 2, z); c.name = 'cipresso'; c.castShadow = true; g.add(c);
    };
    cypress(-3.1, -1.9, 2.4);
    cypress(3.25, -1.9, 2.0);
    cypress(-2.6, 2.3, 1.8);

    return g;
  }

  class Casa3D extends HTMLElement {
    connectedCallback() {
      if (this._booted) return;
      this._booted = true;
      this.style.display = 'block';
      if (!this.style.position) this.style.position = 'relative';
      loadThree().then((THREE) => this.boot(THREE)).catch(() => { this.style.display = 'none'; });
    }

    boot(THREE) {
      const w = this.clientWidth || 320, h = this.clientHeight || 200;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(w, h, false);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      const cv = renderer.domElement;
      cv.style.cssText = 'display:block;width:100%;height:100%;border-radius:inherit;touch-action:pan-y';
      this.appendChild(cv);
      this._renderer = renderer;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, w / h, 0.5, 120);
      const model = buildVilla(THREE, this.getAttribute('variant') || 'villa');
      const pivot = new THREE.Group();
      pivot.add(model);
      pivot.rotation.y = -0.55;
      scene.add(pivot);

      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 40),
        new THREE.ShadowMaterial({ opacity: this.getAttribute('tone') === 'dark' ? 0.4 : 0.22 })
      );
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = 0.001;
      shadowPlane.receiveShadow = true;
      scene.add(shadowPlane);

      scene.add(new THREE.HemisphereLight(0xdfe9f2, 0x8b7a62, 0.6));
      const key = new THREE.DirectionalLight(0xfff3e2, 1.9);
      key.position.set(7, 11, 6);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -9; key.shadow.camera.right = 9;
      key.shadow.camera.top = 9; key.shadow.camera.bottom = -9;
      key.shadow.camera.near = 1; key.shadow.camera.far = 40;
      key.shadow.bias = -0.0015;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xa8c8e4, 0.5);
      fill.position.set(-7, 5, -5);
      scene.add(fill);

      const fit = () => {
        const W = this.clientWidth || w, H = this.clientHeight || h;
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        const base = 21;
        camera.position.set(0, 6.4, base * Math.max(0.72, Math.min(1.5, 1.1 / camera.aspect)));
        camera.lookAt(0, 2.1, 0);
        camera.updateProjectionMatrix();
      };
      fit();

      let auto = this.getAttribute('autorotate') !== 'false';
      let spin = 0, drag = null, pausedUntil = 0, visible = true;

      if (this.hasAttribute('interactive')) {
        cv.style.cursor = 'grab';
        const down = (e) => { drag = (e.touches ? e.touches[0].clientX : e.clientX); cv.style.cursor = 'grabbing'; };
        const move = (e) => {
          if (drag === null) return;
          const x = e.touches ? e.touches[0].clientX : e.clientX;
          spin += (x - drag) * 0.009; drag = x; pausedUntil = performance.now() + 2600;
        };
        const up = () => { drag = null; cv.style.cursor = 'grab'; };
        cv.addEventListener('pointerdown', down);
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        this._off = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
      }

      this._ro = new ResizeObserver(fit);
      this._ro.observe(this);
      this._io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.02 });
      this._io.observe(this);

      let last = performance.now();
      const tick = (t) => {
        this._raf = requestAnimationFrame(tick);
        const dt = Math.min(0.05, (t - last) / 1000); last = t;
        if (!visible) return;
        if (auto && t > pausedUntil) spin += dt * 0.16;
        pivot.rotation.y = -0.55 + spin;
        model.position.y = Math.sin(t / 2600) * 0.05;
        renderer.render(scene, camera);
      };
      this._raf = requestAnimationFrame(tick);
    }

    disconnectedCallback() {
      cancelAnimationFrame(this._raf);
      this._ro && this._ro.disconnect();
      this._io && this._io.disconnect();
      this._off && this._off();
      this._renderer && this._renderer.dispose();
      this._booted = false;
      if (this._renderer && this._renderer.domElement.parentNode === this) this.removeChild(this._renderer.domElement);
      this._renderer = null;
    }
  }
  if (!customElements.get('casa-3d')) customElements.define('casa-3d', Casa3D);
})();
