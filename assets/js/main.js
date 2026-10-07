// Small, dependency-free UI behaviour for the static home page.

// Toggle elements: <button data-toggle="#target"> toggles .hidden on the target.
document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-toggle]');
    if (!trigger) return;

    const target = document.querySelector(trigger.dataset.toggle);
    if (!target) return;

    const open = target.classList.toggle('hidden') === false;
    trigger.setAttribute('aria-expanded', String(open));
});

// Close the mobile menu after tapping one of its links.
document.querySelectorAll('#mobile-menu a').forEach((link) => link.addEventListener('click', () => {
    document.getElementById('mobile-menu').classList.add('hidden');
    document.querySelector('[data-toggle="#mobile-menu"]')?.setAttribute('aria-expanded', 'false');
}));

// Demo only: forms have no backend yet.
document.querySelectorAll('[data-demo-form]').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    window.alert('এটি ডেমো সংস্করণ। সার্চ সুবিধা শীঘ্রই চালু হবে।');
}));

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Hero background slider (cross-fade). Pauses when the tab is hidden.
function initHeroSlider(root) {
    const slides = [...root.querySelectorAll('.hero-slide')];
    const dots = [...root.querySelectorAll('[data-slide-to]')];
    if (slides.length < 2) return;

    let current = 0;
    let timer = null;

    const show = (index) => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
        dots.forEach((dot, i) => {
            dot.classList.toggle('bg-white', i === current);
            dot.classList.toggle('bg-white/40', i !== current);
            dot.setAttribute('aria-current', i === current ? 'true' : 'false');
        });
    };

    const stop = () => timer && clearInterval(timer);
    const start = () => {
        if (prefersReducedMotion) return;
        stop();
        timer = setInterval(() => show(current + 1), 6000);
    };

    dots.forEach((dot) => dot.addEventListener('click', () => {
        show(Number(dot.dataset.slideTo));
        start();
    }));

    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
}

document.querySelectorAll('[data-hero-slider]').forEach(initHeroSlider);

// Count-up: <p data-count-to="123"> animates from 0 (in Bangla digits) when revealed.
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const toBangla = (n) => Math.round(n).toLocaleString('en-US').replace(/\d/g, (d) => BN_DIGITS[d]);

function countUp(el) {
    const target = Number(el.dataset.countTo) || 0;
    if (prefersReducedMotion || target === 0) return;

    const duration = 1400;
    const startTime = performance.now();
    const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = toBangla(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
    };
    el.textContent = toBangla(0);
    requestAnimationFrame(tick);
}

if ('IntersectionObserver' in window) {
    // Scroll reveal: <div data-reveal> fades in once it enters the viewport.
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.add('is-visible');
            el.querySelectorAll('[data-count-to]').forEach(countUp);
            // Drop the reveal styles once done so they don't interfere with hover transitions.
            el.addEventListener('transitionend', function done(e) {
                if (e.target !== el || e.propertyName !== 'opacity') return;
                el.removeAttribute('data-reveal');
                el.classList.remove('is-visible');
                el.removeEventListener('transitionend', done);
            });
            revealObserver.unobserve(el);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

    // Section titles animate in on their own once scrolled into view.
    const titleObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            titleObserver.unobserve(entry.target);
        });
    }, { threshold: 0.4 });

    document.querySelectorAll('[data-title-anim]').forEach((el) => titleObserver.observe(el));
}

// Footer year in Bangla digits.
document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear()).replace(/\d/g, (d) => BN_DIGITS[d]);
});
