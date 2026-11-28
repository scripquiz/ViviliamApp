import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { NavController, IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

interface LifeEventReference {
  book: string;
  start: {
    chapter: number;
    verse: number | null;
  };
  end: {
    chapter: number;
    verse: number | null;
  };
}

interface LifeEventItem {
  id: number;
  event: string;
  event_tamil?: string;
  references?: LifeEventReference[];
  reference?: LifeEventReference;
}

@Component({
  selector: 'app-life-events',
  templateUrl: './life-events.page.html',
  styleUrls: ['./life-events.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [FormsModule, IonicModule],
})
export class LifeEventsPage {
  private navctrl = inject(NavController);
  private http = inject(HttpClient);

  private readonly STORAGE_LANGUAGE_KEY = 'life_events_language';

  public selectedLanguage: 'ta' | 'en' = 'ta';
  public events: LifeEventItem[] = [];

  async ionViewWillEnter() {
    const saved = localStorage.getItem(this.STORAGE_LANGUAGE_KEY);
    this.selectedLanguage = saved === 'en' ? 'en' : 'ta';
    await this.loadEvents();
  }

  navBack() {
    this.navctrl.back();
  }

  async onLanguageChange(value: string | null | undefined) {
    this.selectedLanguage = value === 'en' ? 'en' : 'ta';
    localStorage.setItem(this.STORAGE_LANGUAGE_KEY, this.selectedLanguage);
  }

  openEvent(item: LifeEventItem) {
    this.navctrl.navigateForward(
      `/life-events/${item.id}?lang=${this.selectedLanguage}`
    );
  }

  getEventLabel(item: LifeEventItem): string {
    if (this.selectedLanguage === 'ta') {
      return String(item.event_tamil || item.event || '').trim();
    }

    return String(item.event || item.event_tamil || '').trim();
  }

  private async loadEvents() {
    const raw = await firstValueFrom(
      this.http.get('assets/data/15.ts', { responseType: 'text' })
    );
    const parsed = JSON.parse(raw) as LifeEventItem[];
    this.events = (parsed || []).map((item, index) => ({
      ...item,
      id: index,
    }));
  }
}
