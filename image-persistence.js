(function () {
  var DB_NAME = 'zhang-hang-portfolio-db';
  var STORE_NAME = 'images';

  function openDb() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB unavailable'));
        return;
      }
      var request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function withStore(mode, work) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE_NAME, mode);
        var store = tx.objectStore(STORE_NAME);
        var result = work(store, resolve, reject);
        tx.oncomplete = function () {
          if (result !== undefined) resolve(result);
          db.close();
        };
        tx.onerror = function () {
          reject(tx.error);
          db.close();
        };
      });
    });
  }

  function getRecord(key) {
    return withStore('readonly', function (store, resolve) {
      var req = store.get(key);
      req.onsuccess = function () {
        resolve(req.result ? req.result.value : null);
      };
    });
  }

  function setRecord(key, value) {
    return withStore('readwrite', function (store) {
      store.put({ key: key, value: value, updatedAt: Date.now() });
    });
  }

  function deleteRecord(key) {
    return withStore('readwrite', function (store) {
      store.delete(key);
    });
  }

  function listRecords() {
    return withStore('readonly', function (store, resolve) {
      var req = store.getAll();
      req.onsuccess = function () {
        resolve(req.result || []);
      };
    });
  }

  function cloneData(data) {
    return JSON.parse(JSON.stringify(data || {}));
  }

  function slug(value) {
    return encodeURIComponent(String(value || '').trim().toLowerCase());
  }

  function profileKey() {
    return 'profile:avatar';
  }

  function educationKey(item) {
    return 'education:' + slug(item.school) + ':badge';
  }

  function experienceKey(item) {
    return 'experience:' + slug(item.role) + ':logo';
  }

  function showcaseKey(item, index) {
    return 'showcase:' + slug(item.name) + ':image:' + index;
  }

  function extractImageEntries(data) {
    var entries = {};
    if (data.profile && data.profile.avatar) {
      entries[profileKey()] = data.profile.avatar;
    }
    (data.education || []).forEach(function (item) {
      if (item.badge) entries[educationKey(item)] = item.badge;
    });
    (data.experience || []).forEach(function (item) {
      if (item.logo) entries[experienceKey(item)] = item.logo;
    });
    (data.showcase || []).forEach(function (item) {
      (item.images || []).forEach(function (image, index) {
        if (image) entries[showcaseKey(item, index)] = image;
      });
    });
    return entries;
  }

  function stripImages(data) {
    var next = cloneData(data);
    if (next.profile) next.profile.avatar = null;
    (next.education || []).forEach(function (item) {
      item.badge = null;
    });
    (next.experience || []).forEach(function (item) {
      item.logo = null;
    });
    (next.showcase || []).forEach(function (item) {
      item.images = (item.images || []).map(function () {
        return null;
      });
    });
    return next;
  }

  function hydrateData(data) {
    return listRecords().then(function (records) {
      var map = {};
      records.forEach(function (entry) {
        if (entry.key.indexOf('data:') === 0) {
          map[entry.key.slice(5)] = entry.value;
        }
      });
      var next = cloneData(data);
      if (next.profile && map[profileKey()]) {
        next.profile.avatar = map[profileKey()];
      }
      (next.education || []).forEach(function (item) {
        var key = educationKey(item);
        if (map[key]) item.badge = map[key];
      });
      (next.experience || []).forEach(function (item) {
        var key = experienceKey(item);
        if (map[key]) item.logo = map[key];
      });
      (next.showcase || []).forEach(function (item) {
        item.images = (item.images || []).map(function (image, index) {
          var key = showcaseKey(item, index);
          return map[key] || image;
        });
      });
      return next;
    }).catch(function () {
      return data;
    });
  }

  function syncFromData(data) {
    var entries = extractImageEntries(data);
    return listRecords().then(function (records) {
      var activeKeys = {};
      Object.keys(entries).forEach(function (key) {
        activeKeys['data:' + key] = true;
      });
      var writes = Object.keys(entries).map(function (key) {
        return setRecord('data:' + key, entries[key]);
      });
      records.forEach(function (entry) {
        if (entry.key.indexOf('data:') === 0 && !activeKeys[entry.key]) {
          writes.push(deleteRecord(entry.key));
        }
      });
      return Promise.all(writes);
    }).catch(function () {});
  }

  function clearDataImages() {
    return listRecords().then(function (records) {
      return Promise.all(records.filter(function (entry) {
        return entry.key.indexOf('data:') === 0;
      }).map(function (entry) {
        return deleteRecord(entry.key);
      }));
    }).catch(function () {});
  }

  window.__portfolioImageStore = {
    stripImages: stripImages,
    hydrateData: hydrateData,
    syncFromData: syncFromData,
    clearDataImages: clearDataImages,
    loadCertificateImage: function (key) {
      return getRecord('certificate:' + key).catch(function () {
        return null;
      });
    },
    saveCertificateImage: function (key, value) {
      return setRecord('certificate:' + key, value).then(function () {
        return value;
      }).catch(function () {
        return value;
      });
    },
    removeCertificateImage: function (key) {
      return deleteRecord('certificate:' + key).catch(function () {});
    }
  };
})();
