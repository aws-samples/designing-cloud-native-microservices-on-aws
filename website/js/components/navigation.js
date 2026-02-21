/**
 * Navigation Component
 * Smooth scrolling, active section highlighting, and mobile menu toggle
 * for the EventStorming Coffeeshop showcase website.
 */

/** Section IDs that correspond to nav links */
var NAV_SECTIONS = ['hero', 'architecture', 'order', 'menu', 'inventory'];

/** Navbar height in pixels, used for scroll offset */
var NAV_HEIGHT = 64;

/**
 * Initialize navigation behavior.
 * Binds smooth scrolling, scroll-based active highlighting, and mobile menu toggle.
 */
function initNavigation() {
  // Smooth scroll for all nav anchor links with hash hrefs
  var navLinks = document.querySelectorAll('#nav ul a[href^="#"], #mobile-menu a[href^="#"]');
  for (var i = 0; i < navLinks.length; i++) {
    navLinks[i].addEventListener('click', handleNavClick);
  }

  // Highlight active section on scroll (passive for performance)
  window.addEventListener('scroll', updateActiveSection, { passive: true });

  // Initial highlight
  updateActiveSection();

  // Mobile menu toggle
  var menuBtn = document.getElementById('mobile-menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', toggleMobileMenu);
  }
}

/**
 * Handle nav link click: smooth scroll to target and close mobile menu.
 * @param {Event} e - Click event
 */
function handleNavClick(e) {
  var href = this.getAttribute('href');
  if (!href || href.charAt(0) !== '#') return;

  var target = document.getElementById(href.substring(1));
  if (!target) return;

  e.preventDefault();

  var top = target.getBoundingClientRect().top + window.pageYOffset - NAV_HEIGHT;
  window.scrollTo({ top: top, behavior: 'smooth' });

  // Close mobile menu if open
  var mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
    mobileMenu.classList.add('hidden');
    mobileMenu.classList.remove('flex');
    var menuBtn = document.getElementById('mobile-menu-btn');
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  }
}

/**
 * Highlight the nav link corresponding to the section currently in the viewport.
 * Uses getBoundingClientRect with a navbar offset of 64px.
 */
function updateActiveSection() {
  var activeId = '';

  for (var i = NAV_SECTIONS.length - 1; i >= 0; i--) {
    var section = document.getElementById(NAV_SECTIONS[i]);
    if (!section) continue;

    var rect = section.getBoundingClientRect();
    // Section is "active" when its top has scrolled past the navbar + a small buffer
    if (rect.top <= NAV_HEIGHT + 40) {
      activeId = NAV_SECTIONS[i];
      break;
    }
  }

  // Update desktop and mobile nav links
  var allLinks = document.querySelectorAll('#nav ul a[href^="#"], #mobile-menu a[href^="#"]');
  for (var j = 0; j < allLinks.length; j++) {
    var link = allLinks[j];
    var linkHref = link.getAttribute('href');
    if (linkHref === '#' + activeId) {
      link.classList.add('text-green-500');
      link.classList.remove('text-slate-300');
    } else {
      link.classList.remove('text-green-500');
      link.classList.add('text-slate-300');
    }
  }
}

/**
 * Toggle the mobile hamburger menu visibility.
 * Switches 'hidden'/'flex' classes on #mobile-menu and updates aria-expanded.
 */
function toggleMobileMenu() {
  var menu = document.getElementById('mobile-menu');
  var btn = document.getElementById('mobile-menu-btn');
  if (!menu) return;

  var isHidden = menu.classList.contains('hidden');

  menu.classList.toggle('hidden', !isHidden);
  menu.classList.toggle('flex', isHidden);

  if (btn) {
    btn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
  }
}
