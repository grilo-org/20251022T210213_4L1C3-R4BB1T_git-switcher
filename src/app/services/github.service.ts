import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GitHubUser } from '../models/github-user';

@Injectable({
	providedIn: 'root'
})
export class GithubService {

	private baseUrl = 'https://api.github.com/users';

	constructor(private http: HttpClient) { }

	getUser(username: string): Observable<GitHubUser> {
		return this.http.get<GitHubUser>(`${this.baseUrl}/${username}`);
	}

}
