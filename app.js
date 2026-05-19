document.addEventListener('DOMContentLoaded', () => {
  console.log("app.js loaded successfully!");

  /* --- 1. MOUSE GLOW --- */
  const cursorGlow = document.getElementById('cursor-glow');
  if (cursorGlow) {
    window.addEventListener('mousemove', (e) => {
      cursorGlow.style.left = `${e.clientX}px`;
      cursorGlow.style.top  = `${e.clientY}px`;
    });
  }

  /* --- 2. SCROLL FADE-INS --- */
  const fadeSections = document.querySelectorAll('.fade-in-section');
  const sectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  fadeSections.forEach(section => sectionObserver.observe(section));

  /* --- 3. LIGHTBOX --- */
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox      = document.getElementById('gallery-lightbox');
  if (lightbox) {
    const lightboxImg     = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn        = document.getElementById('lightbox-close-btn');

    const openLightbox = (src, caption) => {
      lightboxImg.src             = src;
      lightboxCaption.textContent = caption;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    };

    galleryItems.forEach(item => {
      item.addEventListener('click', () =>
      openLightbox(item.dataset.src, item.dataset.caption)
      );
    });

    closeBtn.addEventListener('click', closeLightbox);

    // Close on backdrop click
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
      });
  }

  /* --- 4. YOUTUBE FEED --- */
  const videoGrid = document.getElementById('youtube-video-grid');
  if (!videoGrid) return;

  const CHANNEL_ID = 'UC3fl3Hcw2l_p09cHP3qqEzQ';
  const MAX_VIDEOS = 3;

  const extractVideoId = (url = '') => {
    const match = url.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const renderVideos = (items) => {
    videoGrid.innerHTML = '';
    items.slice(0, MAX_VIDEOS).forEach(item => {
      const videoId   = extractVideoId(item.link) || extractVideoId(item.guid);
      const thumbnail = videoId
      ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      : '';

      const card = document.createElement('a');
      card.className = 'video-card fade-in-section is-visible';
      card.href      = item.link;
      card.target    = '_blank';
      card.rel       = 'noopener noreferrer';
      card.innerHTML = `
      <div class="video-thumbnail-container">
      <img src="${thumbnail}" alt="${item.title}" loading="lazy">
      <div class="play-icon">&#9654;</div>
      </div>
      <div class="video-info">
      <h3>${item.title}</h3>
      <p class="video-date">${new Date(item.pubDate).toLocaleDateString()}</p>
      </div>`;
      videoGrid.appendChild(card);
    });
  };

  const showError = () => {
    videoGrid.innerHTML = `
    <p class="feed-error">
    Videos unavailable right now.
    <a href="https://www.youtube.com/channel/${CHANNEL_ID}" target="_blank" rel="noopener noreferrer">
    Visit our channel →
    </a>
    </p>`;
  };

  const parseXML = (xmlString) => {
    const xml     = new DOMParser().parseFromString(xmlString, 'text/xml');
    const entries = [...xml.querySelectorAll('entry')];
    return entries.map(e => ({
      title:   e.querySelector('title')?.textContent   ?? 'Untitled',
                             link:    e.querySelector('link')?.getAttribute('href') ?? '#',
                             guid:    e.querySelector('id')?.textContent      ?? '',
                             pubDate: e.querySelector('published')?.textContent ?? '',
    }));
  };

  const xmlFeedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

  // codetabs returns XML directly, no encoding needed
  fetch(`https://api.codetabs.com/v1/proxy?quest=${xmlFeedUrl}`)
  .then(r => {
    if (!r.ok) throw new Error(`codetabs error: ${r.status}`);
    return r.text();
  })
  .then(xmlString => {
    if (!xmlString || xmlString.includes('<html')) throw new Error('Got HTML instead of XML');
    const items = parseXML(xmlString);
    if (items.length) renderVideos(items);
    else throw new Error('No entries found');
  })
  .catch(err => {
    console.error('YouTube feed failed:', err);
    showError();
  });
});
