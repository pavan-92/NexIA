import { createPool, Pool } from 'mysql2/promise';
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import * as schema from '../models/schema';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

// Variáveis de conexão com o banco de dados
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'nexia_db';
const AUTO_MIGRATE = process.env.AUTO_MIGRATE === 'true';

// Variável global para armazenar a conexão com o banco de dados
let db: MySql2Database<typeof schema> | null = null;
let pool: Pool | null = null;

// Tipo para garantir consistência nas funções
type Database = MySql2Database<typeof schema>;

/**
 * Conecta ao banco de dados MySQL e inicializa o ORM Drizzle
 */
export async function connectToDatabase(): Promise<Database> {
  if (db) return db as Database;

  try {
    // Cria pool de conexões
    pool = createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Inicializa o Drizzle ORM
    db = drizzle(pool, { schema, mode: 'default' });
    
    // Executa as migrações do banco de dados, se configurado
    if (AUTO_MIGRATE) {
      try {
        console.log('Executando migrações automáticas...');
        await migrate(db, { migrationsFolder: './drizzle' });
        console.log('Migrações concluídas com sucesso');
      } catch (error: any) {
        console.warn('Aviso: Não foi possível executar migrações automáticas:', error.message);
        console.log('Continuando sem migrações automáticas...');
      }
    }

    return db as Database;
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}

/**
 * Obtém a instância atual do banco de dados
 */
export function getDatabase(): Database | null {
  return db as Database | null;
}

/**
 * Fecha a conexão com o banco de dados
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    db = null;
    pool = null;
    console.log('Conexão com o banco de dados fechada');
  }
}