import { exec } from 'child_process';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import electronSquirrelStartup from 'electron-squirrel-startup';
import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

if (electronSquirrelStartup) app.quit();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const iconPath = join(__dirname, 'assets', 'github-logo.png');

const isDev = process.argv.includes('--dev');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:4200');
  } else {
    win.loadFile(join(__dirname, 'dist', 'git-switcher', 'browser', 'index.html'));
  }
}

app.whenReady()
  .then(createWindow)
  .catch(err => console.error('Erro ao iniciar o app:', err));

ipcMain.handle('select-repo', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('set-git-config', async (_, { userName, userEmail, scope, repoPath }) => {
  const baseCmd = scope === 'global' ? `git config --global` : `git -C "${repoPath}" config`;
  return new Promise((resolve, reject) => {
    exec(`${baseCmd} user.name "${userName}" && ${baseCmd} user.email "${userEmail}"`, (err) => {
      if (err) return reject(`Erro ao aplicar configurações: ${err.message}`);
      resolve('Configuração aplicada com sucesso!');
    });
  });
});

ipcMain.handle('get-git-config', async (_, { scope, repoPath }) => {
  const baseCmd = scope === 'global' ? `git config --global` : `git -C "${repoPath}" config`;
  return new Promise((resolve, reject) => {
    exec(`${baseCmd} user.name && ${baseCmd} user.email`, (err, stdout) => {
      if (err) return reject(`Erro ao obter configurações: ${err.message}`);
      const [name, email] = stdout.trim().split('\n');
      const result = [`user.name=${name || ''}`, `user.email=${email || ''}`].join('\n');
      resolve(result);
    });
  });
});

ipcMain.handle('reset-git-config', async (_, { scope, repoPath }) => {
  const baseCmd = scope === 'global' ? `git config --global` : `git -C "${repoPath}" config`;
  return new Promise((resolve, reject) => {
    exec(`${baseCmd} --unset user.name && ${baseCmd} --unset user.email`, (err) => {
      if (err) {
        if (err.message.includes('unset') || err.message.includes('not found')) {
          return resolve('Nenhuma configuração para remover.');
        }
        return reject(`Erro ao resetar configurações: ${err.message}`);
      }
      resolve('Configurações de Git resetadas com sucesso!');
    });
  });
});

ipcMain.handle('export-accounts', async (event, accounts) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Exportar contas',
    defaultPath: 'contas.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (filePath) {
    fs.writeFileSync(filePath, JSON.stringify(accounts, null, 2), 'utf-8');
    return 'Exportado com sucesso!';
  }
  throw new Error('Exportação cancelada');
});

ipcMain.handle('import-accounts', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Importar contas',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (filePaths && filePaths[0]) {
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    return JSON.parse(content);
  }
  throw new Error('Importação cancelada');
});

ipcMain.handle('get-commits', async (event, repoPath) => {
  return new Promise((resolve, reject) => {
    const command = `git -C "${repoPath}" log --pretty=format:"%an|%s|%ad" --date=iso --max-count=10`;
    exec(command, (err, stdout) => {
      if (err) return reject(err.message);
      const commits = stdout.split('\n').map(line => {
        const [author, message, date] = line.split('|');
        return { author, message, date };
      });
      resolve(commits);
    });
  });
});

ipcMain.handle('is-git-repo', async (_, repoPath) => {
	try {
		const gitPath = join(repoPath, '.git');
		fs.access(gitPath, fs.constants.F_OK);
		return true;
	} catch (error) {
		return false;
	}
});
