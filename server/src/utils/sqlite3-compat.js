/**
 * Compatibility wrapper that makes sql.js (pure-JS SQLite/WASM)
 * work with Sequelize v6's sqlite3 (async/callback) API.
 */
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let SQL = null;
const sqlReady = initSqlJs().then((s) => { SQL = s; return s; });

class Database {
  constructor(filename, mode, callback) {
    if (typeof mode === 'function') {
      callback = mode;
      mode = undefined;
    }
    this._filename = filename;
    this._db = null;
    this._saveTimer = null;

    sqlReady
      .then((SQL) => {
        try {
          if (filename && filename !== ':memory:' && fs.existsSync(filename)) {
            const buffer = fs.readFileSync(filename);
            this._db = new SQL.Database(buffer);
          } else {
            this._db = new SQL.Database();
          }
          if (callback) callback(null);
        } catch (err) {
          if (callback) callback(err);
        }
      })
      .catch((err) => {
        if (callback) callback(err);
      });
  }

  _persist() {
    if (this._filename && this._filename !== ':memory:' && this._db) {
      // Debounce saves
      if (this._saveTimer) clearTimeout(this._saveTimer);
      this._saveTimer = setTimeout(() => {
        try {
          const dir = path.dirname(this._filename);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          const data = this._db.export();
          fs.writeFileSync(this._filename, Buffer.from(data));
        } catch (e) { /* silent */ }
      }, 100);
    }
  }

  _parseArgs(args) {
    let callback;
    let params = null; // null = no params, [] = array, {} = object
    for (const arg of args) {
      if (typeof arg === 'function') { callback = arg; break; }
      else if (Array.isArray(arg)) params = arg;
      else if (typeof arg === 'object' && arg !== null) params = arg; // named params from Sequelize
      else if (arg !== undefined && arg !== null) {
        if (!Array.isArray(params)) params = [];
        params.push(arg);
      }
    }
    return { callback, params };
  }

  // Prepare params for sql.js - accepts array or object
  _prepareParams(params) {
    if (!params) return undefined;
    if (Array.isArray(params)) {
      if (params.length === 0) return undefined;
      // Convert array to named params: $1, $2, ...
      const obj = {};
      for (let i = 0; i < params.length; i++) {
        obj[`$${i + 1}`] = params[i] === undefined ? null : params[i];
      }
      return obj;
    }
    // Already an object with $1, $2, ... keys from Sequelize
    return params;
  }

  run(sql, ...args) {
    const { callback, params } = this._parseArgs(args);
    try {
      if (!this._db) throw new Error('Database not initialized');
      const prepared = this._prepareParams(params);
      if (prepared) {
        this._db.run(sql, prepared);
      } else {
        this._db.run(sql);
      }
      const changes = this._db.getRowsModified();
      let lastID = 0;
      if (/^\s*INSERT/i.test(sql)) {
        try {
          const r = this._db.exec('SELECT last_insert_rowid() as id');
          if (r.length > 0 && r[0].values.length > 0) lastID = r[0].values[0][0];
        } catch (e) { /* ignore */ }
      }
      this._persist();
      const ctx = { changes, lastID };
      if (callback) process.nextTick(() => callback.call(ctx, null));
    } catch (err) {
      if (callback) process.nextTick(() => callback.call({ changes: 0, lastID: 0 }, err));
    }
    return this;
  }

  all(sql, ...args) {
    const { callback, params } = this._parseArgs(args);
    try {
      if (!this._db) throw new Error('Database not initialized');
      const namedParams = this._prepareParams(params);
      const stmt = this._db.prepare(sql);
      if (namedParams) stmt.bind(namedParams);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      if (callback) process.nextTick(() => callback(null, rows));
    } catch (err) {
      if (callback) process.nextTick(() => callback(err, []));
    }
    return this;
  }

  get(sql, ...args) {
    const { callback, params } = this._parseArgs(args);
    try {
      if (!this._db) throw new Error('Database not initialized');
      const namedParams = this._prepareParams(params);
      const stmt = this._db.prepare(sql);
      if (namedParams) stmt.bind(namedParams);
      let row = undefined;
      if (stmt.step()) row = stmt.getAsObject();
      stmt.free();
      if (callback) process.nextTick(() => callback(null, row));
    } catch (err) {
      if (callback) process.nextTick(() => callback(err));
    }
    return this;
  }

  exec(sql, callback) {
    try {
      if (!this._db) throw new Error('Database not initialized');
      this._db.exec(sql);
      this._persist();
      if (callback) process.nextTick(() => callback(null));
    } catch (err) {
      if (callback) process.nextTick(() => callback(err));
    }
    return this;
  }

  close(callback) {
    try {
      if (this._db) {
        this._persist();
        this._db.close();
        this._db = null;
      }
      if (callback) process.nextTick(() => callback(null));
    } catch (err) {
      if (callback) process.nextTick(() => callback(err));
    }
    return this;
  }

  configure() { return this; }
  serialize(fn) { if (fn) fn(); return this; }
  parallelize(fn) { if (fn) fn(); return this; }
}

module.exports = {
  Database,
  OPEN_READWRITE: 2,
  OPEN_CREATE: 4,
  OPEN_FULLMUTEX: 0x00010000,
  OPEN_URI: 0x00000040,
  OPEN_SHAREDCACHE: 0x00020000,
  OPEN_PRIVATECACHE: 0x00040000,
  OPEN_READONLY: 1,
  verbose: function () { return this; },
};
