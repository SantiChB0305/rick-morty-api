import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CharacterService, Character } from './services/character';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  activeTab: 'home' | 'search' | 'favorites' = 'home';

  homeCharacters: Character[] = [];
  characters: Character[] = [];
  favorites: Character[] = [];

  selectedCharacter: Character | null = null;

  searchName: string = '';
  selectedStatus: string = '';
  selectedSpecies: string = '';

  loadingHome: boolean = false;
  loadingSearch: boolean = false;

  currentPage: number =1;
  totalPages: number =1;

  constructor(private characterService: CharacterService) {}

  ngOnInit(): void {
    this.loadHomeCharacters();
    this.loadCharacters();
    this.loadFavorites();
  }

  setTab(tab: 'home' | 'search' | 'favorites'): void {
    this.activeTab = tab;
    if (tab === 'search') {
      this.loadCharacters();
    } else if (tab === 'favorites') {
      this.loadFavorites();
    }
  }

  loadHomeCharacters(): void {
    this.loadingHome = true;
    this.characterService.getCharacters('Rick').subscribe({
      next: (data) => {
        this.homeCharacters = data.results || [];
        this.loadingHome = false;
      },
      error: () => {
        this.homeCharacters = [];
        this.loadingHome = false;
      }
    });
  }

  loadCharacters(page: number = 1): void {
    this.currentPage = page;
    this.loadingSearch = true;

    this.characterService
      .getCharacters(this.searchName, this.selectedStatus, this.selectedSpecies, this.currentPage)
      .subscribe({
        next: (data) => {
          this.characters = data.results || [];
          this.totalPages = data.info?.pages || 1;
          this.loadingSearch = false;
        },
        error: () => {
          this.characters = [];
          this.totalPages =1;
          this.loadingSearch = false;
        }
      });
  }

  changePage(delta: number): void {
    const newPage = this.currentPage + delta;
    if (newPage >= 1 && newPage <= this.totalPages){
      this.loadCharacters(newPage);
    }
  }

  loadFavorites(): void {
    this.characterService.getFavorites().subscribe({
      next: (favs) => (this.favorites = favs),
      error: (err) => console.log('MongoDB deshabilitado o indisponible', err)
    });
  }

  isFavorite(characterId: number): boolean {
    return this.favorites.some((fav) => fav.id === characterId);
  }

  toggleFavorite(character: Character): void {
    if (this.isFavorite(character.id)) {
      this.characterService.removeFavorite(character.id).subscribe(() => {
        this.loadFavorites();
      });
    } else {
      this.characterService.addFavorite(character).subscribe(() => {
        this.loadFavorites();
      });
    }
  }

  openDetail(character: Character): void {
    this.characterService.getCharacterDetail(character.id).subscribe((data) => {
      this.selectedCharacter = data;
    });
  }

  closeDetail(): void {
    this.selectedCharacter = null;
  }

  clearFilters(): void{
    this.searchName= '';
    this.selectedStatus= '';
    this.selectedSpecies= '';
    this.loadCharacters(1);
  }
}