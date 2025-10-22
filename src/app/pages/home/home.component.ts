import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AccountModalComponent } from '../../components/account-modal/account-modal.component';
import { CardComponent } from '../../components/card/card.component';
import { CommitHistoryModalComponent } from '../../components/commit-history-modal/commit-history-modal.component';
import { Account } from '../../models/account';
import { AccountService } from '../../services/account.service';
import { LocalGitService } from '../../services/local-git.service';

@Component({
	selector: 'app-home',
	standalone: true,
	imports: [
		CommonModule,
		CardComponent,
		AccountModalComponent,
		CommitHistoryModalComponent
	],
	templateUrl: './home.component.html',
	styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
	accounts: Account[] = [];

	showModal = false;
	selectedAccount?: Account;

	selectedRepo: string | null = null;
	selectedHistoryAccount: Account | null = null;

	constructor(
		private accountService: AccountService,
		private localGitService: LocalGitService
	) { }

	ngOnInit(): void {
		this.loadAccounts();
	}

	loadAccounts() {
		this.accounts = this.accountService.getAll();
	}

	openAddModal() {
		this.selectedAccount = undefined;
		this.showModal = true;
	}

	openEditModal(account: Account) {
		this.selectedAccount = account;
		this.showModal = true;
	}

	handleSubmit(data: Omit<Account, 'id' | 'avatar_url'>) {
		if (this.selectedAccount) {
			const updatedAccount: Account = {
				...this.selectedAccount,
				...data
			};
			this.accountService.updateAccount(updatedAccount);
		} else {
			if (!data?.username) return;
			this.accountService.addAccount(data);
		}

		this.selectedAccount = undefined;
		this.loadAccounts();
		this.handleClose();
	}

	handleClose() {
		this.selectedAccount = undefined;
		this.showModal = false;
	}

	setActive({ id, scope }: { id: number; scope: 'local' | 'global' }) {
		this.accountService.setActiveAccount(id, scope);
		this.loadAccounts();
	}

	removeAccount(id: number) {
		this.accountService.removeAccount(id);
		this.loadAccounts();
	}

	setLocal(account: Account) {
		this.accountService.setLocalAccount(account);
	}

	getLinkedRepos(accountId: number): string[] {
		return this.localGitService.getReposByAccount(accountId);
	}

	getFolderName(path: string): string {
		return path.split(/[\\/]/).pop() || path;
	}

	isAccountUsedLocally(accountId: number): boolean {
		return this.localGitService.getReposByAccount(accountId).length > 0;
	}

	viewConfig(scope: 'local' | 'global') {
		this.accountService.viewGitConfig(scope);
	}

	async resetConfig(scope: 'local' | 'global') {
		if (window.confirm(`Tem certeza que deseja resetar as configurações ${scope}?`)) {
			try {
				const needsReload = await this.accountService.resetGitConfig(scope);
				if (needsReload) {
					window.location.reload();
				}
				this.loadAccounts();
			} catch (error) {
				this.loadAccounts();
			}
		}
	}

	exportAccounts() {
		this.accountService.exportAccounts();
	}

	async importAccounts() {
		this.accountService.importAccounts();
		window.location.reload();
	}

	openHistory(account: Account, repo: string): void {
		this.selectedRepo = repo;
		this.selectedHistoryAccount = account;
	}

	closeHistory(): void {
		this.selectedRepo = null;
		this.selectedHistoryAccount = null;
	}
}
