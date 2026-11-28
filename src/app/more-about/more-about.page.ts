import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NavController } from '@ionic/angular/standalone';
import { App } from '@capacitor/app';
import { addIcons } from "ionicons";
import { arrowBackOutline, informationCircleOutline } from "ionicons/icons";
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonIcon, IonContent } from "@ionic/angular/standalone";

//import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';

@Component({
  selector: 'app-more-about',
  templateUrl: './more-about.page.html',
  styleUrls: ['./more-about.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonIcon, IonContent],
})
export class MoreAboutPage {
  navctrl = inject(NavController);

  public appversionText: any;
  constructor() {
    // Get app version using Capacitor App plugin
    this.getAppVersion();
    addIcons({ arrowBackOutline, informationCircleOutline });
  }

  async getAppVersion() {
    try {
      const info = await App.getInfo();
      this.appversionText = info.version;
    } catch (err) {
      alert(err);
    }
  }

  navBack() {
    this.navctrl.back();
  }
  openMore(pagename) {
    this.navctrl.navigateRoot('/' + pagename);
  }
}
