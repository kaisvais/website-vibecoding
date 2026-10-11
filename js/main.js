/* =========================================================
   KAI Agency — анимации
   GSAP + ScrollTrigger + Lenis
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'expo.out', duration: 1.2 });

  /* ---------------- Утилиты ---------------- */

  // Разбивает текст на слова, сохраняя вложенные теги и неразрывные пробелы
  function splitWords(el, cls = 'w', innerCls = 'wi') {
    if (el.dataset.split) return $$('.' + (innerCls || cls), el);
    el.dataset.split = '1';
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/([ \t\n\r]+)/).forEach((part) => {
            if (!part) return;
            if (/^[ \t\n\r]+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = cls;
            if (innerCls) {
              const wi = document.createElement('span');
              wi.className = innerCls;
              wi.textContent = part;
              w.appendChild(wi);
            } else {
              w.textContent = part;
            }
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    };
    walk(el);
    return $$('.' + (innerCls || cls), el);
  }

  // Эффект «дешифровки» текста
  const GLYPHS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ0123456789#%&/';
  function scramble(el, duration = 1.1) {
    const final = el.dataset.final || el.textContent;
    el.dataset.final = final;
    const o = { p: 0 };
    return gsap.to(o, {
      p: 1, duration, ease: 'none',
      onUpdate() {
        const n = Math.floor(o.p * final.length);
        let out = final.slice(0, n);
        for (let i = n; i < final.length; i++) {
          const ch = final[i];
          out += /[\s()—·]/.test(ch) ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        el.textContent = out;
      },
      onComplete() { el.textContent = final; },
    });
  }

  // Счётчик
  const fmt = (v) => Math.round(v).toLocaleString('ru-RU');
  function countUp(el, duration = 2) {
    const to = parseFloat(el.dataset.to || 0);
    const from = parseFloat(el.dataset.from || 0);
    const o = { v: from };
    el.textContent = fmt(from);
    return gsap.to(o, { v: to, duration, ease: 'power3.out', onUpdate: () => (el.textContent = fmt(o.v)) });
  }

  /* ---------------- Reduced motion: всё сразу ---------------- */
  if (reduce) {
    document.body.classList.remove('is-loading');
    $('.loader').remove();
    $$('.count').forEach((el) => (el.textContent = fmt(parseFloat(el.dataset.to || 0))));
    $$('.verdict__text').forEach((el) => (el.style.color = 'inherit'));
    initForm();
    return;
  }

  /* ---------------- Плавный скролл ---------------- */
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.6, offset: id === '#top' ? 0 : -20 });
    });
  });

  /* ---------------- Прелоадер ---------------- */
  const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r)));
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const loaderNum = $('.loader__num');
  const lp = { v: 0 };
  const setNum = () => (loaderNum.textContent = Math.round(lp.v));

  gsap.set('.loader__dot', { scale: 0, transformOrigin: '50% 50%' });
  const preTl = gsap.timeline();
  preTl
    .to('.loader__ring', { strokeDashoffset: 18, duration: 1.4, ease: 'power2.inOut' }, 0)
    .to(lp, { v: 82, duration: 1.4, ease: 'power2.inOut', onUpdate: setNum }, 0);

  Promise.all([loaded, fontsReady, new Promise((r) => setTimeout(r, 1300))]).then(() => {
    gsap.timeline({ onComplete: startSite })
      .to(lp, { v: 100, duration: 0.5, ease: 'power2.out', onUpdate: setNum })
      .to('.loader__ring', { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, '<')
      .to('.loader__dot', { scale: 1, duration: 0.6, ease: 'back.out(4)' }, '-=.2')
      .to('.loader__mark', { rotation: 360, duration: 0.9, ease: 'expo.inOut' }, '-=.1')
      .to('.loader__inner', { opacity: 0, scale: 0.9, duration: 0.5, ease: 'power2.in' }, '-=.25')
      .to('.loader__panel--a', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '-=.1')
      .to('.loader__panel--b', { yPercent: 100, duration: 1.1, ease: 'expo.inOut' }, '<');
  });

  /* ---------------- Стартовые состояния героя ---------------- */
  const heroTitleWords = splitWords($('.hero__title'));
  const heroPromiseWords = splitWords($('.hero__promise'));
  gsap.set('.hero__word span', { yPercent: 110, opacity: 0 });
  gsap.set('.hero__card', { rotationX: 34, y: 240, scale: 0.84, opacity: 0, transformPerspective: 1600 });
  gsap.set([heroTitleWords, heroPromiseWords], { yPercent: 115 });
  gsap.set('.hero__person', { yPercent: 16, opacity: 0, scale: 1.06 });
  gsap.set('.chip', { scale: 0, opacity: 0 });
  gsap.set('.hero .fade-up', { y: 30, opacity: 0 });
  gsap.set('.hero__meta .tag', { y: -20, opacity: 0 });
  gsap.set('.hero__eyebrow', { opacity: 0, x: -20 });
  gsap.set('.bento', { y: 80, opacity: 0 });
  gsap.set('.header', { yPercent: -160 });

  function startSite() {
    $('.loader').remove();
    document.body.classList.remove('is-loading');
    lenis.start();
    heroIntro();
    initScroll();
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }

  /* =========================================================
     1. HERO — 3D-выезд карточки, вордмарк, параллакс мышью
     ========================================================= */
  function heroIntro() {
    const mark = $('.hero__promise mark');
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('.hero__word span', { yPercent: 0, opacity: 1, duration: 1.6, stagger: 0.09 }, 0)
      .to('.header', { yPercent: 0, duration: 1.2 }, 0.2)
      .to('.hero__meta .tag', { y: 0, opacity: 1, stagger: 0.1, duration: 1 }, 0.3)
      .to('.hero__card', { rotationX: 0, y: 0, scale: 1, opacity: 1, duration: 1.9 }, 0.35)
      .to('.hero__eyebrow', { opacity: 1, x: 0, duration: 1 }, 0.9)
      .to(heroTitleWords, { yPercent: 0, duration: 1.2, stagger: 0.05 }, 0.95)
      .to(heroPromiseWords, { yPercent: 0, duration: 1, stagger: 0.03 }, 1.25)
      .fromTo(mark, { '--mark': 0 }, { '--mark': 1, duration: 0.9, ease: 'power3.inOut' }, 1.75)
      .to('.hero__person', { yPercent: 0, opacity: 1, scale: 1, duration: 1.8 }, 0.9)
      .to('.hero .fade-up', { y: 0, opacity: 1, stagger: 0.12, duration: 1 }, 1.5)
      .to('.chip', { scale: 1, opacity: 1, stagger: 0.18, duration: 0.9, ease: 'back.out(2.2)' }, 1.7)
      .fromTo('.hero__card-shine', { backgroundPosition: '120% 0' }, { backgroundPosition: '-60% 0', duration: 1.8, ease: 'power2.inOut' }, 1.6)
      .to('.bento', { y: 0, opacity: 1, stagger: 0.1, duration: 1.3 }, 1.4)
      .add(() => {
        $$('.hero .count').forEach((el) => countUp(el, 2.2));
        gsap.to('.bento__track span', { scaleX: 1, duration: 2.2, ease: 'power3.inOut' });
        gsap.to('.bento__ring-fill', { strokeDashoffset: 0, duration: 2.2, ease: 'power3.inOut' });
        // живые бары
        $$('.bento__bars i').forEach((b, i) => {
          gsap.to(b, { height: () => 20 + Math.random() * 80 + '%', backgroundColor: i % 4 === 0 ? '#7FE0D8' : 'rgba(127,224,216,.3)', duration: 0.8, repeat: -1, repeatRefresh: true, yoyo: true, ease: 'sine.inOut', delay: i * 0.05 });
        });
      }, 1.8);

    // парение чипов
    $$('.chip').forEach((c, i) => {
      gsap.to(c, { y: i % 2 ? 10 : -10, duration: 2.2 + i * 0.4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 2.6 });
    });

    // параллакс мышью
    if (fine) {
      const hero = $('.hero');
      const qs = [
        [gsap.quickTo('.hero__word', 'x', { duration: 1.4, ease: 'power3' }), -14],
        [gsap.quickTo('.hero__visual', 'x', { duration: 1.2, ease: 'power3' }), 18],
        [gsap.quickTo('.hero__visual', 'y', { duration: 1.2, ease: 'power3' }), 12],
        [gsap.quickTo('.hero__card', 'rotationY', { duration: 1.4, ease: 'power3' }), 3],
      ];
      const chipQ = $$('.chip').map((c, i) => [gsap.quickTo(c, 'x', { duration: 1, ease: 'power3' }), 16 + i * 10]);
      hero.addEventListener('mousemove', (e) => {
        const nx = e.clientX / innerWidth - 0.5;
        const ny = e.clientY / innerHeight - 0.5;
        qs[0][0](nx * qs[0][1]);
        qs[1][0](nx * qs[1][1]);
        qs[2][0](ny * qs[2][1]);
        qs[3][0](nx * qs[3][1]);
        chipQ.forEach(([q, f]) => q(nx * f));
      });
    }
  }

  /* =========================================================
     Всё, что завязано на скролл
     ========================================================= */
  function initScroll() {
    const mm = gsap.matchMedia();

    /* ---------- общие появления ---------- */
    $$('.split-lines').forEach((el) => {
      if (el.closest('.hero')) return;
      const words = splitWords(el);
      gsap.fromTo(words, { yPercent: 115, rotation: 3 }, {
        yPercent: 0, rotation: 0, duration: 1.3, stagger: 0.045,
        scrollTrigger: { trigger: el, start: 'top 85%' },
      });
    });
    $$('.fade-up').forEach((el) => {
      if (el.closest('.hero')) return;
      gsap.from(el, { y: 36, opacity: 0, duration: 1.2, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    $$('.scramble').forEach((el) => {
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => scramble(el) });
    });
    $$('.count').forEach((el) => {
      if (el.closest('.hero') || el.closest('.case')) return;
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => countUp(el, 1.8) });
    });

    /* ---------- HERO при скролле ---------- */
    gsap.to('.hero__word', { yPercent: 35, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__stage', { y: -80, scale: 0.94, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__person', { y: -50, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    /* =========================================================
       2. БОЛИ — хаос уведомлений, закреплённая сцена
       ========================================================= */
    const pains = $$('.pain');
    const unread = $('.pains__unread');
    mm.add('(min-width: 861px)', () => {
      const start = [
        { x: 420, y: -160, rotation: 24 },
        { x: -460, y: 120, rotation: -30 },
        { x: 380, y: 260, rotation: 18 },
        { x: -400, y: -60, rotation: -22 },
        { x: 300, y: 340, rotation: 30 },
      ];
      const rest = [-3, 2.5, -1.5, 3, -2];
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.pains__pin', start: 'top top', end: '+=220%', pin: true, scrub: 1, refreshPriority: 2,
          onUpdate: (s) => (unread.textContent = Math.round(s.progress * 47)),
        },
      });
      pains.forEach((p, i) => {
        tl.fromTo(p, { ...start[i], opacity: 0, scale: 0.8 }, { x: 0, y: 0, rotation: rest[i], opacity: 1, scale: 1, duration: 1, ease: 'power3.out' }, i * 0.7);
        // предыдущие карточки «уходят вглубь»
        if (i > 0) tl.to(pains.slice(0, i), { scale: '-=0.02', filter: 'brightness(.94)', duration: 0.6, ease: 'none' }, i * 0.7);
      });
      tl.to('.pains__photo img', { yPercent: -18, ease: 'none', duration: tl.duration() }, 0);
      tl.to(pains, { y: (i) => -i * 6, rotation: 0, duration: 0.8, ease: 'power2.inOut', stagger: 0.04 }, '+=0.2');
      // мелкая тряска «звонящих» уведомлений
      pains.forEach((p, i) => gsap.to(p.querySelector('.pain__app'), { rotation: 12, duration: 0.08, repeat: 5, yoyo: true, repeatDelay: 0, delay: 1 + i, ease: 'none', scrollTrigger: { trigger: '.pains', start: 'top 40%' } }));
    });
    mm.add('(max-width: 860px)', () => {
      pains.forEach((p) => gsap.from(p, { y: 50, opacity: 0, rotation: 3, duration: 1, scrollTrigger: { trigger: p, start: 'top 90%' } }));
      ScrollTrigger.create({ trigger: '.pains__photo', start: 'top 80%', once: true, onEnter: () => { unread.dataset.to = 47; countUp(unread, 2); } });
    });

    // Вывод: слова проявляются по мере скролла
    const verdict = $('.verdict__text');
    const vWords = splitWords(verdict, 'vw', null);
    gsap.to(vWords, {
      color: (i, el) => (el.closest('.verdict__accent') ? '#D97757' : '#111110'),
      stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: verdict, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });

    /* =========================================================
       3. УСЛУГИ — карты «сдаются» в 3D, у каждой — живая микросцена
       ========================================================= */
    const svcs = $$('.svc');
    gsap.set(svcs, { transformPerspective: 1200, transformOrigin: '50% 100%' });
    gsap.from(svcs, {
      rotationX: -75, y: 140, opacity: 0, duration: 1.5, stagger: 0.12,
      scrollTrigger: { trigger: '.svc-grid', start: 'top 82%' },
      onComplete: () => svcs.forEach((s) => (s.dataset.ready = '1')),
    });

    // наклон и прожектор
    if (fine) {
      svcs.forEach((card) => {
        const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3' });
        const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3' });
        card.addEventListener('mousemove', (e) => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          card.style.setProperty('--mx', px * 100 + '%');
          card.style.setProperty('--my', py * 100 + '%');
          if (!card.dataset.ready) return;
          ry((px - 0.5) * 8);
          rx(-(py - 0.5) * 8);
        });
        card.addEventListener('mouseleave', () => { if (card.dataset.ready) { rx(0); ry(0); } });
      });
    }

    // парящие 3D-иконки
    $$('.svc__icon').forEach((ic, i) => gsap.to(ic, { y: -16, rotation: i % 2 ? 4 : -4, duration: 3 + i * 0.3, repeat: -1, yoyo: true, ease: 'sine.inOut' }));

    // чат-бот: сообщения по очереди
    const chatMsgs = $$('.chat__msg');
    const typing = $('.chat__typing');
    const chatTl = gsap.timeline({ repeat: -1, repeatDelay: 1.6, paused: true });
    chatMsgs.forEach((m, i) => {
      if (m.classList.contains('chat__msg--out')) {
        chatTl.to(typing, { opacity: 1, duration: 0.25 }, '+=0.3').to(typing, { opacity: 0, duration: 0.2 }, '+=0.9');
      }
      chatTl.to(m, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.8)' }, i === 0 ? 0.3 : '+=0.15');
    });
    chatTl.to(chatMsgs, { opacity: 0, y: -10, duration: 0.4, stagger: 0.05, ease: 'power2.in' }, '+=2.2')
      .set(chatMsgs, { y: 12, scale: 0.96 });

    // интеграции: импульсы бегут по линиям
    const flowTl = gsap.timeline({ repeat: -1, paused: true });
    $$('.flow__pulse').forEach((p, i) => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: `26 ${len}`, strokeDashoffset: 26 });
      flowTl.to(p, { strokeDashoffset: -len, duration: 2.2, ease: 'power1.inOut' }, i * 1.1);
    });
    flowTl.from('.flow__node', { scale: 0.92, transformOrigin: 'center', duration: 0.4, stagger: 0.15, ease: 'back.out(3)' }, 0);

    // дашборд: столбики растут и «дышат»
    const bars = $$('.dash__bars i');
    const dashTl = gsap.timeline({ paused: true });
    dashTl.to(bars, { scaleY: 1, duration: 1, stagger: 0.07, ease: 'back.out(1.6)' })
      .add(() => bars.forEach((b, i) => gsap.to(b, { scaleY: () => 0.5 + Math.random() * 0.5, duration: 1.4, repeat: -1, yoyo: true, repeatRefresh: true, ease: 'sine.inOut', delay: i * 0.1 })));

    // отчёт: линия рисуется, приходит уведомление
    const line = $('.report__line');
    const lineLen = line.getTotalLength();
    gsap.set(line, { strokeDasharray: lineLen, strokeDashoffset: lineLen });
    gsap.set('.report__toast', { y: 10 });
    const repTl = gsap.timeline({ repeat: -1, repeatDelay: 1.5, paused: true });
    repTl.to(line, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut' })
      .to('.report__area', { opacity: 1, duration: 0.8 }, '-=0.6')
      .fromTo('.report__dot', { opacity: 0, scale: 0, transformOrigin: 'center' }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(3)' }, '-=0.3')
      .to('.report__toast', { opacity: 1, y: 0, duration: 0.6, ease: 'back.out(2)' }, '+=0.2')
      .to(['.report__toast', '.report__area', '.report__dot'], { opacity: 0, duration: 0.4 }, '+=2.2')
      .to(line, { strokeDashoffset: -lineLen, duration: 0.6, ease: 'power2.in' }, '<')
      .set(line, { strokeDashoffset: lineLen })
      .set('.report__toast', { y: 10 });

    // форма → CRM
    const typed = $('.lead-form__typed');
    const typedText = typed.dataset.text;
    const tObj = { n: 0 };
    const formTl = gsap.timeline({ repeat: -1, repeatDelay: 1.4, paused: true });
    formTl.set(tObj, { n: 0 })
      .to(tObj, { n: typedText.length, duration: 1.6, ease: 'none', onUpdate: () => (typed.textContent = typedText.slice(0, Math.round(tObj.n))) })
      .to('.lead-form__btn', { scale: 0.94, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.inOut' }, '+=0.3')
      .to('.lead-form__btn', { backgroundColor: '#111110', duration: 0.3 }, '<')
      .to('.lead-form__crm', { opacity: 1, y: 0, duration: 0.6, ease: 'back.out(2)' })
      .to('.lead-form__crm', { opacity: 0, y: 10, duration: 0.4 }, '+=2')
      .to('.lead-form__btn', { backgroundColor: '#D97757', duration: 0.3 }, '<')
      .add(() => (typed.textContent = ''));

    [[chatTl, '.svc--wide'], [flowTl, '.svc--aqua'], [repTl, '.svc--dark'], [formTl, '.lead-form']].forEach(([tl, trg]) => {
      ScrollTrigger.create({ trigger: trg, start: 'top 85%', end: 'bottom top', onToggle: (s) => (s.isActive ? tl.play() : tl.pause()) });
    });
    ScrollTrigger.create({ trigger: '.dash', start: 'top 85%', once: true, onEnter: () => dashTl.play() });

    /* =========================================================
       4. ПОЧЕМУ МЫ — горизонтальная лента
       ========================================================= */
    mm.add('(min-width: 861px)', () => {
      const track = $('.why__track');
      const dist = () => track.scrollWidth - innerWidth;
      const tween = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '.why__pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, refreshPriority: 1,
          onUpdate: (s) => {
            gsap.set('.why__bar i', { scaleX: s.progress });
            $('.why__current').textContent = String(Math.min(5, Math.floor(s.progress * 5) + 1)).padStart(2, '0');
          },
        },
      });
      gsap.to('.why__photo img', { xPercent: -20, ease: 'none', scrollTrigger: { trigger: '.why__photo', containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      $$('.why-card').forEach((card) => {
        gsap.from(card.querySelector('.why-card__n'), { yPercent: 60, opacity: 0, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 95%', end: 'left 55%', scrub: true } });
        gsap.from(card, { rotation: 4, y: 40, transformOrigin: '0% 100%', ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'left 60%', scrub: true } });
      });
      const introH = $('.why__intro .h2');
      const w = splitWords(introH);
      gsap.fromTo(w, { yPercent: 115 }, { yPercent: 0, stagger: 0.04, duration: 1.3, scrollTrigger: { trigger: '.why', start: 'top 70%' } });
    });
    mm.add('(max-width: 860px)', () => {
      $$('.why-card, .why__photo').forEach((c) => gsap.from(c, { y: 60, opacity: 0, duration: 1, scrollTrigger: { trigger: c, start: 'top 90%' } }));
    });

    /* =========================================================
       5. КОМУ ПОДХОДИМ — орбиты
       ========================================================= */
    const rings = $$('.orbit__ring');
    const dur = [36, 54, 80];
    rings.forEach((r, i) => {
      const dir = i % 2 ? -1 : 1;
      gsap.to(r, { rotation: 360 * dir, duration: dur[i], repeat: -1, ease: 'none' });
      gsap.to(r.querySelectorAll('.orbit__sat'), { rotation: -360 * dir, duration: dur[i], repeat: -1, ease: 'none' });
    });
    const orbitTl = gsap.timeline({ scrollTrigger: { trigger: '.orbit', start: 'top 75%' } });
    orbitTl.from('.orbit__core', { scale: 0, rotation: -200, duration: 1.4, ease: 'back.out(1.6)' })
      .from(rings, { scale: 0.2, opacity: 0, duration: 1.6, stagger: 0.15 }, 0.1)
      .from('.orbit__sat img', { scale: 0, duration: 0.8, stagger: 0.08, ease: 'back.out(2.5)' }, 0.6)
      .from('.orbit__caption', { opacity: 0, y: 20, duration: 1 }, 1);
    gsap.fromTo('.orbit', { rotation: -25 }, { rotation: 25, ease: 'none', scrollTrigger: { trigger: '.fit', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.orbit__glow', { scale: 1.15, opacity: 0.7, duration: 2.4, repeat: -1, yoyo: true, ease: 'sine.inOut' });

    const yesTl = gsap.timeline({ scrollTrigger: { trigger: '.yes', start: 'top 80%' } });
    $$('.yes li').forEach((li, i) => {
      yesTl.from(li, { x: 80, opacity: 0, duration: 1.1 }, i * 0.18)
        .to(li.querySelector('.yes__ic path'), { strokeDashoffset: 0, duration: 0.6, ease: 'power2.out' }, i * 0.18 + 0.5)
        .from(li.querySelector('.yes__ic'), { scale: 0, rotation: -90, duration: 0.8, ease: 'back.out(3)' }, i * 0.18 + 0.3);
    });
    const noTl = gsap.timeline({ scrollTrigger: { trigger: '.no', start: 'top 80%' } });
    noTl.from('.no', { y: 60, opacity: 0, duration: 1.1 })
      .from('.no li', { opacity: 0, x: -20, stagger: 0.12, duration: 0.8 }, 0.3);
    $$('.no__text').forEach((t, i) => {
      noTl.to(t, { '--strike': 1, duration: 0.7, ease: 'power3.inOut' }, 1 + i * 0.25)
        .to(t, { color: 'rgba(255,255,255,.62)', duration: 0.5 }, '<0.3')
        .from(t.previousElementSibling, { rotation: -180, scale: 0.4, duration: 0.7, ease: 'back.out(2)' }, 1 + i * 0.25);
    });

    /* =========================================================
       6. ПРОЦЕСС — одометр + бегунок по линии
       ========================================================= */
    const steps = $$('.step');
    const reel = $('.odo__reel');
    const phase = $('.process__phase');
    const phases = ['Разбор · 30 минут', 'План и смета · 2 дня', 'Разработка · 2–4 недели', 'Запуск · 30 дней поддержки'];
    let current = -1;
    const setStep = (i) => {
      if (i === current) return;
      current = i;
      gsap.to(reel, { yPercent: -25 * i, duration: 1, ease: 'expo.out' });
      phase.dataset.final = phases[i];
      scramble(phase, 0.6);
      steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
      if (i === 2) {
        $$('.step__weeks i').forEach((w, k) => gsap.delayedCall(0.25 * k + 0.3, () => w.classList.add('on')));
      } else {
        $$('.step__weeks i').forEach((w) => w.classList.remove('on'));
      }
    };
    steps.forEach((s, i) => {
      ScrollTrigger.create({ trigger: s, start: 'top 62%', end: 'bottom 62%', onToggle: (self) => self.isActive && setStep(i) });
      gsap.from(s, { y: 70, opacity: 0, duration: 1.2, scrollTrigger: { trigger: s, start: 'top 92%' } });
    });
    gsap.to('.steps__fill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 62%', end: 'bottom 62%', scrub: 0.5 } });
    gsap.fromTo('.steps__runner', { top: '0%' }, { top: '100%', ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 62%', end: 'bottom 62%', scrub: 0.5 } });
    setStep(0);

    /* =========================================================
       7. КЕЙСЫ — стопка карточек
       ========================================================= */
    const cases = $$('.case');
    mm.add('(min-width: 861px)', () => {
      cases.forEach((c, i) => {
        c.style.top = 100 + i * 22 + 'px';
        if (i < cases.length - 1) {
          gsap.to(c, {
            scale: 0.92, filter: 'brightness(.7)', ease: 'none',
            scrollTrigger: { trigger: cases[i + 1], start: 'top 75%', end: () => 'top ' + (100 + (i + 1) * 22) + 'px', scrub: true },
          });
        }
      });
      return () => cases.forEach((c) => (c.style.top = ''));
    });
    cases.forEach((c) => {
      const img = c.querySelector('.case__media img');
      gsap.fromTo(c.querySelector('.case__media'), { clipPath: 'inset(0 100% 0 0 round 0px)' }, { clipPath: 'inset(0 0% 0 0 round 0px)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: c, start: 'top 75%' } });
      gsap.to(img, { scale: 1, ease: 'none', scrollTrigger: { trigger: c, start: 'top bottom', end: 'top 100px', scrub: true } });
      const tl = gsap.timeline({ scrollTrigger: { trigger: c, start: 'top 55%' } });
      tl.from(c.querySelectorAll('.case__body > *'), { y: 30, opacity: 0, stagger: 0.08, duration: 1 })
        .to(c.querySelector('.case__before s'), { '--strike': 1, duration: 0.7, ease: 'power3.inOut' }, 0.6)
        .add(() => countUp(c.querySelector('.count'), 1.8), 0.9)
        .from(c.querySelector('.case__arrow'), { x: -20, opacity: 0, duration: 0.8 }, 0.8);
    });

    /* =========================================================
       8. CTA — бегущая строка от скорости скролла, форма
       ========================================================= */
    const mq = gsap.to('.marquee__track', { xPercent: -50, duration: 22, ease: 'none', repeat: -1 });
    let dir = 1;
    lenis.on('scroll', ({ velocity }) => {
      if (Math.abs(velocity) < 0.1) return;
      dir = velocity > 0 ? 1 : -1;
      gsap.to(mq, { timeScale: dir * (1 + Math.min(Math.abs(velocity) * 0.35, 6)), duration: 0.3, overwrite: true });
      gsap.to(mq, { timeScale: dir, duration: 1.2, delay: 0.3, overwrite: false });
    });
    gsap.from('.marquee', { yPercent: 120, rotation: 0, scrollTrigger: { trigger: '.cta', start: 'top 85%' }, duration: 1.4 });

    gsap.fromTo('.cta__bg', { yPercent: -10, rotation: -4 }, { yPercent: 12, rotation: 4, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.fromTo('.cta__portrait img', { yPercent: -20 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.cta__portrait', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.cta__portrait', { clipPath: 'circle(0% at 50% 50%)', duration: 1.8, ease: 'expo.inOut', scrollTrigger: { trigger: '.cta__portrait', start: 'top 85%' } });
    gsap.from(['.form', '.form .field', '.form .btn', '.form__note'], { y: 50, opacity: 0, stagger: 0.08, duration: 1.2, scrollTrigger: { trigger: '.form', start: 'top 80%' } });
    gsap.fromTo('.footer__word span', { yPercent: 100 }, { yPercent: 0, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top 95%', end: 'bottom bottom', scrub: 1 } });

    if (fine) {
      const blob = $('.cta__blob');
      const bx = gsap.quickTo(blob, 'x', { duration: 1, ease: 'power3' });
      const by = gsap.quickTo(blob, 'y', { duration: 1, ease: 'power3' });
      $('.cta').addEventListener('mousemove', (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        bx(e.clientX - r.left);
        by(e.clientY - r.top);
      });
    }

    /* ---------- шапка, прогресс, навигация ---------- */
    gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    const header = $('.header');
    let lastY = 0;
    lenis.on('scroll', ({ scroll }) => {
      header.classList.toggle('is-hidden', scroll > 300 && scroll > lastY + 2);
      if (scroll < lastY - 2) header.classList.remove('is-hidden');
      lastY = scroll;
    });
    $$('[data-theme]').forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec, start: 'top 40px', end: 'bottom 40px', refreshPriority: -1,
        onToggle: (self) => self.isActive && header.classList.toggle('is-light', sec.dataset.theme === 'light'),
      });
    });

    // «пилюля» в навигации
    const nav = $('.nav');
    const pill = $('.nav__pill');
    const links = $$('.nav a');
    let activeLink = null;
    const movePill = (a) => {
      if (!a) { pill.style.opacity = 0; return; }
      pill.style.opacity = 1;
      pill.style.width = a.offsetWidth + 'px';
      pill.style.transform = `translateX(${a.offsetLeft}px)`;
    };
    links.forEach((a) => {
      a.addEventListener('mouseenter', () => movePill(a));
      const sec = $(a.getAttribute('href'));
      ScrollTrigger.create({
        trigger: sec, start: 'top 50%', end: 'bottom 50%', refreshPriority: -1,
        onToggle: (self) => {
          if (self.isActive) activeLink = a; else if (activeLink === a) activeLink = null;
          links.forEach((l) => l.classList.toggle('is-active', l === activeLink));
          movePill(activeLink);
        },
      });
    });
    nav.addEventListener('mouseleave', () => movePill(activeLink));

    initForm();
    initCursor();
    initMagnetic();

    // после загрузки шрифтов и картинок пересчитываем позиции
    addEventListener('load', () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); });
  }

  /* ---------------- Форма ---------------- */
  function initForm() {
    const form = $('.form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      $$('.field', form).forEach((f) => {
        const input = f.querySelector('input');
        const bad = !input.value.trim() || (input.type === 'tel' && input.value.replace(/\D/g, '').length < 10);
        f.classList.toggle('is-error', bad);
        if (bad) ok = false;
      });
      if (!ok) { setTimeout(() => $$('.field', form).forEach((f) => f.classList.remove('is-error')), 1200); return; }

      // TODO: отправить данные в CRM / Telegram
      const label = $('.btn__label', form);
      label.textContent = 'Отправляем…';
      if (reduce) { $('.form__success', form).style.cssText = 'opacity:1;visibility:visible'; return; }
      const tl = gsap.timeline({ delay: 0.6 });
      tl.set('.form__success', { visibility: 'visible' })
        .to('.form__success', { opacity: 1, duration: 0.5, ease: 'power2.out' })
        .to('.form__success circle', { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, '-=.2')
        .to('.form__success path', { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, '-=.2')
        .from('.form__success b, .form__success span', { y: 20, opacity: 0, stagger: 0.1, duration: 0.8 }, '-=.3')
        .add(() => burst(form), 0.9);
    });
  }

  // разлёт частиц при успешной отправке
  function burst(host) {
    const r = host.getBoundingClientRect();
    for (let i = 0; i < 26; i++) {
      const p = document.createElement('i');
      const size = 6 + Math.random() * 8;
      p.style.cssText = `position:fixed;z-index:95;pointer-events:none;width:${size}px;height:${size}px;border-radius:${Math.random() > 0.5 ? '50%' : '3px'};background:${i % 3 ? '#D97757' : '#7FE0D8'};left:${r.left + r.width / 2}px;top:${r.top + r.height / 2 - 40}px`;
      document.body.appendChild(p);
      const a = Math.random() * Math.PI * 2;
      const d = 120 + Math.random() * 220;
      gsap.to(p, { x: Math.cos(a) * d, y: Math.sin(a) * d - 60, rotation: Math.random() * 360, duration: 1.2 + Math.random() * 0.6, ease: 'expo.out' });
      gsap.to(p, { opacity: 0, y: '+=120', duration: 0.8, delay: 1, ease: 'power2.in', onComplete: () => p.remove() });
    }
  }

  /* ---------------- Курсор ---------------- */
  function initCursor() {
    if (!fine) return;
    const c = $('.cursor');
    const dot = $('.cursor__dot');
    const ring = $('.cursor__ring');
    const label = $('.cursor__label');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.1 }), dy = gsap.quickTo(dot, 'y', { duration: 0.1 });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
    addEventListener('mousemove', (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    document.addEventListener('mouseover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const hov = e.target.closest('a, button, input');
      c.classList.toggle('is-label', !!lab);
      c.classList.toggle('is-hover', !lab && !!hov);
      if (lab) label.textContent = lab.dataset.cursor;
    });
    document.addEventListener('mouseleave', () => gsap.to(c, { opacity: 0 }));
    document.addEventListener('mouseenter', () => gsap.to(c, { opacity: 1 }));
  }

  /* ---------------- Магнитные кнопки ---------------- */
  function initMagnetic() {
    if (!fine) return;
    $$('.magnetic').forEach((el) => {
      const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      const qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * 0.25);
        qy((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener('mouseleave', () => { gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .4)' }); });
    });
  }
})();
