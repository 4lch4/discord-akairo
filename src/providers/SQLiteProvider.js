const Provider = require('./Provider');

class SQLiteProvider extends Provider {
    constructor(db, tableName, dataColumn) {
        super();

        this.db = db;
        this.tableName = tableName;
        this.dataColumn = dataColumn;
    }

    init() {
        return this.db.all('SELECT * FROM $table', { $table: this.tableName }).then(rows => {
            for (const row of rows) {
                this.items.set(row.id, this.dataColumn ? JSON.parse(row[this.dataColumn]) : row);
            }
        });
    }

    get(id, key, defaultValue) {
        if (this.items.has(id)) {
            const value = this.items.get(id)[key];
            return value == null ? defaultValue : value;
        }

        return defaultValue;
    }

    set(id, key, value) {
        const data = this.items.get(id) || {};
        data[key] = value;
        this.items.set(id, data);

        if (this.dataColumn) {
            return this.db.run('REPLACE INTO $table (id, $key) VALUES ($id, $value)', {
                $table: this.tableName,
                $key: this.dataColumn,
                $id: id,
                $value: JSON.stringify(data)
            });
        }

        return this.db.run('REPLACE INTO $table (id, $key) VALUES ($id, $value)', {
            $table: this.tableName,
            $key: key,
            $id: id,
            $value: value
        });
    }

    delete(id, key) {
        const data = this.items.get(id) || {};
        delete data[key];

        if (this.dataColumn) {
            return this.db.run('REPLACE INTO $table (id, $key) VALUES ($id, $value)', {
                $table: this.tableName,
                $key: this.dataColumn,
                $id: id,
                $value: JSON.stringify(data)
            });
        }

        return this.db.run('REPLACE INTO $table (id, $key) VALUES ($id, $value)', {
            $table: this.tableName,
            $key: key,
            $id: id,
            $value: null
        });
    }

    clear(id) {
        this.items.delete(id);
        return this.db.run('DELETE FROM $table WHERE id = $id', {
            $table: this.tableName,
            $id: id
        });
    }
}

module.exports = SQLiteProvider;
