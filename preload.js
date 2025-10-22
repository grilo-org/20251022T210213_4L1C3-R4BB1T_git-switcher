const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	setGitConfig: (config) => ipcRenderer.invoke('set-git-config', config),
	selectRepoDialog: () => ipcRenderer.invoke('select-repo'),
	getGitConfig: (config) => ipcRenderer.invoke('get-git-config', config),
	resetGitConfig: (config) => ipcRenderer.invoke('reset-git-config', config),
	exportAccounts: (accounts) => ipcRenderer.invoke('export-accounts', accounts),
	importAccounts: () => ipcRenderer.invoke('import-accounts'),
	getCommits: (repoPath) => ipcRenderer.invoke('get-commits', repoPath),
	isGitRepo: (repoPath) => ipcRenderer.invoke('is-git-repo', repoPath)
});
