(function () {
  function getGreeting() {
    var hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Hi！早上好';
    if (hour >= 11 && hour < 14) return 'Hi！中午好';
    if (hour >= 14 && hour < 18) return 'Hi！下午好';
    return 'Hi！晚上好';
  }

  function getTypingDelay(char, index) {
    if (char === ' ') return 24;
    if (/[，,。.!！?？；;：:]/.test(char)) return 260;
    if (/[、·]/.test(char)) return 180;
    return 28 + Math.min(index * 2, 18);
  }

  function typeText(target, text, callback) {
    var index = 0;
    var host = target.closest('.heroIntro') || target.parentElement || document.body;
    target.textContent = '';
    host.classList.add('isTyping');

    function tick() {
      target.textContent = text.slice(0, index);
      var currentChar = text.charAt(index - 1);
      index += 1;
      if (index <= text.length) {
        window.setTimeout(tick, getTypingDelay(currentChar, index));
      } else if (callback) {
        window.setTimeout(callback, 280);
      } else {
        host.classList.remove('isTyping');
      }
    }

    tick();
  }

  function mountHeroIntro() {
    var name = document.querySelector('._name_cca9l_136');
    if (!name || document.querySelector('.heroIntro')) return false;

    var inner = name.closest('._inner_cca9l_38');
    if (inner && !inner.querySelector('.heroCopyColumn')) {
      var column = document.createElement('div');
      column.className = 'heroCopyColumn';
      inner.insertBefore(column, name);
      column.appendChild(name);
    }

    var intro = document.createElement('div');
    intro.className = 'heroIntro';
    intro.innerHTML = [
      '<p class="heroGreeting"><span class="heroGreetingText"></span><span class="heroGreetingEmoji" aria-hidden="true">👋</span><span class="heroCaret" aria-hidden="true">|</span></p>',
      '<p class="heroWelcome"><span class="heroWelcomeText"></span></p>',
      '<p class="heroIdentity"><strong>我是<span class="heroNameMark">张航</span>，正在努力成为一名 <span class="heroRoleMark">AI Native Intern</span> ✨</strong></p>',
      '<p class="heroNumbersHint">可以通过几个数字快速了解我 ⬇️</p>'
    ].join('');

    name.insertAdjacentElement('afterend', intro);
    typeText(intro.querySelector('.heroGreetingText'), getGreeting(), function () {
      window.setTimeout(function () {
        typeText(intro.querySelector('.heroWelcomeText'), '欢迎来到我的个人主页 🚀', function () {
          intro.classList.remove('isTyping');
        });
      }, 180);
    });
    return true;
  }

  function polishStats() {
    var values = ['5 个月+', '985', '2 个', '3 年'];
    var labels = ['百度实习时长', '研究生在读', 'AI HR 项目', '国家奖学金'];
    var stats = Array.prototype.slice.call(document.querySelectorAll('._stat_cca9l_219'));
    if (stats.length < values.length) return false;

    stats.slice(0, values.length).forEach(function (stat, index) {
      var valueNode = stat.querySelector('._statValue_cca9l_251');
      var labelNode = stat.querySelector('._statLabel_cca9l_259');
      if (valueNode) valueNode.textContent = values[index];
      if (labelNode) labelNode.textContent = labels[index];
    });
    return true;
  }

  function polishScholarships() {
    var scholarships = Array.prototype.slice.call(document.querySelectorAll('._scholarshipValue_17qhc_165'));
    if (scholarships.length < 2) return false;

    if (scholarships[0]) {
      scholarships[0].textContent = '国家奖学金（2024） · 国家奖学金（2025）';
    }

    if (scholarships[1]) {
      scholarships[1].textContent = '国家奖学金（2023） · 校长奖学金（2023）';
    }

    return true;
  }

  function currentSection() {
    var hash = window.location.hash && window.location.hash.replace('#', '');
    if (hash) {
      var hashed = document.getElementById(hash);
      if (hashed) return hashed;
    }

    var sections = Array.prototype.slice.call(document.querySelectorAll('._hero_cca9l_2, section[id]'));
    var best = sections[0];
    var bestDistance = Infinity;
    sections.forEach(function (section) {
      var rect = section.getBoundingClientRect();
      var distance = Math.abs(rect.top);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = section;
      }
    });
    return best || document.querySelector('._hero_cca9l_2');
  }

  function playSectionMotion(section) {
    if (!section) return;
    section.classList.remove('techMotionActive');
    void section.offsetWidth;
    section.classList.add('techMotionActive');
    window.clearTimeout(section._techMotionTimer);
    section._techMotionTimer = window.setTimeout(function () {
      section.classList.remove('techMotionActive');
    }, 3800);
  }

  function bindSectionMotion() {
    if (window.__portfolioSectionMotionBound) return;
    window.__portfolioSectionMotionBound = true;

    window.setTimeout(function () {
      playSectionMotion(currentSection());
    }, 260);

    window.addEventListener('hashchange', function () {
      window.setTimeout(function () {
        playSectionMotion(currentSection());
      }, 80);
    });

    document.addEventListener('click', function (event) {
      var link = event.target.closest && event.target.closest('a[href^="#"], ._navPill_cca9l_197[href^="#"]');
      if (!link) return;
      var target = document.getElementById(link.getAttribute('href').slice(1));
      window.setTimeout(function () {
        playSectionMotion(target || currentSection());
      }, 180);
    });

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.58) {
            window.__portfolioLastMotionSection = entry.target;
            playSectionMotion(entry.target);
          }
        });
      }, { threshold: [0.58] });

      var tries = 0;
      var timer = window.setInterval(function () {
        tries += 1;
        var sections = document.querySelectorAll('._hero_cca9l_2, section[id]');
        if (sections.length || tries > 30) {
          window.clearInterval(timer);
          Array.prototype.forEach.call(sections, function (section) {
            observer.observe(section);
          });
        }
      }, 120);
    }
  }

  function start() {
    var introMounted = mountHeroIntro();
    var statsPolished = polishStats();
    var scholarshipsPolished = polishScholarships();
    var copyColumn = document.querySelector('.heroCopyColumn');
    var stats = document.querySelector('._stats_cca9l_219');
    if (copyColumn && stats && stats.parentElement !== copyColumn) {
      copyColumn.appendChild(stats);
    }
    bindSectionMotion();
    if (introMounted && statsPolished && scholarshipsPolished) return;

    var tries = 0;
    var timer = window.setInterval(function () {
      tries += 1;
      introMounted = introMounted || mountHeroIntro();
      statsPolished = statsPolished || polishStats();
      scholarshipsPolished = scholarshipsPolished || polishScholarships();
      copyColumn = document.querySelector('.heroCopyColumn');
      stats = document.querySelector('._stats_cca9l_219');
      if (copyColumn && stats && stats.parentElement !== copyColumn) {
        copyColumn.appendChild(stats);
      }
      bindSectionMotion();
      if ((introMounted && statsPolished && scholarshipsPolished) || tries > 80) {
        window.clearInterval(timer);
      }
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
