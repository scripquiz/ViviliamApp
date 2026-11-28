import { Component, ChangeDetectionStrategy, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NavController } from '@ionic/angular/standalone';
import { AuthserviceProvider } from 'src/providers/authservice/authservice';
import { IonLoaderService } from '../ion-loader.service';
import { addIcons } from "ionicons";
import { arrowBackOutline } from "ionicons/icons";
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonIcon, IonContent } from "@ionic/angular/standalone";

@Component({
  selector: 'app-more-contact',
  templateUrl: './more-contact.page.html',
  styleUrls: ['./more-contact.page.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [FormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonIcon, IonContent],
})
export class MoreContactPage {
  ionLoaderService = inject(IonLoaderService);
  navctrl = inject(NavController);
  authservice = inject(AuthserviceProvider);

  navBack() {
    this.navctrl.back();
  }
  openPage(url: string) {
    window.open(url, '_blank');
  }

  // openPage(url, objThis)
  // {

  //   const options: ThemeableBrowserOptions = {
  //     statusbar: {
  //         color: '#3366cc'
  //     },
  //     toolbar: {
  //         height: 48,
  //         color: '#3366cc'
  //     },
  //     title: {
  //         color: '#ffffff',
  //         showPageTitle: true,
  //         staticText:"Viviliam - Contact"

  //     },
  //     toolbarposition:"200,300",

  //     closeButton: {
  //       wwwImage: 'assets/images/mobile-close.png',
  //       wwwImagePressed: 'close_pressed',
  //       align: 'right',

  //       event: 'closePressed'
  //   },

  //     backButtonCanClose: true
  // };

  // const browser: ThemeableBrowserObject = objThis.themeableBrowser.create(url, '_self', options);

  // }
  openMoreHelp() {
    var params = 'notifications';
    this.authservice.execute_api(params, this.checkforresponse, this);
    this.ionLoaderService.simpleLoader('Connecting...');
  }
  checkforresponse(status, _objAllData, objThis) {
    objThis.ionLoaderService.dismissLoader();
    if (status) {
      //window.open("https://app.viviliam.com/contact", "_blank");
      objThis.openPage('https://app.viviliam.com/contact');
    } else {
      //objThis.authservice.showAlert("Network failure", "", objThis.authservice.noNetWorkMessage);
      objThis.ionLoaderService.dismissLoader();
      objThis.authservice.showAlert(
        '',
        '',
        objThis.authservice.serverDownMessage
      );
    }
  }

  constructor() {
    addIcons({ arrowBackOutline });
  }
}
