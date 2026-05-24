/* ================================================
   PHARMD PORTFOLIO — main.js
   Interactions, animations, scroll effects
   ================================================ */

'use strict';

// ── Safe init wrapper ────────────────────────────
// Every init function is wrapped so one failure never kills the whole page.
function safeInit(name, fn) {
  try {
    fn();
  } catch (err) {
    console.warn('⚕ [' + name + '] init failed:', err);
  }
}

// ── Particle Background ──────────────────────────
function initParticles() {
  const container = document.getElementById('particleBg');
  if (!container) return;
  const count = 30;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    const xPos = Math.random() * 100;
    const duration = Math.random() * 20 + 15;
    const delay = Math.random() * 20;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${xPos}%;
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
    `;
    container.appendChild(p);
  }
}

// ── Navbar scroll effect ─────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });
}

// ── Hamburger / Mobile Nav ───────────────────────
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close on link click
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ── Active nav link on scroll ────────────────────
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link:not(.nav-link-cta)');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${entry.target.id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(s => observer.observe(s));
}

// ── Counter Animation ────────────────────────────
function animateCounters() {
  const counters = document.querySelectorAll('[data-target]');
  counters.forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    if (isNaN(target)) return;
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current) + (el.dataset.suffix || '+');
    }, 40);
  });
}

// ── Skill Bar Animation ──────────────────────────
function animateSkillBars() {
  const fills = document.querySelectorAll('.sb-fill');
  fills.forEach(fill => {
    const width = fill.dataset.width;
    if (!width) return;
    setTimeout(() => {
      fill.style.width = width + '%';
    }, 200);
  });
}

// ── Scroll Reveal (bulletproof) ──────────────────
function initScrollReveal() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  if (!elements.length) return;

  let countersDone = false;
  let skillsDone   = false;

  // Mark body as JS-ready so CSS can safely hide elements for reveal animation.
  // This is the KEY — without this class, CSS keeps everything visible.
  document.body.classList.add('js-ready');

  // Force-reveal safety net: if observer hasn't triggered within 500ms, show everything.
  const forceReveal = () => {
    elements.forEach(el => el.classList.add('visible'));
    if (!countersDone) { countersDone = true; animateCounters(); }
    if (!skillsDone) { skillsDone = true; animateSkillBars(); }
  };
  const safetyTimer = setTimeout(forceReveal, 500);

  // Check IntersectionObserver support
  if (typeof IntersectionObserver === 'undefined') {
    clearTimeout(safetyTimer);
    forceReveal();
    return;
  }

  try {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Stagger sibling reveals
          const parent = entry.target.parentElement;
          if (parent) {
            const siblings = [...parent.children];
            const i = siblings.indexOf(entry.target);
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, i * 80);
          } else {
            entry.target.classList.add('visible');
          }

          // Trigger counters when hero stats come into view
          if (!countersDone && entry.target.closest('#hero')) {
            countersDone = true;
            animateCounters();
          }

          // Trigger skill bars when skills section visible
          if (!skillsDone && entry.target.closest('#skills')) {
            skillsDone = true;
            setTimeout(animateSkillBars, 300);
          }

          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });

    elements.forEach(el => observer.observe(el));
  } catch (err) {
    console.warn('⚕ IntersectionObserver failed, using fallback reveal:', err);
    clearTimeout(safetyTimer);
    forceReveal();
  }
}

// ── Supabase Integration ──────────────────────────
let supabaseClient = null;
function initSupabase() {
  try {
    const config = window.SUPABASE_CONFIG;
    if (config && config.url && config.anonKey && window.supabase && window.supabase.createClient) {
      supabaseClient = window.supabase.createClient(config.url, config.anonKey);
      console.log('⚕ Supabase client initialized.');
    } else {
      console.log('⚕ Supabase not available. Using simulation fallback.');
    }
  } catch (err) {
    console.warn('⚕ Supabase initialization error:', err);
  }
}

// ── Contact Form ─────────────────────────────────
function initContactForm() {
  const form      = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  if (!form || !submitBtn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnText = submitBtn.querySelector('.btn-text');
    const btnIcon = submitBtn.querySelector('.btn-icon');
    if (!btnText || !btnIcon) return;

    const nameEl    = document.getElementById('contactName');
    const emailEl   = document.getElementById('contactEmail');
    const subjectEl = document.getElementById('contactSubject');
    const messageEl = document.getElementById('contactMessage');

    const formData = {
      name:    nameEl ? nameEl.value : '',
      email:   emailEl ? emailEl.value : '',
      subject: subjectEl ? subjectEl.value : '',
      message: messageEl ? messageEl.value : ''
    };

    // UI Feedback: sending state
    btnText.textContent = 'Sending…';
    btnIcon.textContent = '⏳';
    submitBtn.disabled = true;

    if (supabaseClient) {
      try {
        const { error } = await supabaseClient
          .from('contact_messages')
          .insert([formData]);

        if (error) throw error;

        // Success state
        btnText.textContent = 'Message Sent!';
        btnIcon.textContent = '✓';
        submitBtn.style.background = 'linear-gradient(135deg, #14b8a6, #0d9488)';
        form.reset();
      } catch (err) {
        console.error('⚕ Supabase insertion error:', err);
        btnText.textContent = 'Failed to Send';
        btnIcon.textContent = '❌';
        submitBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      } finally {
        setTimeout(() => {
          btnText.textContent = 'Send Message';
          btnIcon.textContent = '→';
          submitBtn.disabled = false;
          submitBtn.style.background = '';
        }, 3000);
      }
    } else {
      // Simulate sending (fallback mode)
      setTimeout(() => {
        btnText.textContent = 'Message Sent!';
        btnIcon.textContent = '✓';
        submitBtn.style.background = 'linear-gradient(135deg, #14b8a6, #0d9488)';

        setTimeout(() => {
          btnText.textContent = 'Send Message';
          btnIcon.textContent = '→';
          submitBtn.disabled = false;
          submitBtn.style.background = '';
          form.reset();
        }, 3000);
      }, 1200);
    }
  });
}

// ── Smooth scroll offset (account for fixed nav) ─
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

// ── Card tilt micro-interaction ──────────────────
function initCardTilt() {
  const cards = document.querySelectorAll('.glass-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect   = card.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2);
      const dy     = (e.clientY - cy) / (rect.height / 2);
      const tiltX  = dy * -4;
      const tiltY  = dx *  4;
      card.style.transform = `translateY(-4px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      card.style.transition = 'transform 0.1s ease';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.35s ease, box-shadow 0.3s ease, border-color 0.3s ease';
    });
  });
}

// ── Typing effect in hero subtitle ───────────────
function initTypingEffect() {
  const roles = [
    'Healthcare Innovator',
    'Clinical Researcher',
    'AI Enthusiast',
    'PharmD Candidate',
    'Scientific Author'
  ];
  const el = document.querySelector('.hero-subtitle');
  if (!el) return;

  let rIdx = 0, cIdx = 0, deleting = false;

  function type() {
    const role = roles[rIdx];
    if (!deleting) {
      cIdx++;
      el.innerHTML = `Healthcare Innovator &nbsp;·&nbsp; Clinical Researcher &nbsp;·&nbsp; <span class="gradient-text" style="font-style:italic">${role.slice(0, cIdx)}</span>`;
      if (cIdx === role.length) {
        deleting = true;
        setTimeout(type, 1800);
        return;
      }
    } else {
      cIdx--;
      el.innerHTML = `Healthcare Innovator &nbsp;·&nbsp; Clinical Researcher &nbsp;·&nbsp; <span class="gradient-text" style="font-style:italic">${role.slice(0, cIdx)}</span>`;
      if (cIdx === 0) {
        deleting = false;
        rIdx = (rIdx + 1) % roles.length;
      }
    }
    setTimeout(type, deleting ? 55 : 90);
  }

  setTimeout(type, 2500);
}

// ── Progress: reading progress bar ───────────────
function initReadingProgress() {
  const bar = document.createElement('div');
  bar.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    height: 2px;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6, #14b8a6);
    z-index: 9999;
    transition: width 0.1s linear;
    width: 0%;
  `;
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const scrolled  = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return;
    const pct       = (scrolled / maxScroll) * 100;
    bar.style.width = pct + '%';
  }, { passive: true });
}

// ── Section glow effect on scroll ────────────────
function initSectionGlow() {
  const glowEl = document.createElement('div');
  glowEl.style.cssText = `
    position: fixed;
    width: 600px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(59,130,246,0.05), transparent 70%);
    pointer-events: none;
    z-index: 0;
    transition: transform 0.8s ease, opacity 0.8s ease;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
  `;
  document.body.appendChild(glowEl);

  window.addEventListener('mousemove', (e) => {
    glowEl.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
  }, { passive: true });
}

// ── Nav active style injection ────────────────────
function injectNavActiveStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .nav-link.active {
      color: var(--blue-400) !important;
      background: rgba(59,130,246,0.1);
    }
    @media (max-width: 768px) {
      .nav-links.open .nav-link {
        font-size: 1.4rem;
        padding: 0.85rem 2.5rem;
        width: 100%;
        text-align: center;
        border-radius: 12px;
      }
    }
  `;
  document.head.appendChild(style);
}

// ── INIT ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Each init is wrapped in safeInit so one failure never breaks others.
  safeInit('Supabase',         initSupabase);
  safeInit('Particles',        initParticles);
  safeInit('Navbar',           initNavbar);
  safeInit('MobileNav',        initMobileNav);
  safeInit('ActiveNav',        initActiveNav);
  safeInit('ScrollReveal',     initScrollReveal);
  safeInit('ContactForm',      initContactForm);
  safeInit('SmoothScroll',     initSmoothScroll);
  safeInit('CardTilt',         initCardTilt);
  safeInit('TypingEffect',     initTypingEffect);
  safeInit('ReadingProgress',  initReadingProgress);
  safeInit('SectionGlow',      initSectionGlow);
  safeInit('NavActiveStyles',  injectNavActiveStyles);

  // Hero counters animate on page load (hero is visible immediately)
  setTimeout(() => {
    try { animateCounters(); } catch (e) { /* ignore */ }
  }, 600);

  // Skill bars animation observer
  safeInit('SkillBarObserver', () => {
    const skillSection = document.getElementById('skills');
    if (!skillSection) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        animateSkillBars();
        obs.disconnect();
      }
    }, { threshold: 0.1 });
    obs.observe(skillSection);
  });

  console.log('%c⚕ PharmD Portfolio Loaded ', 'background:#3b82f6;color:#fff;font-size:14px;padding:4px 10px;border-radius:4px;font-weight:700;');
});
