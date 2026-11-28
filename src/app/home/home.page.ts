import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { Component, ViewChild } from '@angular/core';
import {
  DatabaseService,
  DatabaseConnection,
} from 'src/app/services/database.service';
import { AuthserviceProvider } from 'src/providers/authservice/authservice';
import { Platform } from '@ionic/angular';
import { MenuController } from '@ionic/angular';
import { IonLoaderService } from '../ion-loader.service';
import { ScreenOrientationService } from '../services/screen-orientation.service';
import { App } from '@capacitor/app';
import { WakeLockService } from '../services/wake-lock.service';
import { NetworkService } from '../services/network.service';
import { Browser } from '@capacitor/browser';
import { LoggerService } from '../services/logger.service';
import { AudioFocusService } from '../services/audio-focus.service';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class HomePage {
  @ViewChild('audioPlayer') audio: any;
  private lastConnectivityResult: boolean = false;
  private lastConnectivityCheck: number = 0;
  private connectivityCacheDuration: number = 30000; // 30 seconds
  public networkSubscription: any;
  private orientationSubscription: any;
  private networkStateChangeDebounceTime = 3000; // 3 seconds
  private networkDebounceTimer: any = null;
  private lastReportedNetworkState: boolean | null = null;

  public APIMessage: any = '';
  public database: DatabaseConnection;
  public tabRowitemSelected: any = '0';
  public orientation: any;
  public currentAudioIndex: any = 0;
  public audioPlaying: any;
  public isSeeking = false;
  public playAll: any = false;
  public playAllText: any = 'Play All';
  public appversionText: any = '';
  public resumeListener: any;
  public repeat_state_all: any = 0;
  public repeat_played_count_all: any = 0;
  public todayAudioFiles: any[] = [];
  public isAudioLoading: boolean = true;
  public audioLoadError: boolean = false;
  private isActivelyTesting: boolean = false;
  private audioLoadInProgress: boolean = false;
  // True while the list on screen came from the local cache
  public isShowingCachedAudio: boolean = false;
  // Date (YYYY-MM-DD) that todayAudioFiles was loaded for
  private loadedAudioDate: string = '';
  public segmentSelected: string = '0';
  constructor(
    private http: HttpClient,
    public network: NetworkService,
    private wakeLockService: WakeLockService,
    private screenorientation: ScreenOrientationService,
    private ionLoaderService: IonLoaderService,
    public menuCtrl: MenuController,
    private authservice: AuthserviceProvider,
    private platform: Platform,
    private databaseService: DatabaseService,
    private logger: LoggerService,
    private audioFocusService: AudioFocusService
  ) {
    this.getAppVersionInfo();

    this.audioFocusService.registerOwner('home', () => {
      this.stopHomeAudioPlayback();
    });

    this.platform
      .ready()
      .then(() => {
        fetch('https://api.viviliam.com/assets/voiceover/audio_bibles.json')
          .then((res) => res.json())
          .then((json) => {
            this.authservice.audio_bibles = json[0].bibleids;
          })
          .catch((error) => {
            this.logger.error('Failed to load audio bibles:', error);
          });
        this.resumeListener = this.platform.resume.subscribe(() => {
          this.logger.network('App resumed - checking active connectivity');
          this.testActiveConnectivity().then((isConnected) => {
            if (isConnected) {
              this.logger.network(
                'Active connectivity test passed - loading content'
              );
              this.setStableErrorState(false, '');
              if (!this.audioPlaying) {
                if (this.needsAudioLoad()) {
                  this.loadAudioDirectly();
                }
              }
            } else {
              this.logger.network(
                'Active connectivity test failed - setting error state'
              );
              this.setStableErrorState(true, this.authservice.noNetWorkMessage);
            }
          });
          if (
            this.screenorientation.type === 'landscape-primary' ||
            this.screenorientation.type === 'landscape-secondary'
          ) {
            this.orientation = 'landscape';
            this.authservice.orientation = this.orientation;
          } else {
            this.orientation = 'portrait';
            this.authservice.orientation = this.orientation;
          }
        });
        this.orientation = this.authservice.orientation;
        this.orientationSubscription = this.screenorientation
          .onChange()
          .subscribe(() => {
            this.logger.log(
              'Orientation changed to ' + this.screenorientation.type
            );
            if (
              this.screenorientation.type == 'landscape-primary' ||
              this.screenorientation.type === 'landscape-secondary'
            ) {
              this.orientation = 'landscape';
              this.authservice.orientation = this.orientation;
            } else {
              this.orientation = 'portrait';
              this.authservice.orientation = this.orientation;
            }
          });
        this.databaseService
          .create({
            name: 'viviliam.db',
            location: 'default',
          })
          .then((db: DatabaseConnection) => {
            this.database = db;
          })
          .catch((error) => {
            this.logger.error('Database creation error:', error);
            this.setStableErrorState(true, 'Database error');
          });
      })
      .catch((error) => {
        this.logger.error('Platform ready error:', error);
      });
  }
  handleLoadingError(message) {
    this.logger.error('Audio loading error:', message);
    this.isAudioLoading = false;
    this.audioLoadError = !this.todayAudioFiles.length;
    this.audioLoadInProgress = false;
    if (this.network.isConnected) {
      this.setStableErrorState(true, this.authservice.serverDownMessage);
      this.logger.log('Setting server error flag for audio loading');
    } else {
      this.setStableErrorState(true, this.authservice.noNetWorkMessage);
    }
  }
  playAllAudiosDirect() {
    if (this.playAll) {
      this.stopAllAudioDirect();
      // Wake lock is released in stopAllAudioDirect
    } else {
      for (var i = 0; i < this.todayAudioFiles.length; i++) {
        this.todayAudioFiles[i].repeat_state = 0;
        this.todayAudioFiles[i].repeat_played_count = 0;
        this.todayAudioFiles[i].state = 'pause';
        this.todayAudioFiles[i].ctime = 0;
        this.todayAudioFiles[i].ctimeintime = '0:00';
        this.todayAudioFiles[i].durationintime = this.convertHMS(
          parseInt(this.todayAudioFiles[i].duration)
        );
      }
      this.playAll = true;
      this.repeat_played_count_all = 0;
      this.startAudioDirect(0);
      this.playAllText = 'Stop Playing';
    }
  }
  stopAllAudioDirect() {
    for (var i = 0; i < this.todayAudioFiles.length; i++) {
      this.todayAudioFiles[i].repeat_state = 0;
      this.todayAudioFiles[i].repeat_played_count = 0;
      this.todayAudioFiles[i].state = 'pause';
      this.todayAudioFiles[i].ctime = 0;
      this.todayAudioFiles[i].ctimeintime = '0:00';
      this.todayAudioFiles[i].durationintime = this.convertHMS(
        this.todayAudioFiles[i].duration
      );
    }
    this.playAll = false;
    this.currentAudioIndex = 0;
    this.playAllText = 'Play All';
    this.audio.nativeElement.pause();
    this.audioPlaying = false;
    this.audioFocusService.releaseFocus('home');
    // Release wake lock when stopping all audio
    this.wakeLockService
      .allowSleepAgain()
      .then(() => this.logger.log('Wake lock released'))
      .catch(() => this.logger.log('Wake lock release failed'));
  }

  private clearPerItemRepeatStates(exceptIndex: number = -1) {
    if (!Array.isArray(this.todayAudioFiles)) {
      return;
    }

    for (let idx = 0; idx < this.todayAudioFiles.length; idx++) {
      if (idx !== exceptIndex) {
        this.todayAudioFiles[idx].repeat_state = 0;
      }
      this.todayAudioFiles[idx].repeat_played_count = 0;
    }
  }

  setRepeatStateDirect(i) {
    // A track repeat replaces Play All; a single track keeps playing.
    if (this.playAll) {
      this.stopAudioDirect(this.currentAudioIndex);
    }
    const currentRepeatState =
      Number(this.todayAudioFiles[i].repeat_state) || 0;
    const nextRepeatState =
      currentRepeatState >= 3 ? 0 : currentRepeatState + 1;

    // Only one repeat can be active at a time across daily audio.
    this.repeat_state_all = 0;
    this.repeat_played_count_all = 0;
    this.clearPerItemRepeatStates(i);
    this.todayAudioFiles[i].repeat_state = nextRepeatState;
  }

  private stopHomeAudioPlayback(): void {
    const audioElement = this.audio?.nativeElement;
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    this.audioPlaying = false;
    this.playAll = false;
    this.playAllText = 'Play All';
    this.audioFocusService.releaseFocus('home');

    if (Array.isArray(this.todayAudioFiles)) {
      this.todayAudioFiles.forEach((item) => {
        item.state = 'pause';
      });
    }

    this.wakeLockService
      .allowSleepAgain()
      .then(() => this.logger.log('Wake lock released'))
      .catch(() => this.logger.log('Wake lock release failed'));
  }

  ionViewWillEnter() {
    this.menuCtrl.enable(false);
    this.setupNetworkListeners();
  }

  ionViewWillLeave() {
    this.removeNetworkListeners();
    this.stopHomeAudioPlayback();
  }

  ionViewDidEnter() {
    if (this.isTodayTabActive()) {
      this.loadAudioDirectly();
    }

    this.testConnectionOnStartup().then((isConnected) => {
      this.logger.network(
        'Comprehensive connectivity check result:',
        isConnected
      );
      if (isConnected) {
        this.logger.network(
          'Active internet connection confirmed - initializing page'
        );
        this.setStableErrorState(false, '');
        if (this.isTodayTabActive()) {
          this.loadAudioDirectly();
        }
      }
    });
    this.authservice.currentPage = 'HOME';
    this.platform.ready().then(() => {
      this.orientation = this.authservice.orientation;
    });
    this.logger.log('View did enter');
  }
  segmentChanged(event) {
    this.segmentSelected = event.detail.value;
    this.selectRowTaIte(parseInt(this.segmentSelected).toString());
  }
  selectRowTaIte(tabitem) {
    this.tabRowitemSelected = tabitem;
    this.segmentSelected = tabitem.toString();
    if (tabitem.toString() === '0') {
      this.checkNetworkForAudio();
    }
  }
  convertHMS(value) {
    const sec = parseInt(value, 10);
    var hours: any = Math.floor(sec / 3600);
    var minutes: any = Math.floor((sec - hours * 3600) / 60);
    var seconds: any = sec - hours * 3600 - minutes * 60;
    if (hours < 10) {
      hours = '0' + hours;
    }
    if (seconds < 10) {
      seconds = '0' + seconds;
    }
    if (hours == '00') return minutes + ':' + seconds;
    else return hours + ':' + minutes + ':' + seconds;
  }
  ngOnDestroy() {
    this.audioFocusService.releaseFocus('home');
    this.audioFocusService.unregisterOwner('home');

    this.removeNetworkListeners();
    if (this.orientationSubscription) {
      this.orientationSubscription.unsubscribe();
    }
    if (this.resumeListener) {
      this.resumeListener.unsubscribe();
    }
  }
  setRepeatStateAll() {
    this.repeat_state_all = (Number(this.repeat_state_all) || 0) + 1;
    if (this.repeat_state_all > 3) this.repeat_state_all = 0;
    this.repeat_played_count_all = 0;

    // Enforce exclusive repeat selection: repeat-all clears per-item repeats.
    this.clearPerItemRepeatStates();

    this.logger.log(`Repeat all set to ${this.repeat_state_all}`);
  }
  playAudioDirect(idx) {
    this.playAll = false;
    this.playAllText = 'Play All';
    this.startAudioDirect(idx);
  }
  startAudioDirect(idx) {
    this.audioFocusService.requestFocus('home');

    this.currentAudioIndex = idx;
    for (var i = 0; i < this.todayAudioFiles.length; i++) {
      this.todayAudioFiles[i].state = 'pause';
    }
    this.todayAudioFiles[idx].state = 'play';
    this.wakeLockService
      .keepAwake()
      .then(() => this.logger.log('Wake lock acquired for audio playback'))
      .catch(() => this.logger.log('Wake lock acquisition failed'));
    const audioElement = this.audio?.nativeElement;
    if (!audioElement) {
      this.logger.error('Audio element is not available');
      return;
    }

    audioElement.preload = 'auto';
    audioElement.src = this.todayAudioFiles[idx].url;
    audioElement.load();
    audioElement.onloadedmetadata = () => {
      const actualDuration = audioElement.duration;
      this.todayAudioFiles[idx].duration = actualDuration;
      this.todayAudioFiles[idx].durationintime = this.convertHMS(
        Math.floor(actualDuration)
      );
    };
    audioElement.currentTime = this.todayAudioFiles[idx].ctime;
    this.audioPlaying = true;
    this.playCurrentAudio();
    // Reset wake lock activity timer on audio play
    this.wakeLockService.resetActivity();
  }
  private playCurrentAudio(): void {
    const audioElement = this.audio.nativeElement;
    const url = this.todayAudioFiles[this.currentAudioIndex]?.url;
    void audioElement.play()?.catch((error) => {
      // AbortError: a pause or a newer track interrupted this request
      if (
        error?.name === 'AbortError' ||
        url !== this.todayAudioFiles[this.currentAudioIndex]?.url
      ) {
        return;
      }
      this.handlePlaybackFailure(error);
    });
  }
  // Bound to the <audio> element's error event
  onAudioError(): void {
    const error = this.audio.nativeElement.error;
    // No error on the element means the event is from a replaced source
    if (error) {
      this.handlePlaybackFailure(error);
    }
  }
  private handlePlaybackFailure(error: unknown): void {
    this.logger.error('Audio playback failed:', error);
    // Also guards against reporting one failure twice
    if (!this.audioPlaying || !this.todayAudioFiles[this.currentAudioIndex]) {
      return;
    }
    this.stopAudioDirect(this.currentAudioIndex);
    this.authservice.showAlert(
      'Error',
      '',
      this.network.isConnected
        ? 'Unable to play this audio. Please try again.'
        : this.authservice.noNetWorkMessage
    );
  }
  // Bound to the <audio> element's pause event. Pauses made by this page have
  // already cleared audioPlaying, so only outside ones (call, headset) remain.
  onAudioPause(): void {
    const audioElement = this.audio.nativeElement;
    if (
      !this.audioPlaying ||
      !audioElement.paused ||
      audioElement.ended || // handled by handleAudioEnded
      !this.todayAudioFiles[this.currentAudioIndex]
    ) {
      return;
    }
    this.stopAudioDirect(this.currentAudioIndex);
  }
  // Bound to the <audio> element's play event; covers playback resumed from
  // outside the page, e.g. a headset button.
  onAudioPlay(): void {
    const audioElement = this.audio.nativeElement;
    if (this.audioPlaying || audioElement.paused) {
      return;
    }
    const idx = this.todayAudioFiles.findIndex(
      (item) => item.url === audioElement.getAttribute('src')
    );
    if (idx < 0) {
      audioElement.pause();
      return;
    }
    this.audioFocusService.requestFocus('home');
    this.currentAudioIndex = idx;
    this.todayAudioFiles[idx].state = 'play';
    this.audioPlaying = true;
    this.holdWakeLock();
  }
  // The wake lock service drops the lock after 5 minutes without activity,
  // after 30 minutes, and when the app is paused, so keep renewing it.
  private holdWakeLock(): void {
    if (document.visibilityState !== 'visible') {
      return;
    }
    if (this.wakeLockService.isActive()) {
      this.wakeLockService.resetActivity();
    } else {
      this.wakeLockService
        .keepAwake()
        .catch(() => this.logger.log('Wake lock acquisition failed'));
    }
  }
  // Bound to the <audio> element's timeupdate event
  onTimeUpdate(): void {
    if (this.audioPlaying) {
      this.holdWakeLock();
    }
    const track = this.todayAudioFiles[this.currentAudioIndex];
    if (!this.audioPlaying || this.isSeeking || !track) {
      return;
    }
    const currentTime = this.audio.nativeElement.currentTime;
    track.ctime = currentTime;
    track.ctimeintime = this.convertHMS(currentTime);
    track.durationintime = this.convertHMS(
      Math.max(0, Math.floor(track.duration) - Math.floor(currentTime))
    );
  }
  // Bound to the <audio> element's ended event
  handleAudioEnded() {
    const activeAudioArray = this.todayAudioFiles;
    if (!activeAudioArray[this.currentAudioIndex]) {
      return;
    }
    activeAudioArray[this.currentAudioIndex].ctime = 0;
    activeAudioArray[this.currentAudioIndex].ctimeintime = '0:00';
    activeAudioArray[this.currentAudioIndex].durationintime = this.convertHMS(
      parseInt(activeAudioArray[this.currentAudioIndex].duration)
    );
    if (this.playAll) {
      if (this.currentAudioIndex < activeAudioArray.length - 1) {
        this.logger.log(`Moving to next track: ${this.currentAudioIndex + 1}`);
        this.currentAudioIndex++;
        this.startAudioDirect(this.currentAudioIndex);
      } else {
        this.logger.log(
          `End of playlist reached. Repeat count: ${this.repeat_played_count_all}/${this.repeat_state_all}`
        );
        if (
          this.repeat_state_all > 0 &&
          this.repeat_played_count_all < this.repeat_state_all
        ) {
          this.repeat_played_count_all++;
          this.logger.log(`Starting repeat ${this.repeat_played_count_all}`);
          this.startAudioDirect(0);
        } else {
          this.stopAudioDirect(this.currentAudioIndex);
          this.repeat_state_all = 0;
          this.repeat_played_count_all = 0;
        }
      }
    } else if (activeAudioArray[this.currentAudioIndex].repeat_state > 0) {
      if (
        activeAudioArray[this.currentAudioIndex].repeat_played_count <
        activeAudioArray[this.currentAudioIndex].repeat_state
      ) {
        activeAudioArray[this.currentAudioIndex].repeat_played_count++;
        this.audio.nativeElement.currentTime = 0;
        this.playCurrentAudio();
      } else {
        this.stopAudioDirect(this.currentAudioIndex);
        activeAudioArray[this.currentAudioIndex].repeat_state = 0;
        activeAudioArray[this.currentAudioIndex].repeat_played_count = 0;
      }
    } else {
      this.stopAudioDirect(this.currentAudioIndex);
    }
  }
  stopAudioDirect(idx) {
    this.todayAudioFiles[idx].state = 'pause';
    this.audio.nativeElement.pause();
    this.audioPlaying = false;
    this.playAll = false;
    this.playAllText = 'Play All';
    this.audioFocusService.releaseFocus('home');
    this.wakeLockService
      .allowSleepAgain()
      .then(() => this.logger.log('Wake lock released'))
      .catch(() => this.logger.log('Wake lock release failed'));
  }
  onChangePlayTimeDirect(idx, obj) {
    const position = Number(obj.currentTarget.value) || 0;

    // Nothing playing: remember the position; it applies when this track is played
    if (!this.audioPlaying) {
      this.setTrackPosition(idx, position);
      return;
    }

    if (idx === this.currentAudioIndex) {
      this.setTrackPosition(idx, position);
      this.audio.nativeElement.currentTime = position;
      this.playCurrentAudio();
      return;
    }

    // Jumping to another track. In Play All, rewind the one being left so a
    // repeat of the playlist doesn't resume it halfway.
    if (this.playAll) {
      this.setTrackPosition(this.currentAudioIndex, 0);
    }
    this.setTrackPosition(idx, position);
    this.startAudioDirect(idx);
  }
  private setTrackPosition(idx: number, position: number): void {
    const track = this.todayAudioFiles[idx];
    track.ctime = position;
    track.ctimeintime = this.convertHMS(position);
    track.durationintime = this.convertHMS(
      Math.max(0, Math.floor(track.duration) - Math.floor(position))
    );
  }
  async openExternalURLDirectly(url: string) {
    if (url != '') {
      if (!this.network.isConnected) {
        this.authservice.showAlert('', '', this.authservice.noNetWorkMessage);
        return;
      }
      this.ionLoaderService.simpleLoader('Opening...');
      try {
        await Browser.open({
          url: url,
          toolbarColor: '#c94b18',
          presentationStyle: 'popover',
        });
        setTimeout(() => {
          this.ionLoaderService.dismissLoader();
        }, 1000);
      } catch (error) {
        this.ionLoaderService.dismissLoader();
        this.logger.error('Error opening URL:', error);
        this.authservice.showAlert(
          'Error',
          '',
          'Failed to open the page. Please check your connection.'
        );
      }
    }
  }
  setStableErrorState(isError: boolean, message: string) {
    if (isError) {
      const isServerErr =
        this.network.hasInternetConnectivity &&
        message !== this.authservice.noNetWorkMessage;
      if (isServerErr || message === this.authservice.noNetWorkMessage) {
        this.APIMessage = message;
      }
    } else {
      this.APIMessage = '';
    }
  }
  async getAppVersionInfo() {
    try {
      const info = await App.getInfo();
      this.appversionText = info.version;
      this.logger.log('App version retrieved from Capacitor:', info.version);
    } catch (err) {
      this.logger.error('Error getting app version:', err);
      this.appversionText = '4.9.0';
    }
  }
  private removeNetworkListeners() {
    if (this.networkSubscription) {
      this.networkSubscription.unsubscribe();
      this.networkSubscription = null;
    }
    if (this.networkDebounceTimer) {
      clearTimeout(this.networkDebounceTimer);
      this.networkDebounceTimer = null;
    }
  }
  setupNetworkListeners() {
    this.logger.network('Setting up network listeners in HomePage');

    // Initial connectivity state
    this.lastReportedNetworkState = this.network.isConnected;

    // Single network subscription with debouncing
    this.removeNetworkListeners();
    this.networkSubscription = this.network.actualConnectivity$.subscribe(
      (hasConnectivity) => {
        this.logger.network(
          'Raw network state change detected:',
          hasConnectivity
        );

        // Don't respond to rapid fluctuations - use debouncing
        if (this.networkDebounceTimer) {
          clearTimeout(this.networkDebounceTimer);
        }

        this.networkDebounceTimer = setTimeout(() => {
          // Only process if the state is different from last reported state
          if (this.lastReportedNetworkState !== hasConnectivity) {
            this.logger.network(
              'Stable network change detected to:',
              hasConnectivity
            );
            this.lastReportedNetworkState = hasConnectivity;

            if (hasConnectivity) {
              this.logger.network('Stable network connectivity established');
              this.setStableErrorState(false, '');

              // Load audio if needed
              if (this.isTodayTabActive() && this.needsAudioLoad()) {
                this.logger.network('Network restored - loading audio content');
                this.loadAudioDirectly();
              }
            } else {
              this.logger.network('Stable network connectivity lost');
              if (this.isTodayTabActive()) {
                this.setStableErrorState(
                  true,
                  this.authservice.noNetWorkMessage
                );
              }

              // Try loading from cache if on audio tab
              if (this.isTodayTabActive()) {
                this.showCachedAudioIfEmpty();
              }
            }
          }
        }, this.networkStateChangeDebounceTime);
      }
    );
  }

  private isTodayTabActive(): boolean {
    return this.tabRowitemSelected?.toString() === '0';
  }
  checkNetwork(
    options: {
      source?: string;
      priority?: boolean;
      loadAudio?: boolean;
    } = {}
  ): Promise<boolean> {
    // Set defaults
    const { source = 'general', priority = false, loadAudio = false } = options;

    this.logger.network(
      `Network check (${source}${priority ? ', priority' : ''})`
    );

    // Check if we can use cached result
    const now = Date.now();
    if (
      !priority &&
      now - this.lastConnectivityCheck < this.connectivityCacheDuration
    ) {
      this.logger.network(
        `Using cached connectivity result (${now - this.lastConnectivityCheck
        }ms old): ${this.lastConnectivityResult}`
      );

      // Still trigger appropriate actions based on cached result
      if (loadAudio) {
        this.handleNetworkResult(this.lastConnectivityResult, loadAudio);
      }

      return Promise.resolve(this.lastConnectivityResult);
    }

    // Prevent multiple simultaneous checks
    if (this.isActivelyTesting && !priority) {
      this.logger.network(
        `Network check already in progress (${source}) - using cached state`
      );
      return Promise.resolve(this.network.isConnected);
    }

    this.isActivelyTesting = true;

    // Basic check - if device reports no connection, don't bother with full check
    if (!this.network.isConnected) {
      this.logger.network(`Device reports disconnected (${source})`);
      this.handleNetworkResult(false, loadAudio);
      this.isActivelyTesting = false;

      // Update cached result
      this.lastConnectivityCheck = now;
      this.lastConnectivityResult = false;

      return Promise.resolve(false);
    }

    // Track timeout ID for proper cleanup
    let timeoutId: any = null;

    // Set up timeout
    const timeoutPromise = new Promise<boolean>((resolve) => {
      timeoutId = setTimeout(() => {
        if (this.isActivelyTesting) {
          this.logger.network(`Network check timed out (${source})`);

          // Update cached result for timeouts
          this.lastConnectivityCheck = Date.now();
          this.lastConnectivityResult = false;

          resolve(false);
        }
      }, 10000);
    });

    // Perform actual connectivity check
    const checkPromise = this.network
      .forceConnectivityCheck()
      .then((isConnected) => {
        this.logger.network(`Network check result (${source}): ${isConnected}`);

        // Update cached result
        this.lastConnectivityCheck = Date.now();
        this.lastConnectivityResult = isConnected;

        return isConnected;
      })
      .catch((error) => {
        this.logger.error(`Network check error (${source}):`, error);

        // Update cached result for errors
        this.lastConnectivityCheck = Date.now();
        this.lastConnectivityResult = false;

        return false;
      });

    // Race between timeout and actual check
    return Promise.race([checkPromise, timeoutPromise]).then((isConnected) => {
      // Clear timeout if it was created
      if (timeoutId) clearTimeout(timeoutId);

      this.isActivelyTesting = false;
      this.handleNetworkResult(isConnected, loadAudio);
      return isConnected;
    });
  }

  testConnectionOnStartup(): Promise<boolean> {
    return this.checkNetwork({
      source: 'startup',
      priority: true,
    });
  }

  checkNetworkForAudio(): Promise<boolean> {
    return this.checkNetwork({
      source: 'audio',
      loadAudio: true,
    });
  }

  testActiveConnectivity(): Promise<boolean> {
    return this.checkNetwork({
      source: 'resume',
      priority: true,
    });
  }
  // Local date as YYYY-MM-DD
  private getTodayDateString(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(today.getDate()).padStart(2, '0')}`;
  }
  private needsAudioLoad(): boolean {
    return (
      this.audioLoadError ||
      !this.todayAudioFiles.length ||
      this.loadedAudioDate !== this.getTodayDateString()
    );
  }
  tryLoadFromCache() {
    this.logger.log('Attempting to load audio from cache...');
    const dateStr = this.getTodayDateString();
    const cachedData = localStorage.getItem('todayAudioCache');
    const cacheDate = localStorage.getItem('todayAudioCacheDate');
    if (cachedData && cacheDate === dateStr) {
      try {
        this.logger.log('Found valid cached audio data for today');
        const data = JSON.parse(cachedData);
        if (!this.processNewAudioData(data, dateStr)) {
          return false;
        }
        this.isShowingCachedAudio = true;
        return true;
      } catch (error) {
        this.logger.error('Error loading from cache:', error);
        return false;
      }
    } else {
      this.logger.log('No valid cache found for today');
      return false;
    }
  }
  // Used when offline: never replaces or hides a list that is already loaded.
  private showCachedAudioIfEmpty(): void {
    if (this.todayAudioFiles.length || this.tryLoadFromCache()) {
      return;
    }
    // A request still in flight reports its own result. Only the initial,
    // never-loaded state needs to become an error here.
    if (!this.audioLoadInProgress && this.isAudioLoading) {
      this.isAudioLoading = false;
      this.audioLoadError = true;
    }
  }
  loadAudioDirectly() {
    if (this.audioLoadInProgress) {
      this.logger.log(
        'Audio load already in progress - skipping duplicate request'
      );
      return;
    }

    // Reload a list from an earlier day, but never swap it during playback
    const dateStr = this.getTodayDateString();
    if (
      this.todayAudioFiles.length &&
      (this.loadedAudioDate === dateStr || this.audioPlaying)
    ) {
      this.logger.log('Audio already loaded - skipping reload');
      return;
    }

    // Set initial states
    this.audioLoadInProgress = true;
    this.isAudioLoading = true;
    this.audioLoadError = false;
    this.logger.log('Starting audio loading process...');

    const apiUrl = `https://api.viviliam.com/api/audio?date=${dateStr}`;

    // Make API request; timeout() cancels it and raises an error after 15s
    this.http.get(apiUrl).pipe(timeout(15000)).subscribe(
      (data: any) => {
        this.audioLoadInProgress = false;
        this.logger.log('Received audio data from API');
        try {
          if (!this.processNewAudioData(data, dateStr)) {
            this.tryLoadFromCache();
            return;
          }
          this.setStableErrorState(false, '');
          // Cache only a validated, non-empty response
          if (data.audio.length) {
            localStorage.setItem('todayAudioCache', JSON.stringify(data));
            localStorage.setItem('todayAudioCacheDate', dateStr);
          }
        } catch (error) {
          // The list is already processed; only the cache write can fail here
          this.logger.error('Error caching API response:', error);
        }
      },
      (error) => {
        this.audioLoadInProgress = false;
        this.logger.error('HTTP error:', error);
        this.isAudioLoading = false;
        this.audioLoadError = !this.todayAudioFiles.length;
        this.setStableErrorState(true, this.authservice.serverDownMessage);
        this.tryLoadFromCache();
      }
    );
  }
  // Returns false when the data is invalid; an empty list is a valid result.
  processNewAudioData(data, dateStr): boolean {
    this.logger.log(`Processing new API audio data for date: ${dateStr}`);
    try {
      const todaysAudio = [];
      if (data.audio && Array.isArray(data.audio)) {
        this.logger.log(`Found ${data.audio.length} audio items from new API`);
        data.audio.forEach((item) => {
          this.logger.log(`Processing ${item.type} audio for today`);
          todaysAudio.push({
            type: item.type,
            url: item.url,
            duration: parseInt(item.duration || '0'),
            durationintime:
              item.formattedDuration ||
              this.convertHMS(parseInt(item.duration || '0')),
            state: 'pause',
            ctime: 0,
            ctimeintime: '0:00',
            repeat_state: 0,
            repeat_played_count: 0,
          });
        });
        // A late response can arrive while an earlier day's list is in use
        if (this.todayAudioFiles.length && this.loadedAudioDate !== dateStr) {
          this.stopAllAudioDirect();
        }
        // An empty list also replaces the old one, to show "No audio today"
        this.todayAudioFiles = todaysAudio;
        this.loadedAudioDate = dateStr;
        // tryLoadFromCache sets this again after calling this method
        this.isShowingCachedAudio = false;
        this.isAudioLoading = false;
        this.audioLoadError = false;
        this.logger.log(
          `Loaded ${todaysAudio.length} audio files from new API`
        );
        return true;
      } else {
        this.logger.log('Invalid API response format');
        this.handleLoadingError('Invalid API response');
        return false;
      }
    } catch (error) {
      this.logger.error('Error processing new API data:', error);
      this.handleLoadingError('API processing error');
      return false;
    }
  }

  private handleNetworkResult(isConnected: boolean, loadAudio: boolean): void {
    // Update app state based on connectivity
    if (isConnected) {
      this.setStableErrorState(false, '');

      // Load audio if requested and needed
      if (loadAudio && this.needsAudioLoad()) {
        this.logger.network('Network available - loading audio content');
        this.loadAudioDirectly();
      }
    } else {
      this.APIMessage = this.authservice.noNetWorkMessage;
      this.setStableErrorState(true, this.authservice.noNetWorkMessage);

      // Try loading from cache if audio was requested
      if (loadAudio) {
        this.showCachedAudioIfEmpty();
      }
    }
  }
}
