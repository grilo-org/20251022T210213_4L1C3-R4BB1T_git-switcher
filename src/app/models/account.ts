export interface Account {
	id: number;
	type: string;
	name: string;
	username: string;
	email: string;
	avatar_url: string;
	isActive?: boolean;
	scope?: 'local' | 'global';
}
