import {
  Component,
  OnInit,
  OnDestroy, // Add this import
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';

import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { AuthserviceProvider } from 'src/providers/authservice/authservice';
import { ShareService } from '../../providers/share.service';
import { Clipboard } from '@capacitor/clipboard';
import { Toast } from '@capacitor/toast';

@Component({
  selector: 'app-daily-bible-quote',
  templateUrl: './daily-bible-quote.component.html',
  styleUrls: ['./daily-bible-quote.component.scss'],
  imports: [IonicModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyBibleQuoteComponent implements OnInit, OnDestroy {
  // Inputs from parent component
  @Input() database: DatabaseConnection;

  // Quote data
  public tamilQuote: string = '';
  public englishQuote: string = '';
  public quoteoftheday: string = '';
  public quoteofthedayauthor: string = '';
  public dailyQuoteLanguage: string = 'English';
  public dailyQuoteLanguageAlternate: string = 'Tamil';
  public showDailyQuoteSetting: string = 'opacityhidehome';
  public isLoading: boolean = true;

  constructor(
    private authservice: AuthserviceProvider,
    private shareService: ShareService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Initialize quote language preference
    this.dailyQuoteLanguage =
      this.authservice.dailyQuote ||
      localStorage.getItem('quoteLanguage') ||
      'English';

    // Set the alternate language option
    if (this.dailyQuoteLanguage.toUpperCase() === 'TAMIL') {
      this.dailyQuoteLanguageAlternate = 'English';
    } else {
      this.dailyQuoteLanguageAlternate = 'Tamil';
    }
    this.addGlobalClickListener();
  }

  ngOnChanges() {
    // When database is injected from parent, load quote
    if (this.database) {
      this.isLoading = true;
      this.cdr.detectChanges(); // Update UI to show loading spinner
      this.getQuoteOfTheDay();
    }
  }
  ngOnDestroy() {
    // Clean up the global click listener
    this.removeGlobalClickListener();
    // Clean up any open menus
    this.removeMenu();
  }

  private addGlobalClickListener() {
    document.addEventListener('click', this.globalClickHandler);
  }

  private removeGlobalClickListener() {
    document.removeEventListener('click', this.globalClickHandler);
  }

  private globalClickHandler = (event: Event) => {
    const target = event.target as HTMLElement;

    // Check if click is outside any menu
    const isClickOnVerseSetting =
      target.closest('#dynamic-verse-menu') ||
      target.closest('app-daily-bible-verse .verse-menu-icon');
    const isClickOnQuoteSetting =
      target.closest('#dynamic-quote-menu') ||
      target.closest('app-daily-bible-quote .quote-menu-icon');

    // If click is outside both menus, hide this component's menu
    if (!isClickOnVerseSetting && !isClickOnQuoteSetting) {
      if (this.showDailyQuoteSetting === 'opacityshowhome') {
        this.hideSettingsMenu();
      }
    }
  };

  getQuoteOfTheDay() {
    this.isLoading = true;
    const todayDate = new Date();
    const month = todayDate.getMonth() + 1; // January is 0
    const day = todayDate.getDate();

    console.log(`Looking for quote with month=${month}, day=${day}`);
    const qry =
      'SELECT * FROM quoteoftheday where Mnth=' + month + ' and Date=' + day;

    console.log('Quote of the day query:' + qry);
    this.database
      .executeSql(qry, [])
      .then((data) => {
        console.log('Quote of the day count: ' + data.rows.length);
        console.log(
          'Daily Quote language: ' + this.dailyQuoteLanguage.toUpperCase()
        );

        if (data && data.rows && data.rows.length > 0) {
          // Store both versions
          this.tamilQuote =
            data.rows.item(0).tquot || 'No Tamil quote available';
          this.englishQuote =
            data.rows.item(0).quot || 'No English quote available';
          this.quoteofthedayauthor = data.rows.item(0).athr || 'Unknown';

          // Set display based on language preference
          if (this.dailyQuoteLanguage.toUpperCase() === 'TAMIL') {
            this.quoteoftheday = this.tamilQuote;
            this.dailyQuoteLanguageAlternate = 'English';
          } else {
            this.quoteoftheday = this.englishQuote;
            this.dailyQuoteLanguageAlternate = 'Tamil';
          }
          console.log('Quote loaded: ' + this.quoteoftheday);
          console.log('Author: ' + this.quoteofthedayauthor);
          console.log(
            'Daily quote language alternate: ' +
              this.dailyQuoteLanguageAlternate
          );
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

    // Optional: Add a direct check to see total quotes in database
    this.database
      .executeSql('SELECT COUNT(*) as count FROM quoteoftheday', [])
      .then((res) => {
        console.log(`Total quotes in database: ${res.rows.item(0).count}`);
      })
      .catch((err) => console.error('Error checking quote table:', err));
  }

  showSettings() {
    this.showDailyQuoteSetting =
      this.showDailyQuoteSetting === 'opacityshowhome'
        ? 'opacityhidehome'
        : 'opacityshowhome';

    if (this.showDailyQuoteSetting === 'opacityshowhome') {
      setTimeout(() => {
        this.createAndPositionMenu();
      }, 10);
    } else {
      this.removeMenu();
    }

    this.cdr.detectChanges();
  }
  private createAndPositionMenu() {
    // Remove existing menu if any
    this.removeMenu();

    // Use a more specific selector that targets only this component's button
    const moreButton = document.querySelector(
      'app-daily-bible-quote .quote-menu-icon'
    );
    if (!moreButton) return;

    const rect = moreButton.getBoundingClientRect();

    // Create menu overlay
    const overlay = document.createElement('div');
    overlay.className = 'quotesettingMenu-dynamic opacityshowhome';
    overlay.id = 'dynamic-quote-menu';

    // Hide menu when clicking outside (on overlay)
    overlay.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      // Check if the click was on the overlay itself (not on children)
      if (
        target === overlay ||
        target.classList.contains('quotesettingMenu-dynamic')
      ) {
        this.hideSettingsMenu();
      }
    });

    // Create popover
    const popover = document.createElement('div');
    popover.className = 'popover-dynamic pop-over-shadow opacityshowhome';

    // Position the popover - Fixed positioning to show below the icon
    popover.style.position = 'fixed';
    popover.style.top = rect.bottom + 8 + 'px'; // Show below the button
    popover.style.left = rect.right - 140 + 'px'; // Align right edge of menu with right edge of button
    popover.style.width = '140px';
    popover.style.zIndex = '10001';

    // Prevent popover clicks from bubbling to overlay
    popover.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Add menu content with new Copy All and Share All options
    popover.innerHTML = `
      <ion-list style="padding:0px">
        <ion-item no-padding style="border-bottom: 1px solid rgba(0,0,0,.3);height:47px;--padding-start: 10px;" class="menu-language">
          <ion-avatar slot="start" style="margin-inline:unset;">
            <ion-icon name="language-outline" style="font-size:24px; position:relative;top:3px"></ion-icon>
          </ion-avatar>
          <ion-label style="font-size:16px;font-family: Arial, Helvetica, sans-serif;position:relative;top:-5px">${this.dailyQuoteLanguageAlternate}</ion-label>
        </ion-item>
        <ion-item no-padding style="border-bottom: 1px solid rgba(0,0,0,.3);height:47px;--padding-start: 10px;" class="menu-copy">
          <ion-avatar slot="start" style="margin-inline:unset;">
            <ion-icon name="copy-outline" style="font-size:24px; position:relative;top:3px"></ion-icon>
          </ion-avatar>
          <ion-label style="font-size:16px;font-family: Arial, Helvetica, sans-serif;position:relative;top:-5px">Copy</ion-label>
        </ion-item>
        <ion-item no-padding style="border-bottom: 1px solid rgba(0,0,0,.3);height:47px;--padding-start: 10px;" class="menu-copy-all">
          <ion-avatar slot="start" style="margin-inline:unset;">
            <ion-icon name="documents-outline" style="font-size:24px; position:relative;top:3px"></ion-icon>
          </ion-avatar>
          <ion-label style="font-size:16px;font-family: Arial, Helvetica, sans-serif;position:relative;top:-5px">Copy All</ion-label>
        </ion-item>
        <ion-item no-padding style="border-bottom: 1px solid rgba(0,0,0,.3);height:47px;--padding-start: 10px;" class="menu-share">
          <ion-avatar slot="start" style="margin-inline:unset;">
            <ion-icon name="share-social-outline" style="font-size:24px;position:relative; top:6px;"></ion-icon>
          </ion-avatar>
          <ion-label style="font-size:16px;font-family: Arial, Helvetica, sans-serif;position:relative;top:-2px">Share</ion-label>
        </ion-item>
        <ion-item no-padding style="height:47px;--padding-start: 10px;display: block;" class="menu-share-all">
          <ion-avatar slot="start" style="margin-inline:unset;">
            <ion-icon name="share-outline" style="font-size:24px;position:relative; top:6px;"></ion-icon>
          </ion-avatar>
          <ion-label style="font-size:16px;font-family: Arial, Helvetica, sans-serif;position:relative;top:-2px">Share All</ion-label>
        </ion-item>
      </ion-list>
    `;

    // Add event listeners that hide menu after selection
    popover.querySelector('.menu-language')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setLanguage();
      this.hideSettingsMenu();
    });

    popover.querySelector('.menu-copy')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.shareContent('COPY');
      this.hideSettingsMenu();
    });

    popover.querySelector('.menu-copy-all')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.shareContent('COPY_ALL');
      this.hideSettingsMenu();
    });

    popover.querySelector('.menu-share')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.shareContent('SHARE');
      this.hideSettingsMenu();
    });

    popover.querySelector('.menu-share-all')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.shareContent('SHARE_ALL');
      this.hideSettingsMenu();
    });

    overlay.appendChild(popover);
    document.body.appendChild(overlay);
  }

  hideSettingsMenu() {
    this.showDailyQuoteSetting = 'opacityhidehome';
    this.removeMenu();
    this.cdr.detectChanges();
  }

  private removeMenu() {
    const existingMenu = document.getElementById('dynamic-quote-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
  }

  setLanguage() {
    this.dailyQuoteLanguage = this.dailyQuoteLanguageAlternate;

    // Save preference to localStorage for persistence between sessions
    localStorage.setItem('quoteLanguage', this.dailyQuoteLanguageAlternate);

    // Set the alternate language option for next toggle
    if (this.dailyQuoteLanguageAlternate.toUpperCase() === 'TAMIL') {
      this.dailyQuoteLanguageAlternate = 'English';
    } else {
      this.dailyQuoteLanguageAlternate = 'Tamil';
    }

    // Update the quote content immediately without loader
    this.updateQuoteContent();
    this.showDailyQuoteSetting = 'opacityhidehome';
    this.cdr.detectChanges();
  }

  private updateQuoteContent() {
    const todayDate = new Date();
    const month = todayDate.getMonth() + 1;
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

          // Set display based on language preference
          if (this.dailyQuoteLanguage.toUpperCase() === 'TAMIL') {
            this.quoteoftheday = this.tamilQuote;
          } else {
            this.quoteoftheday = this.englishQuote;
          }
        } else {
          this.quoteoftheday = 'No quote available for today';
          this.quoteofthedayauthor = '';
          this.tamilQuote = '';
          this.englishQuote = '';
        }
        this.cdr.detectChanges();
      })
      .catch((error) => {
        console.error('Error updating quote content:', error);
        this.quoteoftheday = "Could not load today's quote";
        this.quoteofthedayauthor = 'Please try again later';
        this.tamilQuote = '';
        this.englishQuote = '';
        this.cdr.detectChanges();
      });
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

    this.showDailyQuoteSetting = 'opacityhidehome';

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
}
