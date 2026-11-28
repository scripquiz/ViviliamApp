import { Routes } from '@angular/router';
import { TabslinkPage } from './tabslink.page';

export const routes: Routes = [
  {
    path: '',
    component: TabslinkPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('../home/home.page').then(m => m.HomePage)
      },
      {
        path: 'read',
        loadComponent: () => import('../read/read.page').then(m => m.ReadPage)
      },
      {
        path: 'compare',
        loadComponent: () => import('../compare/compare.page').then(m => m.ComparePage)
      },
      {
        path: 'search',
        loadComponent: () => import('../search/search.page').then(m => m.SearchPage)
      },
      {
        path: 'more',
        loadComponent: () => import('../more/more.page').then(m => m.MorePage)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  }
];
