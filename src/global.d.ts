import { Account } from './app/models/account';

export { };

declare global {
	interface Window {
		electronAPI: {
			setGitConfig: (config: {
				userName: string; userEmail: string; scope: 'local' | 'global'; repoPath?: string;
			}) => Promise<string>;

			selectRepoDialog: () => Promise<string | null>;

			getGitConfig: (config: { scope: 'local' | 'global'; repoPath?: string; }) => Promise<string>;

			resetGitConfig: (config: { scope: 'local' | 'global'; repoPath?: string; }) => Promise<string>;

			exportAccounts: (accounts: Account[]) => Promise<void>;

			importAccounts: () => Promise<Account[]>;

			getCommits: (repoPath: string) => Promise<{ author: string; message: string; date: string; }[]>;

			isGitRepo: (repoPath: string) => Promise<boolean>
		};
	}
}
