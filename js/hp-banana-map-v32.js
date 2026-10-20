/* Procedural 3D banana; each peel opens a concise stakeholder summary. */
(function () {
  'use strict';
  var scriptURL = document.currentScript.src;
  var map = document.querySelector('[data-hp-banana-map]');
  if (!map) return;
  var host = map.querySelector('[data-banana-canvas]');
  var loading = map.querySelector('[data-banana-loading]');
  var fallback = map.querySelector('[data-banana-fallback]');
  var opening = map.querySelector('[data-banana-opening]');
  var prompt = map.querySelector('[data-stakeholder-prompt]');
  var status = map.querySelector('[data-stakeholder-status]');
  var reader = map.querySelector('.hp-stakeholder-map__reader');
  var buttons = Array.from(map.querySelectorAll('[data-banana-theme]'));
  var topics = Array.from(map.querySelectorAll('[data-banana-group]'));
  var keys = buttons.map(function (button) { return button.dataset.bananaTheme; });
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var selected = null, selectionToken = 0, pending = null;
  var ready = false, failed = false, animateChoice = null, resetFruit = null;
  var canvasLabel = host.getAttribute('aria-label');
  var layout = map.querySelector('.hp-banana-layout');
  var choices = map.querySelector('.hp-banana-choices');
  var tools = map.querySelector('.hp-banana-tools');
  // Labels sit beside the fruit, while names and short takeaways open below.
  layout.insertBefore(choices, reader);
  layout.insertBefore(tools, reader);
  var svgNS = 'http://www.w3.org/2000/svg';
  var connections = document.createElementNS(svgNS, 'svg');
  connections.setAttribute('class', 'hp-banana-connections');
  connections.setAttribute('aria-hidden', 'true');
  connections.setAttribute('focusable', 'false');
  connections.setAttribute('hidden', '');
  var leaders = buttons.map(function (button) {
    var group = document.createElementNS(svgNS, 'g');
    group.dataset.theme = button.dataset.bananaTheme;
    var path = document.createElementNS(svgNS, 'path');
    var dot = document.createElementNS(svgNS, 'circle');
    dot.setAttribute('r', '4');
    group.append(path, dot);
    connections.append(group);
    return { group: group, path: path, dot: dot };
  });
  layout.prepend(connections);
  var refreshConnections = null;
  function highlightConnections() {
    leaders.forEach(function (line, index) {
      line.group.classList.toggle('is-selected', keys[index] === selected);
    });
    if (refreshConnections) refreshConnections();
  }

  topics.forEach(function (topic) { topic.hidden = true; });
  fallback.hidden = true;
  loading.hidden = false;
  host.setAttribute('aria-busy', 'true');
  map.classList.add('banana-enhanced');

  function reveal(key, token) {
    if (token !== selectionToken) return;
    topics.forEach(function (topic) { topic.hidden = topic.dataset.bananaGroup !== key; });
    opening.hidden = true;
    prompt.hidden = !!key;
    reader.setAttribute('aria-busy', 'false');
    map.classList.toggle('has-selection', !!key);
    buttons.forEach(function (button) {
      button.setAttribute('aria-expanded', String(button.dataset.bananaTheme === key));
    });
    var topic = topics.find(function (item) { return item.dataset.bananaGroup === key; });
    status.textContent = topic ? topic.querySelector('h4').textContent.trim() : '';
    highlightConnections();
  }

  function choose(key) {
    var token = ++selectionToken;
    selected = key;
    highlightConnections();
    buttons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.bananaTheme === key));
      button.setAttribute('aria-expanded', 'false');
    });
    topics.forEach(function (topic) { topic.hidden = true; });
    prompt.hidden = true;
    opening.hidden = false;
    reader.setAttribute('aria-busy', 'true');
    map.classList.add('has-selection');
    if (failed) reveal(key, token);
    else if (ready) animateChoice(keys.indexOf(key), function () { reveal(key, token); });
    else pending = { key: key, token: token };
  }

  buttons.forEach(function (button, index) {
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', function () { choose(button.dataset.bananaTheme); });
    button.addEventListener('keydown', function (event) {
      var next = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + buttons.length - 1) % buttons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else return;
      event.preventDefault();
      buttons[next].focus();
      choose(buttons[next].dataset.bananaTheme);
    });
  });
  map.querySelector('[data-banana-reset]').addEventListener('click', function () {
    ++selectionToken;
    selected = null;
    pending = null;
    buttons.forEach(function (button) {
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-expanded', 'false');
    });
    reveal(null, selectionToken);
    if (resetFruit) resetFruit();
  });

  function useFallback() {
    failed = true;
    ready = false;
    loading.hidden = true;
    fallback.hidden = false;
    host.setAttribute('aria-busy', 'false');
    map.classList.add('banana-fallback');
    connections.setAttribute('hidden', '');
    if (selected) reveal(selected, selectionToken);
    pending = null;
  }

  import(new URL('vendor/three.module.js', scriptURL).href).then(function (THREE) {
    if (failed) return;
    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    var canvas = renderer.domElement;
    canvas.className = 'hp-banana-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('tabindex', '0');
    canvas.setAttribute('aria-label', canvasLabel);
    host.prepend(canvas);

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-2.7, 2.7, 2.7, -2.7, .1, 30);
    camera.position.set(.1, .55, 8);
    camera.lookAt(0, -.08, 0);
    scene.add(new THREE.HemisphereLight(0xfffaf0, 0xa08455, 2.65));
    var keyLight = new THREE.DirectionalLight(0xfff7df, 3.3);
    keyLight.position.set(-3, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.camera.right = keyLight.shadow.camera.top = 4;
    keyLight.shadow.normalBias = .035;
    keyLight.shadow.bias = -.0002;
    scene.add(keyLight);
    var rim = new THREE.DirectionalLight(0xffead0, 1.8);
    rim.position.set(3, 2, -4);
    scene.add(rim);
    var fruit = new THREE.Group();
    fruit.rotation.set(.04, -Math.PI / 2, -.13);
    fruit.scale.y = .78;
    scene.add(fruit);

    function centre(t) {
      return new THREE.Vector3(-.3 + .9 * Math.sin(Math.PI * t), (t - .5) * 3.35, .06 * Math.sin(Math.PI * t));
    }
    function radius(t) { return .065 + .27 * Math.pow(Math.max(0, Math.sin(Math.PI * t)), .68); }
    function frame(t) {
      var tangent = new THREE.Vector3(.9 * Math.PI * Math.cos(Math.PI * t), 3.35, .06 * Math.PI * Math.cos(Math.PI * t)).normalize();
      var side = new THREE.Vector3(tangent.y, -tangent.x, 0).normalize();
      return { side: side, front: new THREE.Vector3().crossVectors(side, tangent).normalize() };
    }

    var bodyPositions = [], bodyIndices = [], rows = 64, rings = 32;
    for (var row = 0; row <= rows; row++) {
      var t = row / rows, f = frame(t), c = centre(t);
      for (var col = 0; col <= rings; col++) {
        var a = col / rings * Math.PI * 2;
        var r = radius(t) * .94 * (1 + .018 * Math.cos(4 * a));
        var point = c.clone().addScaledVector(f.side, Math.cos(a) * r).addScaledVector(f.front, Math.sin(a) * r);
        bodyPositions.push(point.x, point.y, point.z);
        if (row < rows && col < rings) {
          var index = row * (rings + 1) + col, next = index + rings + 1;
          bodyIndices.push(index, next, index + 1, next, next + 1, index + 1);
        }
      }
    }
    for (var end = 0; end < 2; end++) {
      var pole = bodyPositions.length / 3, tip = centre(end);
      bodyPositions.push(tip.x, tip.y, tip.z);
      for (var cap = 0; cap < rings; cap++) {
        var edge = end * rows * (rings + 1) + cap;
        if (end) bodyIndices.push(pole, edge + 1, edge);
        else bodyIndices.push(pole, edge, edge + 1);
      }
    }
    var bodyGeometry = new THREE.BufferGeometry();
    bodyGeometry.setAttribute('position', new THREE.Float32BufferAttribute(bodyPositions, 3));
    bodyGeometry.setIndex(bodyIndices);
    bodyGeometry.computeVertexNormals();
    var body = new THREE.Mesh(bodyGeometry, new THREE.MeshStandardMaterial({ color: 0xffedbf, roughness: .91 }));
    body.castShadow = body.receiveShadow = true;
    fruit.add(body);

    var peelMeshes = [], progress = [0, 0, 0, 0], desired = [0, 0, 0, 0], peelRows = 56, peelCols = 10;
    var layerSize = (peelRows + 1) * (peelCols + 1);
    var skinMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .82, side: THREE.DoubleSide });
    var insideMaterial = new THREE.MeshStandardMaterial({ color: 0xffebaa, roughness: .95, side: THREE.DoubleSide });
    keys.forEach(function (key, peelIndex) {
      var theta = Math.PI / 4 + peelIndex * Math.PI / 2;
      var geometry = new THREE.BufferGeometry();
      var positions = new Float32Array(layerSize * 2 * 3);
      var colors = new Float32Array(positions.length);
      var indices = [];
      for (var layer = 0; layer < 2; layer++) {
        var start = indices.length;
        for (var i = 0; i <= peelRows; i++) {
          for (var j = 0; j <= peelCols; j++) {
            var v = layer * layerSize + i * (peelCols + 1) + j;
            var color = new THREE.Color(0xf1c449);
            color.lerp(new THREE.Color(0xba7b26), .32 * Math.pow(Math.abs(j / peelCols * 2 - 1), 7));
            color.lerp(new THREE.Color(0xc49332), .4 * Math.pow(Math.abs(i / peelRows * 2 - 1), 6));
            color.toArray(colors, v * 3);
            if (i < peelRows && j < peelCols) {
              var below = v + peelCols + 1;
              if (layer) indices.push(v, v + 1, below, below, v + 1, below + 1);
              else indices.push(v, below, v + 1, below, below + 1, v + 1);
            }
          }
        }
        geometry.addGroup(start, indices.length - start, layer);
      }
      var edgeStart = indices.length;
      function closeEdge(a, b) {
        indices.push(a, b, a + layerSize, b, b + layerSize, a + layerSize);
      }
      for (var k = 0; k < peelRows; k++) {
        closeEdge(k * (peelCols + 1), (k + 1) * (peelCols + 1));
        closeEdge(k * (peelCols + 1) + peelCols, (k + 1) * (peelCols + 1) + peelCols);
      }
      for (var n = 0; n < peelCols; n++) {
        closeEdge(n, n + 1);
        closeEdge(peelRows * (peelCols + 1) + n, peelRows * (peelCols + 1) + n + 1);
      }
      geometry.addGroup(edgeStart, indices.length - edgeStart, 1);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setIndex(indices);
      var mesh = new THREE.Mesh(geometry, [skinMaterial, insideMaterial]);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.userData.theme = key;
      mesh.userData.theta = theta;
      fruit.add(mesh);
      peelMeshes.push(mesh);
    });

    function updatePeel(index, amount) {
      var mesh = peelMeshes[index], theta = mesh.userData.theta;
      var radial = new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta));
      var across = new THREE.Vector3(-Math.sin(theta), 0, Math.cos(theta));
      var attachT = .035, attachFrame = frame(attachT);
      var attachment = centre(attachT).addScaledVector(attachFrame.side, Math.cos(theta) * radius(attachT)).addScaledVector(attachFrame.front, Math.sin(theta) * radius(attachT));
      var positions = mesh.geometry.attributes.position.array;
      for (var i = 0; i <= peelRows; i++) {
        var s = i / peelRows, t = attachT + s * (1 - attachT), localFrame = frame(t);
        // Release the tip first, then carry the opening down to the attached base.
        // At amount 0 the skin is closed; at 1 the complete curled peel is visible.
        var releaseStart = .45 * (1 - s);
        var localAmount = THREE.MathUtils.smoothstep(amount, releaseStart, releaseStart + .55);
        var phi = 3.40 * s;
        var curled = attachment.clone().add(new THREE.Vector3(0, 3.48 / 3.40 * Math.sin(phi), 0)).addScaledVector(radial, 3.48 / 3.40 * (1 - Math.cos(phi)));
        var curledNormal = radial.clone().multiplyScalar(Math.cos(phi)).add(new THREE.Vector3(0, -Math.sin(phi), 0));
        for (var j = 0; j <= peelCols; j++) {
          var delta = (j / peelCols - .5) * (Math.PI / 2 - .018);
          var closedNormal = localFrame.side.clone().multiplyScalar(Math.cos(theta + delta)).addScaledVector(localFrame.front, Math.sin(theta + delta));
          var closed = centre(t).addScaledVector(closedNormal, radius(t));
          var opened = curled.clone().addScaledVector(across, Math.sin(delta) * radius(t)).addScaledVector(curledNormal, (Math.cos(delta) - 1) * radius(t));
          var point = closed.lerp(opened, localAmount);
          var normal = closedNormal.lerp(curledNormal, localAmount).normalize();
          for (var layer = 0; layer < 2; layer++) {
            var p = point.clone().addScaledVector(normal, layer ? -.014 : .014);
            var v = (layer * layerSize + i * (peelCols + 1) + j) * 3;
            positions[v] = p.x; positions[v + 1] = p.y; positions[v + 2] = p.z;
          }
        }
      }
      mesh.geometry.attributes.position.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingSphere();
    }
    progress.forEach(function (amount, index) { updatePeel(index, amount); });
    var stemStart = centre(1);
    var stemPath = new THREE.CatmullRomCurve3([stemStart, stemStart.clone().add(new THREE.Vector3(-.07, .14, 0)), stemStart.clone().add(new THREE.Vector3(-.04, .29, -.02))]);
    var stem = new THREE.Mesh(new THREE.TubeGeometry(stemPath, 12, .073, 10, false), new THREE.MeshStandardMaterial({ color: 0x7f6232, roughness: .94 }));
    stem.castShadow = true;
    fruit.add(stem);
    var bottom = new THREE.Mesh(new THREE.SphereGeometry(.075, 16, 12), new THREE.MeshStandardMaterial({ color: 0x795331, roughness: .94 }));
    bottom.position.copy(centre(0));
    bottom.scale.set(1, 1.35, .85);
    fruit.add(bottom);

    var animation = null, frameHandle = 0, inView = true;
    host.dataset.peelState = 'closed';
    function schedule() {
      if (!frameHandle && !failed && (inView || animation)) frameHandle = requestAnimationFrame(draw);
    }
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function draw(time) {
      frameHandle = 0;
      if (failed) return;
      var complete = null;
      if (animation) {
        var fraction = Math.min(1, (time - animation.start) / animation.duration);
        var e = ease(Math.max(0, fraction));
        for (var i = 0; i < progress.length; i++) {
          var value = THREE.MathUtils.lerp(animation.from[i], animation.to[i], e);
          if (Math.abs(value - progress[i]) > .00001 || fraction === 1) updatePeel(i, value);
          progress[i] = value;
        }
        fruit.rotation.y = THREE.MathUtils.lerp(animation.fromYaw, animation.toYaw, e);
        fruit.rotation.x = THREE.MathUtils.lerp(animation.fromPitch, .04, e);
        if (fraction === 1) {
          complete = animation.complete;
          animation = null;
          host.dataset.peelState = progress.some(function (value) { return value > .01; }) ? 'open' : 'closed';
        }
      }
      renderer.render(scene, camera);
      updateConnections();
      if (complete) {
        renderer.getContext().finish();
        requestAnimationFrame(complete);
      }
      if (animation) schedule();
    }
    function animate(to, targetYaw, complete, duration) {
      var yawDelta = Math.atan2(Math.sin(targetYaw - fruit.rotation.y), Math.cos(targetYaw - fruit.rotation.y));
      animation = {
        from: progress.slice(), to: to, fromYaw: fruit.rotation.y, toYaw: fruit.rotation.y + yawDelta,
        fromPitch: fruit.rotation.x, start: performance.now(), duration: motion.matches ? 1 : (duration || 1550), complete: complete
      };
      host.dataset.peelState = to.some(function (value, index) { return value > progress[index]; }) ? 'peeling' : 'closing';
      schedule();
    }
    animateChoice = function (index, complete) {
      var requestToken = selectionToken;
      var targetYaw = peelMeshes[index].userData.theta - Math.PI / 4;
      function peelOpen() {
        if (requestToken !== selectionToken) return;
        desired[index] = 1;
        animate(desired.slice(), targetYaw, complete);
      }
      // A previously opened theme replays its own peel, rather than only rotating.
      if (progress[index] > .5) {
        desired[index] = 0;
        animate(desired.slice(), targetYaw, peelOpen, 650);
      } else peelOpen();
    };
    resetFruit = function () {
      desired = [0, 0, 0, 0];
      animate(desired.slice(), -Math.PI / 2, null, 900);
    };
    var projectedAnchor = new THREE.Vector3();
    function updateConnections() {
      if (failed) return;
      var area = layout.getBoundingClientRect();
      var viewport = host.getBoundingClientRect();
      var labelArea = choices.getBoundingClientRect();
      var height = Math.max(viewport.bottom, labelArea.bottom) - area.top;
      connections.setAttribute('viewBox', '0 0 ' + area.width + ' ' + height);
      connections.setAttribute('width', area.width);
      connections.setAttribute('height', height);
      connections.removeAttribute('hidden');
      var stacked = labelArea.top >= viewport.bottom - 2;
      peelMeshes.forEach(function (mesh, index) {
        // An actual outer-surface vertex follows the peel animation and rotation.
        var anchorRow = Math.round(peelRows * .72);
        var vertex = anchorRow * (peelCols + 1) + Math.floor(peelCols / 2);
        projectedAnchor.fromBufferAttribute(mesh.geometry.attributes.position, vertex);
        mesh.localToWorld(projectedAnchor);
        projectedAnchor.project(camera);
        var x = viewport.left - area.left + (projectedAnchor.x + 1) * viewport.width / 2;
        var y = viewport.top - area.top + (1 - projectedAnchor.y) * viewport.height / 2;
        var target = buttons[index].getBoundingClientRect();
        var endY = target.top - area.top + target.height / 2;
        var path;
        if (stacked) {
          var left = target.left + target.width / 2 < area.left + area.width / 2;
          var endX = (left ? target.left : target.right) - area.left;
          var gutterX = left ? 8 + index * 2 : area.width - 8 - index * 2;
          var turnY = Math.min(viewport.bottom - area.top - 12, y + 48);
          path = 'M' + x + ' ' + y + ' Q' + gutterX + ' ' + y + ' ' + gutterX + ' ' + turnY +
            ' L' + gutterX + ' ' + endY + ' L' + endX + ' ' + endY;
        } else {
          var endX = target.left - area.left;
          var bridge = Math.max(x + 22, endX - 35);
          path = 'M' + x + ' ' + y + ' C' + bridge + ' ' + y + ' ' + (endX - 30) + ' ' + endY + ' ' + endX + ' ' + endY;
        }
        leaders[index].path.setAttribute('d', path);
        leaders[index].dot.setAttribute('cx', x);
        leaders[index].dot.setAttribute('cy', y);
      });
    }
    refreshConnections = schedule;
    new ResizeObserver(schedule).observe(choices);
    new ResizeObserver(schedule).observe(layout);
    function resize() {
      var width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
      var aspect = width / height, fullHeight = Math.max(5.15, 4.55 / aspect);
      camera.left = -fullHeight * aspect / 2; camera.right = fullHeight * aspect / 2;
      camera.top = fullHeight / 2; camera.bottom = -fullHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      schedule();
    }
    new ResizeObserver(resize).observe(host);
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (inView) schedule();
    }, { rootMargin: '200px' }).observe(host);
    resize();
    // The loader ends only after GPU completion and a browser paint opportunity.
    renderer.render(scene, camera);
    updateConnections();
    renderer.getContext().finish();
    requestAnimationFrame(function () {
      if (failed) return;
      loading.hidden = true;
      host.setAttribute('aria-busy', 'false');
      ready = true;
      if (pending) {
        var request = pending;
        pending = null;
        animateChoice(keys.indexOf(request.key), function () { reveal(request.key, request.token); });
      }
    });
    canvas.addEventListener('webglcontextlost', function (event) {
      event.preventDefault();
      cancelAnimationFrame(frameHandle);
      animation = null;
      useFallback();
    });

    var pointer = null, raycaster = new THREE.Raycaster();
    canvas.addEventListener('pointerdown', function (event) {
      if (animation || !ready || event.button !== 0) return;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moved: false };
      canvas.setPointerCapture(event.pointerId);
      canvas.classList.add('is-dragging');
    });
    canvas.addEventListener('pointermove', function (event) {
      if (!pointer || pointer.id !== event.pointerId) return;
      if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 4) pointer.moved = true;
      fruit.rotation.y += (event.clientX - pointer.x) * .009;
      fruit.rotation.x = THREE.MathUtils.clamp(fruit.rotation.x + (event.clientY - pointer.y) * .004, -.34, .34);
      pointer.x = event.clientX; pointer.y = event.clientY;
      schedule();
    });
    canvas.addEventListener('pointerup', function (event) {
      if (!pointer || pointer.id !== event.pointerId) return;
      if (!pointer.moved) {
        var rect = canvas.getBoundingClientRect();
        raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2), camera);
        var hits = raycaster.intersectObjects(peelMeshes);
        if (hits.length) choose(hits[0].object.userData.theme);
      }
      pointer = null;
      canvas.classList.remove('is-dragging');
    });
    canvas.addEventListener('pointercancel', function () { pointer = null; canvas.classList.remove('is-dragging'); });
    canvas.addEventListener('keydown', function (event) {
      if (animation) return;
      if (event.key === 'ArrowLeft') fruit.rotation.y -= .18;
      else if (event.key === 'ArrowRight') fruit.rotation.y += .18;
      else if (event.key === 'ArrowUp') fruit.rotation.x = Math.max(-.34, fruit.rotation.x - .08);
      else if (event.key === 'ArrowDown') fruit.rotation.x = Math.min(.34, fruit.rotation.x + .08);
      else return;
      event.preventDefault();
      schedule();
    });
    document.addEventListener('aerosense:languagechange', function () {
      requestAnimationFrame(function () {
        canvas.setAttribute('aria-label', host.getAttribute('aria-label'));
        if (selected && !opening.hidden) return;
        if (selected) reveal(selected, selectionToken);
      });
    });
  }).catch(function (error) {
    console.warn('The 3D stakeholder map is unavailable; theme content remains accessible.', error);
    useFallback();
  });
}());
