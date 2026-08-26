import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

 export interface Character {
  id: number;
  name: string;
  status: string;
  species: string;
  image: string;
  gender?: string;
  origin?: { name: string };
  location?: { name: string };
 }

 @Injectable({
  providedIn: 'root'
 })
 export class CharacterService {
  private apiUrl = 'https://rick-morty-api-1-0oqu.onrender.com/api';

  constructor(private http: HttpClient) {}

  getCharacters(name: string = '', status: string = '', species: string = '', page: number = 1): Observable<any>{
    let params = new HttpParams().set('page', page.toString());
    
    if (name) params =  params.set('name', name);
    if (status) params = params.set('status', status);
    if (species) params = params.set('species', species);

    return this.http.get<any>(`${this.apiUrl}/characters`, { params });
  }

  getCharacterDetail(id: number): Observable<Character> {
    return this.http.get<Character>(`${this.apiUrl}/characters/${id}`);
  }

  getFavorites(): Observable<Character[]> {
    return this.http.get<Character[]>(`${this.apiUrl}/favorites`);
  }

  addFavorite(character: Character): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/favorites`,  character);
  }

  removeFavorite(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/favorites/${id}`);
  }
 }