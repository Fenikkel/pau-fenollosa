(() => {
  const videos = [...document.querySelectorAll('[data-video-player]')];
  if (!videos.length) return;

  const showError = (container) => {
    container.classList.add('has-error');
    container.querySelector('.video-toggle').disabled = true;
    container.querySelector('.video-error').hidden = false;
  };

  window.onYouTubeIframeAPIReady = () => {
    videos.forEach((container) => {
      const frame = container.querySelector('iframe');
      const toggle = container.querySelector('.video-toggle');
      const fullscreen = container.querySelector('.video-fullscreen');
      let scrollStyle;

      const updatePlayback = (state) => {
        const playing = state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING;
        container.classList.toggle('is-playing', playing);
        toggle.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${frame.title}`);
      };

      const source = new URL(frame.src);
      if (location.origin !== 'null') source.searchParams.set('origin', location.origin);
      frame.src = source.href;

      const player = new YT.Player(frame, {
        events: {
          onReady: () => {
            toggle.disabled = false;
            fullscreen.disabled = false;
          },
          onStateChange: (event) => updatePlayback(event.data),
          onAutoplayBlocked: () => updatePlayback(YT.PlayerState.PAUSED),
          onError: () => showError(container),
        },
      });

      toggle.addEventListener('click', () => {
        const state = player.getPlayerState();
        if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }
      });

      const updateFullscreen = () => {
        const expanded = document.fullscreenElement === container ||
          document.webkitFullscreenElement === container || container.classList.contains('is-expanded');
        const label = expanded ? 'Exit fullscreen' : 'Enter fullscreen';
        fullscreen.setAttribute('aria-label', label);
        fullscreen.setAttribute('aria-pressed', String(expanded));
        fullscreen.title = label;
      };

      // Use an expanded inline player where element fullscreen is unavailable (e.g. iPhone).
      const expandInline = () => {
        const expanded = container.classList.toggle('is-expanded');
        if (expanded) {
          scrollStyle = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = scrollStyle;
        }
        updateFullscreen();
      };

      fullscreen.addEventListener('click', async () => {
        if (container.classList.contains('is-expanded')) {
          expandInline();
        } else if (document.fullscreenElement || document.webkitFullscreenElement) {
          const exit = document.exitFullscreen || document.webkitExitFullscreen;
          await exit.call(document);
        } else {
          const enter = container.requestFullscreen || container.webkitRequestFullscreen;
          if (enter) {
            try {
              await enter.call(container);
            } catch {
              expandInline();
            }
          } else {
            expandInline();
          }
        }
      });

      document.addEventListener('fullscreenchange', updateFullscreen);
      document.addEventListener('webkitfullscreenchange', updateFullscreen);
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && container.classList.contains('is-expanded')) expandInline();
      });
    });
  };

  const api = document.createElement('script');
  api.src = 'https://www.youtube.com/iframe_api';
  api.onerror = () => videos.forEach(showError);
  document.head.append(api);
})();
