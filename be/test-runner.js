#!/usr/bin/env node

/**
 * Script utilitaire pour charger les variables d'environnement avant d'exécuter les tests
 * Usage: node test-runner.js <test-file>
 * Exemple: node test-runner.js test-audits.js
 */

import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Charger les variables d'environnement
dotenv.config();

// Obtenir le fichier de test depuis les arguments
const testFile = process.argv[2];

if (!testFile) {
  console.error('❌ Erreur: Aucun fichier de test spécifié');
  console.log('Usage: node test-runner.js <test-file>');
  console.log('Exemple: node test-runner.js test-audits.js');
  process.exit(1);
}

// Afficher les variables d'environnement utilisées
console.log('🔧 Configuration:');
console.log(`   API_BASE_URL: ${process.env.API_BASE_URL || 'http://localhost:4000'}`);
console.log(`   PORT: ${process.env.PORT || '4000'}`);
console.log('');

// Exécuter le fichier de test
const testProcess = spawn('node', [testFile], {
  stdio: 'inherit',
  env: process.env
});

testProcess.on('close', (code) => {
  process.exit(code);
});
