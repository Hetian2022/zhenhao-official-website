
  (function () {
    const maskEl = document.getElementById("heroBgMask");
    const avoidEl = document.getElementById("heroContent");

    if (!maskEl || !avoidEl) return;

    const logoSources = [
      { src: "./images/Arbitrum.webp", alt: "Arbitrum" },
      { src: "./images/BNBChain.png", alt: "BNB Chain" },
      { src: "./images/ETH.png", alt: "Ethereum" },
      { src: "./images/logo.png", alt: "Bitcoin" },
      { src: "./images/Tron.png", alt: "TRON" },
      { src: "./images/usdc.png", alt: "USDC" },
      { src: "./images/usdt.png", alt: "USDT" }
    ];

    const config = {
      count: 14,
      minSize: 26,
      maxSize: 86,
      gapPx: 10,
      maxTries: 120,
      avoidPaddingPx: 28,
      floating: true,
      seed: undefined
    };

    function makeRng(seed) {
      let t = (seed ?? Math.floor(Math.random() * 1e9)) >>> 0;
      return () => {
        t += 0x6d2b79f5;
        let x = Math.imul(t ^ (t >>> 15), 1 | t);
        x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
      };
    }

    function rand(rng, min, max) {
      return rng() * (max - min) + min;
    }

    function pxToPercentX(px, width) {
      return (px / Math.max(width, 1)) * 100;
    }

    function percentYToXSpace(percentY, width, height) {
      return percentY * (height / Math.max(width, 1));
    }

    function collide(a, b, width, height) {
      const dx = a.x - b.x;
      const dy = percentYToXSpace(a.y - b.y, width, height);
      const dist2 = dx * dx + dy * dy;
      const minR = a.r + b.r;
      return dist2 < minR * minR;
    }

    function getAvoidRect(containerRect, avoidRect, padding) {
      return {
        left: Math.max(0, avoidRect.left - containerRect.left - padding),
        top: Math.max(0, avoidRect.top - containerRect.top - padding),
        right: Math.min(containerRect.width, avoidRect.right - containerRect.left + padding),
        bottom: Math.min(containerRect.height, avoidRect.bottom - containerRect.top + padding)
      };
    }

    function pointInRect(xPx, yPx, rect) {
      return xPx > rect.left && xPx < rect.right && yPx > rect.top && yPx < rect.bottom;
    }

    function generateLayout() {
      maskEl.innerHTML = "";

      const containerRect = maskEl.getBoundingClientRect();
      const avoidRectRaw = avoidEl.getBoundingClientRect();
      const avoidRect = getAvoidRect(containerRect, avoidRectRaw, config.avoidPaddingPx);

      const rng = makeRng(config.seed);

      const sizes = Array.from({ length: config.count }, () =>
        rand(rng, config.minSize, config.maxSize)
      ).sort((a, b) => b - a);

      const placed = [];

      for (let i = 0; i < sizes.length; i++) {
        const sizePx = sizes[i];
        const logo = logoSources[i % logoSources.length];

        const r = pxToPercentX(sizePx / 2 + config.gapPx, containerRect.width);

        let success = false;
        let x = 50;
        let y = 50;

        for (let t = 0; t < config.maxTries; t++) {
          x = rand(rng, 4, 96);
          y = rand(rng, 4, 96);

          const xPx = (x / 100) * containerRect.width;
          const yPx = (y / 100) * containerRect.height;

          if (pointInRect(xPx, yPx, avoidRect)) continue;

          const current = { x, y, r };
          let hit = false;

          for (const other of placed) {
            if (collide(current, other, containerRect.width, containerRect.height)) {
              hit = true;
              break;
            }
          }

          if (hit) continue;

          placed.push(current);
          success = true;
          break;
        }

        if (!success) continue;

        const rotate = rand(rng, -22, 22);
        const opacity = rand(rng, 0.22, 0.82);
        const floatDelay = rand(rng, 0, 2.2);
        const floatDur = rand(rng, 6, 11);
        const floatAmp = rand(rng, 6, 14);

        const img = document.createElement("img");
        img.className = "hero-coin" + (config.floating ? " floating" : "");
        img.src = logo.src;
        img.alt = logo.alt;
        img.draggable = false;

        img.style.left = x + "%";
        img.style.top = y + "%";
        img.style.width = sizePx + "px";
        img.style.height = sizePx + "px";
        img.style.opacity = opacity;
        img.style.setProperty("--rotate", rotate + "deg");
        img.style.setProperty("--float-delay", floatDelay + "s");
        img.style.setProperty("--float-dur", floatDur + "s");
        img.style.setProperty("--float-amp", floatAmp + "px");

        maskEl.appendChild(img);
      }
    }

    let resizeTimer = null;
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(generateLayout, 120);
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("load", generateLayout);

    if ("ResizeObserver" in window) {
      const ro = new ResizeObserver(() => generateLayout());
      ro.observe(avoidEl);
      ro.observe(maskEl);
    }
  })();
