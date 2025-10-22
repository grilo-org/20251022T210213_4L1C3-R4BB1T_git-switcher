import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { Account } from '../models/account';
import { ElectronApiService } from './electron-api.service';
import { GithubService } from './github.service';
import { LocalGitService } from './local-git.service';

type LocalGitConfig = {
	repoPath: string;
	accountId: number;
};

@Injectable({
	providedIn: 'root',
})
export class AccountService {

	private readonly STORAGE_KEY = 'accounts';
	private readonly LOCAL_GIT_STORAGE_KEY = 'local-git-configs';
	accounts: Account[] = [];

	avatar?: string;

	constructor(
		private githubService: GithubService,
		private toastrService: ToastrService,
		private localGitService: LocalGitService,
		private electronApiService: ElectronApiService
	) {
		this.loadAccounts();
	}

	loadAccounts(): void {
		const data = localStorage.getItem(this.STORAGE_KEY);
		this.accounts = data ? JSON.parse(data) : [];
	}

	getAll(): Account[] {
		return this.accounts;
	}

	async addAccount(account: Omit<Account, 'id' | 'avatar_url'>): Promise<void> {
		let avatar_url = '';

		try {
			const userData = await firstValueFrom(this.githubService.getUser(account.username));
			avatar_url = userData.avatar_url;
		} catch (error) {
			this.toastrService.error("Usuário não encontrado.");
			return;
		}

		const newAccount: Account = {
			id: this.generateId(),
			...account,
			avatar_url
		};

		this.accounts.push(newAccount);
		this.saveAccounts();
		this.toastrService.success("Conta adicionada com sucesso.");
	}

	saveAccounts(): void {
		localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.accounts));
	}

	generateId(): number {
		return this.accounts.length > 0
			? Math.max(...this.accounts.map(acc => acc.id)) + 1
			: 1;
	}

	async setActiveAccount(id: number, scope: 'local' | 'global'): Promise<void> {
		const activeAcc = this.accounts.find(acc => acc.id === id);
		if (!activeAcc) {
			this.toastrService.error("Conta não encontrada.");
			return;
		}

		let finalScope = scope;

		if (scope === 'local') {
			const isLocallyTracked = this.localGitService.getReposByAccount(id).length > 0;
			if (!isLocallyTracked) {
				this.toastrService.warning("Esta conta não está associada a nenhum repositório local configurado. Ativando como global.");
				finalScope = 'global';
			}
		}

		this.accounts = this.accounts.map(acc => ({
			...acc,
			isActive: acc.id === id,
			scope: acc.id === id ? finalScope : undefined
		}));
		this.saveAccounts();

		try {
			await this.electronApiService.setGitConfig({
				userName: activeAcc.name,
				userEmail: activeAcc.email,
				scope: finalScope
			});
			this.toastrService.success(
				`Git configurado com: ${activeAcc.name} <${activeAcc.email}>`,
				`Conta ativada (${finalScope})`
			);
		} catch (err: any) {
			this.accounts = this.accounts.map(acc => ({
				...acc,
				scope: acc.id === id ? undefined : acc.scope
			}));
			this.saveAccounts();

			this.toastrService.error("Erro ao configurar Git global", err.message);
		}
	}

	async setLocalAccount(account: Account): Promise<void> {
		const repoPath = await this.electronApiService.selectRepoDialog();
		if (!repoPath) return;

		try {
			const isRepo = await this.electronApiService.isGitRepo(repoPath);
			if (!isRepo) {
				this.toastrService.error(`O diretório selecionado não é um repositório Git válido. Verifique se contém a pasta .git.`);
				return;
			}
		} catch (err: any) {
			this.toastrService.error(`Falha ao verificar o diretório: ${err.message}`);
			return;
		}

		this.localGitService.set(repoPath, account.id);

		try {
			await this.electronApiService.setGitConfig({
				userName: account.name,
				userEmail: account.email,
				scope: 'local',
				repoPath
			});

			this.toastrService.success(
				`Conta local configurada para ${repoPath}`,
				'Git Local'
			);
		} catch (err: any) {
			this.localGitService.remove(repoPath);
			this.toastrService.error("Erro ao configurar Git local. Associação removida.", err.message);
		}
	}

	getActiveAccount(): Account | undefined {
		return this.accounts.find(acc => acc.isActive);
	}

	removeAccount(id: number): void {
		const confirmar = window.confirm('Tem certeza que deseja remover esta conta?');
		if (!confirmar) return;

		this.accounts = this.accounts.filter(acc => acc.id !== id);
		this.saveAccounts();

		const raw = localStorage.getItem(this.LOCAL_GIT_STORAGE_KEY);
		if (raw) {
			try {
				const localConfigs: LocalGitConfig[] = JSON.parse(raw);
				const updated = localConfigs.filter((item: LocalGitConfig) => item.accountId !== id);
				localStorage.setItem(this.LOCAL_GIT_STORAGE_KEY, JSON.stringify(updated));
			} catch (e) {
				this.toastrService.warning('Não foi possível limpar configurações locais antigas.');
			}
		}

		this.toastrService.success("Conta removida com sucesso.");
	}

	updateAccount(updated: Account): void {
		this.accounts = this.accounts.map(acc => {
			if (acc.id === updated.id) {
				return { ...acc, ...updated }
			}
			return acc
		});
		this.saveAccounts();
		this.toastrService.success("Conta atualizada com sucesso.");
	}

	async viewGitConfig(scope: 'local' | 'global') {
		try {
			if (scope === 'local') {
				const repoPath = await this.electronApiService.selectRepoDialog();
				if (!repoPath) return;

				const isGit = await this.electronApiService.isGitRepo(repoPath);
				if (!isGit) {
					this.toastrService.error('O caminho selecionado não é um repositório Git válido.', 'Erro');
					return;
				}

				const result = await this.electronApiService.getGitConfig({ scope, repoPath } as any);
				this.toastrService.info(result, `Configurações Locais`);
			} else {
				const result = await this.electronApiService.getGitConfig({ scope });
				this.toastrService.info(result, `Configurações Globais`);
			}
		} catch (err: any) {
			this.toastrService.error(err.message);
		}
	}

	async resetGitConfig(scope: 'local' | 'global'): Promise<boolean> {
		if (scope === 'local') {
			try {
				const repoPath = await this.electronApiService.selectRepoDialog();
				if (!repoPath) return false;

				const isGit = await this.electronApiService.isGitRepo(repoPath);
				if (!isGit) {
					this.toastrService.error('O caminho selecionado não é um repositório Git válido.', 'Erro');
					return false;
				}

				const result = await this.electronApiService.resetGitConfig({ scope, repoPath } as any);
				this.localGitService.remove(repoPath);
				this.toastrService.info(result, `Resetado (${scope})`);
				return true;
			} catch (err: any) {
				this.toastrService.error(err.message);
				return false;
			}
		} else {
			try {
				const msg = await this.electronApiService.resetGitConfig({ scope });
				this.toastrService.success(msg, `Resetado (${scope})`);
				return false;
			} catch (err: any) {
				this.toastrService.error(err.message);
				return false;
			}
		}
	}

	exportAccounts(): void {
		const exportData = this.accounts.map(account => ({ ...account, isActive: false }));
		this.electronApiService.exportAccounts(exportData)
			.then(() => this.toastrService.success('Contas exportadas com sucesso!'))
			.catch(err => this.toastrService.error('Erro ao exportar', err.message));
	}

	importAccounts(): void {
		this.electronApiService.importAccounts()
			.then((imported: Account[]) => {
				this.accounts = [...this.accounts, ...imported];
				this.saveAccounts();
				this.toastrService.success('Contas importadas com sucesso!');
				localStorage.removeItem(this.LOCAL_GIT_STORAGE_KEY);
				window.location.reload();
			})
			.catch(err => this.toastrService.error('Erro ao importar', err.message));
	}

}
