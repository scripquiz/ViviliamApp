import {
  Component,
  OnInit,
  OnChanges,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { DatabaseConnection } from 'src/app/services/database.service';
import { AuthserviceProvider } from 'src/providers/authservice/authservice';
import { ShareService } from '../../providers/share.service';
import { Clipboard } from '@capacitor/clipboard';
import { Toast } from '@capacitor/toast';
import {
  COLOR_THEMES,
  ImageRatio,
  VerseImageService,
} from '../../services/verse-image.service';
import { RatioDialogComponent } from '../../shared/ratio-dialog/ratio-dialog.component';

@Component({
  selector: 'app-daily-bible-verse',
  templateUrl: './daily-bible-verse.component.html',
  styleUrls: ['./daily-bible-verse.component.scss'],
  imports: [IonicModule, FormsModule, RatioDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyBibleVerseComponent implements OnInit, OnChanges {
  private authservice = inject(AuthserviceProvider);
  private shareService = inject(ShareService);
  private cdr = inject(ChangeDetectorRef);
  private verseImageService = inject(VerseImageService);

  // Inputs from parent component
  @Input() database: DatabaseConnection;

  // Verse data
  public tamilVerse: string = '';
  public tamilVerseReference: string = '';
  public englishVerse: string = '';
  public englishVerseReference: string = '';
  public verseoftheday: string = '';
  public verseoftheday_reference: string = '';
  public dailyVerseLanguage: string = 'English';
  public dailyVerseLanguageAlternate: string = 'Tamil';
  public menuOpen: boolean = false;
  public menuEvent?: Event;
  public isLoading: boolean = true;
  public selectedColorTheme: number = 0; // Default to first theme
  public showRatioDialog: boolean = false;

  ngOnInit() {
    this.dailyVerseLanguage = this.authservice.dailyVerse;
    this.applyLanguage();
  }

  // Shows the loaded verse in the selected language and sets the other as the menu option
  private applyLanguage() {
    const isTamil = this.dailyVerseLanguage.toUpperCase() === 'TAMIL';
    this.verseoftheday = isTamil ? this.tamilVerse : this.englishVerse;
    this.verseoftheday_reference = isTamil
      ? this.tamilVerseReference
      : this.englishVerseReference;
    this.dailyVerseLanguageAlternate = isTamil ? 'English' : 'Tamil';
  }

  ngOnChanges() {
    // When database is injected from parent, load verse
    if (this.database) {
      this.isLoading = true;
      this.getVerseOfTheDay();
    }
  }

  getVerseOfTheDay() {
    const todayDate = new Date();
    const qry =
      'SELECT * FROM verseoftheday where Mnth=' +
      (todayDate.getMonth() + 1) +
      ' and Date=' +
      todayDate.getDate();

    this.database
      .executeSql(qry, [])
      .then((data) => {
        if (data.rows.length > 0) {
          // Store both versions
          this.tamilVerse = data.rows.item(0).Tvrs;
          this.tamilVerseReference = data.rows.item(0).Tref;
          this.englishVerse = data.rows.item(0).Evrs;
          this.englishVerseReference = data.rows.item(0).Eref;

          this.applyLanguage();
        }
        this.isLoading = false;
        this.cdr.detectChanges(); // Trigger change detection
      })
      .catch((error) => {
        console.error('Error getting verse of the day:', error);
        this.isLoading = false;
        this.cdr.detectChanges(); // Trigger change detection on error too
      });
  }

  showSettings(event: Event) {
    this.menuEvent = event;
    this.menuOpen = true;
  }

  createImageWithRatio(ratio: ImageRatio) {
    this.showRatioDialog = false;
    return this.verseImageService.createImage({
      text: this.verseoftheday,
      reference: this.verseoftheday_reference,
      filePrefix: 'daily-verse',
      theme: COLOR_THEMES[this.selectedColorTheme],
      ratio,
    });
  }

  setLanguage() {
    this.dailyVerseLanguage = this.dailyVerseLanguageAlternate;

    // Save preference to localStorage for persistence between sessions
    localStorage.setItem('bibleVerseLanguage', this.dailyVerseLanguage);

    this.applyLanguage();
    this.cdr.detectChanges(); // Trigger change detection
  }

  async shareContent(mode: string) {
    let shareText = '';

    if (mode === 'COPY_ALL' || mode === 'SHARE_ALL') {
      // Create content with both languages
      shareText = `${this.tamilVerse}\n${this.tamilVerseReference}\n\n${this.englishVerse}\n${this.englishVerseReference}\n\nShared via Viviliam\nhttps://app.viviliam.com`;
    } else {
      // Original single language content
      shareText =
        this.verseoftheday +
        '\n\n' +
        this.verseoftheday_reference +
        '\n\n' +
        'Shared via Viviliam\nhttps://app.viviliam.com';
    }

    if (mode === 'SHARE' || mode === 'SHARE_ALL') {
      this.shareService.share({
        text: shareText,
        title: 'Viviliam',
      });
    } else if (mode === 'COPY' || mode === 'COPY_ALL') {
      try {
        await Clipboard.write({
          string: shareText,
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        await Toast.show({
          text: 'Failed to copy to clipboard',
          duration: 'short',
          position: 'center',
        });
      }
    }
    this.cdr.detectChanges();
  }
  createImage() {
    this.showRatioDialog = true;
  }
}
