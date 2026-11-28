import {
  Component,
  OnInit,
  OnChanges,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
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
import {
  IonCard,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from "ionicons";
import { ellipsisHorizontal, languageOutline, imageOutline, copyOutline, documentsOutline, shareSocialOutline, shareOutline } from "ionicons/icons";

@Component({
  selector: 'app-daily-bible-quote',
  templateUrl: './daily-bible-quote.component.html',
  styleUrls: ['./daily-bible-quote.component.scss'],
  imports: [
    FormsModule,
    RatioDialogComponent,
    IonCard,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonPopover,
    IonSpinner,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyBibleQuoteComponent implements OnInit, OnChanges {
  private authservice = inject(AuthserviceProvider);
  private shareService = inject(ShareService);
  private cdr = inject(ChangeDetectorRef);
  private verseImageService = inject(VerseImageService);

  // Inputs from parent component
  @Input() database: DatabaseConnection;

  // Quote data
  public tamilQuote: string = '';
  public englishQuote: string = '';
  public quoteoftheday: string = '';
  public quoteofthedayauthor: string = '';
  public dailyQuoteLanguage: string = 'English';
  public dailyQuoteLanguageAlternate: string = 'Tamil';
  public menuOpen: boolean = false;
  public menuEvent?: Event;
  public isLoading: boolean = true;
  public selectedColorTheme: number = 0; // Default to first theme
  public showRatioDialog: boolean = false;

  ngOnInit() {
    // Initialize quote language preference
    this.dailyQuoteLanguage =
      this.authservice.dailyQuote ||
      localStorage.getItem('quoteLanguage') ||
      'English';
    this.applyLanguage();
  }

  // Shows the loaded quote in the selected language and sets the other as the menu option
  private applyLanguage() {
    const isTamil = this.dailyQuoteLanguage.toUpperCase() === 'TAMIL';
    const quote = isTamil ? this.tamilQuote : this.englishQuote;
    // Both are empty before loading and after a failed load; keep the message then
    if (quote) {
      this.quoteoftheday = quote;
    }
    this.dailyQuoteLanguageAlternate = isTamil ? 'English' : 'Tamil';
  }

  ngOnChanges() {
    // When database is injected from parent, load quote
    if (this.database) {
      this.isLoading = true;
      this.cdr.detectChanges(); // Update UI to show loading spinner
      this.getQuoteOfTheDay();
    }
  }

  getQuoteOfTheDay() {
    this.isLoading = true;
    const todayDate = new Date();
    const month = todayDate.getMonth() + 1; // January is 0
    const day = todayDate.getDate();

    const qry =
      'SELECT * FROM quoteoftheday where Mnth=' + month + ' and Date=' + day;
    this.database
      .executeSql(qry, [])
      .then((data) => {
        if (data && data.rows && data.rows.length > 0) {
          // Store both versions
          this.tamilQuote =
            data.rows.item(0).tquot || 'No Tamil quote available';
          this.englishQuote =
            data.rows.item(0).quot || 'No English quote available';
          this.quoteofthedayauthor = data.rows.item(0).athr || 'Unknown';

          this.applyLanguage();
        } else {
          // Handle case when no quote is found for today
          this.quoteoftheday = 'No quote available for today';
          this.quoteofthedayauthor = '';
          this.tamilQuote = '';
          this.englishQuote = '';
          console.warn("No quote found for today's date");
        }

        this.isLoading = false;
        this.cdr.detectChanges(); // Trigger change detection
      })
      .catch((error) => {
        console.error('Error getting quote of the day:', error);

        // Set user-friendly error message
        this.quoteoftheday = "Could not load today's quote";
        this.quoteofthedayauthor = 'Please try again later';
        this.tamilQuote = '';
        this.englishQuote = '';

        this.isLoading = false;
        this.cdr.detectChanges(); // Trigger change detection on error too
      });
  }

  showSettings(event: Event) {
    this.menuEvent = event;
    this.menuOpen = true;
  }

  setLanguage() {
    this.dailyQuoteLanguage = this.dailyQuoteLanguageAlternate;

    // Save preference to localStorage for persistence between sessions
    localStorage.setItem('quoteLanguage', this.dailyQuoteLanguage);

    this.applyLanguage();
    this.cdr.detectChanges();
  }

  async shareContent(mode: string) {
    let shareText = '';

    if (mode === 'COPY_ALL' || mode === 'SHARE_ALL') {
      // Create content with both languages
      shareText = `${this.tamilQuote}\n\n--  ${this.quoteofthedayauthor}  --\n\n${this.englishQuote}\n\nShared via Viviliam\nhttps://app.viviliam.com`;
    } else {
      // Original single language content
      shareText =
        this.quoteoftheday +
        '\n\n--  ' +
        this.quoteofthedayauthor +
        ' --\r\n\nShared via Viviliam\nhttps://app.viviliam.com';
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
        // Only show toast on error
        await Toast.show({
          text: 'Failed to copy to clipboard',
          duration: 'short',
          position: 'center',
        });
      }
    }
    this.cdr.detectChanges(); // Trigger change detection
  }

  createImageWithRatio(ratio: ImageRatio) {
    this.showRatioDialog = false;
    return this.verseImageService.createImage({
      text: this.quoteoftheday,
      reference: this.quoteofthedayauthor,
      filePrefix: 'daily-quote',
      theme: COLOR_THEMES[this.selectedColorTheme],
      ratio,
    });
  }

  createImage() {
    this.showRatioDialog = true;
  }

  constructor() {
    addIcons({ ellipsisHorizontal, languageOutline, imageOutline, copyOutline, documentsOutline, shareSocialOutline, shareOutline });
  }
}
