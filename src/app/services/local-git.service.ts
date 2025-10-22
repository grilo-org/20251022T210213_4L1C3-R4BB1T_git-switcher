import { Injectable } from '@angular/core';
import { LocalGitConfig } from '../models/local-git-config';

@Injectable({ providedIn: 'root' })
export class LocalGitService {
	private readonly KEY = 'local-git-configs';

	set(repoPath: string, accountId: number): void {
		const filtered = this.getAll().filter(c => c.repoPath !== repoPath);
		filtered.push({ repoPath, accountId });
		localStorage.setItem(this.KEY, JSON.stringify(filtered));
	}

	getAll(): LocalGitConfig[] {
		return JSON.parse(localStorage.getItem(this.KEY) || '[]');
	}

	getByRepo(repoPath: string): LocalGitConfig | undefined {
		return this.getAll().find(cfg => cfg.repoPath === repoPath);
	}

	getReposByAccount(accountId: number): string[] {
		return this.getAll()
			.filter(c => c.accountId === accountId)
			.map(c => c.repoPath);
	}

	remove(repoPath: string): void {
		const remaining = this.getAll().filter(cfg => cfg.repoPath !== repoPath);
		localStorage.setItem(this.KEY, JSON.stringify(remaining));
	}

}
