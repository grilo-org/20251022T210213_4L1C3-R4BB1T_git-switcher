import { Injectable } from '@angular/core';
import { Account } from '../models/account';

type GitCommit = {
	author: string;
	message: string;
	date: string;
};

type GitConfigSetArgs = {
	userName: string;
	userEmail: string;
	scope: 'local' | 'global';
	repoPath?: string;
};

type GitConfigGetArgs = {
	scope: 'local' | 'global';
	repoPath?: string;
};


@Injectable({
	providedIn: 'root',
})
export class ElectronApiService {
	private get api() {
		if (!window.electronAPI) {
			throw new Error('Electron API (window.electronAPI) não está disponível.');
		}
		return window.electronAPI;
	}

	setGitConfig(args: GitConfigSetArgs): Promise<string> {
		return this.api.setGitConfig(args);
	}

	getGitConfig(args: GitConfigGetArgs): Promise<string> {
		return this.api.getGitConfig(args);
	}

	resetGitConfig(args: GitConfigGetArgs): Promise<string> {
		return this.api.resetGitConfig(args);
	}

	selectRepoDialog(): Promise<string | null> {
		return this.api.selectRepoDialog();
	}

	exportAccounts(accounts: Account[]): Promise<void> {
		return this.api.exportAccounts(accounts);
	}

	importAccounts(): Promise<Account[]> {
		return this.api.importAccounts();
	}

	getCommits(repoPath: string): Promise<GitCommit[]> {
		return this.api.getCommits(repoPath);
	}

	isGitRepo(repoPath: string): Promise<boolean> {
		return this.api.isGitRepo(repoPath);
	}
}
