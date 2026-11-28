import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./startup/startup.page').then(m => m.StartupPage),
        data: { preload: true }
    },
    {
        path: 'tabs',
        loadChildren: () => import('./tabs/tabs.routes').then(m => m.routes)
    },
    {
        path: 'tab1',
        loadComponent: () => import('./tab1/tab1.page').then(m => m.Tab1Page)
    },
    {
        path: 'startup',
        loadComponent: () => import('./startup/startup.page').then(m => m.StartupPage)
    },
    {
        path: 'startup-language',
        loadComponent: () => import('./startup-language/startup-language.page').then(m => m.StartupLanguagePage)
    },
    {
        path: 'addnotes',
        loadComponent: () => import('./addnotes/addnotes.page').then(m => m.AddnotesPage)
    },
    {
        path: 'startup-default-bible',
        loadComponent: () => import('./startup-default-bible/startup-default-bible.page').then(m => m.StartupDefaultBiblePage)
    },
    {
        path: 'getstarted',
        loadComponent: () => import('./getstarted/getstarted.page').then(m => m.GetstartedPage)
    },
    {
        path: 'tabslink',
        loadChildren: () => import('./tabslink/tabslink.routes').then(m => m.routes)
    },
    {
        path: 'home',
        loadComponent: () => import('./home/home.page').then(m => m.HomePage),
        data: { preload: true }
    },
    {
        path: 'read/:counter',
        loadComponent: () => import('./read/read.page').then(m => m.ReadPage)
    },
    {
        path: 'compare',
        loadComponent: () => import('./compare/compare.page').then(m => m.ComparePage)
    },
    {
        path: 'bookselector',
        loadComponent: () => import('./bookselector/bookselector.page').then(m => m.BookselectorPage)
    },
    {
        path: 'readmarklist/:counter',
        loadComponent: () => import('./readmarklist/readmarklist.page').then(m => m.ReadmarklistPage)
    },
    {
        path: 'setdefaultbible',
        loadComponent: () => import('./setdefaultbible/setdefaultbible.page').then(m => m.SetdefaultbiblePage)
    },
    {
        path: 'search',
        loadComponent: () => import('./search/search.page').then(m => m.SearchPage)
    },
    {
        path: 'more',
        loadComponent: () => import('./more/more.page').then(m => m.MorePage)
    },
    {
        path: 'settings',
        loadComponent: () => import('./settings/settings.page').then(m => m.SettingsPage)
    },
    {
        path: 'more-terms',
        loadComponent: () => import('./more-terms/more-terms.page').then(m => m.MoreTermsPage)
    },
    {
        path: 'more-about',
        loadComponent: () => import('./more-about/more-about.page').then(m => m.MoreAboutPage)
    },
    {
        path: 'more-contact',
        loadComponent: () => import('./more-contact/more-contact.page').then(m => m.MoreContactPage)
    },
    {
        path: 'more-reportbug',
        loadComponent: () => import('./more-reportbug/more-reportbug.page').then(m => m.MoreReportbugPage)
    },
    {
        path: 'more-volunteer',
        loadComponent: () => import('./more-volunteer/more-volunteer.page').then(m => m.MoreVolunteerPage)
    },
    {
        path: 'more-private-policy',
        loadComponent: () => import('./more-private-policy/more-private-policy.page').then(m => m.MorePrivatePolicyPage)
    },
    {
        path: 'bible-topics',
        loadComponent: () => import('./bible-topics/bible-topics.page').then(m => m.BibleTopicsPage)
    },
    {
        path: 'bible-topics/:id',
        loadComponent: () => import('./bible-topic-detail/bible-topic-detail.page').then(m => m.BibleTopicDetailPage)
    },
    {
        path: 'life-events',
        loadComponent: () => import('./life-events/life-events.page').then(m => m.LifeEventsPage)
    },
    {
        path: 'life-events/:id',
        loadComponent: () => import('./life-event-detail/life-event-detail.page').then(m => m.LifeEventDetailPage)
    },
];
