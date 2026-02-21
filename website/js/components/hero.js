/**
 * Hero Component
 * Subtle entrance animations for the hero section text content.
 * Respects prefers-reduced-motion.
 */

/**
 * Initialize Hero section entrance effects.
 * Adds a staggered fade-in + translateY animation to the h1, subtitle, and CTA.
 * Skips animation entirely if the user prefers reduced motion.
 */
function initHero() {
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  var hero = document.getElementById('hero');
  if (!hero) return;

  // Target the h1, subtitle p, and CTA link inside the hero text block
  var textBlock = hero.querySelector('.text-center');
  if (!textBlock) return;

  var h1 = textBlock.querySelector('h1');
  var subtitle = textBlock.querySelector('p');
  var cta = textBlock.querySelector('a');

  var targets = [h1, subtitle, cta];
  var delays = [0, 150, 300];

  // Set initial hidden state on each target
  for (var i = 0; i < targets.length; i++) {
    if (!targets[i]) continue;
    targets[i].style.opacity = '0';
    targets[i].style.transform = 'translateY(16px)';
    targets[i].style.transition = 'opacity 500ms ease, transform 500ms ease';
  }

  // Trigger reveal with staggered delays
  for (var j = 0; j < targets.length; j++) {
    if (!targets[j]) continue;
    scheduleReveal(targets[j], delays[j]);
  }
}

/**
 * Schedule the reveal of an element after a delay.
 * @param {HTMLElement} el - The element to reveal.
 * @param {number} delay - Delay in milliseconds before revealing.
 */
function scheduleReveal(el, delay) {
  setTimeout(function () {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  }, delay);
}
