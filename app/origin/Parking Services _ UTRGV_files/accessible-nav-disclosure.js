// accessible-nav-disclosure.js

// Check functionality
console.log("accessible-nav-disclosure loading...");

// Manually accessible  top menu for departments  
// disclosure menu keyboard behavior 
// from https://www.w3.org/WAI/ARIA/apg/example-index/disclosure/disclosure-navigation.html

/*
 *   This content is licensed according to the W3C Software License at
 *   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 *
 *   Supplemental JS for the disclosure menu keyboard behavior
 */

'use strict';

class DisclosureNav {
  constructor(domNode) {
    this.rootNode = domNode;
    this.controlledNodes = [];
    this.openIndex = null;
    this.useArrowKeys = true;
    this.topLevelNodes = [
      ...this.rootNode.querySelectorAll(
        ':scope > li > a, :scope > li > button:not(.flyout-toggle)'
      ),
    ];

    this.topLevelNodes.forEach((node) => {
      // handle button + menu
      if (
        node.tagName.toLowerCase() === 'button' &&
        node.hasAttribute('aria-controls')
      ) {
        const menu = node.parentNode.querySelector('ul');
        if (menu) {
          // save ref controlled menu
          this.controlledNodes.push(menu);

          // collapse menus
          node.setAttribute('aria-expanded', 'false');
          this.toggleMenu(menu, false);

          // attach event listeners
          menu.addEventListener('keydown', this.onMenuKeyDown.bind(this));
          node.addEventListener('click', this.onButtonClick.bind(this));
          node.addEventListener('keydown', this.onButtonKeyDown.bind(this));
        }
      }
      // handle links
      else {
        this.controlledNodes.push(null);
        node.addEventListener('keydown', this.onLinkKeyDown.bind(this));
      }
    });

    this.rootNode.addEventListener('focusout', this.onBlur.bind(this));

    // Set inline display:none on ALL hidden submenus at init time.
    // The DisclosureNav constructor only calls toggleMenu() on top-level dropdown ULs.
    // Flyout ULs (managed by a separate click handler) only have the velocity-template
    // hidden attribute and no inline style until their first toggle — leaving them
    // vulnerable to CSS hover rules that can override the UA [hidden] display:none
    // and expose them to NVDA. This covers all levels.
    this.rootNode.querySelectorAll('ul[hidden]').forEach(function (ul) {
      ul.style.display = 'none';
    });
  }

  controlFocusByKey(keyboardEvent, nodeList, currentIndex) {
    var newIndex = -1;
    switch (keyboardEvent.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        keyboardEvent.preventDefault();
        if (currentIndex > -1) {
          newIndex = Math.max(0, currentIndex - 1);
          nodeList[newIndex].focus();
        }
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        keyboardEvent.preventDefault();
        if (currentIndex > -1) {
          newIndex = Math.min(nodeList.length - 1, currentIndex + 1);
          nodeList[newIndex].focus();
        }
        break;
      case 'Home':
        keyboardEvent.preventDefault();
        newIndex = 0;
        nodeList[newIndex].focus();
        break;
      case 'End':
        keyboardEvent.preventDefault();
        newIndex = nodeList.length - 1;
        nodeList[newIndex].focus();
        break;
    }
  }

  // public function to close open menu
  close() {
    this.toggleExpand(this.openIndex, false);
  }

  onBlur(event) {
    var menuContainsFocus = this.rootNode.contains(event.relatedTarget);
    if (!menuContainsFocus && this.openIndex !== null) {
      this.toggleExpand(this.openIndex, false);
    }
  }

  onButtonClick(event) {
    var button = event.target;
    var buttonIndex = this.topLevelNodes.indexOf(button);
    var buttonExpanded = button.getAttribute('aria-expanded') === 'true';
    this.toggleExpand(buttonIndex, !buttonExpanded);
  }

  onButtonKeyDown(event) {
    var targetButtonIndex = this.topLevelNodes.indexOf(document.activeElement);

    // close on escape
    if (event.key === 'Escape') {
      this.toggleExpand(this.openIndex, false);
    }

    // explicitly open/close on Enter or Space (do not rely on native click)
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      var buttonExpanded = this.topLevelNodes[targetButtonIndex].getAttribute('aria-expanded') === 'true';
      this.toggleExpand(targetButtonIndex, !buttonExpanded);
      // Focus stays on the button after opening so NVDA remains in Forms Mode.
      // User then presses ArrowDown to enter the menu while JS still receives key events.
    }

    // move focus into the open menu if the current menu is open
    else if (
      this.useArrowKeys &&
      this.openIndex === targetButtonIndex &&
      event.key === 'ArrowDown'
    ) {
      event.preventDefault();
      // Find first visible focusable item (a or flyout-toggle, not inside hidden)
      var firstItem = Array.prototype.slice.call(
        this.controlledNodes[this.openIndex].querySelectorAll('a, .flyout-toggle')
      ).filter(function (el) { return !el.closest('[hidden]'); })[0];
      if (firstItem) { firstItem.focus(); }
    }

    // handle arrow key navigation between top-level buttons, if set
    else if (this.useArrowKeys) {
      this.controlFocusByKey(event, this.topLevelNodes, targetButtonIndex);
    }
  }

  onLinkKeyDown(event) {
    var targetLinkIndex = this.topLevelNodes.indexOf(document.activeElement);

    // handle arrow key navigation between top-level buttons, if set
    if (this.useArrowKeys) {
      this.controlFocusByKey(event, this.topLevelNodes, targetLinkIndex);
    }
  }

  onMenuKeyDown(event) {
    if (this.openIndex === null) {
      return;
    }

    var openMenu = this.controlledNodes[this.openIndex];

    // Detect if focus is inside a flyout submenu (nested ul, not the top-level dropdown ul).
    // When true, Escape and ArrowLeft should close just the flyout, not the whole dropdown.
    var closestUl = document.activeElement.closest('ul');
    var isInFlyout = !!(closestUl && closestUl !== openMenu && openMenu.contains(document.activeElement));

    var menuLinks = Array.prototype.slice.call(
      openMenu.querySelectorAll('a, .flyout-toggle')
    ).filter(function (el) {
      // Exclude items inside hidden flyout submenus
      return !el.closest('[hidden]');
    });
    // Sort by DOM order so arrow keys follow visual reading order
    menuLinks.sort(function (a, b) {
      return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    var currentIndex = menuLinks.indexOf(document.activeElement);

    // Escape: close only the flyout if inside one; otherwise close the whole dropdown
    if (event.key === 'Escape') {
      event.preventDefault();
      if (isInFlyout) {
        var escToggle = closestUl.previousElementSibling;
        if (escToggle && escToggle.classList.contains('flyout-toggle')) {
          escToggle.setAttribute('aria-expanded', 'false');
          closestUl.setAttribute('hidden', 'hidden');
          closestUl.style.display = 'none';
          escToggle.focus();
        }
      } else {
        this.topLevelNodes[this.openIndex].focus();
        this.toggleExpand(this.openIndex, false);
      }
    }

    // ArrowRight on a flyout-toggle: open the flyout and move focus to its first item.
    // This lets keyboard and NVDA Forms Mode users enter a level-3 flyout with ArrowRight.
    else if (
      this.useArrowKeys &&
      event.key === 'ArrowRight' &&
      document.activeElement.classList.contains('flyout-toggle')
    ) {
      event.preventDefault();
      var arrowRightFlyout = document.getElementById(
        document.activeElement.getAttribute('aria-controls')
      );
      if (arrowRightFlyout) {
        if (document.activeElement.getAttribute('aria-expanded') !== 'true') {
          document.activeElement.click(); // open the flyout
        }
        var arrowRightFirst = arrowRightFlyout.querySelector('a');
        if (arrowRightFirst) { setTimeout(function () { arrowRightFirst.focus(); }, 0); }
      }
    }

    // ArrowLeft from inside a flyout: close the flyout and return focus to its toggle button
    else if (this.useArrowKeys && event.key === 'ArrowLeft' && isInFlyout) {
      event.preventDefault();
      var leftToggle = closestUl.previousElementSibling;
      if (leftToggle && leftToggle.classList.contains('flyout-toggle')) {
        leftToggle.setAttribute('aria-expanded', 'false');
        closestUl.setAttribute('hidden', 'hidden');
        closestUl.style.display = 'none';
        leftToggle.focus();
      }
    }

    // ArrowUp/ArrowLeft from first item in the main dropdown: return focus to the parent button
    else if (
      this.useArrowKeys &&
      (event.key === 'ArrowUp' || event.key === 'ArrowLeft') &&
      currentIndex === 0 &&
      !isInFlyout
    ) {
      event.preventDefault();
      this.topLevelNodes[this.openIndex].focus();
    }

    // handle arrow key navigation within menu links, if set
    else if (this.useArrowKeys) {
      this.controlFocusByKey(event, menuLinks, currentIndex);
    }
  }

  toggleExpand(index, expanded) {
    // close open menu, if applicable
    if (this.openIndex !== index) {
      this.toggleExpand(this.openIndex, false);
    }

    // handle menu at called index
    if (this.topLevelNodes[index]) {
      this.openIndex = expanded ? index : null;
      this.topLevelNodes[index].setAttribute('aria-expanded', expanded);
      this.toggleMenu(this.controlledNodes[index], expanded);
    }
  }

  toggleMenu(domNode, show) {
    if (domNode) {
      if (show) {
        domNode.removeAttribute('hidden');
        domNode.style.display = 'block';
      } else {
        domNode.setAttribute('hidden', 'hidden');
        domNode.style.display = 'none';
        // Reset any open flyouts inside this dropdown when it closes
        domNode.querySelectorAll('.flyout-toggle[aria-expanded="true"]').forEach(function (flyout) {
          flyout.setAttribute('aria-expanded', 'false');
          var flyoutMenu = document.getElementById(flyout.getAttribute('aria-controls'));
          if (flyoutMenu) {
            flyoutMenu.setAttribute('hidden', 'hidden');
            flyoutMenu.style.display = 'none';
          }
        });
      }
    }
  }

  updateKeyControls(useArrowKeys) {
    this.useArrowKeys = useArrowKeys;
  }
}

// =====================================================
// SIDE NAV DISCLOSURE - button-activated left sidebar
// =====================================================
// Targets <nav class="left-nav nav-side-accessible">.
// Items with children are rendered by the velocity template as:
//   <button class="sidebar-toggle" type="button"
//           aria-expanded="false" aria-controls="ID">Label</button>
//   <ul id="ID" hidden="hidden" class="sidebar-list"> … </ul>
// This class wires click and keyboard (Enter / Space / Escape) so
// submenus open/close like the top-menu disclosure pattern.

class SideNavDisclosure {
  constructor(navNode) {
    this.rootNode = navNode;
    this._init();
  }

  _init() {
    var self = this;

    // Belt-and-suspenders: ensure all hidden ULs have inline display:none.
    this.rootNode.querySelectorAll('ul[hidden]').forEach(function (ul) {
      ul.style.display = 'none';
    });

    // Wire every sidebar toggle button.
    this.rootNode.querySelectorAll('button.sidebar-toggle').forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
      var menu = self._getMenu(btn);
      if (menu) {
        menu.setAttribute('hidden', 'hidden');
        menu.style.display = 'none';
      }

      btn.addEventListener('click', function () {
        self._toggle(btn);
      });

      btn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          self._toggle(btn);
        } else if (e.key === 'Escape') {
          self._collapse(btn);
          btn.focus();
        }
      });
    });

    // Close all open menus when focus leaves the entire nav.
    this.rootNode.addEventListener('focusout', function (e) {
      if (!self.rootNode.contains(e.relatedTarget)) {
        self.rootNode.querySelectorAll('button.sidebar-toggle[aria-expanded="true"]').forEach(function (b) {
          self._collapse(b);
        });
      }
    });
  }

  _getMenu(btn) {
    var menuId = btn.getAttribute('aria-controls');
    return menuId ? document.getElementById(menuId) : btn.nextElementSibling;
  }

  _expand(btn) {
    var menu = this._getMenu(btn);
    btn.setAttribute('aria-expanded', 'true');
    if (menu) {
      menu.removeAttribute('hidden');
      menu.style.display = 'block';
    }
  }

  _collapse(btn) {
    var menu = this._getMenu(btn);
    btn.setAttribute('aria-expanded', 'false');
    if (menu) {
      menu.setAttribute('hidden', 'hidden');
      menu.style.display = 'none';
      // Recursively collapse any nested open toggles.
      menu.querySelectorAll('button.sidebar-toggle[aria-expanded="true"]').forEach(function (inner) {
        inner.setAttribute('aria-expanded', 'false');
        var innerMenu = document.getElementById(inner.getAttribute('aria-controls')) || inner.nextElementSibling;
        if (innerMenu) {
          innerMenu.setAttribute('hidden', 'hidden');
          innerMenu.style.display = 'none';
        }
      });
    }
  }

  _toggle(btn) {
    if (btn.getAttribute('aria-expanded') === 'true') {
      this._collapse(btn);
    } else {
      this._expand(btn);
    }
  }
}

/* Initialize Disclosure Menus */
// Using DOMContentLoaded instead of 'load' so the nav is interactive
// as soon as the HTML is parsed — not blocked by image/resource downloads.
// This fixes multi-second delays on heavy photo gallery pages.
document.addEventListener(
  'DOMContentLoaded',
  function () {
    var menus = document.querySelectorAll('.disclosure-nav');
    var disclosureMenus = [];

    for (var i = 0; i < menus.length; i++) {
      disclosureMenus[i] = new DisclosureNav(menus[i]);
    }

    // listen to arrow key checkbox
    var arrowKeySwitch = document.getElementById('arrow-behavior-switch');
    if (arrowKeySwitch) {
      arrowKeySwitch.addEventListener('change', function () {
        var checked = arrowKeySwitch.checked;
        for (var i = 0; i < disclosureMenus.length; i++) {
          disclosureMenus[i].updateKeyControls(checked);
        }
      });
    }

    // Initialize side nav disclosure menus
    document.querySelectorAll('.left-nav.nav-side-accessible').forEach(function (sideNav) {
      new SideNavDisclosure(sideNav);
    });

    // fake link behavior
    disclosureMenus.forEach((disclosureNav, i) => {
      var links = menus[i].querySelectorAll('[href="#mythical-page-content"]');
      var examplePageHeading = document.getElementById('mythical-page-heading');
      for (var k = 0; k < links.length; k++) {
        // The codepen export script updates the internal link href with a full URL
        // we're just manually fixing that behavior here
        links[k].href = '#mythical-page-content';

        links[k].addEventListener('click', (event) => {
          // change the heading text to fake a page change
          var pageTitle = event.target.innerText;
          examplePageHeading.innerText = pageTitle;

          // handle aria-current
          for (var n = 0; n < links.length; n++) {
            links[n].removeAttribute('aria-current');
          }
          event.target.setAttribute('aria-current', 'page');
        });
      }
    });
  },
  false
);







/* Flyout toggle handler (level 2 → level 3 submenus) */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.flyout-toggle').forEach(function (btn) {

    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';

      // Close any other open flyouts
      document.querySelectorAll('.flyout-toggle[aria-expanded="true"]').forEach(function (other) {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          var otherMenu = document.getElementById(other.getAttribute('aria-controls'));
          if (otherMenu) {
            otherMenu.setAttribute('hidden', 'hidden');
            otherMenu.style.display = 'none';
          }
        }
      });

      // Toggle this flyout
      var menu = document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', String(!expanded));
      if (menu) {
        if (!expanded) {
          menu.removeAttribute('hidden');
          menu.style.display = 'block';
        } else {
          menu.setAttribute('hidden', 'hidden');
          menu.style.display = 'none';
        }
      }
    });

    btn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
        // Focus stays on the flyout button after opening so NVDA remains in Forms Mode.
        // User then presses ArrowRight to enter the flyout submenu.
      } else if (e.key === 'Escape') {
        btn.setAttribute('aria-expanded', 'false');
        var menu = document.getElementById(btn.getAttribute('aria-controls'));
        if (menu) {
          menu.setAttribute('hidden', 'hidden');
          menu.style.display = 'none';
        }
        btn.focus();
      }
      // ArrowRight is handled by onMenuKeyDown (event bubbles up to the top-level dropdown ul)
    });

  });
});

/* Hamburger toggle — keep aria-expanded in sync so NVDA announces
   "Main Menu button collapsed/expanded" on mobile view. */
document.addEventListener('DOMContentLoaded', function () {
  var navToggle = document.querySelector('.nav-toggle[aria-controls="top-and-mobile"]');
  var topNav = document.getElementById('top-and-mobile');
  if (navToggle && topNav) {
    function toggleNav(e) {
      e.preventDefault();
      var isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isExpanded));
    }
    navToggle.addEventListener('click', toggleNav);
    // Space key: role="button" on an <a> makes NVDA expect Space to activate it,
    // but browsers scroll on Space by default — intercept it here.
    navToggle.addEventListener('keydown', function (e) {
      if (e.key === ' ') {
        toggleNav(e);
      }
    });
  }
});

/* aria-current fallback — handles URL mismatches where Velocity's server-side
   $currentPage.link comparison found no match (e.g. minor normalisation
   differences between the link href and the browser URL).

   Only checks visible, non-hidden links so overview links inside collapsed
   dropdowns cannot produce a false match. Pass 2 (home-page detection) has
   been removed: if no exact match is found the home page correctly shows no
   active indicator, which is the intended behaviour. */
document.addEventListener('DOMContentLoaded', function () {
  var nav = document.querySelector('.disclosure-nav');
  if (!nav) return;

  // Velocity already handled it — nothing to do
  if (nav.querySelector('[aria-current="page"]')) return;

  function normalizePath(href) {
    try {
      return new URL(href, window.location.href).pathname
        .replace(/\/index\.html?$/i, '')
        .replace(/\/$/, '')
        .toLowerCase() || '/';
    } catch (e) { return ''; }
  }

  var currentPath = normalizePath(window.location.href);

  // Only consider links that are NOT inside a hidden submenu
  var visibleNavLinks = Array.prototype.slice.call(nav.querySelectorAll('a[href]')).filter(function (a) {
    return !a.closest('[hidden]');
  });

  // Exact normalized path match only
  for (var i = 0; i < visibleNavLinks.length; i++) {
    if (normalizePath(visibleNavLinks[i].href) === currentPath) {
      visibleNavLinks[i].setAttribute('aria-current', 'page');
      return;
    }
  }
});

// Check functionality
console.log("accessible-nav-disclosure loaded");
