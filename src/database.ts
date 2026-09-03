import sqlite3 from "sqlite3";
import {open} from 'sqlite';

export async function openDb(){
   return open({
    filename: './database.sqlite',
    driver: sqlite3.Database
   });
}

export async function initDb() {
  const db = await openDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS jogos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL,
      nota INTEGER NOT NULL,
      review TEXT NOT NULL,
      favorito INTEGER DEFAULT 0
    )
  `);

}

