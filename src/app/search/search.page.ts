import { ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { Component, NgZone, OnDestroy } from '@angular/core';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { AuthserviceProvider } from 'src/providers/authservice/authservice';
import { Platform, NavController } from '@ionic/angular';
import { MenuController } from '@ionic/angular';
import { ScreenOrientationService } from '../services/screen-orientation.service';
import { DarkModeService } from '../services/dark-mode.service';
import { Subscription } from 'rxjs';

import { AppComponent } from '../../app/app.component';
import { Keyboard } from '@capacitor/keyboard';

@Component({
  selector: 'app-search',
  templateUrl: 'search.page.html',
  styleUrls: ['search.page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class SearchPage implements OnDestroy {
  public currentpage: any = 1;
  public totalpages: any = 15;
  public showSearchNavigation: any = 'hide';
  public database: DatabaseConnection;
  public versData: any = '';
  public verseList: any = [];
  public searchText: any = '';
  public pageIndex: any = 1;
  public pager: any = 'Loading...';
  public gotoPage: any = '';
  public showverse: any = 'hide';
  public searchinfo: any = '';
  public orientation: any;
  public searchInprocess: any = false;
  public searchInput: any = '';
  public search_submited: any = 0;
  public isDarkMode: boolean = false;
  private darkModeSubscription: Subscription;

  constructor(
    public appComponent: AppComponent,
    public screenorientation: ScreenOrientationService,
    public menuCtrl: MenuController,
    public authservice: AuthserviceProvider,
    public platform: Platform,
    public databaseService: DatabaseService,
    public navctrl: NavController,
    private ngZone: NgZone,
    private darkModeService: DarkModeService
  ) {
    this.setSearchData();

    // Subscribe to dark mode state changes
    this.darkModeSubscription = this.darkModeService.darkModeState$.subscribe(
      (state) => {
        this.isDarkMode = state.searchDarkMode || state.globalDarkMode;
        this.applyDarkMode();
      }
    );
  }

  ionViewWillEnter() {
    this.menuCtrl.enable(true);
  }

  ionViewDidEnter() {
    this.authservice.showsign = 0;
    this.applyDarkMode();
    this.platform.ready().then(() => {
      // Critical fix for Tamil character input in Capacitor
      Keyboard.setAccessoryBarVisible({ isVisible: false });
      Keyboard.setScroll({ isDisabled: false });
      // Removed setResizeMode that was causing TypeScript errors

      // Enhanced input handling for Tamil characters
      const searchInputs = document.querySelectorAll('ion-input');
      searchInputs.forEach((input) => {
        input.addEventListener('ionFocus', () => {
          console.log('Input focused - enabling proper keyboard handling');
          Keyboard.setScroll({ isDisabled: false });

          // Force re-render of input to ensure IME works correctly
          setTimeout(() => {
            this.ngZone.run(() => {
              // This triggers Angular change detection
              this.searchInprocess = this.searchInprocess;
            });
          }, 50);
        });
      });

      // Listen to keyboard events
      Keyboard.addListener('keyboardWillShow', () => {
        Keyboard.setScroll({ isDisabled: false });
      });
    });
  }

  ionViewWillLeave() {
    this.platform.ready().then(() => {
      Keyboard.setScroll({ isDisabled: false });
      // Remove keyboard listeners when leaving the page
      Keyboard.removeAllListeners();
    });
  }

  ngOnDestroy() {
    if (this.darkModeSubscription) {
      this.darkModeSubscription.unsubscribe();
    }
  }

  applyDarkMode() {
    this.darkModeService.applyPageDarkMode('search', 'app-search ion-content');
    // Also update status bar when on this page
    this.darkModeService.updateStatusBar('search');
  }

  setSearchData() {
    this.authservice.searchInfo =
      this.authservice.searchbibleInfo +
      ' - ' +
      this.authservice.searchcategoryinfo +
      ' - ' +
      this.authservice.searchOption;
    this.authservice.currentPage = 'SEARCH';
    //   setInterval(() => {
    //     this.searchinfo = this.authservice.searchbibleInfo + " - " + this.authservice.searchcategoryinfo + " - " + this.authservice.searchOption;

    // }, 300);

    this.platform.ready().then(() => {
      this.orientation = this.authservice.orientation;
      this.screenorientation.onChange().subscribe(() => {
        console.log('Orientation changed to ' + this.screenorientation.type);
        if (this.screenorientation.type == 'landscape-primary') {
          this.orientation = 'landscape';
          this.authservice.orientation = this.orientation;
        } else {
          this.orientation = 'portrait';
          this.authservice.orientation = this.orientation;
        }
      });
    });
    console.log('View did enter');
    this.platform.ready().then(() => {
      this.databaseService
        .create({
          name: 'viviliam.db',
          location: 'default',
        })
        .then((db: DatabaseConnection) => {
          console.log('DB created');
          this.database = db;
          if (!this.authservice.defaultbibleid_setforsearch) {
            this.getBibleList();
            this.authservice.defaultbibleid_setforsearch = true;
          }
        });
    });
  }
  getBibleList() {
    this.database
      .executeSql('SELECT * FROM bibles order by seq', [])
      .then((data) => {
        console.log('Books count ' + data.rows.length);
        this.authservice.bibleList = [];

        for (var j = 0; j < data.rows.length; j++) {
          if (data.rows.item(j).defaultbible == '1') {
            this.authservice.defaultBibleId = data.rows.item(j).id;
            this.authservice.defaultBibleVersionText = data.rows.item(j).title;

            this.authservice.defaultBibleLanguage = data.rows.item(j).language;

            this.appComponent.initializeData();
          }

          this.authservice.bibleList.push({
            id: data.rows.item(j).id,
            title: data.rows.item(j).title,
            language: data.rows.item(j).language,
            defaultbible: data.rows.item(j).defaultbible,
          });
        }
      });
  }
  initiateSearchBible() {
    this.currentpage = 1;
    this.gotoPage = '';
    this.searchInput = this.searchText.replace(/^\s+|\s+$|\s+(?=\s)/g, '');
    this.searchBible();
  }

  searchBible() {
    this.searchInprocess = true;
    this.pager = 'Looking...';
    this.showverse = 'hide';
    this.versData = '';
    this.verseList = [];
    //this.searchText = this.searchText.replace(/^\s+|\s+$|\s+(?=\s)/g, "");
    var excludeCharacters;
    excludeCharacters =
      '1,2,3,4,5,6,7,8,9,0,~,@,#,$,%,^,*,(,),{,},-,=,+,<,>,?,`,[,],%,_,*';
    if (this.authservice.searchBible != 1 && this.authservice.searchBible != 2)
      excludeCharacters =
        excludeCharacters +
        ',' +
        'a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z';
    var excludeCharactersArray = excludeCharacters.split(',');
    var isSecialCharacters = 0;
    for (var i = 0; i < excludeCharactersArray.length; i++) {
      if (this.searchInput.indexOf(excludeCharactersArray[i]) != -1) {
        isSecialCharacters = 1;
        //this.searchInput = this.searchInput.split(excludeCharactersArray[i]).join("");
      }
    }

    if (this.searchInput == '' || this.searchInput.length < 2) {
      this.pager = 'Verse not found';
      this.authservice.showAlert(
        '',
        '',
        'Please enter 2 or 3 characters to proceed with search'
      );
      this.searchInprocess = false;
    } else if (isSecialCharacters == 1) {
      this.searchInprocess = false;
      this.pager = 'Verse not found';
      if (
        this.authservice.searchBible != 1 &&
        this.authservice.searchBible != 2
      )
        this.authservice.showAlert(
          '',
          '',
          'Special characters, Numbers and English alphabets are not allowed in Tamil Bible search'
        );
      else
        this.authservice.showAlert(
          '',
          '',
          'Numbers and Special characters are not allowed in search'
        );
    } else {
      this.search_submited = 1;
      this.showSearchNavigation = 'show';
      var resultData;
      var searchVerse;

      if (this.authservice.searchOption.toUpperCase() == 'EXACT') {
        /*searchVerse = "replace(replace(vers, '&quot;', ''), '&apos;','') like '%"+ this.searchInput +"%'";*/
        searchVerse =
          "replace(replace(vers, '&quot;', '$$$$$$'), '&apos;','______') like '%" +
          this.searchInput.split("'").join('______').split('"').join('$$$$$$') +
          "%'";
      } else if (this.authservice.searchOption.toUpperCase() == 'ANY') {
        searchVerse =
          " (replace(replace(vers, '&quot;', '$$$$$$'), '&apos;','______') like '%" +
          this.searchInput
            .split("'")
            .join('______')
            .split('"')
            .join('$$$$$$')
            .split(' ')
            .join(
              "%' or replace(replace(vers, '&quot;', '$$$$$$'), '&apos;','______') like '%"
            );

        searchVerse += "%') ";
      } else if (this.authservice.searchOption.toUpperCase() == 'ALL') {
        searchVerse =
          " (replace(replace(vers, '&quot;', '$$$$$$'), '&apos;','______')  like '%" +
          this.searchInput
            .split("'")
            .join('______')
            .split('"')
            .join('$$$$$$')
            .split(' ')
            .join(
              "%' and replace(replace(vers, '&quot;', '$$$$$$'), '&apos;','______') like '%"
            );

        searchVerse += "%') ";
      }
      var qry;
      if (this.authservice.searchBible == '5')
        qry =
          "SELECT a.*, case '" +
          this.authservice.searchLanguage +
          "' when 'Tamil' then fullname_tamil else fullname_english end bookname, case '" +
          this.authservice.searchLanguage +
          "' when 'Tamil' then fullname_tamil else fullname_english end fullbookname  FROM vers a, books_etb b where a.booknumber=b.bnumber and bibleid =" +
          this.authservice.searchBible +
          ' and a.booknumber between ' +
          this.authservice.SearchFromBook +
          ' and ' +
          this.authservice.SearchToBook +
          ' and ' +
          searchVerse +
          " and vnumber <>'0' order by a.bibleid,a.booknumber,a.cnumber, a.vnumber";
      else
        qry =
          "SELECT a.*, case '" +
          this.authservice.searchLanguage +
          "' when 'Tamil' then fullname_tamil else fullname_english end bookname, case '" +
          this.authservice.searchLanguage +
          "' when 'Tamil' then fullname_tamil else fullname_english end fullbookname  FROM vers a, books b where a.booknumber=b.bnumber and bibleid =" +
          this.authservice.searchBible +
          ' and a.booknumber between ' +
          this.authservice.SearchFromBook +
          ' and ' +
          this.authservice.SearchToBook +
          ' and ' +
          searchVerse +
          " and vnumber <>'0' order by a.bibleid,a.booknumber,a.cnumber, a.vnumber";
      console.log('Search qry ' + qry);
      //this.database.executeSql("SELECT a.*, case '" + this.authservice.defaultBibleLanguage + "' when 'Tamil' then shortname_tamil else shortname_english end bookname  FROM vers a, books b where a.bnumber=b.bnumber and bibleid =? and booknumber=? and cnumber=? order by vnumber", [this.authservice.defaultBibleId, this.authservice.defaultBookNumber,  this.authservice.defaultChapterNumber ]).then((data) => {
      this.database.executeSql(qry, []).then((data) => {
        if (data.rows.length == 0) {
          this.pager = 'Verse not found';
          this.showverse = 'hide';
        } else {
          this.showverse = 'show';

          this.versData = '';
          var font, titlefont;
          this.verseList = [];
          if (this.authservice.searchLanguage == 'Tamil') font = 'font16';
          else font = 'font18';
          this.totalpages = parseInt((data.rows.length / 25).toString());
          if (data.rows.length % 25 > 0) this.totalpages++;
          var startIndex, endIndex;
          startIndex = this.currentpage * 25 - 25;
          endIndex = this.currentpage * 25 - 1;
          if (this.currentpage == this.totalpages && data.rows.length % 25 > 0)
            endIndex = (data.rows.length % 25) + this.currentpage * 25 - 25 - 1;
          this.pager = 'Page ' + this.currentpage + ' of ' + this.totalpages;
          var myarr = this.searchInput.split(' ');
          var sn = 1;
          for (var i = startIndex; i <= endIndex; i++) {
            this.versData = '';
            //var versetext = data.rows.item(i).vers;
            var versetext = data.rows
              .item(i)
              .vers.split('&quot;')
              .join('$$$$$$')
              .split('&apos;')
              .join('______')
              .split('.')
              .join('~~~~~~');
            var vnumber = data.rows.item(i).vnumber;
            var cnumber = data.rows.item(i).cnumber;
            var bookname = data.rows.item(i).bookname;

            if (this.authservice.searchOption.toUpperCase() == 'EXACT') {
              versetext = versetext.replace(
                new RegExp(
                  this.searchInput
                    .split("'")
                    .join('______')
                    .split('"')
                    .join('$$$$$$')
                    .split('.')
                    .join('~~~~~~'),
                  'gi'
                ),
                '<span class=showYellow>$&</span>'
              );
              // versetext = versetext.replace(new RegExp(this.searchInput,'gi'),'<span class=showYellow>$&</span>');
            } else if (
              this.authservice.searchOption.toUpperCase() == 'ANY' ||
              this.authservice.searchOption.toUpperCase() == 'ALL'
            ) {
              for (var j = 0; j < myarr.length; j++) {
                versetext = versetext.replace(
                  new RegExp(
                    myarr[j]
                      .split("'")
                      .join('______')
                      .split('"')
                      .join('$$$$$$')
                      .split('.')
                      .join('~~~~~~'),
                    'gi'
                  ),
                  '###$&@@@'
                );
              }
            }
            versetext = versetext
              .split('______')
              .join('&apos;')
              .split('$$$$$$')
              .join('&quot;')
              .split('~~~~~~')
              .join('.');
            versetext = versetext.split('###').join('<span class=showYellow>');
            versetext = versetext.split('@@@').join('</span>');
            versetext = versetext.split('*').join('');
            versetext = versetext.split('␢').join('');
            versetext = versetext.split('§').join('');
            versetext = versetext.split('(p)').join('');
            versetext = versetext.split('(P)').join('');
            versetext = versetext.split('#').join('');
            versetext = versetext.split('$').join('');
            versetext = versetext.split('ṟ').join('');
            versetext = versetext.split('Ṟ').join('');
            versetext = versetext.split('ḇ').join("<span class='boldtext'>");
            versetext = versetext.split('Ḇ').join('</span>');
            versetext = versetext.split('*').join('');
            versetext = versetext.split('␢').join('');
            versetext = versetext.split('§').join('');
            versetext = versetext.split('⒫').join('');
            versetext = versetext.split('⒯').join('');
            if (data.rows.item(i).bibleid == 2) {
              versetext = versetext
                .split('[')
                .join(
                  '<span class="' +
                    this.authservice.globalfont +
                    'Italic Italic">'
                );
              versetext = versetext.split(']').join('</span>');
            }
            if (data.rows.item(i).bibleid == 3) {
              if (this.authservice.BSINumberShow == '1')
                versetext = versetext
                  .split('[')
                  .join('<span class=' + 'textgrey>[');
              else
                versetext = versetext
                  .split('[')
                  .join('<span class=' + 'textgrey-hide>[');

              versetext = versetext.split(']').join(']</span>');
            }

            this.versData +=
              "<p class='searchvers " +
              font +
              "'><span class='black-color'>" +
              bookname +
              '&nbsp;' +
              cnumber +
              ':' +
              vnumber +
              '</span><br>' +
              versetext +
              '</p>';

            this.verseList.push({
              sn: sn,
              verseData: this.versData,
              bibleid: data.rows.item(i).bibleid,
              booknumber: data.rows.item(i).booknumber,
              cnumber: data.rows.item(i).cnumber,
              vnumber: data.rows.item(i).vnumber,
            });
            sn++;
          }
        }
        this.searchInprocess = false;
        this.scrollTo();
      });
    }
  }
  scrollTo() {
    setTimeout(() => {
      let b = document.getElementById('item1');
      //if (b) b.scrollIntoView();
      if (b) b.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
  }
  gotoPrevPage() {
    if (this.currentpage > 1) {
      this.currentpage--;
      this.searchText = this.searchInput;
      this.searchBible();
    }
    //alert("Begining of page");
    else this.authservice.showAlert('', '', 'Beginning of page');
  }
  gotoNextPage() {
    if (this.currentpage < this.totalpages) {
      this.currentpage++;
      this.searchText = this.searchInput;
      this.searchBible();
    }
    //alert("End of page");
    else this.authservice.showAlert('', '', 'End of page');
  }
  gotoPageNumber() {
    // Dismiss keyboard when enter is pressed or Go button is clicked
    Keyboard.hide();

    if (this.gotoPage.toString().indexOf('.') != -1)
      this.authservice.showAlert('', '', 'Enter valid page number');
    else if (this.gotoPage == '')
      this.authservice.showAlert(
        '',
        '',
        'Enter page number between 1 and ' + this.totalpages
      );
    else if (
      parseInt(this.gotoPage) < 0 ||
      parseInt(this.gotoPage) > this.totalpages
    ) {
      this.authservice.showAlert(
        '',
        '',
        'Enter page number between 1 and ' + this.totalpages
      );
    } else {
      this.currentpage = this.gotoPage;
      this.searchText = this.searchInput;
      this.searchBible();
    }
  }
  selectItemFromSearch(bibleid, booknumber, cnumber, vnumber) {
    // Save the current reading position before navigating to search results
    if (!this.authservice.isViewingSearchResult) {
      this.authservice.saveReadingState();
    }

    // Set flag that we're viewing a search result
    this.authservice.isViewingSearchResult = true;
    this.authservice.searchResultReference = this.getBookReference(
      booknumber,
      cnumber,
      vnumber
    );

    this.database
      .executeSql("update bibles set defaultbible = '0'", [])
      .then((data) => {
        this.database
          .executeSql("update bibles set defaultbible = '1' where id = ? ", [
            bibleid,
          ])
          .then((data) => {
            this.authservice.defaultBibleId = bibleid;

            this.authservice.defaultBibleId = bibleid;
            this.authservice.defaultBookNumber = booknumber;
            this.authservice.defaultChapterNumber = cnumber;
            this.authservice.defaultVersNumber = vnumber;

            this.database
              .executeSql('SELECT * FROM bibles where id=' + bibleid, [])
              .then((data) => {
                console.log('Books count ' + data.rows.length);
                if (data.rows.length >= 0) {
                  this.authservice.defaultBibleVersionText =
                    data.rows.item(0).title;
                  this.authservice.defaultBibleLanguage =
                    data.rows.item(0).language;
                }
                console.log('Set vnumbe ' + vnumber);
                this.authservice.readMode = 'VERSE';
                this.authservice.scrollmode = '';
                this.authservice.dataLoaded = 0;
                this.authservice.appstartesstae = '1';
                this.authservice.compareBibleId = bibleid;
                this.authservice.dataLoadedCompare = 0;
                this.navctrl.navigateRoot('/tabslink/read');
              });
          });
      });
  }

  // Helper method to get a formatted reference for the search result
  getBookReference(booknumber, cnumber, vnumber) {
    // Find the book name from the search results
    for (let item of this.verseList) {
      if (item.booknumber === booknumber && item.cnumber === cnumber) {
        // Extract the book name from the verse data
        const match = item.verseData.match(
          /<span class='black-color'>([^<]+)&nbsp;/
        );
        if (match && match[1]) {
          return `${match[1]} ${cnumber}:${vnumber}`;
        }
      }
    }
    return `${booknumber}:${cnumber}:${vnumber}`;
  }

  // Handle focus event specifically for Tamil input
  handleInputFocus() {
    console.log('Input focus - enabling Tamil keyboard support');
    // Ensure keyboard is properly configured for Tamil input
    this.platform.ready().then(() => {
      Keyboard.setScroll({ isDisabled: false });

      // Reset the input field state to ensure proper IME handling
      setTimeout(() => {
        this.ngZone.run(() => {
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && activeElement.tagName === 'ION-INPUT') {
            // Force native keyboard to properly handle Tamil input
            const tmpValue = this.searchText;
            this.searchText = '';
            setTimeout(() => {
              this.searchText = tmpValue;
            }, 10);
          }
        });
      }, 50);
    });
  }
}
