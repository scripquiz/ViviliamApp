import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthserviceProvider } from '../../providers/authservice/authservice';
import { MenuController, IonicModule } from '@ionic/angular';
@Component({
  selector: 'app-startup-language',
  templateUrl: './startup-language.page.html',
  styleUrls: ['./startup-language.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class StartupLanguagePage {
  private menuCtrl = inject(MenuController);
  private router = inject(Router);
  private authservice = inject(AuthserviceProvider);

  navigateto_defaultbible(defaultlanguage) {
    this.authservice.default_language = defaultlanguage;
    this.authservice.defaultBibleLanguage = defaultlanguage;
    this.router.navigateByUrl('/startup-default-bible');
  }
  ionViewWillEnter() {
    console.log('View will enter');
    this.menuCtrl.enable(false);
  }
}
