import { Injectable } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Toast } from '@capacitor/toast';

// Gradient color themes for the generated images
export const COLOR_THEMES = [
  { name: 'Sunset', colors: ['#f89b29', '#ff0f7b'], textColor: '#ffffff' },
  { name: 'Ocean', colors: ['#1e2370', '#17c9c9'], textColor: '#ffffff' },
  { name: 'Purple Dream', colors: ['#4d3399', '#ff00cc'], textColor: '#ffffff' },
  { name: 'Forest', colors: ['#0d3844', '#54895f'], textColor: '#ffffff' },
  { name: 'Rose Gold', colors: ['#C33764', '#8B4789'], textColor: '#ffffff' },
];

export type ImageRatio = '1:1' | '3:4' | '9:16';

export interface VerseImageOptions {
  text: string;
  reference: string; // verse reference or quote author
  filePrefix: string;
  theme: (typeof COLOR_THEMES)[number];
  ratio: ImageRatio;
}

// Canvas size and text layout for each ratio
const LAYOUTS = {
  '1:1': { width: 720, height: 720, mainFontSize: 36, referenceFontSize: 27, lineHeight: 63, textOffsetY: 18, logoBottom: 72 },
  '3:4': { width: 720, height: 960, mainFontSize: 36, referenceFontSize: 26, lineHeight: 60, textOffsetY: -20, logoBottom: 100 },
  '9:16': { width: 720, height: 1280, mainFontSize: 36, referenceFontSize: 26, lineHeight: 60, textOffsetY: -50, logoBottom: 150 },
};

@Injectable({ providedIn: 'root' })
export class VerseImageService {
  // Draws the text on a themed canvas and saves it as a PNG
  async createImage({ text, reference, filePrefix, theme, ratio }: VerseImageOptions): Promise<void> {
    try {
      // Show loading message
      await this.showToast('Creating image...');

      // Wait for fonts to be loaded
      await this.ensureFontLoaded();

      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      const layout = LAYOUTS[ratio];
      canvas.width = layout.width;
      canvas.height = layout.height;

      const plainText = text.replace(/<[^>]*>/g, ''); // Remove HTML tags

      // Basic check for the Tamil Unicode range
      const containsTamil = /[஀-௿]/.test(plainText);

      // Use selected color theme
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, theme.colors[0]);
      gradient.addColorStop(1, theme.colors[1]);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Set text properties
      ctx.fillStyle = theme.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const { mainFontSize, referenceFontSize, lineHeight } = layout;

      // The canvas falls back along each font list by itself
      ctx.font = containsTamil
        ? `600 ${mainFontSize}px "Anek Tamil", "Noto Sans Tamil", sans-serif`
        : `600 ${mainFontSize}px "Bricolage Grotesque", Georgia, serif`;

      // Calculate the total height of the text to center it properly
      const maxWidth = canvas.width - 100;
      const lines = this.calculateWrappedLines(ctx, plainText, maxWidth);
      const totalTextHeight = lines.length * lineHeight;

      // Adjust vertical positioning based on ratio
      const textStartY = (canvas.height - totalTextHeight) / 2 + layout.textOffsetY;

      lines.forEach((line, index) =>
        ctx.fillText(line, canvas.width / 2, textStartY + index * lineHeight)
      );

      // Add reference with appropriate font and weight
      ctx.font = containsTamil
        ? `600 ${referenceFontSize}px "Anek Tamil", sans-serif`
        : `600 ${referenceFontSize}px "Bricolage Grotesque", serif`;

      const referenceY = textStartY + totalTextHeight + 25;
      ctx.fillText(`${reference}`, canvas.width / 2, referenceY);

      // Add logo with adjusted position for different ratios
      const logoY = canvas.height - layout.logoBottom;
      await this.addLogoToCanvas(ctx, canvas.width / 2, logoY);

      // Generate filename with current date, time, ratio, and language
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const language = containsTamil ? 'tamil' : 'english';
      const ratioStr = ratio.replace(':', 'x');
      const fileName = `${filePrefix}-${dateStr}-${timeStr}-${language}-${ratioStr}.png`;

      await this.saveImage(canvas, fileName, ratio);
    } catch (error) {
      console.error('Error creating image:', error);
      await this.showToast('Failed to create image');
    }
  }

  // Saves to Documents, or downloads through the browser if that fails
  private async saveImage(canvas: HTMLCanvasElement, fileName: string, ratio: ImageRatio): Promise<void> {
    // Convert canvas to base64
    const base64Data = canvas.toDataURL('image/png').split(',')[1];

    try {
      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
      });

      await this.showToast(`Image saved to Documents (${ratio})`);
    } catch (filesystemError) {
      console.log('Filesystem save failed, using browser download:', filesystemError);

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

            await this.showToast(`Image downloaded successfully! (${ratio})`);
          }
        }, 'image/png');
      } catch (downloadError) {
        console.error('Download failed:', downloadError);
        await this.showToast('Failed to save image');
      }
    }
  }

  private async showToast(text: string): Promise<void> {
    await Toast.show({ text, duration: 'short', position: 'center' });
  }

  // Draws the logo centered at (x, y), or the site address if it cannot load
  private async addLogoToCanvas(ctx: CanvasRenderingContext2D, x: number, y: number): Promise<void> {
    const logoWidth = 240;
    const logoHeight = 36;
    const img = new Image();

    // Handle CORS if loading from external URL
    img.crossOrigin = 'anonymous';
    img.src = 'assets/images/vl50.png';

    try {
      await img.decode();
      ctx.drawImage(img, x - logoWidth / 2, y - logoHeight / 2, logoWidth, logoHeight);
    } catch (error) {
      console.error('Error drawing logo:', error);
      this.addFallbackText(ctx, x, y);
    }
  }

  // Fallback method to add text if logo fails
  private addFallbackText(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText('app.viviliam.com', x, y);
  }

  // Load the fonts before drawing text on the canvas
  private async ensureFontLoaded(): Promise<void> {
    await Promise.allSettled([
      document.fonts.load('600 40px "Anek Tamil"', 'தமிழ் பைபிள்'),
      document.fonts.load('600 30px "Anek Tamil"', 'வசனம்'),
      document.fonts.load('600 40px "Bricolage Grotesque"', 'Bible Verse'),
      document.fonts.load('600 30px "Bricolage Grotesque"', 'Reference'),
    ]);

    // Additional wait for font to be fully available
    await new Promise((resolve) => setTimeout(resolve, 500));
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
      const testWidth = ctx.measureText(testLine).width;

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
}
