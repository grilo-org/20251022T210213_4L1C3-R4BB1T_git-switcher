import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Account } from '../../models/account';

@Component({
	selector: 'app-commit-history-modal',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './commit-history-modal.component.html',
	styleUrls: ['./commit-history-modal.component.scss']
})
export class CommitHistoryModalComponent implements OnInit {
	@Input() repoPath!: string;
	@Input() account!: Account;
	@Output() close = new EventEmitter<void>();

	commits: { author: string; message: string; date: string }[] = [];

	isLoadingCommits = false;

	get repoName(): string {
		return this.repoPath.split(/[/\\]/).pop() ?? this.repoPath;
	}

	ngOnInit(): void {
		this.isLoadingCommits = true;
		window.electronAPI.getCommits(this.repoPath)
			.then(result => this.commits = result)
			.catch(() => this.commits = [])
			.finally(() => this.isLoadingCommits = false);
	}
}
