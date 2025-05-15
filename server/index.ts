/**
 * Este arquivo serve como um ponto de entrada para o Replit
 * Ele redirecionará para o arquivo de entrada real no diretório backend
 */

import { spawn } from 'child_process';
import { join } from 'path';
import * as fs from 'fs';

// Definir os caminhos para o backend e frontend
const backendPath = join(process.cwd(), 'backend');
const frontendPath = join(process.cwd(), 'frontend');

// Verificar se os diretórios existem
if (!fs.existsSync(backendPath)) {
  console.error('Erro: Diretório backend não encontrado!');
  process.exit(1);
}

if (!fs.existsSync(frontendPath)) {
  console.error('Erro: Diretório frontend não encontrado!');
  process.exit(1);
}

console.log('=== Iniciando NexIA ===');
console.log('Estrutura de diretórios verificada...');

// Função para iniciar o backend
const startBackend = () => {
  console.log('\n=== Iniciando Backend ===');
  const backend = spawn('node', ['-r', 'ts-node/register', './index.ts'], {
    cwd: backendPath,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development', PORT: '5000' },
  });

  backend.on('error', (err) => {
    console.error('Erro ao iniciar o backend:', err);
  });

  backend.on('exit', (code) => {
    console.log(`Processo do backend encerrado com código ${code}`);
  });

  return backend;
};

// Iniciar o backend
const backendProcess = startBackend();

// Encerrar processos quando o script principal for encerrado
process.on('SIGINT', () => {
  console.log('Encerrando processos...');
  backendProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Encerrando processos...');
  backendProcess.kill();
  process.exit(0);
});