import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';

import { Filesystem, Directory } from '@capacitor/filesystem';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { DatabaseConnection } from 'src/app/services/database.service';
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
  public menuOpen: boolean = false;
  public menuEvent?: Event;
  public isLoading: boolean = true;
  public selectedColorTheme: number = 0; // Default to first theme

  // Define 5 gradient color themes
  public colorThemes = [
    { name: 'Sunset', colors: ['#f89b29', '#ff0f7b'], textColor: '#ffffff' },
    { name: 'Ocean', colors: ['#1e2370', '#17c9c9'], textColor: '#ffffff' },
    {
      name: 'Purple Dream',
      colors: ['#4d3399', '#ff00cc'],
      textColor: '#ffffff',
    },
    { name: 'Forest', colors: ['#0d3844', '#54895f'], textColor: '#ffffff' },
    { name: 'Rose Gold', colors: ['#C33764', '#8B4789'], textColor: '#ffffff' },
  ];

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
    this.removeRatioMenu();
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

          // Set display based on language preference
          if (this.dailyQuoteLanguage.toUpperCase() === 'TAMIL') {
            this.quoteoftheday = this.tamilQuote;
            this.dailyQuoteLanguageAlternate = 'English';
          } else {
            this.quoteoftheday = this.englishQuote;
            this.dailyQuoteLanguageAlternate = 'Tamil';
          }
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

  showRatioSelectionMenu() {
    // Remove any existing ratio menu
    this.removeRatioMenu();

    // Create ratio selection overlay
    const overlay = document.createElement('div');
    overlay.className = 'ratio-menu-overlay';
    overlay.id = 'quote-ratio-selection-menu';
    overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10002;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

    // Create ratio selection dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
    background: white;
    border-radius: 12px;
    padding: 24px;
    min-width: 280px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    text-align: center;
  `;

    dialog.innerHTML = `
    <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px; font-weight: 600;">Select Color & Size</h3>
    
    <!-- Color Theme Palettes -->
    <div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 20px;">
      ${this.colorThemes
        .map(
          (theme, index) => `
        <div 
          class="color-palette" 
          data-theme="${index}"
          style="
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${theme.colors[0]}, ${
            theme.colors[1]
          });
            cursor: pointer;
            border: ${
              index === this.selectedColorTheme
                ? '3px solid #007bff'
                : '2px solid #ddd'
            };
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
          "
          title="${theme.name}"
        ></div>
      `
        )
        .join('')}
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <button class="ratio-btn" data-ratio="1:1" style="
        padding: 12px 20px;
        border: 2px solid #555;
        background: #555;
        color: white;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
      ">
        Square (1:1) - 720x720
      </button>
      <button class="ratio-btn" data-ratio="3:4" style="
        padding: 12px 20px;
        border: 2px solid #555;
        background: #555;
        color: white;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
      ">
        Portrait (3:4) - 720x960
      </button>
      <button class="ratio-btn" data-ratio="9:16" style="
        padding: 12px 20px;
        border: 2px solid #555;
        background: #555;
        color: white;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
      ">
        Story (9:16) - 720x1280
      </button>
      <button class="cancel-btn" style="
        padding: 12px 20px;
        border: 2px solid #6c757d;
        background: transparent;
        color: #6c757d;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 8px;
      ">
        Cancel
      </button>
    </div>
  `;

    // Add hover effects
    const style = document.createElement('style');
    style.textContent = `
    .ratio-btn:hover {
      background: #a73208 !important;
      border-color: #a73208 !important;
      transform: translateY(-1px);
    }
    .cancel-btn:hover {
      background: #6c757d !important;
      color: white !important;
    }
    .color-palette:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
    }
  `;
    // Kept inside the overlay so removeRatioMenu() removes it too
    overlay.appendChild(style);

    // Add event listeners for color palettes
    const palettes = dialog.querySelectorAll('.color-palette');
    palettes.forEach((palette) => {
      palette.addEventListener('click', (e) => {
        const themeIndex = parseInt(
          (e.currentTarget as HTMLElement).getAttribute('data-theme') || '0'
        );
        this.selectedColorTheme = themeIndex;

        // Update border styling for all palettes
        palettes.forEach((p, idx) => {
          (p as HTMLElement).style.border =
            idx === themeIndex ? '3px solid #007bff' : '2px solid #ddd';
        });
      });
    });

    // Add event listeners
    dialog
      .querySelector('[data-ratio="1:1"]')
      ?.addEventListener('click', () => {
        this.createImageWithRatio('1:1');
        this.removeRatioMenu();
      });

    dialog
      .querySelector('[data-ratio="3:4"]')
      ?.addEventListener('click', () => {
        this.createImageWithRatio('3:4');
        this.removeRatioMenu();
      });

    dialog
      .querySelector('[data-ratio="9:16"]')
      ?.addEventListener('click', () => {
        this.createImageWithRatio('9:16');
        this.removeRatioMenu();
      });

    dialog.querySelector('.cancel-btn')?.addEventListener('click', () => {
      this.removeRatioMenu();
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.removeRatioMenu();
      }
    });

    // Prevent dialog clicks from closing the menu
    dialog.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }

  // Add this method to remove the ratio menu
  private removeRatioMenu() {
    const existingMenu = document.getElementById('quote-ratio-selection-menu');
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

  async createImageWithRatio(ratio: '1:1' | '3:4' | '9:16') {
    try {
      // Show loading message
      await Toast.show({
        text: 'Creating image...',
        duration: 'short',
        position: 'center',
      });

      // Wait for fonts to be loaded
      await this.ensureFontLoaded();

      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Canvas size and text layout for each ratio
      const layout = {
        '1:1': { width: 720, height: 720, mainFontSize: 36, referenceFontSize: 27, lineHeight: 63, textOffsetY: 18, logoBottom: 72 },
        '3:4': { width: 720, height: 960, mainFontSize: 36, referenceFontSize: 26, lineHeight: 60, textOffsetY: -20, logoBottom: 100 },
        '9:16': { width: 720, height: 1280, mainFontSize: 36, referenceFontSize: 26, lineHeight: 60, textOffsetY: -50, logoBottom: 150 },
      }[ratio];

      canvas.width = layout.width;
      canvas.height = layout.height;

      // Add quote text with increased font size and Anek Tamil as default for Tamil
      const verseText = this.quoteoftheday.replace(/<[^>]*>/g, ''); // Remove HTML tags

      // Check if the verse contains Tamil text (basic check for Tamil Unicode range)
      const containsTamil = /[\u0B80-\u0BFF]/.test(verseText);

      // Use selected color theme
      const selectedTheme = this.colorThemes[this.selectedColorTheme];
      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height
      );
      gradient.addColorStop(0, selectedTheme.colors[0]);
      gradient.addColorStop(1, selectedTheme.colors[1]);

      const textColor = selectedTheme.textColor;
      const referenceColor = selectedTheme.textColor;

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Set text properties
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Font sizes based on ratio
      const { mainFontSize, referenceFontSize } = layout;

      // Set font with better fallback system and weight specification
      if (containsTamil) {
        // Try multiple Tamil font variations with semibold weight (600)
        const tamilFonts = [
          `600 ${mainFontSize}px "Anek Tamil"`,
          `bold ${mainFontSize}px "Anek Tamil"`,
          `600 ${mainFontSize}px Anek Tamil`,
          `${mainFontSize}px "Anek Tamil"`,
          `600 ${mainFontSize}px "Noto Sans Tamil"`,
          `600 ${mainFontSize}px sans-serif`,
        ];

        let fontSet = false;
        for (const fontFamily of tamilFonts) {
          try {
            ctx.font = fontFamily;
            // Test the font with Tamil text
            const testWidth = ctx.measureText('தமிழ் பைபிள்').width;

            if (testWidth > 0) {
              fontSet = true;
              break;
            }
          } catch {
            // try the next font
          }
        }

        if (!fontSet) {
          ctx.font = `600 ${mainFontSize}px sans-serif`;
        }
      } else {
        // Try multiple English font variations with semibold weight (600)
        const englishFonts = [
          `600 ${mainFontSize}px "Bricolage Grotesque"`,
          `bold ${mainFontSize}px "Bricolage Grotesque"`,
          `${mainFontSize}px "Bricolage Grotesque"`,
          `600 ${mainFontSize}px Georgia`,
          `600 ${mainFontSize}px serif`,
        ];

        let fontSet = false;
        for (const fontFamily of englishFonts) {
          try {
            ctx.font = fontFamily;
            // Test the font with English text
            const testWidth = ctx.measureText('Bible Verse').width;

            if (testWidth > 0) {
              fontSet = true;
              break;
            }
          } catch {
            // try the next font
          }
        }

        if (!fontSet) {
          ctx.font = `600 ${mainFontSize}px serif`;
        }
      }

      // Calculate the total height of the verse text to center it properly
      const maxWidth = canvas.width - 100;
      const lineHeight = layout.lineHeight;
      const lines = this.calculateWrappedLines(ctx, verseText, maxWidth);
      const totalTextHeight = lines.length * lineHeight;

      // Adjust vertical positioning based on ratio
      const verseStartY =
        (canvas.height - totalTextHeight) / 2 + layout.textOffsetY;

      this.wrapTextCentered(
        ctx,
        verseText,
        canvas.width / 2,
        verseStartY,
        maxWidth,
        lineHeight
      );

      // Add reference with appropriate font and weight
      ctx.fillStyle = referenceColor;
      if (containsTamil) {
        // Try Tamil reference fonts with semibold weight
        const tamilRefFonts = [
          `600 ${referenceFontSize}px "Anek Tamil"`,
          `bold ${referenceFontSize}px "Anek Tamil"`,
          `${referenceFontSize}px "Anek Tamil"`,
          `600 ${referenceFontSize}px sans-serif`,
        ];

        let refFontSet = false;
        for (const font of tamilRefFonts) {
          try {
            ctx.font = font;
            const testWidth = ctx.measureText('வசனம்').width;
            if (testWidth > 0) {
              refFontSet = true;
              break;
            }
          } catch {
            // try the next font
          }
        }

        if (!refFontSet) {
          ctx.font = `600 ${referenceFontSize}px sans-serif`;
        }
      } else {
        // Try English reference fonts
        const englishRefFonts = [
          `600 ${referenceFontSize}px "Bricolage Grotesque"`,
          `bold ${referenceFontSize}px "Bricolage Grotesque"`,
          `${referenceFontSize}px "Bricolage Grotesque"`,
          `600 ${referenceFontSize}px serif`,
        ];

        let refFontSet = false;
        for (const font of englishRefFonts) {
          try {
            ctx.font = font;
            const testWidth = ctx.measureText('Reference').width;
            if (testWidth > 0) {
              refFontSet = true;
              break;
            }
          } catch {
            // try the next font
          }
        }

        if (!refFontSet) {
          ctx.font = `600 ${referenceFontSize}px serif`;
        }
      }

      const referenceY = verseStartY + totalTextHeight + 25;
      ctx.fillText(
        `${this.quoteofthedayauthor}`,
        canvas.width / 2,
        referenceY
      );

      // Add logo with adjusted position for different ratios
      const logoY = canvas.height - layout.logoBottom;
      await this.addLogoToCanvas(ctx, canvas.width / 2, logoY);

      // Convert canvas to base64
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];

      // Generate filename with current date, time, ratio, and language
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const language = containsTamil ? 'tamil' : 'english';
      const ratioStr = ratio.replace(':', 'x');
      const fileName = `daily-quote-${dateStr}-${timeStr}-${language}-${ratioStr}.png`;

      try {
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
        });

        await Toast.show({
          text: `Image saved to Documents (${ratio})`,
          duration: 'short',
          position: 'center',
        });
      } catch (filesystemError) {
        console.log(
          'Filesystem save failed, using browser download:',
          filesystemError
        );

        try {
          canvas.toBlob(async (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);

              await Toast.show({
                text: `Image downloaded successfully! (${ratio})`,
                duration: 'short',
                position: 'center',
              });
            }
          }, 'image/png');
        } catch (downloadError) {
          console.error('Download failed:', downloadError);
          await Toast.show({
            text: 'Failed to save image',
            duration: 'short',
            position: 'center',
          });
        }
      }
    } catch (error) {
      console.error('Error creating image:', error);
      await Toast.show({
        text: 'Failed to create image',
        duration: 'short',
        position: 'center',
      });
    }
  }

  async createImage() {
    // This method now just shows the ratio selection menu
    this.showRatioSelectionMenu();
  }

  // Updated logo method with better error handling
  private async addLogoToCanvas(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();

      // Handle CORS if loading from external URL
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          // Calculate logo dimensions (adjust as needed)
          const logoWidth = 240; // Adjust width as needed
          const logoHeight = 36; // Adjust height as needed

          // Draw the logo centered at the specified position
          ctx.drawImage(
            img,
            x - logoWidth / 2, // Center horizontally
            y - logoHeight / 2, // Center vertically
            logoWidth,
            logoHeight
          );

          resolve();
        } catch (error) {
          console.error('Error drawing logo:', error);
          // Fallback to text if logo fails
          this.addFallbackText(ctx, x, y);
          resolve();
        }
      };

      img.onerror = () => {
        console.error('Failed to load logo');
        // Fallback to text if logo fails to load
        this.addFallbackText(ctx, x, y);
        resolve();
      };

      // Set the logo source - make sure this file exists
      img.src = 'assets/images/vl50.png';
    });
  }

  // Fallback method to add text if logo fails
  private addFallbackText(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText('app.viviliam.com', x, y);
  }

  // Enhanced font loading method specifically for canvas
  private async ensureFontLoaded(): Promise<void> {
    return new Promise((resolve) => {
      // Load both fonts with specific weights
      if ('fonts' in document && (document as any).fonts.load) {
        const fontPromises = [
          // Anek Tamil with weight 600 (changed from 500)
          (document as any).fonts.load('600 40px "Anek Tamil"', 'தமிழ் பைபிள்'),
          (document as any).fonts.load('600 30px "Anek Tamil"', 'வசனம்'),
          // Bricolage Grotesque with weight 600
          (document as any).fonts.load(
            '600 40px "Bricolage Grotesque"',
            'Bible Verse'
          ),
          (document as any).fonts.load(
            '600 30px "Bricolage Grotesque"',
            'Reference'
          ),
        ];

        Promise.allSettled(fontPromises).then(() => {
          // Additional wait for font to be fully available
          setTimeout(() => {
            resolve();
          }, 500);
        });
      } else {
        // Fallback method
        this.loadFontViaElement().then(() => {
          resolve();
        });
      }
    });
  }

  // Improved font loading via element
  private async loadFontViaElement(): Promise<void> {
    return new Promise((resolve) => {
      // Create multiple test elements with different weights
      const testTexts = ['தமிழ்', 'பைபிள்', 'வசனம்'];
      const elements: HTMLElement[] = [];

      testTexts.forEach((text, index) => {
        const testElement = document.createElement('div');
        testElement.style.fontFamily = '"Anek Tamil", sans-serif';
        testElement.style.fontSize = '40px';
        testElement.style.position = 'absolute';
        testElement.style.left = '-9999px';
        testElement.style.opacity = '0';
        testElement.style.pointerEvents = 'none';
        testElement.innerHTML = text;

        document.body.appendChild(testElement);
        elements.push(testElement);
      });

      // Wait longer for font to load
      setTimeout(() => {
        elements.forEach((element) => {
          if (element.parentNode) {
            document.body.removeChild(element);
          }
        });

        resolve();
      }, 800); // Increased timeout to 800ms
    });
  }

  // Helper method to calculate wrapped lines (for centering)
  private calculateWrappedLines(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      lines.push(line.trim());
    }
    return lines;
  }

  // Updated helper method for text wrapping with proper vertical centering
  private wrapTextCentered(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    startY: number,
    maxWidth: number,
    lineHeight: number
  ) {
    const words = text.split(' ');
    let line = '';
    let currentY = startY;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      ctx.fillText(line.trim(), x, currentY);
    }
  }
}
