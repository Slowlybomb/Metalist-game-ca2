DROP TABLE IF EXISTS records;

CREATE TABLE records
(
    recordId INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT,
    recordTime FLOAT,
    points INTEGER,
    beenSeen BOOLEAN,
    amount_of_enemies INTEGER
);