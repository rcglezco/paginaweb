(function () {
  const teamTrack = document.querySelector('.team-wrap');
  const teamPrevButton = document.querySelector('.team-carousel-prev');
  const teamNextButton = document.querySelector('.team-carousel-next');

  if (teamTrack && teamPrevButton && teamNextButton) {
    const hideCarouselClone = clone => {
      clone.classList.add('team-card-clone');
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('inert', '');
      clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
      if (clone.matches('a[href]')) {
        clone.dataset.cloneHref = clone.getAttribute('href');
        clone.removeAttribute('href');
        clone.setAttribute('role', 'presentation');
      }
      clone.querySelectorAll('a[href]').forEach(element => {
        element.dataset.cloneHref = element.getAttribute('href');
        element.removeAttribute('href');
        element.setAttribute('role', 'presentation');
      });
      clone.querySelectorAll('a, button, input, textarea, select, [tabindex]').forEach(element => {
        element.setAttribute('tabindex', '-1');
      });
    };
    const originalCards = [...teamTrack.querySelectorAll('.team-card')];
    const originalCount = originalCards.length;
    let currentIndex = originalCount;
    let isAnimating = false;

    [...originalCards].reverse().forEach(card => {
      const clone = card.cloneNode(true);
      hideCarouselClone(clone);
      teamTrack.insertBefore(clone, teamTrack.firstChild);
    });

    originalCards.forEach(card => {
      const clone = card.cloneNode(true);
      hideCarouselClone(clone);
      teamTrack.appendChild(clone);
    });

    const touchTeamQuery = window.matchMedia('(hover: none), (pointer: coarse)');

    const clearTeamTouchState = () => {
      teamTrack.querySelectorAll('.team-card.is-touch-active').forEach(card => {
        card.classList.remove('is-touch-active');
      });
    };

    teamTrack.addEventListener('click', event => {
      if (!touchTeamQuery.matches) return;

      const target = event.target instanceof Element ? event.target : null;
      const card = target ? target.closest('.team-card') : null;
      if (!card || !teamTrack.contains(card)) return;
      if (target.closest('a[href]')) return;
      event.preventDefault();

      const wasActive = card.classList.contains('is-touch-active');
      clearTeamTouchState();

      if (!wasActive) {
        card.classList.add('is-touch-active');
      }
    });

    document.addEventListener('click', event => {
      if (!touchTeamQuery.matches) return;

      const target = event.target instanceof Element ? event.target : null;
      if (target && target.closest('.team-card')) return;

      clearTeamTouchState();
    });

    let teamMetrics = { step: 320, visibleCount: 1 };

    const readTeamMetrics = () => {
      const firstCard = teamTrack.querySelector('.team-card');
      if (!firstCard) return { step: 320, visibleCount: 1 };

      const styles = window.getComputedStyle(teamTrack);
      const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
      const step = firstCard.getBoundingClientRect().width + gap;
      const visibleCount = Math.max(1, Math.round(teamTrack.parentElement.clientWidth / step));
      return { step, visibleCount };
    };

    const refreshTeamMetrics = () => {
      teamMetrics = readTeamMetrics();
    };

    const applyTeamPosition = (animate = true) => {
      const { step } = teamMetrics;
      teamTrack.style.transition = animate ? '' : 'none';
      teamTrack.style.transform = `translateX(${-currentIndex * step}px)`;
      if (!animate) {
        window.requestAnimationFrame(() => {
          teamTrack.style.transition = '';
        });
      }
    };

    const moveTeam = direction => {
      if (isAnimating) return;
      clearTeamTouchState();
      refreshTeamMetrics();
      isAnimating = true;
      currentIndex += direction;
      applyTeamPosition(true);
    };

    teamTrack.addEventListener('transitionend', event => {
      if (event.propertyName !== 'transform') return;

      if (currentIndex >= originalCount * 2) {
        currentIndex -= originalCount;
        applyTeamPosition(false);
      } else if (currentIndex < originalCount) {
        currentIndex += originalCount;
        applyTeamPosition(false);
      }
      isAnimating = false;
    });

    teamPrevButton.addEventListener('click', () => moveTeam(-1));
    teamNextButton.addEventListener('click', () => moveTeam(1));
    let teamFrame = null;
    const scheduleTeamPosition = () => {
      if (teamFrame !== null) return;
      teamFrame = window.requestAnimationFrame(() => {
        teamFrame = null;
        clearTeamTouchState();
        refreshTeamMetrics();
        applyTeamPosition(false);
      });
    };
    window.addEventListener('resize', scheduleTeamPosition);
    window.addEventListener('orientationchange', scheduleTeamPosition);

    if ('IntersectionObserver' in window) {
      const teamObserver = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        teamObserver.disconnect();
        scheduleTeamPosition();
      }, { rootMargin: '240px 0px' });
      teamObserver.observe(teamTrack);
    } else {
      window.addEventListener('load', scheduleTeamPosition, { once: true });
    }
  }
})();
