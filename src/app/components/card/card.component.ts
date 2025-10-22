import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Account } from '../../models/account';

@Component({
	selector: 'app-card',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './card.component.html',
	styleUrl: './card.component.scss'
})
export class CardComponent {
	@Input() account: Account = { id: 0, type: '', name: '', username: '', email: '', avatar_url: '' };

	@Input() linkedRepos: string[] = [];
	@Input() usedLocally: boolean = false;

	@Output() activate = new EventEmitter<{ id: number; scope: 'local' | 'global'; }>();
	@Output() activateLocal = new EventEmitter<void>();
	@Output() edit = new EventEmitter<Account>();
	@Output() remove = new EventEmitter<number>();

	@Output() viewHistory = new EventEmitter<string>();

	setActive(scope: 'local' | 'global') {
		this.activate.emit({ id: this.account.id, scope });
	}

	getRepoName(path: string): string {
		return path.split(/[/\\]/).pop() ?? path;
	}

	viewCommits(repoPath: string): void {
		this.viewHistory.emit(repoPath);
	}
}
