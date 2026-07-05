(function () {
  var certificateManifest = {};
  var certificates = [
    { id: 'national-2025', storageKey: 'national-2025', label: '研究生国奖奖学金（2025）', meta: '国家级荣誉', layout: 'landscape' },
    { id: 'national-2024', storageKey: 'national-2024', label: '研究生国奖奖学金（2024）', meta: '国家级荣誉', layout: 'landscape' },
    { id: 'national-2023', storageKey: 'national-2023', label: '本科生国奖奖学金（2023）', meta: '国家级荣誉', layout: 'landscape' },
    { id: 'president-2023', storageKey: 'president', label: '本科生校长奖学金（2023）', meta: '校级高水平奖学金', layout: 'landscape' }
  ];

  var phoneIcon = [
    '<svg viewBox="0 0 24 24" aria-hidden="true">',
    '  <path d="M21 16.9v3a2 2 0 0 1-2.2 2 19.7 19.7 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6 19.7 19.7 0 0 1-3.1-8.6A2 2 0 0 1 3.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L6.9 9.7a16 16 0 0 0 7.4 7.4l1.3-1.3a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6A2 2 0 0 1 21 16.9z" />',
    '</svg>'
  ].join('');

  var certificateIcon = [
    '<svg viewBox="0 0 24 24" aria-hidden="true">',
    '  <path d="M6.5 3.5h8.8l2.2 2.2v14.8h-11z" />',
    '  <path d="M15 3.8v2.5h2.5" />',
    '  <path d="M9 10.2h6" />',
    '  <path d="M9 13.2h6" />',
    '  <path d="M9 16.2h3.5" />',
    '</svg>'
  ].join('');

  var staticCertificateManifest = {
    'national-2025': '/uploads/certificates/national-2025.jpg',
    'national-2024': '/uploads/certificates/national-2024.JPG',
    'national-2023': '/uploads/certificates/national-2023.png',
    'president': '/uploads/certificates/president.png',
    'president-2023': '/uploads/certificates/president.png'
  };

  function getStoredCertificate(storageKey) {
    try {
      if (certificateManifest[storageKey]) return certificateManifest[storageKey];
      if (staticCertificateManifest[storageKey]) return staticCertificateManifest[storageKey];
      var direct = window.localStorage.getItem('portfolio-certificate-' + storageKey);
      if (direct) return direct;

      var legacyMap = {
        'national-2025': ['portfolio-certificate-national-2025', 'portfolio-certificate-national-award-2025'],
        'national-2024': ['portfolio-certificate-national-2024', 'portfolio-certificate-national-award-2024'],
        'national-2023': ['portfolio-certificate-national-2023', 'portfolio-certificate-undergraduate-national-2023'],
        'president-2023': ['portfolio-certificate-president', 'portfolio-certificate-president-2023', 'portfolio-certificate-principal-2023']
      };

      var fallbacks = legacyMap[storageKey] || legacyMap[storageKey + '-2023'] || [];
      for (var i = 0; i < fallbacks.length; i += 1) {
        var legacy = window.localStorage.getItem(fallbacks[i]);
        if (legacy) {
          window.localStorage.setItem('portfolio-certificate-' + storageKey, legacy);
          return legacy;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  function setStoredCertificate(storageKey, value) {
    try {
      window.localStorage.setItem('portfolio-certificate-' + storageKey, value);
      return true;
    } catch (error) {}
    return false;
  }

  function loadImageFromFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (event) {
        var image = new Image();
        image.onload = function () {
          resolve(image);
        };
        image.onerror = reject;
        image.src = event.target && event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function dataUrlSizeBytes(dataUrl) {
    return Math.ceil((dataUrl.length - 'data:image/jpeg;base64,'.length) * 3 / 4);
  }

  function compressCertificateImage(file) {
    var maxWidth = 1400;
    var maxHeight = 1000;
    var targetBytes = 280 * 1024;
    var qualitySteps = [0.82, 0.76, 0.7, 0.64, 0.58, 0.52, 0.46];
    var scaleSteps = [1, 0.92, 0.85, 0.78, 0.72, 0.66];

    return loadImageFromFile(file).then(function (image) {
      var baseRatio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
      var best = null;

      function render(scale, quality) {
        var width = Math.max(1, Math.round(image.width * baseRatio * scale));
        var height = Math.max(1, Math.round(image.height * baseRatio * scale));
        var canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        var context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        var dataUrl = canvas.toDataURL('image/jpeg', quality);
        return {
          dataUrl: dataUrl,
          bytes: dataUrlSizeBytes(dataUrl)
        };
      }

      scaleSteps.forEach(function (scale) {
        qualitySteps.forEach(function (quality) {
          var candidate = render(scale, quality);
          if (!best || candidate.bytes < best.bytes) {
            best = candidate;
          }
          if (candidate.bytes <= targetBytes && !best.hitTarget) {
            best = {
              dataUrl: candidate.dataUrl,
              bytes: candidate.bytes,
              hitTarget: true
            };
          }
        });
      });

      return best.dataUrl;
    });
  }

  function loadCertificateManifest() {
    if (!window.fetch) return Promise.resolve();
    return window.fetch('/__certificates_manifest.json', { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) return {};
        return response.json();
      })
      .then(function (manifest) {
        certificateManifest = Object.assign({}, staticCertificateManifest, manifest || {});
      })
      .catch(function () {
        certificateManifest = Object.assign({}, staticCertificateManifest);
      });
  }

  function persistCertificate(id, value) {
    if (!window.fetch) return Promise.resolve(null);
    return window.fetch('/__save_certificate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, dataUrl: value })
    })
      .then(function (response) {
        if (!response.ok) return null;
        return response.json();
      })
      .then(function (payload) {
        if (payload && payload.url) {
          certificateManifest[id] = payload.url;
          return payload.url;
        }
        return null;
      })
      .catch(function () {
        return null;
      });
  }

  function certificateCard(item, index) {
    var storageKey = item.storageKey || item.id;
    var image = getStoredCertificate(storageKey);
    var imageMarkup = image
      ? '<img class="certificateImage" src="' + image + '" alt="' + item.label + '" />'
      : '<div class="certificatePlaceholder"><span class="certificateIcon">' + certificateIcon + '</span><span>点击上传证书</span></div>';

    return [
      '<article class="certificateCard certificateCard' + (item.layout === 'landscape' ? 'Landscape' : 'Portrait') + '" data-certificate-id="' + storageKey + '" tabindex="0" role="button" aria-label="上传' + item.label + '">',
      '  <div class="certificatePreview">' + imageMarkup + '</div>',
      '  <div class="certificateInfo">',
      '    <strong>' + item.label + '</strong>',
      '    <span>' + item.meta + '</span>',
      '  </div>',
      '  <input class="certificateInput" type="file" accept="image/*" aria-label="上传' + item.label + '" />',
      '</article>'
    ].join('');
  }

  function bindCertificateUploads(section) {
    Array.prototype.forEach.call(section.querySelectorAll('.certificateCard'), function (card) {
      var input = card.querySelector('.certificateInput');
      var preview = card.querySelector('.certificatePreview');
      var id = card.getAttribute('data-certificate-id');
      var openPicker = function () {
        if (input) input.click();
      };

      card.addEventListener('click', function (event) {
        if (event.target !== input) openPicker();
      });
      card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openPicker();
        }
      });

      if (!input || !preview) return;
      input.addEventListener('change', async function () {
        var file = input.files && input.files[0];
        if (!file) return;
        try {
          var value = await compressCertificateImage(file);
          if (!value) return;

          preview.innerHTML = '<img class="certificateImage" src="' + value + '" alt="已上传证书" />';
          card.classList.add('certificateCardUploaded');

          var saved = setStoredCertificate(id, value);
          persistCertificate(id, value);

          if (!saved) {
            window.alert('图片已临时显示但未保存成功，请压缩图片或清理其他大图后重试');
          }
        } catch (error) {
          window.alert('图片处理失败，请重试');
        } finally {
          input.value = '';
        }
      });
    });
  }

  function bindContactActions(section) {
    var emailCard = section.querySelector('.contactCard[href^="mailto:"]');
    if (!emailCard || emailCard.dataset.bound === 'true') return;
    emailCard.dataset.bound = 'true';

    emailCard.addEventListener('click', function () {
      var href = emailCard.getAttribute('href');
      var address = (emailCard.querySelector('.contactAddress') || {}).textContent || 'zhanghang13@foxmail.com';
      var copied = false;

      try {
        window.location.href = href;
      } catch (error) {}

      if (navigator.clipboard && navigator.clipboard.writeText) {
        window.setTimeout(function () {
          if (copied) return;
          navigator.clipboard.writeText(address).then(function () {
            copied = true;
            section.classList.add('contactCopied');
            window.clearTimeout(section._contactCopiedTimer);
            section._contactCopiedTimer = window.setTimeout(function () {
              section.classList.remove('contactCopied');
            }, 2200);
          }).catch(function () {});
        }, 320);
      }
    });
  }

  var mailIcon = [
    '<svg viewBox="0 0 24 24" aria-hidden="true">',
    '  <rect x="3.8" y="6.5" width="16.4" height="11.2" rx="2.8" />',
    '  <path d="M5.4 8l6.6 5.2L18.6 8" />',
    '  <path d="M6.2 16.6l4.7-4" opacity=".42" />',
    '  <path d="M17.8 16.6l-4.7-4" opacity=".42" />',
    '</svg>'
  ].join('');

  function mountHonorsSection() {
    if (document.getElementById('honors')) return;

    var contact = document.getElementById('contact');
    var footer = document.querySelector('footer');
    var section = document.createElement('section');
    section.id = 'honors';
    section.className = 'honorsSection';
    section.innerHTML = [
      '<div class="honorsShell">',
      '  <p class="sectionEyebrow">Honors</p>',
      '  <h2>奖项荣誉</h2>',
      '  <div class="honorGrid">',
      certificates.map(certificateCard).join(''),
      '  </div>',
      '</div>'
    ].join('');

    var anchor = contact || footer;
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(section, anchor);
    } else {
      document.body.appendChild(section);
    }

    bindCertificateUploads(section);
  }

  function mountContactSection() {
    if (document.getElementById('contact')) return;

    var footer = document.querySelector('footer');
    var section = document.createElement('section');
    section.id = 'contact';
    section.className = 'contactSection';
    section.innerHTML = [
      '<div class="contactShell">',
      '  <div class="contactHalo" aria-hidden="true"></div>',
      '  <p class="contactEyebrow">Contact</p>',
      '  <h2>联系我</h2>',
      '  <div class="contactPanel">',
      '    <div class="contactCards">',
      '      <a class="contactCard" href="tel:15152526326" aria-label="拨打电话 15152526326">',
      '        <span class="contactIcon">' + phoneIcon + '</span>',
      '        <span class="contactMeta"><small>Phone</small><strong><span class="contactAddress">15152526326</span></strong></span>',
      '      </a>',
      '      <span class="contactDivider" aria-hidden="true"></span>',
      '      <a class="contactCard" href="mailto:zhanghang13@foxmail.com" aria-label="发送邮件到 zhanghang13@foxmail.com">',
      '        <span class="contactIcon">' + mailIcon + '</span>',
      '        <span class="contactMeta"><small>Email</small><strong><span class="contactAddress">zhanghang13@foxmail.com</span></strong></span>',
      '      </a>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');

    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(section, footer);
    } else {
      document.body.appendChild(section);
    }

    bindContactActions(section);
  }

  function polishFooter() {
    var footer = document.querySelector('footer');
    if (!footer || footer.classList.contains('siteFooterFinal')) return false;
    footer.classList.add('siteFooterFinal');
    footer.innerHTML = '';
    footer.setAttribute('aria-hidden', 'true');
    return true;
  }

  function start() {
    loadCertificateManifest().finally(function () {
      mountContactSection();
      mountHonorsSection();
      if (polishFooter()) return;

      var tries = 0;
      var timer = window.setInterval(function () {
        tries += 1;
        if (polishFooter() || tries > 80) {
          window.clearInterval(timer);
        }
      }, 100);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
